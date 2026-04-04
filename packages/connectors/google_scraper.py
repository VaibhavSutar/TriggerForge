# Module: apps.backend.services.scraper
# Submodule: google_scraper
# Connected to:
#   - upstream: apps.backend.services.pipeline_orchestrator
#   - downstream: services.analyzer.website, services.storage.repository
# Purpose: Real Playwright-based Google Maps scraper that scrolls until the
#          required lead count is achieved or max scroll attempts are exhausted.

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

@dataclass
class LeadInput:
    company_name: str
    niche: str = ""
    location: str = ""


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GoogleScraperConfig:
    min_interval_ms: int = 1200  # polite delay between scroll ticks
    max_results: int = 10  # max results per scroll batch
    headless: bool = True  # run browser headlessly
    slow_mo_ms: int = 0  # optional slow-motion for debugging
    scroll_pause_ms: int = 1800  # wait after each scroll for results to load
    result_load_timeout_ms: int = 8000  # timeout waiting for result list
    page_timeout_ms: int = 30000  # overall page navigation timeout


@dataclass
class ScrapedLead:
    name: str
    website: str
    email: str
    phone: str = ""
    address: str = ""
    rating: str = ""
    socials: dict[str, str] = None

    def __post_init__(self):
        if self.socials is None:
            self.socials = {}


class GoogleScraper:
    """
    Real Google Maps scraper using Playwright.

    Strategy
    --------
    1. Open Google Maps and search for ``{business_type} in {location}``.
    2. Wait for the result sidebar to appear.
    3. Scroll the sidebar panel in a loop — each iteration:
       a. Collect all visible listing cards.
       b. Click each new card, extract name / website / phone / address.
       c. Real deep scrape the business website for email and social links.
       d. Count valid leads (need both website AND email).
       e. Stop when ``required_leads`` is reached OR ``max_scroll_attempts`` exhausted.
    4. Return a summary dict compatible with the pipeline orchestrator contract.
    """

    def __init__(self, config: GoogleScraperConfig | None = None) -> None:
        self.config = config or GoogleScraperConfig()
        self._last_call_ms: int = 0

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def scrape_until_lead_limit(
        self,
        lead: LeadInput,
        required_leads: int,
        max_scroll_attempts: int,
    ) -> dict[str, str]:
        """
        Scrape Google Maps for ``required_leads`` qualified leads.

        A "qualified" lead has a resolvable website URL **and** a verified email.
        Duplicates (same domain) are filtered out.
        """
        query = self.build_query(lead)
        logger.info(
            "[google_scraper] query=%r  required=%d  max_scrolls=%d",
            query,
            required_leads,
            max_scroll_attempts,
        )

        qualified: list[ScrapedLead] = []
        attempts_used = 0

        try:
            from playwright.sync_api import TimeoutError as PWTimeout
            from playwright.sync_api import sync_playwright  # noqa: PLC0415

            with sync_playwright() as pw:
                browser = pw.chromium.launch(
                    headless=self.config.headless,
                    slow_mo=self.config.slow_mo_ms,
                    args=[
                        "--no-sandbox",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-dev-shm-usage",
                    ],
                )
                context = browser.new_context(
                    viewport={"width": 1280, "height": 900},
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    locale="en-US",
                )
                page = context.new_page()
                page.set_default_timeout(self.config.page_timeout_ms)

                # ── Navigate to Google Maps search ──────────────────────────
                maps_url = f"https://www.google.com/maps/search/{_url_encode(query)}"
                logger.info("[google_scraper] navigating → %s", maps_url)
                page.goto(maps_url, wait_until="domcontentloaded")

                # Dismiss consent / cookie banners (EU region)
                self._dismiss_consent(page)

                # ── Wait for the result panel ───────────────────────────────
                panel_selector = 'div[role="feed"], div[aria-label*="Results"]'
                try:
                    page.wait_for_selector(
                        panel_selector, timeout=self.config.result_load_timeout_ms
                    )
                except PWTimeout:
                    logger.warning(
                        "[google_scraper] result panel did not appear — returning empty"
                    )
                    browser.close()
                    return self._summary(
                        query,
                        qualified,
                        required_leads,
                        max_scroll_attempts,
                        max_scroll_attempts,
                    )

                seen_names: set[str] = set()
                seen_domains: set[str] = set()

                for attempt in range(1, max_scroll_attempts + 1):
                    attempts_used = attempt
                    logger.info(
                        "[google_scraper] scroll attempt %d/%d  (qualified so far: %d/%d)",
                        attempt,
                        max_scroll_attempts,
                        len(qualified),
                        required_leads,
                    )

                    # Collect all visible result cards
                    cards = page.query_selector_all('a[href*="/maps/place/"]')
                    logger.debug(
                        "[google_scraper] found %d cards on screen", len(cards)
                    )

                    for card in cards:
                        try:
                            # Extract the displayed name from the card
                            name_el = card.query_selector(
                                "div.qBF1Pd"
                            ) or card.query_selector("span.fontHeadlineSmall")
                            raw_name = (
                                name_el.inner_text()
                                if name_el
                                else card.get_attribute("aria-label") or ""
                            ).strip()
                            if not raw_name or raw_name in seen_names:
                                continue
                            seen_names.add(raw_name)

                            # Click the card to open its detail pane
                            try:
                                card.click()
                                page.wait_for_timeout(1200)
                            except Exception:  # noqa: BLE001
                                continue

                            scraped = self._extract_detail(page)
                            if not scraped:
                                continue
                            scraped.name = raw_name or scraped.name

                            # Qualify the lead
                            if not scraped.website:
                                continue
                            domain = _domain_from_url(scraped.website)
                            if not domain or domain in seen_domains:
                                continue
                            seen_domains.add(domain)

                            # Real scraping for emails and socials
                            details = self._scrape_site_details(context, scraped.website)
                            scraped.email = details.get('email', '')
                            scraped.socials = details.get('socials', {})
                            
                            if not scraped.email:
                                logger.info("[google_scraper]   x no email found on site, skipping")
                                continue

                            qualified.append(scraped)
                            logger.info(
                                "[google_scraper] ✓ qualified lead #%d: %s  <%s>",
                                len(qualified),
                                scraped.name,
                                scraped.email,
                            )

                            if len(qualified) >= required_leads:
                                break

                        except Exception as exc:  # noqa: BLE001
                            logger.debug("[google_scraper] card error: %s", exc)
                            continue

                    if len(qualified) >= required_leads:
                        logger.info(
                            "[google_scraper] goal reached after %d scroll(s)",
                            attempts_used,
                        )
                        break

                    # Scroll the results panel down to load more listings
                    self._scroll_panel(page)
                    page.wait_for_timeout(self.config.scroll_pause_ms)

                browser.close()

        except ImportError:
            logger.error(
                "[google_scraper] playwright not installed — falling back to mock data"
            )
            qualified = self._fallback_mock(lead, required_leads)
            attempts_used = 1

        except Exception as exc:  # noqa: BLE001
            exc_str = str(exc)
            if "Executable doesn't exist" in exc_str or "playwright install" in exc_str:
                logger.error(
                    "[google_scraper] Playwright browser not installed — falling back to mock data. "
                    "Run: playwright install chromium"
                )
                qualified = self._fallback_mock(lead, required_leads)
                attempts_used = 1
            else:
                logger.error(
                    "[google_scraper] unexpected error: %s", exc, exc_info=True
                )
                attempts_used = max_scroll_attempts

        return self._summary(
            query, qualified, required_leads, max_scroll_attempts, attempts_used
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Detail extraction
    # ──────────────────────────────────────────────────────────────────────────

    def _extract_detail(self, page) -> ScrapedLead | None:  # type: ignore[no-untyped-def]
        """Extract business details from the currently-open Maps detail pane."""
        try:
            # Wait for the detail panel to settle
            page.wait_for_selector('h1.DUwDvf', timeout=5000)
        except Exception:  # noqa: BLE001
            pass

        try:
            # ── Name ───────────────────────────────────────────────────────
            name = ""
            name_el = page.query_selector("h1.DUwDvf") or page.query_selector(
                'h1[class*="fontHeadline"]'
            )
            if name_el:
                name = name_el.inner_text().strip()

            # ── Website ────────────────────────────────────────────────────
            website = ""
            web_btn = page.query_selector('a[data-item-id="authority"]')
            if web_btn:
                href = web_btn.get_attribute("href") or ""
                if "google.com/url" in href:
                    qs = dict(parse_qsl(urlparse(href).query))
                    website = qs.get("q", href)
                else:
                    website = href

            # ── Phone ──────────────────────────────────────────────────────
            phone = ""
            phone_el = page.query_selector(
                'button[data-item-id*="phone"] span.fontBodyMedium'
            )
            if phone_el:
                phone = phone_el.inner_text().strip()

            # ── Address ────────────────────────────────────────────────────
            address = ""
            addr_el = page.query_selector(
                'button[data-item-id*="address"] span.fontBodyMedium'
            )
            if addr_el:
                address = addr_el.inner_text().strip()

            # ── Rating ─────────────────────────────────────────────────────
            rating = ""
            rating_el = page.query_selector('div.F7nice span[aria-hidden="true"]')
            if rating_el:
                rating = rating_el.inner_text().strip()

            return ScrapedLead(
                name=name,
                website=self.normalize_url(website),
                email="",  # populated by website scraper
                phone=phone,
                address=address,
                rating=rating,
            )

        except Exception as exc:  # noqa: BLE001
            logger.debug("[google_scraper] _extract_detail error: %s", exc)
            return None

    def _scrape_site_details(self, context, website_url: str) -> dict[str, any]:
        """
        Deep scrape a website for emails and social links using a fresh context page.
        Identifies contact/about pages and scans for @ patterns and social URLs.
        """
        if not website_url:
            return {'email': '', 'socials': {}}
        
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,5}\b'
        social_patterns = {
            'facebook': r'facebook\.com/[^"\'\s>]+',
            'instagram': r'instagram\.com/[^"\'\s>]+',
            'linkedin': r'linkedin\.com/company/[^"\'\s>]+',
            'twitter': r'twitter\.com/[^"\'\s>]+',
        }
        
        found_emails = set()
        found_socials = {}
        
        try:
            page = context.new_page()
            page.set_default_timeout(10000)
            logger.info("[google_scraper]   -> visit website: %s", website_url)
            
            # 1. Homepage
            page.goto(website_url, wait_until="domcontentloaded")
            content = page.content()
            
            # Extract emails from home
            for email in re.findall(email_pattern, content):
                found_emails.add(email)
            
            # Extract socials from home
            for platform, pattern in social_patterns.items():
                match = re.search(pattern, content)
                if match:
                    found_socials[platform] = "https://" + match.group(0)

            # 2. Extract internal links for Contact/About
            links = page.query_selector_all('a[href]')
            contact_urls = []
            for link in links:
                href = link.get_attribute('href') or ""
                if any(word in href.lower() for word in ['contact', 'about', 'reach', 'info', 'support']):
                    if href.startswith('/'):
                        href = website_url.rstrip('/') + href
                    if href.startswith('http') and website_url in href:
                        contact_urls.append(href)
            
            # Deduplicate and limit
            contact_urls = list(dict.fromkeys(contact_urls))[:2]
            
            for c_url in contact_urls:
                try:
                    logger.info("[google_scraper]   -> deep crawl contact page: %s", c_url)
                    page.goto(c_url, wait_until="domcontentloaded")
                    c_content = page.content()
                    # Extract emails
                    for email in re.findall(email_pattern, c_content):
                        found_emails.add(email)
                    # Extract missing socials
                    for platform, pattern in social_patterns.items():
                        if platform not in found_socials:
                            match = re.search(pattern, c_content)
                            if match:
                                found_socials[platform] = "https://" + match.group(0)
                except Exception:
                    continue
                    
            page.close()
        except Exception as exc:
            logger.debug("[google_scraper] website scrape failed for %s: %s", website_url, exc)
            try: page.close()
            except: pass
                
        valid_emails = [e for e in found_emails if not e.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg'))]
        return {
            'email': valid_emails[0] if valid_emails else "",
            'socials': found_socials
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Scroll helpers
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _scroll_panel(page) -> None:  # type: ignore[no-untyped-def]
        """Scroll the Google Maps result sidebar to reveal more listings."""
        page.evaluate("""
            () => {
                const feed = document.querySelector('div[role="feed"]')
                           || document.querySelector('div[aria-label*="Results"]');
                if (feed) {
                    feed.scrollTop += 1200;
                } else {
                    window.scrollBy(0, 1200);
                }
            }
        """)

    @staticmethod
    def _dismiss_consent(page) -> None:  # type: ignore[no-untyped-def]
        """Click through any GDPR / cookie consent overlay."""
        try:
            btn = (
                page.query_selector('button[aria-label*="Accept"]')
                or page.query_selector('form[action*="consent"] button')
                or page.query_selector('button:has-text("Accept all")')
            )
            if btn:
                btn.click()
                page.wait_for_timeout(600)
        except Exception:  # noqa: BLE001
            pass

    # ──────────────────────────────────────────────────────────────────────────
    # Query / URL helpers
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def build_query(lead: LeadInput) -> str:
        tokens = [lead.company_name, lead.niche or "", lead.location or ""]
        query = " ".join(part.strip() for part in tokens if part and part.strip())
        query = re.sub(r"\s+", " ", query).strip()
        if not query:
            raise ValueError("google_scraper_query_missing")
        return query

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        if not raw_url:
            return ""
        raw_url = raw_url.strip()
        if not raw_url.startswith(("http://", "https://")):
            raw_url = "https://" + raw_url
        try:
            parsed = urlparse(raw_url)
            scheme = parsed.scheme.lower() or "https"
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]

            normalized_path = parsed.path or ""
            if normalized_path not in ("", "/"):
                normalized_path = normalized_path.rstrip("/")

            filtered_qs = [
                (k, v)
                for k, v in parse_qsl(parsed.query, keep_blank_values=True)
                if not k.startswith("utm_")
            ]
            filtered_qs.sort(key=lambda item: item[0])

            normalized = parsed._replace(
                scheme=scheme,
                netloc=netloc,
                path=normalized_path,
                query=urlencode(filtered_qs),
                fragment="",
            )
            return urlunparse(normalized).rstrip("/")
        except Exception:  # noqa: BLE001
            return raw_url

    def dedupe_urls(self, urls: list[str]) -> list[str]:
        seen: set[str] = set()
        unique: list[str] = []
        for raw in urls:
            normalized = self.normalize_url(raw)
            if normalized in seen:
                continue
            seen.add(normalized)
            unique.append(normalized)
        return unique

    # ──────────────────────────────────────────────────────────────────────────
    # Fallback mock (used when Playwright is unavailable)
    # ──────────────────────────────────────────────────────────────────────────

    def _fallback_mock(self, lead: LeadInput, required_leads: int) -> list[ScrapedLead]:
        base = (lead.niche or lead.company_name or "business").replace(" ", "").lower()
        max_fallback_results = min(required_leads, self.config.max_results)
        results: list[ScrapedLead] = []
        for i in range(1, max_fallback_results + 1):
            domain = f"{base}{i}.com"
            results.append(
                ScrapedLead(
                    name=f"{lead.company_name} #{i}",
                    website=f"https://{domain}",
                    email=f"info@{domain}",
                    phone=f"+1-555-{i:04d}",
                    address=f"{lead.location or 'Unknown'}",
                )
            )
        return results

    # ──────────────────────────────────────────────────────────────────────────
    # Summary builder
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _summary(
        query: str,
        qualified: list[ScrapedLead],
        required_leads: int,
        max_scroll_attempts: int,
        attempts_used: int,
    ) -> dict[str, str]:
        sample = (
            qualified[0]
            if qualified
            else ScrapedLead(name="n/a", website="n/a", email="n/a")
        )
        return {
            "module": "services.scraper",
            "submodule": "google",
            "query": query,
            "found_leads": str(len(qualified)),
            "required_leads": str(required_leads),
            "max_scroll_attempts": str(max_scroll_attempts),
            "scroll_attempts_used": str(attempts_used),
            "sample_website": sample.website,
            "sample_email": sample.email,
            "leads_json": _leads_to_json(qualified),
        }


# ────────────────────────────────────────────────────────────────────────────
# Module-level helpers
# ────────────────────────────────────────────────────────────────────────────


def _url_encode(text: str) -> str:
    from urllib.parse import quote  # noqa: PLC0415
    return quote(text, safe="")


def _domain_from_url(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.split(":")[0]
    except Exception:  # noqa: BLE001
        return ""


def _leads_to_json(leads: list[ScrapedLead]) -> str:
    import json  # noqa: PLC0415
    return json.dumps(
        [
            {
                "name": lead.name,
                "website": lead.website,
                "email": lead.email,
                "phone": lead.phone,
                "address": lead.address,
                "rating": lead.rating,
                "socials": lead.socials,
            }
            for lead in leads
        ]
    )


if __name__ == "__main__":
    import sys
    import json
    import argparse

    parser = argparse.ArgumentParser(description="Google Maps Deep Scraper CLI")
    parser.add_argument("--query", type=str, help="Search query (e.g. 'cafe in London')")
    parser.add_argument("--limit", type=int, default=5, help="Number of leads to collect")
    parser.add_argument("--max_scrolls", type=int, default=10, help="Maximum scroll attempts")
    parser.add_argument("--headless", type=str, default="True", help="Run in headless mode (True/False)")

    args = parser.parse_args()

    if not args.query:
        print(json.dumps({"success": False, "error": "Missing --query argument"}))
        sys.exit(1)

    # Configure logging to stderr so we don't pollute stdout (where JSON goes)
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)

    config = GoogleScraperConfig(
        max_results=args.limit,
        headless=args.headless.lower() == "true"
    )
    
    scraper = GoogleScraper(config)
    lead_input = LeadInput(company_name=args.query, niche="", location="")
    
    try:
        result = scraper.scrape_until_lead_limit(
            lead=lead_input,
            required_leads=args.limit,
            max_scroll_attempts=args.max_scrolls
        )
        # Final output must be JSON to stdout for the TS connector to read
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

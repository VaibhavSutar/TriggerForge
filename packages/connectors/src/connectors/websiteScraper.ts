
import axios from "axios";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,5}\b/g;

function extractEmails(text: string): string[] {
    if (!text) return [];
    const matches = text.match(emailRegex);
    return matches ? Array.from(new Set(matches)) : [];
}

function extractLinks(html: string, baseUrl: string): string[] {
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
    const links: Set<string> = new Set();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        if (url.startsWith("/")) {
            url = new URL(url, baseUrl).href;
        }
        if (url.startsWith(baseUrl)) {
            links.add(url);
        }
    }
    return Array.from(links);
}

export const websiteScraperConnector: Connector = {
    id: "website_scraper",
    name: "Website Scraper (Email Extraction)",
    type: "scraper",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        let url = config.url || ctx.input?.url || ctx.input;
        if (!url) {
            throw new Error("Missing URL for scraping");
        }

        // Handle array of URLs? Let's just handle one to keep it clean for workflow engine
        if (Array.isArray(url)) {
            url = url[0];
        }

        if (typeof url !== "string" || !url.startsWith("http")) {
            throw new Error(`Invalid URL format: ${url}`);
        }

        ctx.logs.push(`[website_scraper] Scraping URL: ${url}`);

        try {
            // 1. Fetch homepage
            const response = await axios.get(url, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = response.data;
            const homepageEmails = extractEmails(html);
            
            let allEmails = new Set(homepageEmails);
            
            // 2. Look for "Contact" or "About" pages
            const links = extractLinks(html, url);
            const contactLinks = links.filter(l => 
                l.toLowerCase().includes("contact") || 
                l.toLowerCase().includes("about") || 
                l.toLowerCase().includes("reach") ||
                l.toLowerCase().includes("support")
            ).slice(0, 3); // Limit to 3 pages to avoid too many requests

            for (const cLink of contactLinks) {
                try {
                    ctx.logs.push(`[website_scraper] Deep scraping: ${cLink}`);
                    const cRes = await axios.get(cLink, { timeout: 8000 });
                    const cEmails = extractEmails(cRes.data);
                    cEmails.forEach(e => allEmails.add(e));
                } catch (e: any) {
                    ctx.logs.push(`[website_scraper] Error scraping subpage ${cLink}: ${e.message}`);
                }
            }

            const results = Array.from(allEmails);
            ctx.logs.push(`[website_scraper] Found ${results.length} unique emails`);

            return {
                success: true,
                output: {
                    url,
                    emails: results,
                    email: results[0] || null,
                    count: results.length
                }
            };
        } catch (error: any) {
             ctx.logs.push(`[website_scraper] Error: ${error.message}`);
             return {
                 success: false,
                 output: null,
                 error: `Failed to scrape website: ${error.message}`
             };
        }
    }
};

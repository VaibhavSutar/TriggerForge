
export interface TemplateNode {
    id: string;
    connectorId: string;
    label: string;
    position: { x: number; y: number };
    config: Record<string, any>;
}

export interface TemplateEdge {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    nodes: TemplateNode[];
    edges: TemplateEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: "bulk_content_pipeline",
        name: "Bulk Content Generation Pipeline",
        description: "Generate 10 structured creative ideas, build dedicated Google Docs for each, and auto-log them inside a Google Sheet.",
        nodes: [
            { id: "1", connectorId: "start", label: "Manual Start", position: { x: 100, y: 100 }, config: { event: "manual" } },
            { id: "2", connectorId: "google_sheets", label: "Write Headers", position: { x: 100, y: 250 }, config: { operation: "update_sheet", spreadsheetId: "YOUR_SPREADSHEET_ID_HERE", range: "Sheet1!A1:F1", values: "[[\"Reel Title\", \"Concept Summary\", \"YouTube Search Query\", \"Visual Assets\", \"Status\", \"Google Doc Link\"]]" } },
            { id: "3", connectorId: "ai", label: "Generate 10 Reels (JSON)", position: { x: 100, y: 400 }, config: { model: "gemini-2.0-flash", prompt: "Create exactly 10 Instagram Reel ideas for the tech niche. You MUST output ONLY a valid JSON array of objects. Do NOT include markdown tags like ```json. Each object must have exactly these keys: 'title', 'concept' (a 1-sentence summary), 'script', 'youtubeSearchQuery' (a highly specific search term to find relevant reference videos on YouTube, e.g. 'mkbhd smartphone review style'), and 'assets'. Example: [{\"title\": \"Future Tech\", \"concept\": \"A quick look at quantum computing\", \"script\": \"Voiceover: ...\", \"youtubeSearchQuery\": \"quantum computing explained in 60 seconds\", \"assets\": \"B-roll of servers\"}]" } },
            { id: "4", connectorId: "loop", label: "Iterate Over Reels", position: { x: 100, y: 550 }, config: { array: "{{ $node.3.output.text }}" } },
            { id: "5", connectorId: "google_docs", label: "Create Reel Doc", position: { x: 100, y: 700 }, config: { operation: "create_doc", title: "Tech Reel: {{ input.title }}", content: "Title: {{ input.title }}\n\nConcept:\n{{ input.concept }}\n\nScript:\n{{ input.script }}\n\nYouTube Search For Inspiration:\n{{ input.youtubeSearchQuery }}\n\nAssets Needed:\n{{ input.assets }}" } },
            { id: "6", connectorId: "google_sheets", label: "Log inside Tracker", position: { x: 100, y: 850 }, config: { operation: "append_row", spreadsheetId: "YOUR_SPREADSHEET_ID_HERE", range: "Sheet1!A:F", values: "[[\"{{ input.title }}\", \"{{ input.concept }}\", \"{{ input.youtubeSearchQuery }}\", \"{{ input.assets }}\", \"Ready for Review\", \"https://docs.google.com/document/d/{{ input.documentId }}/edit\"]]" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" }
        ]
    },
    {
        id: "seo_blog_ecosystem",
        name: "Automated SEO Blog Ecosystem",
        description: "Generate 5 trending SEO topics daily, architect full outlines for each, save them to Google Docs, and organize them into your Content Calendar.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Daily Schedule", position: { x: 100, y: 100 }, config: { expression: "0 8 * * *" } },
            { id: "2", connectorId: "ai", label: "Discover Trends (JSON)", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Identify 5 highly trending sub-topics in the 'Artificial Intelligence' space right now. Return ONLY a valid JSON array of objects without markdown. Keys must be: 'keyword', 'searchIntent', and 'targetAudience'. Example: [{\"keyword\": \"AI Agents 2026\", \"searchIntent\": \"Informational\", \"targetAudience\": \"Developers\"}]" } },
            { id: "3", connectorId: "loop", label: "Loop Trending Topics", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output.text }}" } },
            { id: "4", connectorId: "ai", label: "Draft SEO Outline", position: { x: 100, y: 550 }, config: { model: "gemini-2.0-flash", prompt: "Write a comprehensive, SEO-optimized blog outline for the keyword: '{{ input.keyword }}'. Audience: {{ input.targetAudience }}. Intent: {{ input.searchIntent }}. Include H1, H2, and H3 tags." } },
            { id: "5", connectorId: "google_docs", label: "Save SEO Outline", position: { x: 100, y: 700 }, config: { operation: "create_doc", title: "SEO Outline: {{ item.keyword }}", content: "{{ input.text }}" } },
            { id: "6", connectorId: "google_sheets", label: "Log to Content Calendar", position: { x: 100, y: 850 }, config: { operation: "append_row", spreadsheetId: "YOUR_CALENDAR_SHEET_ID_HERE", range: "Sheet1!A:E", values: "[[\"{{ item.keyword }}\", \"{{ item.searchIntent }}\", \"{{ item.targetAudience }}\", \"Drafted\", \"https://docs.google.com/document/d/{{ input.documentId }}/edit\"]]" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" }
        ]
    },
    {
        id: "smart_email_sorter",
        name: "AI Smart Email Sorter",
        description: "Sorts incoming emails based on context. Adds organizational tags/labels or automatically moves them to the spam folder if detected as junk.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Every Hour", position: { x: 100, y: 100 }, config: { expression: "0 * * * *" } },
            { id: "2", connectorId: "google_gmail", label: "Fetch Unread Emails", position: { x: 100, y: 250 }, config: { operation: "read_emails", query: "is:unread -has:userlabels" } },
            { id: "3", connectorId: "loop", label: "Iterate Inbox", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output.emails }}" } },
            { id: "4", connectorId: "ai", label: "Analyze Context (JSON)", position: { x: 100, y: 550 }, config: { model: "gemini-2.0-flash", prompt: "Analyze this email: Subject: '{{ input.subject }}' Body: '{{ input.body }}'. Current Labels: '{{ input.labels }}'. Return a JSON object with two fields: 'isSpam' (boolean) and 'tags' (array of strings). LIMIT: Return exactly 2 most relevant tags. REUSE: If any 'Current Labels' are relevant, include them in the 'tags' array instead of generating new ones." } },
            { id: "5", connectorId: "condition", label: "Check if Spam", position: { x: 100, y: 700 }, config: { condition: "{{ $node.4.isSpam }} === true" } },
            { id: "6", connectorId: "google_gmail", label: "Move to Spam", position: { x: 300, y: 850 }, config: { operation: "move_to_spam", messageId: "{{ input.id }}" } },
            { id: "7", connectorId: "google_gmail", label: "Add Context Tags", position: { x: -100, y: 850 }, config: { operation: "modify_labels", messageId: "{{ input.id }}", addLabels: "{{ $node.4.tags }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6", sourceHandle: "true" },
            { source: "5", target: "7", sourceHandle: "false" }
        ]
    },
    {
        id: "premium_ai_video_reel",
        name: "Premium AI Reel Engine",
        description: "Professional Reel generation: Multi-clip stitching, ElevenLabs neural voices, and built-in yellow captions. No cloud rendering fees.",
        nodes: [
            { id: "1", connectorId: "start", label: "Start Production", position: { x: 100, y: 100 }, config: { event: "manual" } },
            { id: "2", connectorId: "ai", label: "Gen 3 Bulk Scripts", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Create 3 unique, high-impact 20-second reel scripts for a 'Luxury Travel' niche. Return as a JSON object with a 'reels' array. Each object in the array MUST have: 1. 'script' (punchy voiceover text) 2. 'search_query' (highly specific Pexels search term for related travel visuals). Return ONLY raw JSON without markdown code blocks." } },
            { id: "3", connectorId: "pexels", label: "Fetch Assets (Batch)", position: { x: -100, y: 400 }, config: { query: "{{$node.2.output.reels}}", type: "videos", per_page: 3, orientation: "portrait" } },
            { id: "4", connectorId: "elevenlabs", label: "Voiceovers (Batch)", position: { x: 300, y: 400 }, config: { apiKey: "YOUR_ELEVENLABS_KEY", voiceId: "pNInz6obpgDQGcFmaJgB", model_id: "eleven_multilingual_v2", text: "{{$node.2.output.reels}}" } },
            { id: "5", connectorId: "video_renderer_local", label: "Parallel Render Engine", position: { x: 100, y: 550 }, config: { operation: "stitch", videoUrls: "{{$node.3.output}}", audioUrl: "{{$node.4.output}}", text: "{{$node.2.output.reels}}", outputName: "luxury_reel" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" }
        ]
    },
    {
        id: "google_maps_outreach_ai",
        name: "Google Maps AI Outreach Engine",
        description: "Deep scrape leads from Google Maps, store inside Sheets, and generate hyper-personalized outreach emails using AI.",
        nodes: [
            { id: "1", connectorId: "start", label: "Start Trigger", position: { x: 250, y: 50 }, config: {} },
            { id: "2", connectorId: "google_maps_deep_scraper", label: "Google Maps Deep Scraper (Premium)", position: { x: 500, y: 50 }, config: { query: "Restaurant in Mumbai", limit: 5, max_scrolls: 10, headless: true } },
            { id: "3", connectorId: "ai", label: "Extract Leads (JSON)", position: { x: 800, y: 50 }, config: { model: "gemini-2.0-flash", prompt: "Extract business leads from this data: {{$node.2.output.leads_json }}. Return ONLY a JSON array with 'name', 'website', 'email' and 'niche'. Force the niche to be 'Restaurant'. No markdown.", system: "You are a data parser. Respond ONLY with a raw JSON array." } },
            { id: "4", connectorId: "google_sheets", label: "Store Leads in Sheet", position: { x: 800, y: 250 }, config: { operation: "append_rows", spreadsheetId: "YOUR_SPREADSHEET_ID_HERE", range: "Leads!A:D", data: "{{$node.3.output.text }}" } },
            { id: "5", connectorId: "google_sheets", label: "Read All Leads from Sheet", position: { x: 250, y: 250 }, config: { operation: "read_sheet", spreadsheetId: "YOUR_SPREADSHEET_ID_HERE", range: "Leads!A1:D" } },
            { id: "6", connectorId: "loop", label: "Iterate Leads", position: { x: 550, y: 250 }, config: { array: "{{$node.5.output }}" } },
            { id: "7", connectorId: "ai", label: "Generate Outreach Email", position: { x: 250, y: 450 }, config: { model: "gemini-2.0-flash", prompt: "Write a PROFESSIONAL AND PERSONALIZED outreach email to {{ item.0 }}. They are in the {{ item.3 }} niche.\n\nSTRUCTURE TO FOLLOW:\nSubject: Enhancing the {{ item.0 }} Experience\n\nDear {{ item.0 }} Team,\n\n[Body inspired by your professional background as a Digital Strategist. Mention specific admiration for their work in the {{ item.3 }} space and how you can help them attract more patrons through targeted digital growth and operational efficiency.]\n\nRULES:\n1. Use the name {{ item.0 }} naturally.\n2. DO NOT use brackets like [Name], [Company], or [Your Title]. Fill them in professionally as 'Vaibhav, Outreach Specialist at TriggerForge'.\n3. DO NOT return a template; write the final ready-to-send email body.\n4. Return ONLY the body text of the email (exclude the subject line as it is handled separately).", system: "You are an expert hospitality copywriter. Write the final email body immediately." } },
            { id: "8", connectorId: "google_gmail", label: "Send Email", position: { x: 550, y: 450 }, config: { operation: "send_email", to: "{{ item.2 }}", subject: "Enhancing the {{ item.0 }} Experience", body: "{{$node.7.output.text }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" },
            { source: "6", target: "7" },
            { source: "7", target: "8" }
        ]
    },
    {
        id: "seo_sanity_content_engine",
        name: "Enterprise SEO & Sanity Content Engine",
        description: "Generate high-authority tech articles matching your Sanity 'blogs' schema, including SEO metadata, and push directly to your CMS.",
        nodes: [
            { id: "1", connectorId: "start", label: "Start Discovery", position: { x: 100, y: 100 }, config: { event: "manual" } },
            { id: "2", connectorId: "ai", label: "Market Research (JSON)", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "As an SEO expert for a Software/Tech services company specializing in {{NIChE_KEYWORDS}}, identify 3 high-intent educational topics for CTOs and Engineers. Return ONLY a JSON array with 'topic', 'targetKeyword', and 'audiencePainPoint'.", system: "You are a senior SEO strategist. Respond ONLY with valid JSON." } },
            { id: "3", connectorId: "loop", label: "Process Topics", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output.text }}" } },
            {
                id: "4",
                connectorId: "ai",
                label: "Generate Prime Content",
                position: { x: -100, y: 550 },
                config: {
                    model: "gemini-2.0-flash",
                    prompt: `As a Senior Technical Content Strategist, write a comprehensive, high-authority article for CTOs on: {{item.topic}}
Focusing on: {{item.audiencePainPoint}}
Keyword: {{item.targetKeyword}}

Return a JSON object containing:
1. "title": A compelling, SEO-friendly title.
2. "subtitle": An engaging sub-headline.
3. "slug": A URL-friendly string.
4. "excerpt": A 2-sentence meta description.
5. "category": Assume a relevant category (e.g., "Technology & Digital Transformation").
6. "categoryColor": Valid hex code or string representing the color (e.g., "00000").
7. "date": Use EXACTLY "2026-04-16T12:00:00.000Z".
8. "readTime": Estimated read time as a string number (e.g., "6").
9. "content": The article content strictly as a JSON ARRAY of Sanity Portable Text blocks. Do NOT use markdown strings. 
CRITICAL: Every block AND every span MUST have a uniquely generated 6-character string "_key".
Example structure for content:
[
  { "_key": "a1b2c3", "_type": "block", "style": "normal", "children": [ { "_key": "x9y8z7", "_type": "span", "marks": [], "text": "Regular paragraph text here." } ] },
  { "_key": "d4e5f6", "_type": "block", "style": "h2", "children": [ { "_key": "u1v2w3", "_type": "span", "marks": ["strong"], "text": "Heading text here" } ] }
]

DO NOT include any extra fields. Return ONLY the JSON object.`,

                }
            },
            {
                id: "5",
                connectorId: "ai",
                label: "Social Reach Hooks",
                position: { x: 300, y: 550 },
                config: {
                    model: "gemini-2.0-flash",
                    prompt: `Generate 3 high-impact social media posts for the following article:
Title: {{$node.4.title}}
Subtitle: {{$node.4.subtitle}}

Return a JSON object with keys "linkedin", "x", and "instagram", each containing the post "content".`,
                }
            },
            {
                id: "6",
                connectorId: "http",
                label: "Push to Sanity (blogs)",
                position: { x: 100, y: 750 },
                config: {
                    method: "POST",
                    url: "https://{{YOUR_SANITY_PROJECT_ID}}.api.sanity.io/v2021-06-07/data/mutate/{{YOUR_SANITY_DATASET}}",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer {{YOUR_SANITY_API_TOKEN}}"
                    },
                    body: {
                        mutations: [
                            {
                                create: {
                                    _type: "blogs",
                                    title: "{{$node.4.title}}",
                                    subtitle: "{{$node.4.subtitle}}",
                                    slug: { _type: "slug", current: "{{$node.4.slug}}" },
                                    excerpt: "{{$node.4.excerpt}}",
                                    category: "{{$node.4.category}}",
                                    categoryColor: "{{$node.4.categoryColor}}",
                                    date: "{{$node.4.date}}",
                                    readTime: "{{$node.4.readTime}}",
                                    content: "{{$node.4.content}}"
                                }
                            }
                        ]
                    }
                }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" }
        ]
    }
];

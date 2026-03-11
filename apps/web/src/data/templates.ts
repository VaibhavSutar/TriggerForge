
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
        id: "email_comm_automation",
        name: "Email & Communication Automation",
        description: "Automate bulk sending of promotional messages via Gmail using data from Sheets.",
        nodes: [
            {
                id: "1",
                connectorId: "start",
                label: "Manual Trigger",
                position: { x: 100, y: 300 },
                config: { event: "manual" }
            },
            {
                id: "2",
                connectorId: "google_sheets",
                label: "Read Contacts",
                position: { x: 400, y: 300 },
                config: { operation: "read_sheet", spreadsheetId: "ENTER_SPREADSHEET_ID" }
            },
            {
                id: "3",
                connectorId: "google_gmail",
                label: "Send Email",
                position: { x: 700, y: 300 },
                config: { to: "{{$node.2.output[0][0]}}", subject: "Update", body: "Hello!" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
    {
        id: "customer_support",
        name: "Customer Support Automation",
        description: "AI-driven auto-replies to customer queries received via Webhook.",
        nodes: [
            {
                id: "1",
                connectorId: "webhook",
                label: "Receive Query",
                position: { x: 100, y: 300 },
                config: {
                    expectedPayload: {
                        "body": {
                            "email": "user@example.com",
                            "query": "How do I reset my password?"
                        }
                    }
                }
            },
            {
                id: "2",
                connectorId: "gemini",
                label: "Generate Reply",
                position: { x: 400, y: 300 },
                config: { operation: "chat", model: "gemini-pro", input: "Answer this customer query: {{$node.1.output.body.query}}" }
            },
            {
                id: "3",
                connectorId: "google_gmail",
                label: "Send Reply",
                position: { x: 700, y: 300 },
                config: { to: "{{$node.1.output.body.email}}", subject: "Re: Support", body: "{{$node.2.output}}" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
    {
        id: "expense_budget",
        name: "Expense & Budget Management",
        description: "Log expenses to Google Sheets and notify via Slack.",
        nodes: [
            {
                id: "1",
                connectorId: "webhook",
                label: "New Expense",
                position: { x: 100, y: 300 },
                config: {
                    expectedPayload: {
                        "body": {
                            "amount": 50.00,
                            "category": "Office Supplies",
                            "description": "Printer paper"
                        }
                    }
                }
            },
            {
                id: "2",
                connectorId: "google_sheets",
                label: "Log Expense",
                position: { x: 400, y: 300 },
                config: { operation: "append_row", spreadsheetId: "ENTER_ID", values: ["{{$node.1.output.body.amount}}", "{{$node.1.output.body.category}}"] }
            },
            {
                id: "3",
                connectorId: "slack",
                label: "Notify Team",
                position: { x: 700, y: 300 },
                config: { webhookUrl: "ENTER_WEBHOOK_URL", message: "New expense logged: {{$node.1.output.body.amount}}" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
    {
        id: "marketing_automation",
        name: "Marketing & Notifications",
        description: "Schedule posts on Twitter and notify Telegram channel.",
        nodes: [
            {
                id: "1",
                connectorId: "cron",
                label: "Daily Schedule",
                position: { x: 100, y: 300 },
                config: { expression: "0 9 * * *" }
            },
            {
                id: "2",
                connectorId: "twitter",
                label: "Post Tweet",
                position: { x: 400, y: 300 },
                config: { text: "New update available!" }
            },
            {
                id: "3",
                connectorId: "telegram",
                label: "Notify Channel",
                position: { x: 700, y: 300 },
                config: { botToken: "ENTER_TOKEN", chatId: "ENTER_CHAT_ID", message: "Tweet posted!" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
    {
        id: "social_media",
        name: "Social Media Automation",
        description: "Generate AI content and publish to Twitter automatically.",
        nodes: [
            {
                id: "1",
                connectorId: "cron",
                label: "Weekly Schedule",
                position: { x: 100, y: 300 },
                config: { expression: "0 10 * * 1" }
            },
            {
                id: "2",
                connectorId: "ai",
                label: "Generate Tweet",
                position: { x: 400, y: 300 },
                config: { prompt: "Write a tech tip about automated workflows.", model: "gpt-4o" }
            },
            {
                id: "3",
                connectorId: "twitter",
                label: "Publish Tweet",
                position: { x: 700, y: 300 },
                config: { text: "{{$node.2.output}}" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
    {
        id: "creative_content",
        name: "Creative Content Automation",
        description: "Generate a blog draft using AI and save to Google Docs.",
        nodes: [
            {
                id: "1",
                connectorId: "start",
                label: "Start Workflow",
                position: { x: 100, y: 300 },
                config: { event: "manual" }
            },
            {
                id: "2",
                connectorId: "ai",
                label: "Draft Blog",
                position: { x: 400, y: 300 },
                config: { prompt: "Write a blog post about the future of AI agents." }
            },
            {
                id: "3",
                connectorId: "google_docs",
                label: "Save Draft",
                position: { x: 700, y: 300 },
                config: { operation: "create_doc", title: "AI Agents Blog", content: "{{$node.2.output}}" }
            }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" }
        ]
    },
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
        id: "crm_email_outreach",
        name: "CRM Bulk Email Outreach",
        description: "Pull contact data and personalized notes from a Google Sheet, and dispatch beautifully customized emails to each prospect.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Weekly Schedule", position: { x: 100, y: 100 }, config: { expression: "0 10 * * 1" } },
            { id: "2", connectorId: "google_sheets", label: "Read CRM Contacts", position: { x: 100, y: 250 }, config: { operation: "read_sheet", spreadsheetId: "YOUR_CRM_SHEET_ID", range: "Leads!A2:C" } },
            { id: "3", connectorId: "loop", label: "Loop Leads", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output }}" } },
            { id: "4", connectorId: "openai", label: "Draft Custom Email", position: { x: 100, y: 550 }, config: { operation: "generate", model: "gpt-4o", input: "Write a short, engaging 3-sentence outreach email to {{ input[0] }} who is interested in {{ input[2] }}. Be friendly." } },
            { id: "5", connectorId: "google_gmail", label: "Send Outreach Email", position: { x: 100, y: 700 }, config: { operation: "send_email", to: "{{ input[1] }}", subject: "Quick question about {{ input[2] }}!", body: "{{ $node.4.output.text }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" }
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
            { id: "5", connectorId: "google_docs", label: "Save SEO Outline", position: { x: 100, y: 700 }, config: { operation: "create_doc", title: "SEO Outline: {{ input.keyword }}", content: "{{ $node.4.output.text }}" } },
            { id: "6", connectorId: "google_sheets", label: "Log to Content Calendar", position: { x: 100, y: 850 }, config: { operation: "append_row", spreadsheetId: "YOUR_CALENDAR_SHEET_ID_HERE", range: "Sheet1!A:E", values: "[[\"{{ input.keyword }}\", \"{{ input.searchIntent }}\", \"{{ input.targetAudience }}\", \"Drafted\", \"https://docs.google.com/document/d/{{ input.documentId }}/edit\"]]" } }
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
        id: "meeting_task_delegator",
        name: "Meeting Summarizer & Task Delegator",
        description: "Submit a meeting transcript via webhook. The AI builds a summary, extracts action items, logs them to Sheets, and emails everyone their specific tasks.",
        nodes: [
            { id: "1", connectorId: "webhook", label: "Receive Transcript", position: { x: 100, y: 100 }, config: { expectedPayload: { "body": { "transcript": "John: I will handle the API keys. Sarah: Great, I'll draft the docs." } } } },
            { id: "2", connectorId: "ai", label: "Extract Action Items (JSON)", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Read this transcript: '{{ $node.1.output.body.transcript }}'. Extract all action items. Return ONLY a JSON array of objects. Keys: 'assigneeName', 'assigneeEmail' (guess if missing, e.g. name@company.com), 'task', 'priority'. Example: [{\"assigneeName\": \"Sarah\", \"assigneeEmail\": \"sarah@example.com\", \"task\": \"Draft Docs\", \"priority\": \"High\"}]" } },
            { id: "3", connectorId: "ai", label: "Generate Executive Summary", position: { x: 400, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Summarize the key decisions from this transcript: '{{ $node.1.output.body.transcript }}'" } },
            { id: "4", connectorId: "google_docs", label: "Save Master Summary", position: { x: 400, y: 400 }, config: { operation: "create_doc", title: "Meeting Summary", content: "{{ $node.3.output.text }}" } },
            { id: "5", connectorId: "loop", label: "Loop Action Items", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output.text }}" } },
            { id: "6", connectorId: "google_sheets", label: "Add Task to Tracker", position: { x: 100, y: 550 }, config: { operation: "append_row", spreadsheetId: "YOUR_TASK_SHEET_ID_HERE", range: "Tasks!A:D", values: "[[\"{{ input.assigneeName }}\", \"{{ input.task }}\", \"{{ input.priority }}\", \"To Do\"]]" } },
            { id: "7", connectorId: "google_gmail", label: "Email Assignment", position: { x: 100, y: 700 }, config: { operation: "send_email", to: "{{ input.assigneeEmail }}", subject: "New Action Item: {{ input.task }}", body: "Hi {{ input.assigneeName }},\n\nYou have a new {{ input.priority }} priority task from the recent meeting:\n\n{{ input.task }}\n\nPlease review the master summary doc for more context." } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "1", target: "3" },
            { source: "3", target: "4" },
            { source: "2", target: "5" },
            { source: "5", target: "6" },
            { source: "6", target: "7" }
        ]
    },
    {
        id: "daily_newsletter_sender",
        name: "Daily Newsletter Broadcaster",
        description: "Drafts a daily newsletter using AI, creates a backup Google Doc, pulls your entire subscriber list from Google Sheets, and sends personalized emails to everyone.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Daily 8 AM", position: { x: 100, y: 100 }, config: { expression: "0 8 * * *" } },
            { id: "2", connectorId: "openai", label: "Write Newsletter", position: { x: 100, y: 250 }, config: { operation: "generate", model: "gpt-4o", input: "Write today's edition of my tech newsletter. Cover 3 major recent advancements in tech. Keep it engaging, friendly, and structured. (Do not include placeholder names)." } },
            { id: "3", connectorId: "google_docs", label: "Save Backup Draft", position: { x: 400, y: 250 }, config: { operation: "create_doc", title: "Newsletter - Draft", content: "{{ $node.2.output.text }}" } },
            { id: "4", connectorId: "google_sheets", label: "Read Subscribers", position: { x: 100, y: 400 }, config: { operation: "read_sheet", spreadsheetId: "YOUR_SUBSCRIBERS_SHEET_ID_HERE", range: "Subscribers!A2:B" } },
            { id: "5", connectorId: "loop", label: "Loop Subscribers", position: { x: 100, y: 550 }, config: { array: "{{ $node.4.output }}" } },
            { id: "6", connectorId: "google_gmail", label: "Mass Email Segment", position: { x: 100, y: 700 }, config: { operation: "send_email", to: "{{ input[1] }}", subject: "Your Daily Tech Update!", body: "Hi {{ input[0] }},\n\n{{ $node.2.output.text }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "2", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" }
        ]
    },
    {
        id: "hr_onboarding_automation",
        name: "HR Employee Onboarding Path",
        description: "Receive a new hire's details via webhook. The AI builds a custom 30-day onboarding plan, saves it to a Google Doc, updates the HR roster, and emails the new hire.",
        nodes: [
            { id: "1", connectorId: "webhook", label: "New Hire Alert", position: { x: 100, y: 100 }, config: { expectedPayload: { "body": { "employeeName": "Alex Doe", "role": "Frontend Engineer", "email": "alex@example.com", "startDate": "Next Monday" } } } },
            { id: "2", connectorId: "ai", label: "Draft 30-Day Plan", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Create a detailed, day-by-day 30-day onboarding plan for a new {{ $node.1.output.body.role }} named {{ $node.1.output.body.employeeName }}." } },
            { id: "3", connectorId: "google_docs", label: "Save Onboarding Doc", position: { x: 100, y: 400 }, config: { operation: "create_doc", title: "Onboarding: {{ $node.1.output.body.employeeName }}", content: "{{ $node.2.output.text }}" } },
            { id: "4", connectorId: "google_sheets", label: "Update HR Tracker", position: { x: 100, y: 550 }, config: { operation: "append_row", spreadsheetId: "YOUR_HR_SHEET_ID_HERE", range: "Roster!A:E", values: "[[\"{{ $node.1.output.body.employeeName }}\", \"{{ $node.1.output.body.role }}\", \"{{ $node.1.output.body.startDate }}\", \"Active\", \"https://docs.google.com/document/d/{{ $node.3.output.documentId }}\"]]" } },
            { id: "5", connectorId: "google_gmail", label: "Welcome Email", position: { x: 100, y: 700 }, config: { operation: "send_email", to: "{{ $node.1.output.body.email }}", subject: "Welcome to the team, {{ $node.1.output.body.employeeName }}!", body: "Hi {{ $node.1.output.body.employeeName }},\n\nWe are so excited to have you join as our new {{ $node.1.output.body.role }}!\n\nI have generated your custom 30-day onboarding guide here: https://docs.google.com/document/d/{{ $node.3.output.documentId }}\n\nSee you on {{ $node.1.output.body.startDate }}!" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" }
        ]
    },
    {
        id: "customer_feedback_analyzer",
        name: "Customer Feedback Analyzer",
        description: "Triggers when a new customer review is received. The AI analyzes sentiment, extracts actionable feedback, logs it to a team spreadsheet, and emails customer support.",
        nodes: [
            { id: "1", connectorId: "webhook", label: "New Review", position: { x: 100, y: 100 }, config: { expectedPayload: { "body": { "customer": "Jane Smith", "rating": 2, "reviewText": "The app is incredibly slow when I try to upload photos, and it crashed twice today." } } } },
            { id: "2", connectorId: "ai", label: "Analyze Sentiment", position: { x: 100, y: 250 }, config: { model: "gemini-2.0-flash", prompt: "Summarize this customer review into exactly two sentences. Sentence 1: The core sentiment (Positive/Negative/Neutral). Sentence 2: The single most actionable item for support to fix.\n\nReview: '{{ $node.1.output.body.reviewText }}'" } },
            { id: "3", connectorId: "google_sheets", label: "Log Review API", position: { x: 100, y: 400 }, config: { operation: "append_row", spreadsheetId: "YOUR_FEEDBACK_SHEET_ID_HERE", range: "Reviews!A:E", values: "[[\"{{ $node.1.output.body.customer }}\", \"{{ $node.1.output.body.rating }} Stars\", \"{{ $node.2.output.text }}\", \"Pending\", \"To be assigned\"]]" } },
            { id: "4", connectorId: "google_gmail", label: "Alert Support Team", position: { x: 100, y: 550 }, config: { operation: "send_email", to: "support@yourcompany.com", subject: "New Review Alert from {{ $node.1.output.body.customer }}", body: "A new review was just logged and analyzed.\n\nCustomer: {{ $node.1.output.body.customer }}\nRating: {{ $node.1.output.body.rating }}\n\nAI Analysis:\n{{ $node.2.output.text }}\n\nPlease check the tracker and follow up." } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" }
        ]
    },
    {
        id: "website_lead_scraper",
        name: "Website Lead Scraper & Outreach",
        description: "Scrape leads from a website, add them to a Google Sheet, and send a personalized outreach email to the client.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Daily Scrape", position: { x: 100, y: 100 }, config: { expression: "0 9 * * *" } },
            { id: "2", connectorId: "serpapi", label: "Search Google", position: { x: 100, y: 250 }, config: { query: "plumbing services in austin texas", engine: "google", num: 10 } },
            { id: "3", connectorId: "openai", label: "Extract Lead Info (JSON)", position: { x: 100, y: 400 }, config: { operation: "generate", model: "gpt-4o", input: "Extract lead information from the following search results: {{ $node.2.output.organic_results }}. Focus on finding companies that might need our services. Return ONLY a JSON array of objects. Keys: 'companyName', 'contactPerson', 'email', 'website', 'industry'. Example: [{\"companyName\": \"Tech Corp\", \"contactPerson\": \"John Doe\", \"email\": \"john@techcorp.com\", \"website\": \"techcorp.com\", \"industry\": \"Software\"}]. If you cannot find a contact person or email, make an educated guess based on the website snippet or use a generic one like 'info@company.com'." } },
            { id: "4", connectorId: "loop", label: "Process Leads", position: { x: 100, y: 550 }, config: { array: "{{ $node.3.output.text }}" } },
            { id: "5", connectorId: "google_sheets", label: "Log Lead to Sheet", position: { x: 100, y: 700 }, config: { operation: "append_row", spreadsheetId: "YOUR_LEADS_SHEET_ID", range: "Leads!A:E", values: "[[\"{{ input.companyName }}\", \"{{ input.contactPerson }}\", \"{{ input.email }}\", \"{{ input.website }}\", \"{{ input.industry }}\"]]" } },
            { id: "6", connectorId: "openai", label: "Draft Custom Email", position: { x: 100, y: 850 }, config: { operation: "generate", model: "gpt-4o", input: "Write a short, personalized outreach email to {{ input.contactPerson }} at {{ input.companyName }}. Mention we noticed their work in the {{ input.industry }} industry and offer a quick call to discuss how we can help improve their website ({{ input.website }})." } },
            { id: "7", connectorId: "google_gmail", label: "Send Outreach Email", position: { x: 100, y: 1000 }, config: { operation: "send_email", to: "{{ input.email }}", subject: "Ideas for {{ input.companyName }}'s website", body: "{{ $node.6.output.text }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "4", target: "6" },
            { source: "6", target: "7" }
        ]
    },
    {
        id: "serpapi_lead_outreach",
        name: "SerpAPI Lead Fetch & Outreach",
        description: "Fetch leads from SerpAPI, populate a Google Sheet, iterate through that sheet to draft personalized AI emails, and send them automatically.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Daily Lead Gen", position: { x: 100, y: 100 }, config: { expression: "0 9 * * *" } },
            { id: "2", connectorId: "serpapi", label: "Fetch Leads from Google", position: { x: 100, y: 250 }, config: { query: "marketing agencies near me", engine: "google", num: 10 } },
            { id: "3", connectorId: "openai", label: "Extract Leads (JSON)", position: { x: 100, y: 400 }, config: { operation: "generate", model: "gpt-4o", input: "Extract business leads from these search results: {{ $node.2.output.organic_results }}. Return a JSON array with 'name', 'website', and 'niche'." } },
            { id: "4", connectorId: "google_sheets", label: "Store Leads in Sheet", position: { x: 100, y: 550 }, config: { operation: "append_rows", spreadsheetId: "YOUR_SHEET_ID", range: "Leads!A:C", data: "{{ $node.3.output.text }}" } },
            { id: "5", connectorId: "google_sheets", label: "Read All Leads from Sheet", position: { x: 100, y: 700 }, config: { operation: "read_sheet", spreadsheetId: "YOUR_SHEET_ID", range: "Leads!A2:D" } },
            { id: "6", connectorId: "loop", label: "Iterate Leads", position: { x: 100, y: 850 }, config: { array: "{{ $node.5.output }}" } },
            { id: "7", connectorId: "openai", label: "Generate Outreach Email", position: { x: 100, y: 1000 }, config: { operation: "generate", model: "gpt-4o", input: "Write a short custom outreach email for {{ input[0] }} in the {{ input[2] }} niche." } },
            { id: "8", connectorId: "google_gmail", label: "Send Email", position: { x: 100, y: 1150 }, config: { operation: "send_email", to: "{{ input[1] }}", subject: "Collaboration Inquiry", body: "{{ $node.7.output.text }}" } }
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
        id: "smart_email_sorter",
        name: "AI Smart Email Sorter",
        description: "Sorts incoming emails based on context. Adds organizational tags/labels or automatically moves them to the spam folder if detected as junk.",
        nodes: [
            { id: "1", connectorId: "cron", label: "Every Hour", position: { x: 100, y: 100 }, config: { expression: "0 * * * *" } },
            { id: "2", connectorId: "google_gmail", label: "Fetch Unread Emails", position: { x: 100, y: 250 }, config: { operation: "read_emails", query: "is:unread" } },
            { id: "3", connectorId: "loop", label: "Iterate Inbox", position: { x: 100, y: 400 }, config: { array: "{{ $node.2.output.emails }}" } },
            { id: "4", connectorId: "openai", label: "Analyze Context (JSON)", position: { x: 100, y: 550 }, config: { operation: "generate", model: "gpt-4o", input: "Analyze this email: Subject: '{{ input.subject }}' Body: '{{ input.body }}'. Return a JSON object with two fields: 'isSpam' (boolean) and 'tags' (array of strings like 'Invoice', 'Newsletter', 'Urgent')." } },
            { id: "5", connectorId: "condition", label: "Check if Spam", position: { x: 100, y: 700 }, config: { condition: "{{ $node.4.output.text.isSpam }} === true" } },
            { id: "6", connectorId: "google_gmail", label: "Move to Spam", position: { x: 300, y: 850 }, config: { operation: "move_to_spam", messageId: "{{ input.id }}" } },
            { id: "7", connectorId: "google_gmail", label: "Add Context Tags", position: { x: -100, y: 850 }, config: { operation: "modify_labels", messageId: "{{ input.id }}", addLabels: "{{ $node.4.output.text.tags }}" } }
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" },
            { source: "5", target: "7" }
        ]
    }
];

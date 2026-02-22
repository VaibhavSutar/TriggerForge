
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
    }
];

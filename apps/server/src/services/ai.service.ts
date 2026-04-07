import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../prisma";

export class AIService {
    private genAI: GoogleGenerativeAI | null = null;

    constructor(private config: { apiKey?: string }) {
        if (config.apiKey) {
            this.genAI = new GoogleGenerativeAI(config.apiKey);
        }
    }

    async generateText(
        prompt: string,
        model: string = "gemini-1.5-flash",
        system?: string,
        options?: { baseURL?: string, apiKey?: string, workflowId?: string, thinking?: boolean }
    ): Promise<string> {
        let client = this.genAI;
        if (options?.apiKey) {
            client = new GoogleGenerativeAI(options.apiKey);
        }

        if (!client) throw new Error("AI Service not configured: Missing API Key. Please provide one in the node config.");

        try {
            const startTime = Date.now();

            // For reasoning models (Thinking), some require specific config flags
            const modelConfig: any = { model };
            if (options?.thinking) {
                // In some versions of the SDK, you might need special handling. 
                // For direct model support or if using specific 'thinking' versions.
                // We'll pass it if requested and let the SDK handle it.
                modelConfig.thinkingConfig = { includeThoughts: true };
            }

            const m = client.getGenerativeModel(modelConfig);

            const result = await m.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Async logging (don't block the response)
            this.logInteraction({
                provider: "gemini",
                model,
                inputPrompt: prompt,
                outputResponse: text,
                latencyMs: Date.now() - startTime,
                workflowId: options?.workflowId
            }).catch(err => console.error("[AIService] Logging failed:", err));

            return text;
        } catch (error) {
            console.error("[AIService] Error generating text:", error);
            throw error;
        }
    }

    private async logInteraction(data: {
        provider: string,
        model: string,
        inputPrompt: string,
        outputResponse: string,
        latencyMs: number,
        tokensUsed?: number,
        workflowId?: string
    }) {
        // Basic PII masking (simple example)
        const maskedPrompt = data.inputPrompt.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "***@***.***");

        try {
            const createData: any = {
                provider: data.provider,
                model: data.model,
                inputPrompt: maskedPrompt,
                outputResponse: data.outputResponse,
                latencyMs: data.latencyMs,
                tokensUsed: data.tokensUsed || 0,
                timestamp: new Date(),
                createdAt: new Date().toISOString()
            };

            // Only attach workflow if it's explicitly provided and valid
            if (data.workflowId && data.workflowId !== "unknown" && data.workflowId.length > 0) {
                createData.workflowId = data.workflowId;
            }

            await prisma.aILog.create({
                data: createData
            });
            console.log("[AIService] Interaction logged to DB");
        } catch (err) {
            console.error("[AIService] DB Logging failed:", err);
        }
    }

    // Tool calling not fully implemented for Gemini in this snippet yet, keeping placeholder
    async generateToolCall(
        prompt: string,
        toolDefinitions: any[],
        model: string = "gemini-pro"
    ): Promise<{ toolName: string; args: any }> {
        throw new Error("Tool calling not yet implemented for Gemini adapter");
    }

    async generateWorkflow(prompt: string, connectors?: { id: string, title?: string }[]): Promise<any> {
        if (!this.genAI) throw new Error("AI Service not configured");

        const connectorListStr = connectors
            ? connectors.map(c => `- ${c.id}${c.title ? ` (${c.title})` : ''}`).join('\n')
            : `- cron (schedule trigger)\n- webhook (http trigger)\n- http (request)\n- ai (text gen using gemini-2.0-flash)\n- condition (logic branching)\n- loop (array iteration)\n- delay (wait time)\n- google_gmail (Gmail)\n- google_sheets (Google Sheets)\n- slack (Slack notifications)\n- pexels (Free stock video/image search)\n- shotstack (Programmatic video editing/rendering)\n- tts (Basic Text to Speech)\n- elevenlabs (Premium AI voices with high quality)\n- video_renderer_local (Free FFMPEG video generation on server)`;

        const systemPrompt = `
You are a workflow architect for TriggerForge.
Your goal is to convert user requests into a valid Workflow JSON structure using the available connectors.

### Available Connectors (Use these IDs for "nodeType"):
${connectorListStr}

### Logic Nodes (Always Available):
- condition (config: { expression: "boolean logic" })
- delay (config: { seconds: number })
- loop (config: { items: "{{$node.id}}" })

### Handle JSON Output:
If a node (like 'ai') returns JSON, use "{{$node.id.fieldName}}" to access properties.
Nodes automatically extract JSON from markdown or raw text.

### Output Format:
Return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
Structure:
{
  "nodes": [
    {
      "id": "node_1",
      "type": "workflowNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Human Readable Name",
        "nodeType": "connector_id",
        "config": { ...specific_config }
      }
    }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2" }
  ]
}

### Rules:
1. Start with a Trigger (cron or webhook).
2. Use MUSTACHE syntax for data passing, e.g., "{{$node.node_1.property}}".
3. For 'ai' nodes extracting leads, always check both search fields: "{{$node.id.output.organic_results}}{{$node.id.output.leads_json}}".
4. 'google_maps_deep_scraper' returns results in 'leads_json'. 'serpapi' returns results in 'organic_results'.
5. For 'ai' nodes, always enforce "Output ONLY the final content" in the prompt.
6. For Google Sheets, default to sheetName 'Leads' if not specified.
7. If the request is complex, use 'loop' and 'condition' nodes correctly.
`;

        try {
            // Using gemini-2.0-flash-exp for the latest experimental features
            const m = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

            const result = await m.generateContent(fullPrompt);
            const content = result.response.text();

            if (!content) {
                throw new Error("AI returned empty response");
            }

            // Clean up markdown code blocks if present
            const jsonStr = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            return JSON.parse(jsonStr);
        } catch (error: any) {
            console.error("[AIService] Generation failed:", error);
            throw new Error(error.message);
        }
    }
}

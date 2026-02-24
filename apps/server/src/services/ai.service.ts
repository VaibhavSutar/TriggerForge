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
        model: string = "gemini-2.0-flash",
        system?: string,
        options?: { baseURL?: string, apiKey?: string }
    ): Promise<string> {
        let client = this.genAI;
        if (options?.apiKey) {
            client = new GoogleGenerativeAI(options.apiKey);
        }

        if (!client) throw new Error("AI Service not configured: Missing API Key. Please provide one in the node config.");

        try {
            const startTime = Date.now();
            const m = client.getGenerativeModel({ model });
            const result = await m.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Async logging (don't block the response)
            this.logInteraction({
                provider: "gemini",
                model,
                inputPrompt: prompt,
                outputResponse: text,
                latencyMs: Date.now() - startTime
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
        tokensUsed?: number
    }) {
        // Basic PII masking (simple example)
        const maskedPrompt = data.inputPrompt.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "***@***.***");

        try {
            await prisma.aILog.create({
                data: {
                    provider: data.provider,
                    model: data.model,
                    inputPrompt: maskedPrompt,
                    outputResponse: data.outputResponse,
                    latencyMs: data.latencyMs,
                    tokensUsed: data.tokensUsed || 0,
                    timestamp: new Date(),
                    createdAt: new Date().toISOString()
                }
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

    async generateWorkflow(prompt: string): Promise<any> {
        if (!this.genAI) throw new Error("AI Service not configured");

        const systemPrompt = `
You are a workflow generator for TriggerForge.
Your goal is to convert user requests into a valid Workflow JSON structure.

### Available Nodes (Connectors):
- Trigger: cron (schedule), webhook (http trigger)
- Action: http (request), specific tools: google_gmail, google_sheets, slack, discord, email, ai (text gen)
- Logic: condition, delay, loop

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
1. Always start with a Trigger node (cron or webhook) unless specified otherwise.
2. Connect nodes logically.
3. Use reasonable default configs.
4. "nodeType" must match one of: cron, webhook, http, email, ai, condition, delay, print, google_gmail, google_sheets, slack, discord, twitter.
`;

        try {
            // Using gemini-2.0-flash as it is available and fast
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

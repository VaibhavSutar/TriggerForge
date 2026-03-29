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
        options?: { baseURL?: string, apiKey?: string, workflowId?: string }
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
            : `- cron (schedule trigger)\n- webhook (http trigger)\n- http (request)\n- ai (text gen using gemini-2.0-flash)\n- condition (logic branching)\n- loop (array iteration)\n- delay (wait time)\n- google_gmail (Gmail)\n- google_sheets (Google Sheets)\n- slack (Slack notifications)`;

        const systemPrompt = `
You are a workflow architect for TriggerForge.
Your goal is to convert user requests into a valid Workflow JSON structure using the available connectors.

### Available Connectors (Use these IDs for "nodeType"):
${connectorListStr}

### Logic Nodes (Always Available):
- condition (input: boolean expression)
- delay (input: seconds)
- loop (input: { items: "{{$node.id}}" })

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
3. For 'ai' nodes, always enforce "Output ONLY the final content" in the prompt.
4. For Google Sheets, default to sheetName 'Leads' if not specified.
5. If the request is complex, use 'loop' and 'condition' nodes correctly.
`;

        try {
            // Using gemini-2.0-flash-exp for the latest experimental features
            const m = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

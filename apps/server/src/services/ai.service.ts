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

    async generateWorkflow(
        prompt: string,
        connectors?: { id: string, title?: string }[],
        context?: { nodes: any[], edges: any[], logs: any[] },
        templates?: { id: string, name: string, description: string }[]
    ): Promise<any> {
        if (!this.genAI) throw new Error("AI Service not configured");

        const connectorListStr = connectors
            ? JSON.stringify(connectors.map(c => ({
                id: c.id,
                title: c.title,
                config_template: (c as any).defaultConfig
            })), null, 2)
            : "No connector metadata provided";

        const currentNodesStr = context?.nodes?.length
            ? JSON.stringify(context.nodes.map(n => ({ id: n.id, label: n.data?.label, type: n.data?.nodeType, config: n.data?.config })), null, 2)
            : "No nodes yet";

        const currentEdgesStr = context?.edges?.length
            ? JSON.stringify(context.edges, null, 2)
            : "No edges yet";

        const currentLogsStr = context?.logs?.length
            ? JSON.stringify(context.logs.slice(-20), null, 2) // Last 20 logs for context
            : "No recent logs available";

        const templateListStr = templates?.length
            ? JSON.stringify(templates, null, 2)
            : "No pre-built templates available";

        const systemPrompt = `
You are the TriggerForge AI Workflow Assistant, a highly advanced agentic architect.
Your goal is to help users BUILD, EDIT, and DEBUG workflows.

### OPERATING MODE:
1. **Analyze**: Look at the current workflow and the latest logs to understand what's happening.
2. **Action**: Decide if you need to generate a new workflow ("REPLACE"), modify parts of the current one ("MODIFY"), or just answer a question ("CHAT").
3. **Execution**: Return a specialized JSON structure containing your thoughts and the technical payload.

### Available Connectors:
${connectorListStr}

### Logic & Routing:
- **condition**: { condition: "string expression like {{$node.id.prop}} === true" }. Has "true" and "false" source handles.
- **loop**: { array: "{{$node.id.items}}" }. Iterates items for downstream nodes.
- **ai**: Returns JSON. Always encourage parsing via "{{$node.id.isSpam}}".

### Current Workflow State:
Nodes:
${currentNodesStr}

Edges:
${currentEdgesStr}

Latest Execution Logs:
${currentLogsStr}

### Output Format (Strictly JSON, no markdown):
{
  "action": "MODIFY" | "REPLACE" | "CHAT" | "RUN",
  "message": "Human explained feedback to the user",
  "suggestedTemplateId": "string (optional, match an ID from Available Templates)",
  "workflow": {
    "nodes": [
      { "id": "node_1", "title": "Label", "nodeType": "connector_id", "config": {}, "position": { "x": 0, "y": 0 } }
    ],
    "edges": [
      { "source": "node_1", "target": "node_2", "sourceHandle": "next", "targetHandle": "next" }
    ]
  }
}

### Rules:
1. If DEBUGGING (based on logs): Identify the failing node in 'message' and return the fixed 'config' in 'workflow.nodes'.
2. If EDITING: Maintain existing node IDs if possible to keep connections intact.
3. If logs show a Gemini API Rate Limit (429): Advise the user to use 'delay' nodes or check their billing.
4. If asked to "check logs": Summarize the failures or successes from the 'Latest Execution Logs' provided.
5. For NEW nodes, ALWAYS include "position": { "x": number, "y": number }.
6. TEMPLATES: Check the 'Available Templates' below. If one matches the user's intent perfectly, include its ID in 'suggestedTemplateId'.
7. ALWAYS output ONLY the raw JSON object.
`;

        const finalSystemPrompt = `${systemPrompt}\n\n### Available Templates:\n${templateListStr}`;

        try {
            const m = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const fullPrompt = `${finalSystemPrompt}\n\nUser Message: ${prompt}`;

            const result = await m.generateContent(fullPrompt);
            const content = result.response.text();

            if (!content) throw new Error("AI returned empty response");

            const jsonStr = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            return JSON.parse(jsonStr);
        } catch (error: any) {
            console.error("[AIService] Interaction failed:", error);
            throw new Error(error.message);
        }
    }
}


import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const aiConnector: Connector = {
    id: "ai",
    name: "AI Text Generation",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { prompt, model, system, baseURL, apiKey } = config;
        if (!prompt) throw new Error("Missing prompt");

        if (!ctx.services?.ai) {
            throw new Error("AI Service not available");
        }

        ctx.logs.push(`[ai] generating text with model ${model || "default"}...`);

        try {
            // Check if workflowId is bound in the config (passed down by workflow engine mapped from node execution)
            const workflowId = config.workflowId || ctx.state?.workflowId || "unknown";

            const result = await ctx.services.ai.generateText(prompt, model, system, { baseURL, apiKey, workflowId });
            ctx.logs.push(`[ai] generated ${result.length} chars`);
            return { success: true, output: { output: { text: result } } };
        } catch (err: any) {
            ctx.logs.push(`[ai] error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

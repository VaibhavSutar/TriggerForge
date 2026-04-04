
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const aiConnector: Connector = {
    id: "ai",
    name: "AI Text Generation",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { prompt, model, system, baseURL, apiKey, thinking } = config;
        if (!prompt) throw new Error("Missing prompt");

        if (!ctx.services?.ai) {
            throw new Error("AI Service not available");
        }

        ctx.logs.push(`[ai] generating text with model ${model || "default"}${thinking ? " (Reasoning Mode enabled)" : ""}...`);

        try {
            // Check if workflowId is bound in the config (passed down by workflow engine mapped from node execution)
            const workflowId = config.workflowId || ctx.state?.workflowId || "unknown";

            const result = await ctx.services.ai.generateText(prompt, model, system, { baseURL, apiKey, workflowId, thinking });
            ctx.logs.push(`[ai] generated ${result.length} chars`);

            const output: Record<string, any> = { text: result };
            
            // Improved JSON Extract logic
            try {
                let jsonFound = false;
                
                // 1. Try markdown blocks first (common with well-behaved LLMs)
                const mdMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
                if (mdMatch) {
                    try {
                        const parsed = JSON.parse(mdMatch[1]);
                        Object.assign(output, parsed);
                        // Also attach to text field as properties to satisfy some mapping hallucinations
                        if (output.text instanceof String || typeof output.text === "string") {
                           const textObj = new String(output.text);
                           Object.assign(textObj, parsed);
                           output.text = textObj;
                        }
                        output.json = parsed; // Maintain fields under .json too
                        jsonFound = true;
                    } catch (e) {}
                }

                // 2. Fallback to bracket matching if not found or parse failed
                if (!jsonFound) {
                    // Try to find the most likely JSON object (greedy bracket matching)
                    const firstBracket = result.indexOf("{");
                    const lastBracket = result.lastIndexOf("}");
                    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                        try {
                            const potentialJson = result.substring(firstBracket, lastBracket + 1);
                            const parsed = JSON.parse(potentialJson);
                            if (typeof parsed === "object" && parsed !== null) {
                                Object.assign(output, parsed);
                                // Mirror to text properties
                                const textObj = new String(output.text);
                                Object.assign(textObj, parsed);
                                output.text = textObj;
                                
                                output.json = parsed;
                                jsonFound = true;
                            }
                        } catch (e) {}
                    }
                }
                
                if (jsonFound) {
                    ctx.logs.push(`[ai] successfully extracted and merged JSON output`);
                }
            } catch (e) {
                // Ignore parse errors, fallback to raw text in 'output.text'
            }

            return { success: true, output };
        } catch (err: any) {
            ctx.logs.push(`[ai] error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

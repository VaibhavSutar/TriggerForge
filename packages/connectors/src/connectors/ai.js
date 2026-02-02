"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConnector = void 0;
exports.aiConnector = {
    id: "ai",
    name: "AI Text Generation",
    type: "action",
    async run(ctx, config) {
        const { prompt, model, system } = config;
        if (!prompt)
            throw new Error("Missing prompt");
        if (!ctx.services?.ai) {
            throw new Error("AI Service not available");
        }
        ctx.logs.push(`[ai] generating text with model ${model || "default"}...`);
        try {
            const result = await ctx.services.ai.generateText(prompt, model, system);
            ctx.logs.push(`[ai] generated ${result.length} chars`);
            return { success: true, output: result };
        }
        catch (err) {
            ctx.logs.push(`[ai] error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

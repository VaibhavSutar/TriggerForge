import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import OpenAI from "openai";

export const openAIConnector: Connector = {
    id: "openai",
    name: "OpenAI",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, model = "gpt-4o", input, systemInstruction, history, apiKey } = config;

        const effectiveApiKey = apiKey || ctx.services?.config?.openAiApiKey || process.env.OPENAI_API_KEY;

        if (!effectiveApiKey) {
            return { success: false, error: "Missing OpenAI API Key", output: null };
        }

        const openai = new OpenAI({ apiKey: effectiveApiKey });

        try {
            if (operation === "embed") {
                const embedModel = model === "gpt-4o" ? "text-embedding-3-small" : model;

                if (Array.isArray(input)) {
                    const response = await openai.embeddings.create({
                        model: embedModel,
                        input: input,
                    });
                    const embeddings = response.data.map((item: any) => item.embedding);
                    ctx.logs.push(`[openai] Generated ${embeddings.length} embeddings`);
                    return { success: true, output: embeddings };
                } else {
                    const response = await openai.embeddings.create({
                        model: embedModel,
                        input: input,
                    });
                    ctx.logs.push(`[openai] Generated embedding`);
                    return { success: true, output: response.data[0].embedding };
                }

            } else if (operation === "chat" || operation === "generate") {
                const messages: any[] = [];

                if (systemInstruction) {
                    messages.push({ role: "system", content: systemInstruction });
                }

                if (history && Array.isArray(history)) {
                    for (const h of history) {
                        messages.push({
                            role: h.role === 'ai' ? 'assistant' : 'user',
                            content: h.content
                        });
                    }
                }

                messages.push({ role: "user", content: input });

                const completion = await openai.chat.completions.create({
                    messages,
                    model: model,
                });

                const response = completion.choices[0].message.content;
                ctx.logs.push(`[openai] Generated response (${response?.length} chars)`);
                return { success: true, output: response };
            }

            return { success: false, error: "Unknown operation: " + operation, output: null };

        } catch (err: any) {
            ctx.logs.push(`[openai] Error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};


import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiConnector: Connector = {
    id: "gemini",
    name: "Google Gemini",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, model = "gemini-pro", input, systemInstruction, history, apiKey } = config;

        const effectiveApiKey = apiKey || ctx.services?.config?.googleAiApiKey || process.env.GOOGLE_AI_API_KEY;

        if (!effectiveApiKey) {
            return { success: false, error: "Missing Google AI API Key", output: null };
        }

        const genAI = new GoogleGenerativeAI(effectiveApiKey);

        try {
            if (operation === "embed") {
                const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
                // Input can be string or array of strings (but usually string for single embedding)
                // If input is array (from chunks), we might want to embed all?
                // For simplicity, let's assume input is string. If array, loop.

                if (Array.isArray(input)) {
                    // Batch embedding not directly supported by single call in all SDK versions, loop for now
                    const embeddings = [];
                    for (const text of input) {
                        const result = await embedModel.embedContent(text);
                        embeddings.push(result.embedding.values);
                    }
                    ctx.logs.push(`[gemini] Generated ${embeddings.length} embeddings`);
                    return { success: true, output: embeddings };
                } else {
                    const result = await embedModel.embedContent(input);
                    ctx.logs.push(`[gemini] Generated embedding`);
                    return { success: true, output: result.embedding.values };
                }

            } else if (operation === "chat" || operation === "generate") {
                const chatModel = genAI.getGenerativeModel({ model });

                if (history && Array.isArray(history)) {
                    const chat = chatModel.startChat({
                        history: history.map((h: any) => ({
                            role: h.role === 'ai' ? 'model' : 'user', // Gemini uses 'model'
                            parts: [{ text: h.content }]
                        })),
                        systemInstruction: systemInstruction ? { role: "system", parts: [{ text: systemInstruction }] } : undefined
                    });

                    const result = await chat.sendMessage(input);
                    const response = result.response.text();
                    ctx.logs.push(`[gemini] Generated response (${response.length} chars)`);
                    return { success: true, output: response };
                } else {
                    // Single generation
                    // TODO: support system instruction for single generation if needed, but chat is better
                    const result = await chatModel.generateContent([
                        systemInstruction ? `System: ${systemInstruction}\nUser: ${input}` : input
                    ]);
                    const response = result.response.text();
                    ctx.logs.push(`[gemini] Generated content (${response.length} chars)`);
                    return { success: true, output: response };
                }
            }

            return { success: false, error: "Unknown operation: " + operation, output: null };

        } catch (err: any) {
            ctx.logs.push(`[gemini] Error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

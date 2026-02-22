
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const huggingFaceConnector: Connector = {
    id: "hugging_face",
    name: "Hugging Face AI",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { apiKey, model, inputs, parameters } = config;

        if (!apiKey) {
            throw new Error("Hugging Face API Key is required.");
        }

        let modelId = model || "meta-llama/Llama-3.2-1B-Instruct";
        if (modelId === "gpt2") { // gpt2 is unreliable on new infra, switch to Llama
            ctx.logs.push("[hugging_face] 'gpt2' is deprecated. Using 'meta-llama/Llama-3.2-1B-Instruct'.");
            modelId = "meta-llama/Llama-3.2-1B-Instruct";
        }

        // Try Chat Completion API (OpenAI Compatible) first for Instruct/Chat models
        // Many modern models on the Router are chat-tuned.
        const chatUrl = "https://router.huggingface.co/v1/chat/completions";

        ctx.logs.push(`[hugging_face] Calling ${modelId}...`);

        try {
            const params = parameters ? JSON.parse(parameters) : {};
            const maxTokens = params.max_new_tokens || params.max_tokens || 500;
            const temperature = params.temperature || 0.7;

            // Prepare Chat Body
            const chatBody = {
                model: modelId,
                messages: [
                    { role: "user", content: inputs || "" }
                ],
                max_tokens: maxTokens,
                temperature: temperature,
                stream: false
            };

            const response = await fetch(chatUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(chatBody)
            });

            if (response.ok) {
                const result = await response.json();
                const outputText = result.choices?.[0]?.message?.content || "";
                return {
                    success: true,
                    output: {
                        output: {
                            text: outputText,
                            result: result
                        }
                    }
                };
            }

            // If Chat API fails (404/400), fall back to standard Inference API
            // Some older models or non-chat models (like BERT) might still use this.
            if (!response.ok && (response.status === 404 || response.status === 400)) {
                ctx.logs.push(`[hugging_face] Chat API failed (${response.status}), trying legacy inference...`);
                const inferenceUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;

                const infResponse = await fetch(inferenceUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "x-wait-for-model": "true"
                    },
                    body: JSON.stringify({
                        inputs: inputs || "",
                        parameters: params
                    }),
                });

                if (!infResponse.ok) {
                    const errText = await infResponse.text();
                    throw new Error(`Hugging Face API Error: ${infResponse.status} ${errText}`);
                }

                const result = await infResponse.json();
                let outputText = "";
                if (Array.isArray(result) && result[0]?.generated_text) {
                    outputText = result[0].generated_text;
                } else if (typeof result === "object") {
                    outputText = JSON.stringify(result);
                } else {
                    outputText = String(result);
                }

                return {
                    success: true,
                    output: {
                        output: {
                            result: result,
                            text: outputText
                        }
                    }
                };
            }

            // If Chat API failed with other error
            const errText = await response.text();
            throw new Error(`Hugging Face API Error: ${response.status} ${errText}`);

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                output: null
            };
        }
    }
};

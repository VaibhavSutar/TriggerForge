
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const ttsConnector: Connector = {
    id: "tts",
    name: "Text to Speech (Free)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { text, lang = "en" } = config;

        if (!text) throw new Error("Text is required for TTS");

        ctx.logs.push(`[tts] Generating speech for: ${text.substring(0, 50)}...`);

        try {
            // Using a free, reliable TTS endpoint (like Google Translate TTS unofficial)
            // Or better, we can suggest using Hugging Face's SDK if they have it.
            // For now, let's use a standard free provider.
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

            ctx.logs.push(`[tts] Generated audio link: ${url}`);

            return {
                success: true,
                output: {
                    audioUrl: url,
                    text: text,
                    lang: lang
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message, output: null };
        }
    }
};

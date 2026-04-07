
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const elevenLabsConnector: Connector = {
    id: "elevenlabs",
    name: "ElevenLabs TTS",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        try {
            const { apiKey, voiceId = "21m00Tcm4TlvDq8ikWAM", text, stability = 0.5, similarity_boost = 0.75, model_id = "eleven_multilingual_v2" } = config;

            if (!apiKey || apiKey === "YOUR_ELEVENLABS_KEY") {
                throw new Error("Missing ElevenLabs API Key. Please enter a real key in the node settings (Settings icon ⚙️ on the node).");
            }
            if (!text) throw new Error("Missing text for ElevenLabs voiceover generation.");

            let textInput = text;
            if (typeof textInput === 'string' && (textInput.startsWith("[") || textInput.startsWith("{"))) {
                try { textInput = JSON.parse(textInput); } catch { }
            }

            const texts = Array.isArray(textInput) ? textInput : [textInput];
            const isBatch = Array.isArray(textInput);

            if (isBatch) ctx.logs.push(`[elevenlabs] Batch mode: Generating ${texts.length} voiceovers...`);

            const fs = await import("fs/promises");
            const path = await import("path");
            const os = await import("os");
            const tempDir = path.join(os.tmpdir(), "triggerforge-media");
            await fs.mkdir(tempDir, { recursive: true });

            const execTTS = async (input: any, idx: number) => {
                const t = typeof input === 'string' ? input : (input?.script || input?.text || input?.content || (typeof input === 'object' ? JSON.stringify(input) : String(input)));
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
                    body: JSON.stringify({ text: t, model_id, voice_settings: { stability, similarity_boost } })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: "Unknown" }));
                    throw new Error(`ElevenLabs Error (${response.status}): ${JSON.stringify(errorData)}`);
                }

                const voicePath = path.join(tempDir, `v_${idx}_${Date.now()}.mp3`);
                await fs.writeFile(voicePath, Buffer.from(await response.arrayBuffer()));
                return { audioUrl: voicePath, path: voicePath };
            };

            const allResults: any[] = [];
            for (let i = 0; i < texts.length; i++) {
                allResults.push(await execTTS(texts[i], i));
            }
            ctx.logs.push(`[elevenlabs] Successfully generated ${texts.length} audio files.`);

            return {
                success: true,
                output: isBatch ? allResults : allResults[0]
            };
        } catch (e: any) {
            ctx.logs.push(`[elevenlabs] ERROR: ${e.message}`);
            return { success: false, error: e.message, output: null };
        }
    }
};

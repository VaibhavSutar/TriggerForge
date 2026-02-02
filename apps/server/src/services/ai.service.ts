
import OpenAI from "openai";

export class AIService {
    private openai: OpenAI | null = null;
    private anthropic: any | null = null; // To implement if needed

    constructor(private config: { openaiApiKey?: string }) {
        if (config.openaiApiKey) {
            this.openai = new OpenAI({ apiKey: config.openaiApiKey });
        }
    }

    async generateText(
        prompt: string,
        model: string = "gpt-4o",
        system?: string
    ): Promise<string> {
        if (!this.openai) throw new Error("AI Service not configured: Missing API Key");

        try {
            const completion = await this.openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: system || "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
            });
            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("[AIService] Error generating text:", error);
            throw error;
        }
    }

    // Future: Add function calling (Native or via MCP)
}

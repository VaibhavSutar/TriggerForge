
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const telegramConnector: Connector = {
    id: "telegram",
    name: "Telegram",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { botToken, chatId, message } = config;

        if (!botToken) throw new Error("Bot Token is required.");
        if (!chatId) throw new Error("Chat ID is required.");
        if (!message) throw new Error("Message is required.");

        ctx.logs.push(`[telegram] Sending message to ${chatId}...`);

        try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                }),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(`Telegram Error: ${result.description}`);
            }

            return {
                success: true,
                output: result.result
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                output: null
            };
        }
    }
};

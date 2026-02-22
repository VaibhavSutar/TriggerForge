
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const teamsConnector: Connector = {
    id: "teams",
    name: "Microsoft Teams",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { webhookUrl, message } = config;

        if (!webhookUrl) throw new Error("Teams Webhook URL is required.");
        if (!message) throw new Error("Message is required.");

        ctx.logs.push(`[teams] Sending message...`);

        try {
            // Teams Webhook format
            const payload = {
                text: message
            };

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Teams Error: ${response.status} ${err}`);
            }

            return {
                success: true,
                output: { status: "sent" }
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


import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const cronConnector: Connector = {
    id: "cron",
    name: "Schedule (Cron)",
    type: "trigger",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { expression } = config;
        ctx.logs.push(`[cron] triggered at ${new Date().toISOString()} (expr: ${expression})`);
        return {
            success: true,
            output: {
                timestamp: Date.now(),
                expression,
                iso: new Date().toISOString()
            }
        };
    }
};


import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const googleGmailConnector: Connector = {
    id: "google_gmail",
    name: "Google Gmail: Send Email",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { to, subject, body, userId } = config; // userId might be needed to lookup tokens?

        // In a real app, we need to resolve the USER's access token here.
        // Ideally, the 'state' or 'input' might contain the user context, OR 'ctx' should have it?
        // Current WorkflowContext doesn't have userId. We might need to pass it in execution context.

        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        // MOCK IMPLEMENTATION for now as we don't have user tokens passed in effectively yet.
        // We would need to: 
        // 1. Get User ID (maybe from ctx.input._userId or ctx.services.db)
        // 2. Fetch tokens from DB.
        // 3. Use ctx.services.oauth.getGoogleClient(token).

        ctx.logs.push(`[google_gmail] Mock send to ${to}`);
        return { success: true, output: { message: "Email sent (mock)" } };
    }
};

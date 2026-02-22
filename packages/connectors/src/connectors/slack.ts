
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const slackConnector: Connector = {
  id: "slack",
  name: "Slack",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { webhookUrl, message } = config;

    if (!webhookUrl) throw new Error("Slack Webhook URL is required.");
    if (!message) throw new Error("Message is required.");

    ctx.logs.push(`[slack] Sending message to webhook...`);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Slack Webservice Error: ${response.status} ${err}`);
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

import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const webhookConnector: Connector = {
  id: "webhook",
  name: "Incoming Webhook Trigger",
  type: "trigger",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { payload } = config;
    ctx.logs.push(`[webhook] triggered`);
    return { success: true, output: payload ?? {} };
  }
};

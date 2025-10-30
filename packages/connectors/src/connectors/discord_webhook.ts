import axios from "axios";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const discordWebhookConnector: Connector = {
  id: "discord",
  name: "Discord Message",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { webhookUrl, message } = config;
    if (!webhookUrl) throw new Error("Missing Discord webhook URL");

    const rendered = Mustache.render(message ?? "Hello from TriggerForge!", {
      state: ctx.state,
      ...ctx.state,
    });

    await axios.post(webhookUrl, { content: rendered });

    ctx.logs.push(`[discord] message sent`);
    return { success: true, output: `Sent to Discord: ${rendered}` };
  },
};

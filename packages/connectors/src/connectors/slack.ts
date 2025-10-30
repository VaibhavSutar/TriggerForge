import axios from "axios";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const slackConnector: Connector = {
  id: "slack",
  name: "Send Slack Message",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { webhookUrl, message } = config;
    if (!webhookUrl) throw new Error("Missing Slack webhookUrl");

    const rendered = Mustache.render(message ?? "No message", { state: ctx.state, ...ctx.state });

    await axios.post(webhookUrl, { text: rendered });
    ctx.logs.push(`[slack] sent message`);
    return { success: true, output: rendered };
  }
};

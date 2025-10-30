import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const printConnector: Connector = {
  id: "print",
  name: "Print Message",
  type: "utility",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const messageTemplate = config.message ?? "No message provided";
    const rendered = Mustache.render(String(messageTemplate), { state: ctx.state, ...ctx.state });
    ctx.logs.push(`[print] ${rendered}`);
    console.log(`[print] ${rendered}`);
    return { success: true, output: rendered };
  }
};

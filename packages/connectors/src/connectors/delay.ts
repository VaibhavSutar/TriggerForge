import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const delayConnector: Connector = {
  id: "delay",
  name: "Delay / Wait",
  type: "utility",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    let ms = Number(config.ms || 1000);
    // Support 'seconds' alias from prompt instructions
    if (config.seconds) {
      ms = Number(config.seconds) * 1000;
    }
    ctx.logs.push(`[delay] waiting ${ms}ms`);
    await new Promise((r) => setTimeout(r, ms));
    ctx.logs.push(`[delay] completed`);
    return { success: true, output: `Waited ${ms}ms` };
  }
};

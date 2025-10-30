import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const randomConnector: Connector = {
  id: "random",
  name: "Generate Random Number",
  type: "utility",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const min = Number(config.min ?? 0);
    const max = Number(config.max ?? 100);
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    ctx.logs.push(`[random] ${value} between ${min}-${max}`);
    return { success: true, output: value };
  }
};

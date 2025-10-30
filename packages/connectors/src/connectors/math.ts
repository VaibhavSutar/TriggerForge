import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const mathConnector: Connector = {
  id: "math",
  name: "Math Expression",
  type: "utility",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { expression } = config; // e.g. "{{state.a}} + {{state.b}}"
    const rendered = Mustache.render(expression || "0", { state: ctx.state, ...ctx.state });
    const result = eval(rendered);
    ctx.logs.push(`[math] ${rendered} = ${result}`);
    return { success: true, output: result };
  }
};

import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import Mustache from "mustache";

export const conditionConnector: Connector = {
  id: "condition",
  name: "Conditional Branch",
  type: "logic",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { expression } = config; // e.g., "{{state.user.age}} > 18"
    if (!expression) throw new Error("Condition connector missing 'expression'");

    const rendered = Mustache.render(expression, { state: ctx.state, ...ctx.state });
    const result = eval(rendered); // ⚠️ sandbox later for security
    ctx.logs.push(`[condition] ${expression} => ${result}`);
    return { success: true, output: !!result };
  }
};

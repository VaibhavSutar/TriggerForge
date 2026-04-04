import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import Mustache from "mustache";

export const conditionConnector: Connector = {
  id: "condition",
  name: "Conditional Branch",
  type: "logic",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    // Accept condition or expression as input keys
    const condition = config.condition || config.expression;
    if (!condition) throw new Error("Condition connector missing 'expression' or 'condition' property");

    const rendered = Mustache.render(condition, { state: ctx.state, ...ctx.state }).trim();

    try {
      const passed = !!eval(rendered);
      ctx.logs.push(`[condition] ${condition} => ${passed}`);
      
      // Cleanest approach: Return a structured result that the engine 
      // can recognize to maintain data flow.
      return { 
        success: true, 
        output: { 
          passed, 
          data: ctx.input 
        } 
      };
    } catch (err: any) {
      throw new Error(`Failed to evaluate condition "${rendered}": ${err.message}.`);
    }
  }
};

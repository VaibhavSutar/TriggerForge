import fs from "fs/promises";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const fileConnector: Connector = {
  id: "file",
  name: "File Write",
  type: "utility",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { path, content } = config;
    if (!path) throw new Error("Missing file path");

    const rendered = Mustache.render(content ?? "", { state: ctx.state, ...ctx.state });
    await fs.writeFile(path, rendered, "utf8");
    ctx.logs.push(`[file] written to ${path}`);
    return { success: true, output: `File saved to ${path}` };
  }
};

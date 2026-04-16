import axios from "axios";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const httpConnector: Connector = {
  id: "http",
  name: "HTTP Request",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { url, method = "GET", headers = {}, body, timeout_ms = 15000 } = config;
    if (!url) throw new Error("Missing URL in HTTP connector config");

    const templateCtx = { state: ctx.state, ...ctx.state };
    
    // Resolve URL
    const renderedUrl = (typeof url === "string" && url.includes("{{")) 
        ? Mustache.render(url, templateCtx) 
        : url;

    // Resolve and Stringify Body
    let finalBody = body;
    if (typeof body === "string" && body.includes("{{")) {
        finalBody = Mustache.render(body, templateCtx);
    } else if (typeof body === "object" && body !== null) {
        finalBody = JSON.stringify(body);
    }

    ctx.logs.push(`[http] ${method.toUpperCase()} ${renderedUrl}`);

    try {
      const response = await axios({
        url: renderedUrl,
        method,
        headers,
        data: finalBody,
        timeout: timeout_ms,
        validateStatus: () => true
      });

      ctx.logs.push(`[http] status ${response.status}`);
      return { success: true, output: response.data };
    } catch (err: any) {
      ctx.logs.push(`[http] error: ${err.message}`);
      return { success: false, output: { error: err.message } };
    }
  }
};

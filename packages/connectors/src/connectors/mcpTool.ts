
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const mcpToolConnector: Connector = {
    id: "mcp_tool",
    name: "MCP Tool Call",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { serverName, toolName, args } = config;

        if (!serverName || !toolName) {
            throw new Error("Missing serverName or toolName");
        }

        if (!ctx.services?.mcp) {
            throw new Error("MCP Service not available");
        }

        ctx.logs.push(`[mcp] calling ${serverName}:${toolName}`);

        try {
            const result = await ctx.services.mcp.callTool(serverName, toolName, args || {});
            ctx.logs.push(`[mcp] success`);
            return { success: true, output: result };
        } catch (err: any) {
            ctx.logs.push(`[mcp] error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

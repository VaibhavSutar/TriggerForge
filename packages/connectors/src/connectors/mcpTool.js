"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpToolConnector = void 0;
exports.mcpToolConnector = {
    id: "mcp_tool",
    name: "MCP Tool Call",
    type: "action",
    async run(ctx, config) {
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
        }
        catch (err) {
            ctx.logs.push(`[mcp] error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

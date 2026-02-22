
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const mcpToolConnector: Connector = {
    id: "mcp_tool",
    name: "MCP Tool Call",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        let { serverName, toolName, args } = config;

        if (!serverName) {
            throw new Error("Missing serverName");
        }

        if (!ctx.services?.mcp) {
            throw new Error("MCP Service not available");
        }

        // Smart Mode: If instructions are provided, use AI to decide which tool to call
        if (config.instructions) {
            if (!ctx.services.ai) {
                throw new Error("AI Service not available");
            }

            // 1. Fetch available tools from the server
            const tools = await ctx.services.mcp.listTools(serverName);
            if (!tools || tools.length === 0) {
                throw new Error(`No tools available on MCP server "${serverName}"`);
            }

            // 2. Construct Prompt
            const prompt = `
Context: ${config.context || "No additional context provided."}

Instructions: ${config.instructions}

Based on the instructions and context, decide which tool to call.
`;

            // 3. Ask AI to generate tool call
            ctx.logs.push(`[mcp] Asking AI to select tool from ${tools.length} available tools...`);
            const decision = await ctx.services.ai.generateToolCall(prompt, tools);

            ctx.logs.push(`[mcp] AI decided to call: ${decision.toolName}`);

            // 4. Override toolName and args with AI decision
            toolName = decision.toolName;
            args = decision.args;
        }

        if (!toolName) {
            throw new Error("Missing toolName (and no instructions provided to infer it)");
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

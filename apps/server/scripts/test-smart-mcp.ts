import { mcpToolConnector } from "../../../packages/connectors/src/connectors/mcpTool"; // Adjust path as needed
import { ConnectorContext } from "../../../packages/connectors/src/types";

// Mock Services
const mockMcpService = {
    listTools: async (serverName: string) => {
        console.log(`[MockMCP] Listing tools for ${serverName}`);
        return [
            { name: "read_file", description: "Read a file", inputSchema: { type: "object", properties: { path: { type: "string" } } } },
            { name: "list_files", description: "List files", inputSchema: { type: "object", properties: { path: { type: "string" } } } }
        ];
    },
    callTool: async (serverName: string, toolName: string, args: any) => {
        console.log(`[MockMCP] Calling ${toolName} with`, args);
        return { content: "Mock file content" };
    }
};

const mockAiService = {
    generateToolCall: async (prompt: string, tools: any[]) => {
        console.log(`[MockAI] Generating tool call for prompt: "${prompt.trim()}"`);
        // Simulate AI decision
        if (prompt.includes("list")) {
            return { toolName: "list_files", args: { path: "." } };
        }
        return { toolName: "read_file", args: { path: "test.txt" } };
    }
};

// Mock Context
const ctx: ConnectorContext = {
    state: {},
    logs: [],
    services: {
        mcp: mockMcpService,
        ai: mockAiService
    }
};

async function testSmartMcp() {
    console.log("--- Testing Smart MCP Node ---");

    const config = {
        serverName: "filesystem",
        instructions: "List all files in the current directory",
        context: "User is in root"
    };

    try {
        const result = await mcpToolConnector.run(ctx, config);
        console.log("Result:", result);
        console.log("Logs:", ctx.logs);
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testSmartMcp();

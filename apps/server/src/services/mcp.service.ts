
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Basic config for an MCP server
export type MCPServerConfig =
    | { type: "stdio"; command: string; args: string[]; name: string }
    | { type: "sse"; url: string; name: string };

export class MCPManager {
    private clients: Map<string, Client> = new Map();

    constructor(private configs: MCPServerConfig[] = []) { }

    async connectAll() {
        for (const config of this.configs) {
            if (this.clients.has(config.name)) continue;

            try {
                let transport;
                if (config.type === "stdio") {
                    transport = new StdioClientTransport({
                        command: config.command,
                        args: config.args,
                    });
                } else {
                    transport = new SSEClientTransport(
                        new URL(config.url.includes("://") ? config.url : `http://${config.url}`)
                    );
                }

                const client = new Client(
                    { name: "TriggerForge", version: "1.0.0" },
                    { capabilities: {} }
                );

                await client.connect(transport);
                this.clients.set(config.name, client);
                console.log(`[MCP] Connected to ${config.name}`);
            } catch (err) {
                console.error(`[MCP] Failed to connect to ${config.name}`, err);
            }
        }
    }

    getTool(serverName: string, toolName: string) {
        // For now, we don't store tools in a map, we assume callTool handles it?
        // Actually the SDK logic is client.callTool method.
        return this.clients.get(serverName);
    }

    async listTools(serverName: string): Promise<Tool[]> {
        const client = this.clients.get(serverName);
        if (!client) return [];
        try {
            const res = await client.listTools();
            return res.tools;
        } catch {
            return [];
        }
    }

    async callTool(
        serverName: string,
        toolName: string,
        args: Record<string, any>
    ): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) throw new Error(`MCP Server "${serverName}" not found`);

        const result = await client.callTool({
            name: toolName,
            arguments: args,
        });
        return result;
    }
}

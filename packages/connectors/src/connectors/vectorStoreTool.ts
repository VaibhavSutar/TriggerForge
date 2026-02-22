
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const vectorStoreToolConnector: Connector = {
    id: "vector_store_tool",
    name: "Vector Store Tool (Definition)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { name = "search_company_documents", description = "Retrieve information from company documents" } = config;

        // This node doesn't execute the search itself when run in the flow.
        // It returns a *Tool Definition* that the Agent node can use.
        // When the Agent *calls* this tool, the Agent (or runtime) must handle the execution ??
        // Actually, in n8n, the Tool Node is connected to the Agent.
        // The Agent sees the tool definition.
        // If the Agent invokes it, it likely triggers a sub-workflow or a specific execution path.

        // For our simplified "Linear Agent" or "Chat with Documents":
        // This node might just pass configuration to the Agent.

        // Let's return a standardized Tool Definition Object.
        const toolDefinition = {
            name,
            description,
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The search query" }
                },
                required: ["query"]
            },
            // Metadata for the engine to know how to execute it?
            // In a real Agentic framework, we'd bind a function. 
            // Here we are just passing data.
            __isTool: true,
            executionConfig: config // execute usage config (pinecone index, etc) logic would be needed if we supported dynamic execution
        };

        // In the n8n example, the vector store tool is connected to the Agent.
        // The Agent aggregates tools.

        return { success: true, output: toolDefinition };
    }
};

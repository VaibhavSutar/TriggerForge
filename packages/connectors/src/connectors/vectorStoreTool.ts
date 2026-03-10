
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const vectorStoreToolConnector: Connector = {
    id: "vector_store_tool",
    name: "Vector Store Tool (Definition)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { name = "search_company_documents", description = "Retrieve information from company documents" } = config;

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
            __isTool: true,
            // Provide connectorId for dynamic execution in the Agent
            connectorId: "pinecone_query_tool", // Let's use a specific wrapper if needed, or simply handle it in Agent / define a custom execution path.
            // Actually, querying pinecone requires embedding first! 
            // So we can define a dedicated 'vector_query_tool_executor' connector or let the agent handle logic.
            // Since we'll let Agent handle it broadly, let's just tag it:
            toolType: "rag_vector_search",
            executionConfig: config
        };

        return { success: true, output: toolDefinition };
    }
};

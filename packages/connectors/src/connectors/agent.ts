
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { geminiConnector } from "./gemini.js";

export const agentConnector: Connector = {
    id: "agent",
    name: "AI Agent",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { tools, goal, model = "gemini-pro", systemMessage } = config;

        // Tools input should be an array of Tool Definitions (from VectorStoreTool, etc)
        const availableTools = Array.isArray(tools) ? tools : [];

        ctx.logs.push(`[agent] Starting agent with ${availableTools.length} tools. Goal: ${goal?.slice(0, 50)}...`);

        // If no tools, just behave like a chat model
        if (availableTools.length === 0) {
            return geminiConnector.run(ctx, {
                operation: "chat",
                input: goal,
                model,
                systemInstruction: systemMessage
            });
        }

        // Implementation of ReAct or Tool Calling Loop
        // 1. Send Goal + Tool Defs to LLM
        // 2. Parse Tool Call
        // 3. Execute Tool (MOCK or REAL?)
        //    - To execute "Vector Store Tool", we need the logic. 
        //    - But the Tool Def was just JSON.
        //    - We need the *implementation* of the tool.
        //    - For the demo, we will implementing specific handling for "vector_store_tool".

        // Simplified "RAG Agent" Logic:
        // 1. Check if we have a vector store tool.
        // 2. If yes, generate query from goal.
        // 3. Run Query (how? we need the config from the tool def).
        // 4. Get Context.
        // 5. Answer.

        // Finding the tool definition that claims to be a vector store
        const vectorTool = availableTools.find((t: any) => t.name.includes("vector") || t.description.includes("document"));

        let contextText = "";

        if (vectorTool && vectorTool.executionConfig) {
            ctx.logs.push(`[agent] Choosing to use tool: ${vectorTool.name}`);

            // Infer query (naive: use goal as query)
            // In real agent, LLM decides parameters.
            const query = goal;

            // EXECUTE SEARCH (Using Pinecone Connector directly? or generic?)
            // We need to invoke the pinecone login.
            // We assume the tool's executionConfig has { indexName, ... }

            // Import dynamically or use service?
            // We can reuse pineconeConnector logic if we can allow it.
            // Hack: we need to import pineconeConnector here to use it.
            // We'll import it at top level (circular dependency risk? no, same package).

            // Dynamic import to avoid circular dep issues in some bundlers, but valid ESM here.
            const { pineconeConnector } = await import("./pinecone.js");
            const { geminiConnector } = await import("./gemini.js"); // embed

            // 1. Embed Query
            const embedResult = await geminiConnector.run(ctx, {
                operation: "embed",
                input: query,
                apiKey: config.googleApiKey // pass through key if needed
            });

            if (!embedResult.success) throw new Error("Agent failed to embed query: " + embedResult.error);

            // 2. Pinecone Query
            const searchResult = await pineconeConnector.run(ctx, {
                ...vectorTool.executionConfig, // indexName, etc
                operation: "query",
                queryVector: embedResult.output,
                apiKey: config.pineconeApiKey
            });

            if (searchResult.success && Array.isArray(searchResult.output)) {
                contextText = searchResult.output.map((m: any) => m.text).join("\n\n");
                ctx.logs.push(`[agent] Retrieved ${searchResult.output.length} context chunks`);
            }
        }

        // Final Answer Generation
        const prompt = `
        System: ${systemMessage || "You are a helpful assistant."}
        
        Context from tools:
        ${contextText ? contextText : "No relevant documents found."}
        
        User Goal: ${goal}
        
        Please answer the user's goal using the provided context.
        `;

        return geminiConnector.run(ctx, {
            operation: "chat",
            input: prompt, // sending as single prompt for now
            model
        });
    }
};

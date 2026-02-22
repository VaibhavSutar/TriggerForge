
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { Pinecone } from "@pinecone-database/pinecone";

export const pineconeConnector: Connector = {
    id: "pinecone",
    name: "Pinecone Vector Store",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, indexName, vectors, queryVector, topK = 5, apiKey, namespace } = config;

        const effectiveApiKey = apiKey || ctx.services?.config?.pineconeApiKey || process.env.PINECONE_API_KEY;

        if (!effectiveApiKey) {
            return { success: false, error: "Missing Pinecone API Key", output: null };
        }

        const pinecone = new Pinecone({ apiKey: effectiveApiKey });
        const index = pinecone.index(indexName);
        const ns = namespace ? index.namespace(namespace) : index;

        try {
            if (operation === "upsert") {
                if (!vectors || !Array.isArray(vectors)) {
                    throw new Error("Missing vectors for upsert");
                }

                // vectors expected format: [{ id, values, metadata }]
                // Map input if necessary, but we assume node maps it correctly or previous node output matches

                // If input is from TextSplitter + Embedding:
                // We might have { text, embedding } pairs.
                // We need to transform this to Pinecone format.
                // For now, assume the user/workflow maps it or we handle specific "documents" format.

                // Flexible handling:
                const records = vectors.map((v: any, i: number) => ({
                    id: v.id || `vec_${Date.now()}_${i}`,
                    values: v.values || v.embedding, // handle both
                    metadata: v.metadata || { text: v.text || "" }
                }));

                await ns.upsert({ records });
                ctx.logs.push(`[pinecone] Upserted ${records.length} vectors`);
                return { success: true, output: { count: records.length } };

            } else if (operation === "query") {
                if (!queryVector) throw new Error("Missing queryVector");

                const result = await ns.query({
                    vector: queryVector,
                    topK: Number(topK),
                    includeMetadata: true
                });

                ctx.logs.push(`[pinecone] Found ${result.matches.length} matches`);

                // Simplify output for consumption
                const matches = result.matches.map(m => ({
                    score: m.score,
                    text: m.metadata?.text,
                    metadata: m.metadata
                }));

                return { success: true, output: matches };
            }

            return { success: false, error: "Unknown operation: " + operation, output: null };

        } catch (err: any) {
            ctx.logs.push(`[pinecone] Error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

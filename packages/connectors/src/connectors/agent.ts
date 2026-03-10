
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { geminiConnector } from "./gemini.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConnector } from "../index.js";

// Helper to convert simple JSON schema to Gemini Schema format
function convertToGeminiSchema(schema: any): any {
    if (!schema) return undefined;

    // Primitive mapping
    const typeMapping: Record<string, string> = {
        'string': 'string',
        'number': 'number',
        'integer': 'integer',
        'boolean': 'boolean',
        'array': 'array',
        'object': 'object'
    };

    const typeStr = typeMapping[schema.type] || 'string';

    const result: any = { type: typeStr };
    if (schema.description) result.description = schema.description;
    if (schema.enum) result.enum = schema.enum;
    if (schema.properties) {
        result.properties = {};
        for (const [key, val] of Object.entries(schema.properties)) {
            result.properties[key] = convertToGeminiSchema(val);
        }
    }
    if (schema.items) result.items = convertToGeminiSchema(schema.items);
    if (schema.required) result.required = schema.required;

    return result;
}

export const agentConnector: Connector = {
    id: "agent",
    name: "AI Agent",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { tools, goal, model = "gemini-1.5-flash", systemMessage, apiKey } = config;

        const availableTools = Array.isArray(tools) ? tools : [];
        ctx.logs.push(`[agent] Starting agent with ${availableTools.length} tools. Goal: ${String(goal).substring(0, 50)}...`);

        // If no tools, just behave like a standard chat model
        if (availableTools.length === 0) {
            return geminiConnector.run(ctx, {
                operation: "chat",
                input: goal,
                model,
                systemInstruction: systemMessage,
                apiKey
            });
        }

        const effectiveApiKey = apiKey || ctx.services?.config?.googleAiApiKey || process.env.GOOGLE_AI_API_KEY;
        if (!effectiveApiKey) {
            return { success: false, error: "Missing Google AI API Key for Agent execution", output: null };
        }

        const genAI = new GoogleGenerativeAI(effectiveApiKey);
        // Function calling heavily relies on newer models, map gemini-pro to gemini-1.5-flash
        const modelToUse = model === "gemini-pro" ? "gemini-1.5-flash" : model;

        // Map tools to Gemini Function Declarations
        const geminiTools = availableTools.map((t: any) => ({
            name: (t.name || "unnamed_tool").replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64),
            description: t.description || `Tool ${t.name}`,
            parameters: t.parameters && t.parameters.type ? convertToGeminiSchema(t.parameters) : undefined
        }));

        const toolMap: Record<string, any> = {};
        for (let i = 0; i < geminiTools.length; i++) {
            toolMap[geminiTools[i].name] = availableTools[i];
        }

        const agentModel = genAI.getGenerativeModel({
            model: modelToUse,
            tools: [{ functionDeclarations: geminiTools }],
            systemInstruction: systemMessage ? { role: "system", parts: [{ text: systemMessage }] } : undefined
        });

        const chat = agentModel.startChat();

        let turnCount = 0;
        const MAX_TURNS = 10;
        let finalOutput = "";

        try {
            // First turn: send the user goal
            let result = await chat.sendMessage(goal);

            while (turnCount < MAX_TURNS) {
                const response = result.response;
                const functionCalls = response.functionCalls();

                // If no function call, the model produced standard text output. Agent loop is complete.
                if (!functionCalls || functionCalls.length === 0) {
                    finalOutput = response.text() || "";
                    ctx.logs.push(`[agent] Generation complete: ${finalOutput.substring(0, 50)}...`);
                    break;
                }

                // Model requested to execute functions
                const functionResponses: any[] = [];
                for (const call of functionCalls) {
                    ctx.logs.push(`[agent] Model dynamically calling tool: ${call.name}`);
                    const toolDef = toolMap[call.name];
                    let toolResponseStr = "Error: Tool definition not found";

                    if (toolDef) {
                        try {
                            const args: any = call.args || {};
                            let executionResult: ConnectorResult;

                            // Custom logic handling based on toolType or explicitly provided connectorId
                            if (toolDef.toolType === "rag_vector_search") {
                                // Specialized RAG step: Embed query, then search Pinecone
                                const { pineconeConnector } = await import("./pinecone.js");
                                const embedResult = await geminiConnector.run(ctx, { operation: "embed", input: args.query, apiKey });

                                if (embedResult.success) {
                                    executionResult = await pineconeConnector.run(ctx, {
                                        ...toolDef.executionConfig,
                                        operation: "query",
                                        queryVector: embedResult.output,
                                        apiKey: config.pineconeApiKey
                                    });
                                } else {
                                    executionResult = { success: false, error: "Failed to embed context query", output: null };
                                }
                            } else if (toolDef.connectorId) {
                                // Generalized execution for any known TriggerForge connector
                                const conn = getConnector(toolDef.connectorId);
                                if (conn) {
                                    executionResult = await conn.run(ctx, { ...toolDef.executionConfig, ...args });
                                } else {
                                    executionResult = { success: false, error: `Connector with ID ${toolDef.connectorId} not registered.`, output: null };
                                }
                            } else {
                                executionResult = { success: false, error: "Tool doesn't declare an executable connectorId or known action", output: null };
                            }

                            // Convert the tool result to a string for model context
                            if (executionResult.success) {
                                toolResponseStr = typeof executionResult.output === 'string'
                                    ? executionResult.output
                                    : JSON.stringify(executionResult.output);
                                ctx.logs.push(`[agent] Tool '${call.name}' succeeded (${toolResponseStr.length} chars)`);
                            } else {
                                toolResponseStr = `Execution Failed: ${executionResult.error}`;
                                ctx.logs.push(`[agent] Tool '${call.name}' failed: ${executionResult.error}`);
                            }

                        } catch (err: any) {
                            toolResponseStr = `Error invoking tool: ${err.message}`;
                            ctx.logs.push(`[agent] Tool execution exception: ${err.message}`);
                        }
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: toolResponseStr }
                        }
                    });
                }

                // Send the tool execution result back to the model 
                ctx.logs.push(`[agent] Passing tool response back to model for reasoning...`);
                // Note: Generative AI SDK expects an array of Object(s) or standard Part formats for function Responses
                result = await chat.sendMessage(functionResponses as any);
                turnCount++;
            }

            if (turnCount >= MAX_TURNS) {
                ctx.logs.push(`[agent] Maximum functional loops (${MAX_TURNS}) reached, stopping.`);
            }

            return { success: true, output: finalOutput || "Agent returned no output (max turns or missing data)" };

        } catch (err: any) {
            ctx.logs.push(`[agent] Error during dynamic reasoning: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};

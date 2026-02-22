
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

interface ChatMessage {
    role: "user" | "ai" | "system";
    content: string;
    timestamp?: number;
}

export const memoryConnector: Connector = {
    id: "memory_window",
    name: "Window Buffer Memory",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, sessionId, message, windowSize = 5 } = config;

        // Where to store?
        // 1. ctx.state (Ephemeral, within workflow run) -> Not useful across chat turns.
        // 2. DB (Persistent) -> We need a Service.
        // For now, let's look for `ctx.services.memory` or fallback to a simple in-memory simulation / file.
        // Or assume the workflow passes `history` in and `history` out, and the CLIENT manages state?
        // n8n Memory node persists state on the server for the sessionId.

        // We will assume `ctx.services.db` allows simple Key-Value storage or similar.
        // Or we use a global singleton in memory for the demo (reset on restart).
        // Let's use a safe global map if no service.

        const globalMemory = (global as any).__MEMORY_STORAGE || ((global as any).__MEMORY_STORAGE = new Map());

        const key = `chat_${sessionId || "default"}`;
        let history: ChatMessage[] = globalMemory.get(key) || [];

        if (operation === "add") {
            if (message) {
                // message could be single object or array
                if (Array.isArray(message)) history.push(...message);
                else history.push(message);
            }
            // Trim
            if (history.length > windowSize * 2) {
                history = history.slice(-(windowSize * 2));
            }
            globalMemory.set(key, history);
            ctx.logs.push(`[memory] Added message, history size: ${history.length}`);
            return { success: true, output: history };

        } else if (operation === "get") {
            ctx.logs.push(`[memory] Retrieved history size: ${history.length}`);
            return { success: true, output: history };
        } else if (operation === "clear") {
            globalMemory.delete(key);
            return { success: true, output: [] };
        }

        return { success: false, error: "Unknown operation", output: null };
    }
};

import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const loopConnector: Connector = {
    id: "loop",
    name: "Loop (Array Iteration)",
    type: "logic",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        let array = config.array || config.items;

        // If array is not explicitly provided, try to use the input
        if (!array) {
            array = ctx.input;
        }

        console.log("[Loop Node] Raw array input received:");
        console.log(array);

        if (typeof array === "string") {
            try {
                // More robust JSON extraction: find the first '[' and last ']'
                const firstBracket = array.indexOf("[");
                const lastBracket = array.lastIndexOf("]");
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    const potentialJson = array.substring(firstBracket, lastBracket + 1);
                    array = JSON.parse(potentialJson);
                } else {
                    // Try as a whole if no brackets found (legacy behavior)
                    let cleanStr = array.trim();
                    cleanStr = cleanStr.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
                    array = JSON.parse(cleanStr);
                }
            } catch (err: any) {
                // Return descriptive error so the user can debug the raw payload
                throw new Error(`Input string is not a valid JSON array. Received: ${array.substring(0, 100)}...`);
            }
        }

        // Smart extraction: if AI returned { "items": [...] } or { "text": "[...]" }
        if (typeof array === "object" && array !== null && !Array.isArray(array)) {
            // Priority 1: Check if any value is already an array
            const arrayKey = Object.keys(array).find(k => Array.isArray(array[k]));
            if (arrayKey) {
                array = array[arrayKey];
            } else {
                // Priority 2: Check if any value is a JSON string representing an array
                const jsonKey = Object.keys(array).find(k => {
                    if (typeof array[k] !== "string") return false;
                    const trimmed = (array[k] as string).trim();
                    return trimmed.startsWith("[") && trimmed.endsWith("]");
                });
                if (jsonKey) {
                    try {
                        array = JSON.parse(array[jsonKey]);
                    } catch (e) {
                        // Ignore and proceed to error at line 47
                    }
                }
            }
        }

        if (!Array.isArray(array)) {
            throw new Error(`Expected an array, but received: ${typeof array}`);
        }

        ctx.logs.push(`[loop] Initiating loop for ${array.length} items`);

        return {
            success: true,
            output: array
        };
    }
};

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

        // Smart extraction: if AI returned { "reels": [...] } or previous node returned { emails: [...] }
        if (typeof array === "object" && array !== null && !Array.isArray(array)) {
            const values = Object.values(array);
            if (values.length === 1 && Array.isArray(values[0])) {
                array = values[0];
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

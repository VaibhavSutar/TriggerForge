import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const loopConnector: Connector = {
    id: "loop",
    name: "Loop (Array Iteration)",
    type: "logic",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        let { array } = config;

        // If array is not explicitly provided, try to use the input
        if (!array) {
            array = ctx.input;
        }

        console.log("[Loop Node] Raw array input received:");
        console.log(array);

        if (typeof array === "string") {
            // Pre-clean: sometimes AI returns ```json...``` despite instructions
            let cleanStr = array.trim();
            cleanStr = cleanStr.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

            try {
                array = JSON.parse(cleanStr);
            } catch (err: any) {
                // Return descriptive error so the user can debug the raw payload
                throw new Error(`Input string is not a valid JSON array. Received: ${cleanStr.substring(0, 100)}...`);
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

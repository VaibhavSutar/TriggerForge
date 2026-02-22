
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const textSplitterConnector: Connector = {
    id: "text_splitter",
    name: "Text Splitter (Recursive)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { text, chunkSize = 1000, chunkOverlap = 200 } = config;

        if (!text) {
            return { success: false, error: "Missing text input", output: null };
        }

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            let endIndex = startIndex + chunkSize;
            if (endIndex < text.length) {
                // Try to find a natural break point (space, newline) to avoid splitting words
                const nextSpace = text.lastIndexOf(" ", endIndex);
                const nextNewline = text.lastIndexOf("\n", endIndex);

                // Prioritize newline specific for code/paragraphs
                let breakPoint = Math.max(nextSpace, nextNewline);

                // If no break found within reasonable distance (e.g. > 50% of chunk), force split
                if (breakPoint > startIndex + chunkSize * 0.5) {
                    endIndex = breakPoint;
                }
            } else {
                endIndex = text.length;
            }

            chunks.push(text.slice(startIndex, endIndex));

            startIndex = endIndex - chunkOverlap;
            // Prevent infinite loop if overlap >= chunkSize (should not happen with defaults)
            if (startIndex >= endIndex) startIndex = endIndex;
        }

        ctx.logs.push(`[text_splitter] Split into ${chunks.length} chunks`);
        return { success: true, output: chunks };
    }
};

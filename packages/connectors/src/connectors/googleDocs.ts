
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const googleDocsConnector: Connector = {
    id: "google_docs",
    name: "Google Docs",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, documentId, content, title } = config;

        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        ctx.logs.push(`[google_docs] ${operation} on ${documentId || title}`);

        let output = {};
        switch (operation) {
            case "create_doc":
                output = { documentId: "new-doc-id", title: title || "Untitled" };
                break;
            case "read_text":
                output = { content: "Mock Document Content..." };
                break;
            case "append_text":
                output = { appended: true };
                break;
            default:
                output = { message: "Operation not supported or mocked" };
        }

        return {
            success: true,
            output
        };
    }
};

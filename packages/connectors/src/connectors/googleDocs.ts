
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const googleDocsConnector: Connector = {
    id: "google_docs",
    name: "Google Docs",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, documentId, title, content } = config;

        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        const services = ctx.services as any;
        const accessToken = ctx.state?.connections?.google?.accessToken;
        if (!accessToken) {
            throw new Error("No Google access token found. Ensure you are authenticated.");
        }

        const docs = await services.oauth.getDocsClient(accessToken, ctx.state?.connections?.google?.refreshToken);

        ctx.logs.push(`[google_docs] ${operation} on ${documentId || title}`);

        let output = {};
        switch (operation) {
            case "create_doc":
                const docTitle = title || "Untitled Doc";
                ctx.logs.push(`[google_docs] Creating doc with title: ${docTitle}`);
                const createRes = await docs.documents.create({
                    requestBody: {
                        title: docTitle
                    }
                });
                output = createRes.data;
                break;

            case "read_text":
                if (!documentId) throw new Error("Document ID is required for read_text");
                const readId = documentId.trim();
                const readRes = await docs.documents.get({
                    documentId: readId
                });
                // Simple text extraction (very basic)
                const bodyContent = readRes.data.body?.content || [];
                let fullText = "";
                bodyContent.forEach((elem: any) => {
                    if (elem.paragraph) {
                        elem.paragraph.elements?.forEach((pElem: any) => {
                            if (pElem.textRun) {
                                fullText += pElem.textRun.content;
                            }
                        });
                    }
                });
                output = { content: fullText, raw: readRes.data };
                break;

            case "append_text":
                if (!documentId) throw new Error("Document ID is required for append_text");
                const cleanId = documentId.trim();
                ctx.logs.push(`[google_docs] Appending to doc ${cleanId}`);

                // To append, we need to know the end index. 
                // We first get the document, find the end index, then update.
                const docGet = await docs.documents.get({ documentId: cleanId });
                const contentList = docGet.data.body?.content;
                let endIndex = 1;
                if (contentList && contentList.length > 0) {
                    endIndex = contentList[contentList.length - 1].endIndex || 1;
                    // Safe decrement
                    if (endIndex > 1) endIndex = endIndex - 1;
                }

                const updateRes = await docs.documents.batchUpdate({
                    documentId: cleanId,
                    requestBody: {
                        requests: [
                            {
                                insertText: {
                                    text: content || "",
                                    endOfSegmentLocation: {
                                        segmentId: "" // Empty string means the body of the document
                                    }
                                }
                            }
                        ]
                    }
                });
                output = updateRes.data;
                break;

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        return {
            success: true,
            output
        };
    }
};

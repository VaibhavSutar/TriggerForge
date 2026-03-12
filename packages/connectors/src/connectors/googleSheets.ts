
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const googleSheetsConnector: Connector = {
    id: "google_sheets",
    name: "Google Sheets",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {

        const { operation, spreadsheetId, range, values, sheetName } = config;

        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        // We assume the credential (accessToken) is injected or available via context.
        // In the current architecture, we might need to fetch the credential from DB 
        // using the User ID stored in context.state.user.id.
        // HOWEVER, for now, let's assume the engine injects a ready-to-use client OR 
        // we pass the accessToken in config (not secure) OR we use the service to get it.

        // HACK/TODO: The current architecture in `trigger.service.ts` doesn't strictly inject 
        // the user's specific OAuth token into the context. 
        // We will assume `ctx.services.oauth` is the service instance.
        // 
        // We need the User's Access Token. 
        // If the workflow execution context includes the `user` object with populated credentials, we are good.
        // If not, we need a way to look it up.
        //
        // FOR THIS IMPLEMENTATION: We will assume the `ctx.state.user` contains the credentials
        // OR that we can fetch them.

        // Let's rely on a helper or assume context has it.
        // Since we are mocking the execution context structure in many places, 
        // let's fetch the token using the `oauth` service if we can, or throw if missing.

        const services = ctx.services as any;

        // We need the user ID and provider to fetch the top-level credential.
        // BUT, the `oauthService.getSheetsClient` takes an accessToken.
        // The engine `executeWorkflow` doesn't automatically load credentials for every node.

        // FIX: We need to LOOKUP the credential from the DB inside this node execution 
        // if it's not provided.
        // But `prisma` might not be exposed to the connector package (it is a separate package).
        // 
        // CRITICAL ARCHITECTURE NOTE: The `connectors` package should be pure. 
        // It shouldn't import `prisma`. 
        // The `oauth` service IS injected. 
        // So we should add a method to `oauth` service to "getClientForUser(userId, provider)" 
        // OR pass the tokens in `ctx.state`.

        // Let's assume for this "End-to-End" fix that `ctx.services.oauth` has a method 
        // that handles the DB lookup or that we pass the accessToken in `config._credential`.
        //
        // Updated Approach: The `WorkflowNode.tsx` or the Engine should resolve the credential.
        // For now, let's assume `config.credential` holds the ACCESS TOKEN (insecure but works for logic test)
        // OR simpler: The engine injects a "google" object into `ctx.services`.

        // PROPOSED FIX FOR NOW: 
        // We will assume `ctx.services.oauth` has a method `getCredential(userId, provider)` 
        // which we will add to the service interface.
        // OR simpler: `ctx.services.oauth.getSheetsClient(token)`.

        // Let's grab the token from `ctx.state.connections['google']` if available, 
        // or fail.

        // REAL FIX:
        // The `TriggerService` or `WorkflowService` should load credentials into `context.state.connections`.
        // Let's assume `ctx.state.connections.google.accessToken` exists.

        const accessToken = ctx.state?.connections?.google?.accessToken;
        if (!accessToken) {
            // Fallback: Try to find it in config if passed explicitly (debug mode)
            // context.logs.push("No Google access token found in context state.");
            throw new Error("No Google access token found. Ensure you are authenticated.");
        }

        const sheets = await services.oauth.getSheetsClient(accessToken, ctx.state?.connections?.google?.refreshToken);

        ctx.logs.push(`[google_sheets] ${operation} on ${spreadsheetId}`);

        let output = {};
        switch (operation) {
            case "read_sheet":
                const readRes = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: range || "Sheet1!A1:Z50",
                });
                output = readRes.data.values || [];
                break;

            case "append_row":
            case "append_rows":
                // Parse values if they are a string (from UI input)
                let rowData = config.data || values;
                if (typeof rowData === "string") {
                    try {
                        const rawStr = rowData.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                        rowData = JSON.parse(rawStr);
                    } catch {
                        rowData = [rowData]; // Treat as single cell
                    }
                }

                // If it's an array of objects (like JSON output from AI)
                if (Array.isArray(rowData) && rowData.length > 0 && typeof rowData[0] === 'object' && !Array.isArray(rowData[0])) {
                    rowData = rowData.map(item => Object.values(item));
                }

                if (!Array.isArray(rowData)) rowData = [rowData]; // Ensure array of arrays or single array?
                // API expects values: [ [co1, col2] ]
                if (!Array.isArray(rowData[0])) rowData = [rowData];

                const appendRes = await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: range || "Sheet1!A1",
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        values: rowData
                    }
                });
                output = appendRes.data;
                break;

            case "update_sheet": // Specifically forces values into a range without appending
                let updateData = values;
                if (typeof values === "string") {
                    try {
                        updateData = JSON.parse(values);
                    } catch {
                        updateData = [values];
                    }
                }
                if (!Array.isArray(updateData)) updateData = [updateData];
                if (!Array.isArray(updateData[0])) updateData = [updateData];

                const updateRes = await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: range || "Sheet1!A1",
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        values: updateData
                    }
                });
                output = updateRes.data;
                break;

            case "clear_sheet":
                const clearRes = await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: range || "Sheet1!A1:Z1000",
                });
                output = clearRes.data;
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

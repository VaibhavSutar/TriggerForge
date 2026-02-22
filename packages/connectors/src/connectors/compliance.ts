import { Connector, ConnectorContext, ConnectorResult } from "../types";

export const complianceNode: Connector = {
    id: "compliance_check",
    name: "Compliance Check",
    type: "action",
    run: async (context: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> => {
        // config contains the input values from the node
        const { checkType, threshold, approverEmail } = config;

        console.log(`[Compliance] Running check: ${checkType}`);

        if (checkType === "cost_limit") {
            // Check context for totalCost, or default to 0
            const currentCost = context.state?.totalCost || 0;
            const limit = parseFloat(threshold) || 10;

            if (currentCost > limit) {
                return {
                    success: false,
                    output: {
                        approved: false,
                        reason: `Compliance Violation: Workflow cost $${currentCost} exceeds limit $${limit}`,
                        checkedAt: new Date().toISOString()
                    },
                    error: `Compliance Violation: Workflow cost $${currentCost} exceeds limit $${limit}`
                };
            }
            return {
                success: true,
                output: { approved: true, reason: "Cost within limits", checkedAt: new Date().toISOString() }
            };
        }

        if (checkType === "manual_approval") {
            console.log("[Compliance] Manual approval requested from", approverEmail);
            // In a synchronous run, we can't really "pause", so we'll simulate a "Pending" state
            // which might be interpreted by the engine as a pause or failure.
            return {
                success: false, // Mark as false to stop execution? or true with "pending" status?
                // Let's mark as success but with a specific output that the engine might catch
                output: { approved: false, reason: "Pending Approval", checkedAt: new Date().toISOString() },
                error: "Manual approval required (Simulation)"
            };
        }

        // PII Scan mock (assumes previous node output is text)
        if (checkType === "pii_scan") {
            const lastOutput = JSON.stringify(context.state?.lastOutput || "");
            if (lastOutput.match(/\b\d{3}-\d{2}-\d{4}\b/)) { // SSN regex
                return {
                    success: false,
                    output: { approved: false, reason: "PII Detected (SSN)", checkedAt: new Date().toISOString() },
                    error: "PII Detected in workflow data"
                };
            }
            return {
                success: true,
                output: { approved: true, reason: "No PII Detected", checkedAt: new Date().toISOString() }
            };
        }

        return {
            success: true,
            output: { approved: true, reason: "Check passed (Default)", checkedAt: new Date().toISOString() }
        };
    }
};

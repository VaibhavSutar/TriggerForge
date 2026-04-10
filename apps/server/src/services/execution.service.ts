
import { executeWorkflowFromJson } from "@triggerforge/core";
import { aiService, mcpManager, oauthService } from "./index";
import { prisma } from "../prisma";

export class ExecutionService {

    /**
     * Run workflow and log execution to DB (Blocking)
     */
    async runWorkflow(workflowId: string, input: any = {}, triggerType: string = "manual") {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow || !workflow.json) {
            throw new Error("Workflow not found or invalid");
        }

        // Check for Webhook Active State if trigger is webhook
        if (triggerType === "webhook") {
            const json: any = workflow.json;
            const webhookNode = json.nodes?.find((n: any) => n.type === "webhook");
            if (webhookNode && webhookNode.config?.active === false) {
                console.log(`[ExecutionService] Webhook for ${workflowId} is inactive. Skipping.`);
                return { skipped: true, reason: "Inactive" };
            }
        }

        // Create Pending Execution Record
        const execution = await prisma.execution.create({
            data: {
                workflowId,
                status: "RUNNING",
                input: input ?? {},
                logs: [],
            }
        });

        return this._execute(execution, workflow, input);
    }

    /**
     * Start workflow in background and return executionId immediately
     */
    async runWorkflowBackground(workflowId: string, input: any = {}, triggerType: string = "manual") {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow || !workflow.json) {
            throw new Error("Workflow not found or invalid");
        }

        // Create Pending Execution Record
        const execution = await prisma.execution.create({
            data: {
                workflowId,
                status: "RUNNING",
                input: input ?? {},
                logs: [],
            }
        });

        // Run in background
        this._execute(execution, workflow, input)
            .catch(err => console.error(`[ExecutionService] Background execution ${execution.id} failed:`, err));

        return { executionId: execution.id };
    }

    /**
     * Internal execution logic
     */
    private async _execute(execution: any, workflow: any, input: any) {
        // Maintain local logs to avoid read-modify-write issues or database field push failures (Json)
        const executionLogs: any[] = [];
        const updateLogsInDb = async (newLog: any) => {
            executionLogs.push(newLog);
            await prisma.execution.update({
                where: { id: execution.id },
                data: { logs: executionLogs }
            });
        };

        // Fetch Google Credentials (if any)
        console.log(`[ExecutionService] Fetching Google creds for user: ${workflow.userId}`);
        const googleCred = await prisma.credential.findFirst({
            where: { userId: workflow.userId, provider: 'google' }
        });

        if (googleCred) {
            console.log(`[ExecutionService] Found Google credentials for user ${workflow.userId}`);
        } else {
            console.log(`[ExecutionService] NO Google credentials found for user ${workflow.userId}`);
        }

        const connections: any = {};
        if (googleCred) {
            connections['google'] = {
                accessToken: googleCred.accessToken,
                refreshToken: googleCred.refreshToken
            };
        }

        let currentOutput: Record<string, any> = {};

        console.log(`[ExecutionService] Starting execution ${execution.id} for workflow ${workflow.id}`);

        try {
            const result = await executeWorkflowFromJson(
                workflow.json as any,
                input,
                {
                    ai: aiService,
                    mcp: mcpManager,
                    oauth: oauthService
                },
                { connections }, // Initial State with connections
                {
                    onNodeStart: async (nodeId, val) => {
                        await updateLogsInDb({
                            nodeId,
                            message: "Execution started",
                            data: val,
                            timestamp: Date.now()
                        });
                    },
                    onNodeFinish: async (nodeId, val) => {
                        currentOutput[nodeId] = val;
                        await updateLogsInDb({
                            nodeId,
                            message: "Execution completed",
                            data: val,
                            timestamp: Date.now()
                        });
                        // Also update overall output for finality
                        await prisma.execution.update({
                            where: { id: execution.id },
                            data: { output: currentOutput }
                        });
                    },
                    onNodeError: async (nodeId, err) => {
                        await updateLogsInDb({
                            nodeId,
                            message: "Execution failed",
                            data: err,
                            timestamp: Date.now()
                        });
                    },
                    onCheckStatus: async () => {
                        // Check if status in DB is still RUNNING
                        const current = await prisma.execution.findUnique({
                            where: { id: execution.id },
                            select: { status: true }
                        });
                        return current?.status === "RUNNING";
                    }
                }
            );

            // Update Success (Final state)
            const finalStatus = result.cancelled ? "FAILED" : (result.success ? "SUCCEEDED" : "FAILED");
            await prisma.execution.update({
                where: { id: execution.id },
                data: {
                    status: finalStatus,
                    output: result.context.nodeResults, // Final consistent output
                    logs: result.context.logs as any, // Final consistent logs
                }
            });

            return { executionId: execution.id, success: result.success, result };

        } catch (err: any) {
            console.error(`[ExecutionService] Execution ${execution.id} failed:`, err);

            // Update Failure
            await prisma.execution.update({
                where: { id: execution.id },
                data: {
                    status: "FAILED",
                    output: { error: err.message },
                    logs: {
                        push: {
                            nodeId: "system",
                            message: "Execution crashed",
                            data: err.message,
                            timestamp: Date.now()
                        }
                    } as any
                }
            });
            throw err;
        }
    }

    /**
     * Get Executions for a workflow
     */
    async getExecutions(workflowId: string, limit: number = 20) {
        return prisma.execution.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Stop a running execution
     */
    async stopExecution(executionId: string) {
        return prisma.execution.update({
            where: { id: executionId },
            data: {
                status: "FAILED", // Using FAILED as a terminal state that triggers the stop check
                logs: {
                    push: {
                        nodeId: "system",
                        message: "STOP request received",
                        timestamp: Date.now()
                    }
                } as any
            }
        });
    }
}

export const executionService = new ExecutionService();

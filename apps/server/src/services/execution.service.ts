
import { prisma } from "../index";
import { executeWorkflowFromJson } from "@triggerforge/core";
import { aiService, mcpManager, oauthService } from "./index";

export class ExecutionService {

    /**
     * Run workflow and log execution to DB
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

        console.log(`[ExecutionService] Starting execution ${execution.id} for workflow ${workflowId}`);

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
                        // Push log
                        await prisma.execution.update({
                            where: { id: execution.id },
                            data: {
                                logs: {
                                    push: {
                                        nodeId,
                                        message: "Execution started",
                                        data: val,
                                        timestamp: Date.now()
                                    }
                                } as any
                            }
                        });
                    },
                    onNodeFinish: async (nodeId, val) => {
                        // Update Output & Log
                        currentOutput[nodeId] = val;

                        await prisma.execution.update({
                            where: { id: execution.id },
                            data: {
                                output: currentOutput,
                                logs: {
                                    push: {
                                        nodeId,
                                        message: "Execution completed",
                                        data: val,
                                        timestamp: Date.now()
                                    }
                                } as any
                            }
                        });
                    },
                    onNodeError: async (nodeId, err) => {
                        await prisma.execution.update({
                            where: { id: execution.id },
                            data: {
                                logs: {
                                    push: {
                                        nodeId,
                                        message: "Execution failed",
                                        data: err,
                                        timestamp: Date.now()
                                    }
                                } as any
                            }
                        });
                    }
                }
            );

            // Update Success (Final state)
            await prisma.execution.update({
                where: { id: execution.id },
                data: {
                    status: result.success ? "SUCCEEDED" : "FAILED",
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
}

export const executionService = new ExecutionService();

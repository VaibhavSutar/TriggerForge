import cron, { ScheduledTask } from "node-cron";
import { prisma } from "../index"; // Assuming shared prisma instance
import { executeWorkflowFromJson } from "@triggerforge/core";
// import services...
import { aiService, mcpManager, oauthService } from "./index";

export class TriggerService {
    private cronTasks: Map<string, ScheduledTask> = new Map();

    /**
     * Initialize all active triggers from DB
     */
    async initialize() {
        console.log("[TriggerService] Initializing triggers...");
        const workflows = await prisma.workflow.findMany({
            // We need a way to filter "active" workflows.
            // For now, we'll load ALL and check their nodes.
            // Ideally, add an 'isActive' flag to Workflow model later.
        });

        for (const wf of workflows) {
            if (!wf.json) continue;
            const json: any = wf.json;
            if (!Array.isArray(json.nodes)) continue;

            // Find cron nodes
            const cronNode = json.nodes.find((n: any) => n.type === "cron");
            if (cronNode) {
                this.registerCron(wf.id, cronNode.config.expression, json);
            }
        }
    }

    /**
     * Register a cron job for a workflow
     */
    registerCron(workflowId: string, expression: string, workflowJson: any) {
        // Clear existing if any
        if (this.cronTasks.has(workflowId)) {
            this.cronTasks.get(workflowId)?.stop();
        }

        if (!cron.validate(expression)) {
            console.error(`[TriggerService] Invalid cron expression for workflow ${workflowId}: ${expression}`);
            return;
        }

        console.log(`[TriggerService] Scheduling workflow ${workflowId} with cron "${expression}"`);

        const task = cron.schedule(expression, async () => {
            console.log(`[TriggerService] Triggering Cron for ${workflowId}`);
            try {
                await executeWorkflowFromJson(workflowJson, {}, {
                    ai: aiService,
                    mcp: mcpManager,
                    oauth: oauthService
                });
                // Log execution (optional, engine logs to console)
            } catch (err) {
                console.error(`[TriggerService] Error executing workflow ${workflowId}:`, err);
            }
        });

        this.cronTasks.set(workflowId, task);
    }

    /**
     * Stop a specific trigger
     */
    stopTrigger(workflowId: string) {
        const task = this.cronTasks.get(workflowId);
        if (task) {
            task.stop();
            this.cronTasks.delete(workflowId);
            console.log(`[TriggerService] Stopped trigger for ${workflowId}`);
        }
    }
}

export const triggerService = new TriggerService();

import cron, { ScheduledTask } from "node-cron";
import { prisma } from "../index"; // Assuming shared prisma instance
import { executeWorkflowFromJson } from "@triggerforge/core";
// import services...
import { aiService, mcpManager, oauthService, executionService } from "./index";

export class TriggerService {
    private cronTasks: Map<string, ScheduledTask> = new Map();
    private pollingInterval: NodeJS.Timeout | null = null;
    private pollingTriggers: Map<string, { type: string, config: any, lastPollTime: number }> = new Map();

    /**
     * Initialize all active triggers from DB
     */
    async initialize() {
        console.log("[TriggerService] Initializing triggers...");
        const workflows = await prisma.workflow.findMany({});

        for (const wf of workflows) {
            if (!wf.json) continue;
            const json: any = wf.json;
            if (!Array.isArray(json.nodes)) continue;

            // Find cron nodes
            const cronNode = json.nodes.find((n: any) => n.type === "cron");
            if (cronNode) {
                this.registerCron(wf.id, cronNode.config.expression, json);
            }

            // Find polling trigger nodes
            const driveTrigger = json.nodes.find((n: any) => n.type === "google_drive_trigger");
            if (driveTrigger) {
                this.registerPollingTrigger(wf.id, "google_drive_trigger", driveTrigger.config);
            }
        }

        this.startPolling();
    }

    /**
     * Register a cron job for a workflow
     */
    registerCron(workflowId: string, expression: string, workflowJson: any) {
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
                executionService.runWorkflow(workflowId, {}, "cron");
            } catch (err) {
                console.error(`[ExecutionService] Error triggering cron for ${workflowId}:`, err);
            }
        });

        this.cronTasks.set(workflowId, task);
    }

    /**
     * Register a polling trigger
     */
    registerPollingTrigger(workflowId: string, type: string, config: any) {
        console.log(`[TriggerService] Registering polling trigger ${type} for ${workflowId}`);
        this.pollingTriggers.set(workflowId, {
            type,
            config,
            lastPollTime: Date.now()
        });
    }

    startPolling() {
        if (this.pollingInterval) return;

        console.log("[TriggerService] Starting Polling Loop...");
        // 60s interval
        this.pollingInterval = setInterval(async () => {
            for (const [workflowId, trigger] of this.pollingTriggers.entries()) {
                await this.checkTrigger(workflowId, trigger);
            }
        }, 60000);
    }

    async checkTrigger(workflowId: string, trigger: { type: string, config: any, lastPollTime: number }) {
        if (trigger.type === "google_drive_trigger") {
            try {
                console.log(`[TriggerService] Polling Google Drive for ${workflowId}`);
                // Mock Polling Logic
                // In real app, check for new files > trigger.lastPollTime
                // If found, runWorkflow(workflowId, { file: ... }, "trigger")

                // executionService.runWorkflow(workflowId, { message: "New File Detected" }, "google_drive_trigger");

                // Update lastPollTime
                trigger.lastPollTime = Date.now();
            } catch (e) {
                console.error(`[TriggerService] Polling failed for ${workflowId}`, e);
            }
        }
    }

    /**
     * Stop a specific trigger
     */
    stopTrigger(workflowId: string) {
        const task = this.cronTasks.get(workflowId);
        if (task) {
            task.stop();
            this.cronTasks.delete(workflowId);
            console.log(`[TriggerService] Stopped cron trigger for ${workflowId}`);
        }

        if (this.pollingTriggers.has(workflowId)) {
            this.pollingTriggers.delete(workflowId);
            console.log(`[TriggerService] Stopped polling trigger for ${workflowId}`);
        }
    }
}

export const triggerService = new TriggerService();

import { FastifyInstance } from "fastify";
import { prisma } from "../index";
import { executeWorkflowFromJson } from "@triggerforge/core";
import { aiService, mcpManager, oauthService, executionService } from "../services";

export async function hookRoutes(fastify: FastifyInstance) {

    // Webhook Trigger Endpoint
    // POST /hooks/:workflowId
    fastify.post("/:workflowId", async (request, reply) => {
        const { workflowId } = request.params as { workflowId: string };
        const body = request.body;
        const query = request.query;
        const headers = request.headers;

        console.log(`[Webhook] Received trigger for ${workflowId}`);

        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow || !workflow.json) {
            return reply.status(404).send({ error: "Workflow not found" });
        }

        // Trigger Execution
        // We pass the webhook data as initial input
        const input = {
            body,
            query,
            headers
        };

        // Run asynchronously (fire and forget from HTTP perspective, or await if result needed)
        // Common pattern: return 200 OK immediately.
        // Use ExecutionService for logging and persistence
        executionService.runWorkflow(workflowId, input, "webhook")
            .then(result => {
                if (result.skipped) console.log(`[Webhook] Skipped: ${result.reason}`);
                else console.log(`[Webhook] Execution ${result.executionId} completed: ${result.success}`);
            })
            .catch(err => console.error("Webhook Execution Error:", err));

        return reply.send({ success: true, message: "Workflow triggered" });
    });
}

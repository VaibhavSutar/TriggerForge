import { FastifyInstance } from "fastify";
import { aiService } from "../services";

export async function aiRoutes(app: FastifyInstance) {
    app.post("/generate-workflow", async (req, reply) => {
        const { prompt, userId } = req.body as { prompt: string; userId: string };

        if (!prompt) {
            return reply.code(400).send({ error: "Missing prompt" });
        }

        try {
            const workflow = await aiService.generateWorkflow(prompt);
            return reply.send({ ok: true, workflow });
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            return reply.code(500).send({ ok: false, error: error.message });
        }
    });

    app.get<{ Params: { workflowId: string } }>("/reports/:workflowId", async (req, reply) => {
        const { workflowId } = req.params;
        try {
            // Need to import GovernanceService to use it here.
            const { governanceService } = await import("../services");
            const report = await governanceService.generateSafetyReport(workflowId);
            return reply.send({ ok: true, report });
        } catch (error: any) {
            console.error("AI Report Generation Error:", error);
            return reply.code(500).send({ ok: false, error: error.message });
        }
    });

}

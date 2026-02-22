
import { FastifyInstance } from "fastify";
import { prisma } from "../index";

export async function executionRoutes(app: FastifyInstance) {
    /**
     * 📜 Get Execution by ID
     * GET /execution/:id
     */
    app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
        const { id } = req.params;

        try {
            const execution = await prisma.execution.findUnique({
                where: { id },
            });

            if (!execution) {
                return reply.code(404).send({ ok: false, error: "Execution not found" });
            }

            return reply.send({ ok: true, execution });
        } catch (error) {
            app.log.error(error);
            return reply
                .code(500)
                .send({ ok: false, error: "Failed to fetch execution" });
        }
    });

    /**
     * 📜 Get Executions for a workflow
     * GET /execution/workflow/:workflowId
     */
    app.get<{ Params: { workflowId: string } }>("/workflow/:workflowId", async (req, reply) => {
        const { workflowId } = req.params;
        try {
            const executions = await prisma.execution.findMany({
                where: { workflowId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            return reply.send({ ok: true, executions });
        } catch (err) {
            return reply.code(500).send({ ok: false, error: "Failed" });
        }
    });
}

import { FastifyInstance } from "fastify";
import { prisma } from "../index";

export async function workflowRoutes(app: FastifyInstance) {
  app.get("/", async () => prisma.workflow.findMany());

  app.post("/", async (req, res) => {
    const { name, json } = req.body as any;
    const wf = await prisma.workflow.create({ data: { name, json } });
    return wf;
  });
}

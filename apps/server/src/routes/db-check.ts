import { FastifyInstance } from "fastify";
import { prisma } from "../index";

export async function dbCheckRoute(app: FastifyInstance) {
  app.get("/db-check", async () => {
    const users = await prisma.user.findMany();
    const workflows = await prisma.workflow.findMany();
    return {
      ok: true,
      userCount: users.length,
      workflowCount: workflows.length,
      connected: true,
    };
  });
}

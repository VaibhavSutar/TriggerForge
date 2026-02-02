import { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { executeWorkflowFromJson } from "@triggerforge/core";
import type { Workflow as CoreWorkflow } from "@triggerforge/core";
import { aiService, mcpManager, oauthService } from "../services";

/** Route types */
type SaveBody = {
  id?: string; // present -> update by id
  userId: string;
  name: string;
  nodes: any[];
  edges?: any[];
};

type PartialUpdateBody = {
  userId: string;
  name?: string;
  json?: {
    nodes?: any[];
    edges?: any[];
  };
};

type IdParams = { id: string };
type UserQuery = { userId?: string };

/** Utility: Build safe Prisma where clause */
function workflowWhere(id: string, userId?: string) {
  return userId ? { id, userId } : { id };
}

export async function workflowRoutes(app: FastifyInstance) {
  /**
   * 🧠 Create or Update (smart upsert by id or by (userId,name))
   * POST /workflow/save
   */
  app.post<{ Body: SaveBody }>("/save", async (req, reply) => {
    const { id, userId, name, nodes, edges } = req.body;

    if (!userId) {
      return reply.code(400).send({ ok: false, error: "Missing userId" });
    }

    try {
      // 🔹 Update existing by id (scoped to user)
      if (id) {
        const owns = await prisma.workflow.findFirst({
          where: workflowWhere(id, userId),
        });
        if (!owns)
          return reply
            .code(404)
            .send({ ok: false, error: "Workflow not found for this user" });

        const workflow = await prisma.workflow.update({
          where: { id },
          data: { name, json: { nodes, edges } },
        });
        return reply.send({ ok: true, mode: "updateById", workflow });
      }

      // 🔹 Update existing by (userId, name)
      const existing = await prisma.workflow.findFirst({
        where: { userId, name },
      });
      if (existing) {
        const workflow = await prisma.workflow.update({
          where: { id: existing.id },
          data: { json: { nodes, edges } },
        });
        return reply.send({ ok: true, mode: "updateByName", workflow });
      }

      // 🔹 Create new
      const workflow = await prisma.workflow.create({
        data: { userId, name, json: { nodes, edges } },
      });
      return reply.code(201).send({ ok: true, mode: "create", workflow });
    } catch (error) {
      app.log.error(error);
      return reply
        .code(500)
        .send({ ok: false, error: "Failed to save workflow" });
    }
  });

  /**
   * 🧩 Partial update (rename or patch json)
   * PATCH /workflow/:id
   */
  app.patch<{ Params: IdParams; Body: PartialUpdateBody }>(
    "/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { userId, name, json } = req.body;

      if (!userId)
        return reply.code(400).send({ ok: false, error: "Missing userId" });

      try {
        const exists = await prisma.workflow.findFirst({
          where: workflowWhere(id, userId),
        });
        if (!exists)
          return reply
            .code(404)
            .send({ ok: false, error: "Workflow not found for this user" });

        const data: any = {};
        if (name) data.name = name;
        if (json) data.json = { ...(exists.json as any), ...json };

        const workflow = await prisma.workflow.update({ where: { id }, data });
        return reply.send({ ok: true, workflow });
      } catch (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ ok: false, error: "Failed to update workflow" });
      }
    }
  );

  /**
   * 📄 Get one (scoped)
   * GET /workflow/:id?userId=...
   */
  app.get<{ Params: IdParams; Querystring: UserQuery }>(
    "/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { userId } = req.query;

      try {
        const workflow = await prisma.workflow.findFirst({
          where: workflowWhere(id, userId),
        });
        if (!workflow)
          return reply
            .code(404)
            .send({ ok: false, error: "Workflow not found for this user" });
        return reply.send({ ok: true, workflow });
      } catch (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ ok: false, error: "Failed to load workflow" });
      }
    }
  );

  /**
   * 📚 Get all workflows (optionally filtered by userId)
   * GET /workflow or /workflow?userId=...
   */
  app.get<{ Querystring: UserQuery }>("/", async (req, reply) => {
    const { userId } = req.query;
    try {
      const where = userId ? { userId } : {};
      const items = await prisma.workflow.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          userId: true,
          name: true,
          json: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return reply.send({ ok: true, items });
    } catch (error) {
      app.log.error(error);
      return reply
        .code(500)
        .send({ ok: false, error: "Failed to fetch workflows" });
    }
  });

  /**
   * 🧭 Get latest workflow for a user
   * GET /workflow/by-user/:userId
   */
  app.get<{ Params: { userId: string } }>("/by-user/:userId", async (req, reply) => {
    const { userId } = req.params;
    try {
      const workflow = await prisma.workflow.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (!workflow)
        return reply
          .code(404)
          .send({ ok: false, error: "No workflows found for this user" });

      return reply.send({ ok: true, workflow });
    } catch (error) {
      app.log.error(error);
      return reply
        .code(500)
        .send({ ok: false, error: "Failed to fetch workflow" });
    }
  });

  /**
   * 🗑️ Delete (scoped)
   * DELETE /workflow/:id?userId=...
   */
  app.delete<{ Params: IdParams; Querystring: UserQuery }>(
    "/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { userId } = req.query;

      try {
        const exists = await prisma.workflow.findFirst({
          where: workflowWhere(id, userId),
        });
        if (!exists)
          return reply
            .code(404)
            .send({ ok: false, error: "Workflow not found for this user" });

        await prisma.workflow.delete({ where: { id } });
        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ ok: false, error: "Failed to delete workflow" });
      }
    }
  );

  /**
   * ▶️ Run workflow (scoped)
   * POST /workflow/:id/run?userId=...
   */
  app.post<{
    Params: IdParams;
    Querystring: UserQuery;
    Body: Record<string, any>;
  }>("/:id/run", async (req, reply) => {
    const { id } = req.params;
    const { userId } = req.query;

    try {
      const workflowRecord = await prisma.workflow.findFirst({
        where: workflowWhere(id, userId),
      });

      if (!workflowRecord) {
        return reply
          .code(404)
          .send({ ok: false, error: "Workflow not found for this user" });
      }

      const workflowJson = workflowRecord.json as {
        nodes: any[];
        edges?: any[];
      };

      const input = req.body ?? {};

      const result = await executeWorkflowFromJson(
        {
          id: workflowRecord.id,
          nodes: workflowJson.nodes,
          edges: workflowJson.edges,
        },
        input,
        {
          ai: aiService,
          mcp: mcpManager,
          oauth: oauthService,
        }
      );

      const execution = await prisma.execution.create({
        data: {
          workflowId: workflowRecord.id,
          status: result.success ? "SUCCEEDED" : "FAILED",
          input,
          output: result.context.nodeResults,
          // logs: result.context.logs, // Removed because 'logs' is not a valid field
        },
      });

      return reply.send({
        ok: true,
        executionId: execution.id,
        result,
      });
    } catch (error) {
      app.log.error(error, "Error running workflow");
      return reply
        .code(500)
        .send({ ok: false, error: "Failed to run workflow" });
    }
  });

}

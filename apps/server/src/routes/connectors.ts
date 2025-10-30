import { FastifyInstance } from "fastify";
import { listConnectors, getConnector } from "@triggerforge/connectors";
console.log("🔍 Connectors module runtime keys:", Object.keys(getConnector))
console.log("🔍 Connectors module runtime keys:", Object.keys(listConnectors))

export async function connectorsRoutes(app: FastifyInstance) {
  // List all connector manifests
  app.get("/", async (_req, reply) => {
    const items = listConnectors();
    console.log("Connectors available:", items.map(i => i.id));
    return reply.send({ ok: true, items });
  });

  // Single connector by id
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const conn = getConnector(id as any);
    if (!conn) return reply.code(404).send({ ok: false, error: "Connector not found" });
    return reply.send({ ok: true, connector: conn });
  });
}

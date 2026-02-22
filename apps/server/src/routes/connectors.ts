import { FastifyInstance } from "fastify";
import { prisma } from "../index";
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

  // [NEW] List Google Files (Proxy)
  // List Google Drive files
  app.get("/google/files", async (req, reply) => {
    const { userId, mimeType } = req.query as { userId: string, mimeType?: string };

    if (!userId) {
      return reply.code(400).send({ error: "Missing userId" });
    }

    try {
      const { oauthService } = await import("../services");
      // Get credentials for this user
      // TODO: In a real app, use a proper AuthN middleware.
      const cred = await prisma.credential.findFirst({
        where: { userId, provider: 'google' }
      });

      if (!cred) {
        return reply.code(401).send({ error: "User not connected to Google" });
      }

      const files = await oauthService.listFiles(cred.accessToken, cred.refreshToken || undefined, mimeType)
      return reply.send({ ok: true, files });
    } catch (error: any) {
      console.error("List files error:", error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Run a single node (Test)
  app.post("/run-node", async (req, reply) => {
    const { userId, type, config } = req.body as { userId: string, type: string, config: any };

    if (!userId || !type) return reply.code(400).send({ error: "Missing userId or type" });

    try {
      // 1. Get Connector
      const { getConnectorByType } = require("@triggerforge/core");
      const connector = getConnectorByType(type);

      if (!connector) return reply.code(404).send({ error: `Connector ${type} not found` });

      // 2. Prepare Context with Services and Credentials
      const { oauthService } = await import("../services");

      // Load Credentials (if needed for this node type)
      // Checks if type starts with 'google_' to pre-load google creds
      let connections: any = {};
      if (type.startsWith("google_")) {
        const cred = await prisma.credential.findFirst({
          where: { userId, provider: 'google' }
        });
        if (cred) {
          connections['google'] = {
            accessToken: cred.accessToken,
            refreshToken: cred.refreshToken
          };
        }
      }

      const ctx: any = {
        services: { oauth: oauthService },
        state: {
          user: { id: userId },
          connections
        },
        logs: []
      };

      // 3. Run
      const result = await connector.run(ctx, config);

      // Return both input (config) and output (result)
      return reply.send({
        ...result,
        input: config
      });

    } catch (err: any) {
      console.error("Run node error:", err);
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

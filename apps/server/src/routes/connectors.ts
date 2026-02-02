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
  app.get("/google/files", async (req, reply) => {
    const { userId, mimeType } = req.query as { userId: string, mimeType?: string };
    if (!userId) return reply.code(400).send({ error: "Missing userId" });

    // 1. Get credentials from DB
    const cred = await prisma.credential.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "google"
        }
      }
    });

    if (!cred) {
      return reply.code(401).send({ error: "Google account not connected" });
    }

    // 2. Fetch files via OAuthService
    try {
      // Dynamic import to avoid circular dep issues in some setups, or just usage practice
      const { oauthService } = await import("../services");
      const files = await oauthService.listFiles(cred.accessToken, cred.refreshToken || undefined, mimeType)
      return reply.send({ ok: true, files });
    } catch (error: any) {
      console.error("Google Drive List Error:", error);
      return reply.code(500).send({ error: "Failed to list files: " + error.message });
    }
  });
}

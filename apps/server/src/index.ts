import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from '@prisma/client';

import { authRoutes } from "./routes/auth";
import { dbCheckRoute } from "./routes/db-check";
import { workflowRoutes } from "./routes/workflow";
import { connectorsRoutes } from "./routes/connectors";
import { hookRoutes } from "./routes/hooks";
import { executionRoutes } from "./routes/execution";
import { aiRoutes } from "./routes/ai";
import { evalRoutes } from "./routes/eval";
import { triggerService } from "./services";

dotenv.config();

const app = Fastify({ logger: true });
app.register(fastifyCors, { origin: "*" });

// Prisma instance (shared)
export const prisma = new PrismaClient();

// Routes
app.get("/", async (request, reply) => {
  return { status: "ok", message: "TriggerForge API is alive" };
});

app.register(authRoutes, { prefix: "/auth" });
app.register(dbCheckRoute);
app.register(workflowRoutes, { prefix: "/workflow" });
app.register(connectorsRoutes, { prefix: "/connectors" });
app.register(hookRoutes, { prefix: "/hooks" });
app.register(executionRoutes, { prefix: "/execution" });
app.register(aiRoutes, { prefix: "/ai" });
app.register(evalRoutes, { prefix: "/eval" });


const startKeepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || "https://trigger-api-tqin.onrender.com";
  console.log(`[Keep-Alive] Initialized with URL: ${url}`);

  // Ping every 14 minutes to prevent Render from spinning down
  setInterval(async () => {
    try {
      console.log(`[Keep-Alive] Pinging ${url}...`);
      await fetch(url);
    } catch (err: any) {
      console.error("[Keep-Alive] Error:", err.message);
    }
  }, 14 * 60 * 1000);
};

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });

    // Initialize Triggers (Cron)
    try {
      await triggerService.initialize();
    } catch (triggerError) {
      console.error("⚠️ Non-fatal error initializing triggers:", triggerError);
    }

    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 4000}`);

    // Start the keep-alive ping loop
    startKeepAlive();
  } catch (err) {
    console.error("❌ FATAL STARTUP ERROR:", err);

    if (app.log.error) {
      app.log.error(err);
    }

    // Give time for logs to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

start();

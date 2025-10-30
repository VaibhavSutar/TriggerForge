import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from '.prisma/client';

import { authRoutes } from "./routes/auth";
import { dbCheckRoute } from "./routes/db-check";
import { workflowRoutes } from "./routes/workflow";
import { connectorsRoutes } from "./routes/connectors";

dotenv.config();

const app = Fastify({ logger: true });
app.register(fastifyCors, { origin: "*" });

// Prisma instance (shared)
export const prisma = new PrismaClient();

// Routes
app.register(authRoutes, { prefix: "/auth" });
app.register(dbCheckRoute);
app.register(workflowRoutes, { prefix: "/workflow" });
app.register(connectorsRoutes, { prefix: "/connectors" });


const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 4000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

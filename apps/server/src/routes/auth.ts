import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../index";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function authRoutes(app: FastifyInstance) {
  // Signup
  app.post("/signup", async (req, res) => {
    const { email, password, name } = req.body as any;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).send({ error: "User exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user };
  });

  // Login
  app.post("/login", async (req, res) => {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).send({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).send({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user };
  });

  // Current user
  app.get("/me", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send({ error: "Missing token" });
    try {
      const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      return { user };
    } catch {
      return res.status(401).send({ error: "Invalid token" });
    }
  });
}

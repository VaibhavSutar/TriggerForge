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

  // Google OAuth Init
  app.get("/google", async (req, res) => {
    const { userId } = req.query as { userId: string };
    if (!userId) return res.status(400).send({ error: "Missing userId" });

    // Pass userId as state to survive the redirect
    const url = await import("../services").then(s => s.oauthService.getGoogleAuthUrl());
    const authUrl = `${url}&state=${userId}`;

    return res.redirect(authUrl);
  });

  // Google OAuth Callback
  app.get("/google/callback", async (req, res) => {
    const { code, state } = req.query as { code: string, state: string };
    if (!code) return res.status(400).send({ error: "Missing code" });

    const { oauthService } = await import("../services");
    try {
      const tokens = await oauthService.exchangeGoogleCode(code);

      // Store in DB
      if (state && tokens.access_token) {
        await prisma.credential.upsert({
          where: {
            userId_provider: {
              userId: state,
              provider: "google"
            }
          },
          update: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            updatedAt: new Date(),
          },
          create: {
            userId: state,
            provider: "google",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
          }
        });
      }

      res.type('text/html').send(`
        <html>
        <body>
          <h3>Connected!</h3>
          <script>
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'google' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("OAuth Error", err);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });
}

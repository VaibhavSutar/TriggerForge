
# TriggerForge — Workflow Automation Platform (Turborepo)

> Build, run and deploy a hybrid automation platform (web + desktop + self-hosted backend)
> Stack: **Next.js (Web)**, **Tauri (Desktop)**, **Fastify + TypeScript (Server)**, **Prisma + Neon (DB)**, **Rust (core engine planned)**, managed in a **Turborepo**.

---

## Table of contents

1. [Quick start (dev)](#quick-start-dev)
2. [Project structure](#project-structure)
3. [Requirements](#requirements)
4. [Environment variables](#environment-variables)
5. [Important commands / scripts](#important-commands--scripts)
6. [Database (Prisma + Neon) setup](#database-prisma--neon-setup)
7. [Auth & Credits overview](#auth--credits-overview)
8. [Frontend (Next.js) notes](#frontend-nextjs-notes)
9. [Desktop (Tauri) notes](#desktop-tauri-notes)
10. [Rust core (packages/core)](#rust-core-packagescore)
11. [CI / GitHub Actions](#ci--github-actions)
12. [Deployment / hosting recommendations](#deployment--hosting-recommendations)
13. [Releases & desktop packaging](#releases--desktop-packaging)
14. [Troubleshooting & FAQ](#troubleshooting--faq)
15. [Contributing](#contributing)
16. [Recommended VS Code extensions](#recommended-vs-code-extensions)
17. [License](#license)

---

## Quick start (dev)

Clone, install and run server + web quickly:

```bash
# clone
git clone https://github.com/<your-org>/triggerforge.git
cd triggerforge

# install (pnpm required)
pnpm install

# generate Prisma client for server (runs once after you set DATABASE_URL)
pnpm --filter server run generate

# run backend server
pnpm --filter server dev

# run web UI in another terminal
pnpm --filter web dev

# (optional) run all dev tasks in parallel
pnpm turbo run dev --parallel
```

Open:

* Web UI: `http://localhost:3000`
* API: `http://localhost:4000` (or as configured by `apps/server/.env`)

---

## Project structure

```
triggerforge/
├── apps/
│   ├── web/              # Next.js web UI (React, React Flow)
│   ├── server/           # Fastify backend (TypeScript, Prisma)
│   └── desktop/          # Tauri desktop app (Rust + React)
│
├── packages/
│   ├── core/             # Rust core engine (worker) — planned
│   ├── connectors/       # JS/TS connectors (email, http, etc.)
│   ├── shared/           # Shared TS types + schemas
│   ├── ui/               # Reusable React components
│   └── config/           # tsconfig, eslint, tailwind
│
├── database/
│   └── prisma/           # Prisma schema (single source of truth)
│
├── infra/                # CI/CD workflows + scripts
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Requirements

* Node.js `>=20.9.0` (use `nvm` recommended)
* pnpm (global): `npm i -g pnpm`
* Rust + cargo (for `packages/core` & Tauri): `rustup`
* Tauri build deps if you plan desktop packaging (platform specific)
* A Neon (Postgres) account for cloud DB (optional for local SQLite)
* Docker not required (we support Docker later if you want to add it)

---

## Environment variables

Keep secrets out of git. Add `.env` files or configure CI secrets.

### Root files to create:

* `apps/server/.env` — server-specific
* `database/.env` — for Prisma commands if needed
* `apps/web/.env.local` — for Next.js front-end

### Example: `apps/server/.env`

```env
PORT=4000
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DB_NAME>?sslmode=require"
JWT_SECRET="replace_with_a_secure_value"
REDIS_URL=""            # optional (job queue, rate limiting)
ENGINE_GRPC_URL=        # optional (if Rust worker runs separately)
```

### Example: `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Example: `database/.env` (for prisma commands)

```env
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DB_NAME>?sslmode=require"
```

> **Security**: Never commit `.env` files. Add `.env` to `.gitignore`.

---

## Important commands & scripts

Use the Turborepo and workspace filters for tasks.

### Workspace-level

```bash
pnpm install
pnpm turbo run dev --parallel
pnpm turbo run build
```

### Server (Fastify + Prisma)

```bash
# in any location (uses workspace filter)
pnpm --filter server dev             # development server
pnpm --filter server run build       # build server (if configured)
pnpm --filter server run generate    # prisma generate (schema -> client)
pnpm --filter server run db:push     # prisma db push
pnpm --filter server run studio      # prisma studio (UI)
```

`apps/server/package.json` should contain:

```json
"scripts": {
  "dev": "ts-node-dev --respawn src/index.ts",
  "generate": "prisma generate --schema=../../database/prisma/schema.prisma",
  "db:push": "prisma db push --schema=../../database/prisma/schema.prisma",
  "studio": "prisma studio --schema=../../database/prisma/schema.prisma"
}
```

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
```

### Desktop (Tauri)

```bash
# Tauri dev + web dev must be configured — see apps/desktop readme
pnpm --filter desktop dev
pnpm --filter desktop build
```

---

## Database (Prisma + Neon) setup

1. Create a Neon project and copy its connection string.

2. Put connection string in `database/.env` and `apps/server/.env` as `DATABASE_URL`.

3. Push DB schema (creates tables):

   ```bash
   pnpm --filter server run db:push
   ```

4. Generate Prisma client into the server workspace:

   ```bash
   pnpm --filter server run generate
   ```

   This will write client runtime to `apps/server/node_modules/.prisma/client` and types to `@prisma/client` installed in server workspace.

5. Optional: open Prisma Studio UI:

   ```bash
   pnpm --filter server run studio
   ```

### Notes:

* Keep a single schema at `database/prisma/schema.prisma` to serve both local and cloud.
* For local desktop mode use SQLite (schema already includes `Json` fields — adapt if needed).

---

## Auth & Credits overview

**Auth model (MVP):**

* JWT-based auth (stateless)
* `User` model in Prisma with `passwordHash`, `credits`, `plan`
* Endpoints: `/auth/signup`, `/auth/login`, `/auth/me`

**Credits system (MVP):**

* `credits` integer on `User`
* `CreditTransaction` logs every credit change
* Middleware to check & decrement credits on `/workflow/run` or execution endpoints

**Security notes:**

* Store `JWT_SECRET` in `.env`/CI secret.
* Hash tokens & passwords using `bcrypt`/`argon2` (bcrypt in scaffold).
* For production consider refresh tokens and token revocation list.

---

## Frontend (Next.js) notes

* Frontend config uses `NEXT_PUBLIC_API_URL` to target the API.
* Keep UI components in `packages/ui` and shared types in `packages/shared`.
* Recommended libs: React Flow for node editor (pinned version), TanStack Query for data fetching.

**To set custom backend URL at runtime**

* Allow users to set `customBackendUrl` in settings (localStorage) — frontend should fall back to `NEXT_PUBLIC_API_URL` if not set.

---

## Desktop (Tauri) notes

* Tauri integrates a Rust backend with a web UI (same Next.js build outputs can be used or a separate SPA).
* Desktop flow:

  * Embedded Rust engine (packages/core or `src-tauri/runner.rs`) runs workflows locally.
  * Local SQLite mirrors Neon schema for offline mode.
  * Optional sync pushes to Neon when online.
* Building desktop installers requires native toolchains per platform (Xcode for macOS, MSVC for Windows).

---

## Rust core (packages/core)

* This crate is the planned workflow engine (DAG runner).
* Use `tokio`, `serde`, `reqwest`, `petgraph`.
* Expose an API: either gRPC (for node orchestrator) or FFI for Tauri integration.
* For now, `packages/core` is scaffolded; you can implement steps:

  * Parse workflow JSON
  * Topological sort & execute nodes
  * Node registry & extensibility API

---

## CI / GitHub Actions

Recommended workflows:

### Basic server CI (`.github/workflows/server.yml`)

* Install Node/pnpm
* Install deps
* `pnpm --filter server run generate`
* Run TypeScript checks & tests
* (Optional) run `pnpm --filter server run db:push` on staging with DB secrets

**Secrets to set in repo**

* `DATABASE_URL` (Neon)
* `JWT_SECRET`
* `NODE_AUTH_TOKEN` (if private deps)
* `SIGNING_KEY` (for releases)

---

## Deployment & hosting recommendations

**Frontend (web)**

* Vercel — built-in Next.js support + edge functions
* Or Netlify

**Backend (server)**

* Render / Railway / Fly.io for Node apps with environment variables
* For self-hosted users provide infrastructure templates (Render, Fly, Docker Compose file)

**Database**

* Neon (serverless Postgres) recommended for managed Postgres in cloud
* Local: SQLite for desktop offline mode

**Rust worker**

* Package as static binary and deploy to Fly.io or as sidecar on same host as server

**CI/CD**

* GitHub Actions to build and publish server, web, and desktop artifacts
* Use artifact storage for desktop installers (GitHub Releases)

---

## Releases & desktop packaging

* Web: Deploy via Vercel or build `next build` → `next export` if static
* Server: Build TypeScript or compile to JS, deploy to chosen host
* Desktop (Tauri): run platform-specific build; upload generated installer to GitHub Releases

Example GitHub Action steps:

* Build server + run tests
* Build web
* Build desktop artifact (on runners with correct toolchains)
* Publish artifacts to GitHub Releases

---

## Troubleshooting & FAQ

**`prisma generate` complains about no package.json near schema**

* Run generate from `apps/server` using:

  ```bash
  pnpm --filter server run generate
  ```

  or add `output = "../../apps/server/node_modules/.prisma/client"` to generator if needed.

**TypeScript says `Module "@prisma/client" has no exported member 'PrismaClient'`**

* Ensure generated client exists at `apps/server/node_modules/.prisma/client`
* `cd apps/server && pnpm prisma generate --schema=../../database/prisma/schema.prisma`
* Restart TS server in VS Code

**Fastify plugin version mismatch (example `@fastify/cors`)**

* Match `@fastify/cors` version with `fastify` major:

  * Fastify v4 → `@fastify/cors@8`
  * Fastify v5 → `@fastify/cors@9`
* Install plugin in server workspace: `pnpm add @fastify/cors@8 -F server`

**`next dev` complains Node version required >=20.9**

* Use `nvm` to install Node 20:

  ```bash
  nvm install 20
  nvm use 20
  ```

**Environment variables not picked up by Prisma**

* Prisma reads `.env` from the folder with schema by default. Use `--env-file` or create `database/.env`.

---

## Testing endpoints (curl examples)

Create user:

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

Login:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

DB check:

```bash
curl http://localhost:4000/db-check
```

Create workflow:

```bash
curl -X POST http://localhost:4000/workflow \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Flow","json":{"nodes":[]}}'
```

---

## Contributing

1. Fork → branch: `feat/your-feature` or `fix/issue`
2. Run lint & tests locally
3. Create PR with clear description & screenshots
4. Follow commit message rules (`feat:`, `fix:`, `chore:`, `docs:`)

---

## Recommended VS Code extensions

* ESLint
* Prettier
* TypeScript Toolbox
* Rust Analyzer
* Turbo Console Log (optional)
* REST Client (for local API testing)
* Prisma (official)

---

## Appendices

### pnpm-workspace.yaml (example)

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "database"
  - "infra"
```

### turbo.json (example)

```json
{
  "$schema":"https://turbo.build/schema.json",
  "pipeline":{
    "dev":{"cache":false},
    "build":{"dependsOn":["^build"],"outputs":["dist/**",".next/**"]},
    "lint":{}
  }
}
```

---

## License

MIT © Your Name / Organization

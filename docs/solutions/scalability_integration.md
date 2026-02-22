# Solution Design: Scalability & Integration

## Problem Statement
**Issue**: Vendor lock-in, high compute costs, low flexibility.
**Context**: The current application might be deployed as a monolith or rely on specific platform features (like Vercel functions for everything), which can become expensive at scale. Users want the freedom to host on cheaper providers (Render, Railway, Hetzner) or on their own infrastructure (AWS ECS, Kubernetes).

## Proposed Solution: Containerized Microservices

### 1. Containerization (Docker)

We will create optimized `Dockerfile`s for each component of the monorepo (`apps/server`, `apps/web`). This ensures that the application can run *anywhere* that supports Docker.

#### Docker Strategy
- **Multi-stage builds**: Use multi-stage builds to keep image sizes small (e.g., build in one stage, run in `node:alpine` or `distroless` in the final stage).
- **Turbo Cache**: Leverage `turbo` and `pnpm` workspace features to optimize build times and caching layers in Docker.
- **Environment Variables**: strict separation of build-time vs run-time configuration.

### 2. Microservices Architecture

To improve scalability and reduce "blast radius" of failures, we will decouple the monolithic server into distinct services.

#### Service Split
1.  **API Gateway / Orchestrator (`apps/server-api`)**:
    - Handles user authentication, project management, and basic CRUD.
    - Routes heavy tasks to other services.
2.  **Workflow Engine (`apps/server-worker`)**:
    - Dedicated service (likely multiple instances) that *executes* the workflows.
    - Scales based on queue depth (Redis/BullMQ).
    - Can be deployed on spot instances for cost savings.
3.  **AI Proxy Service (`apps/server-ai`)**:
    - Handles all interactions with LLMs.
    - Centralizes rate limiting, caching (to reduce costs), and key management.
    - Independently scalable.

### 3. Self-Hosting & Deployment

We will support "Bring Your Own Infrastructure" (BYOI).

#### Supported Platforms
- **Vercel**:
    - `apps/web` (Next.js) is naturally optimized for Vercel.
    - Database (PostgreSQL) can be on Supabase/Neon.
- **Render / Railway / DigitalOcean App Platform**:
    - `apps/server` (Node.js) runs as a persistent web service or background worker.
    - `Redis`: Managed instance or self-hosted container.
- **Docker Compose (Dev/Small-scale Prod)**:
    - Provide a `docker-compose.yml` that spins up Postgres, Redis, Server, Worker, and Web all in one command for local testing or single-server VPS deployment.

## Implementation Steps

1.  **DevOps**: Create `Dockerfile`s for `apps/web` and `apps/server`.
2.  **DevOps**: Create `docker-compose.yml` for the root of the repo.
3.  **Refactor**: Ensure `apps/server` can be run in "worker mode" or "api mode" via an environment variable (e.g., `SERVICE_MODE=api|worker`).
4.  **Docs**: Write a "Self-Hosting Guide" in the documentation.

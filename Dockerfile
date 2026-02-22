FROM node:18-alpine AS base

# Install turbo global
RUN npm install turbo --global

FROM base AS pruner
WORKDIR /app
COPY . .
# Prune the workspace for the target apps
RUN turbo prune --scope=@triggerforge/server --scope=@triggerforge/web --docker

FROM base AS builder
WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# Build the project
COPY turbo.json turbo.json
RUN turbo run build --filter=@triggerforge/server... --filter=@triggerforge/web...

FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app .

# Expose ports (Server: 3001, Web: 3000)
EXPOSE 3000 3001

CMD ["node", "apps/server/dist/index.js"]

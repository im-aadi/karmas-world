# -------------------------------------------------------------
# Stage 1: Build the backend API TypeScript code and Prisma client
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy root configuration and dependency manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/
COPY server/prisma/ ./server/prisma/

# Install all dependencies including devDependencies for build
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @karmas-world/api db:generate

# Copy shared package and build
COPY packages/shared/ ./packages/shared/
RUN pnpm shared:build

# Copy backend source code and tsconfig
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/

# Build backend JavaScript files to server/dist
RUN pnpm --filter @karmas-world/api build

# -------------------------------------------------------------
# Stage 2: Production runtime with minimal attack surface
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Create unprivileged application user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package manifests and install production-only dependencies
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/
COPY server/prisma/ ./server/prisma/

RUN pnpm install --prod --frozen-lockfile && pnpm --filter @karmas-world/api db:generate

# Copy compiled files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/server/dist ./server/dist

# Set file permissions for unprivileged user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

# Container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

# Start the application server
CMD ["node", "server/dist/index.js"]

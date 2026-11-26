# -------------------------------------------------------------
# Stage 1: Build the Vite frontend production bundle
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy root configuration and dependency manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared package source and build it
COPY packages/shared/ ./packages/shared/
RUN pnpm shared:build

# Copy frontend source files
COPY index.html vite.config.ts tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript and build production bundle into /app/dist
RUN pnpm build

# -------------------------------------------------------------
# Stage 2: Serve with production-hardened Nginx
# -------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with compression and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

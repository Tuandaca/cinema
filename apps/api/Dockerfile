# Multi-stage Dockerfile for NestJS API
# ====================================

# Stage 1: Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy monorepo configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy package manifests across monorepo workspaces
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package
RUN pnpm --filter @cinema/shared build

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Build NestJS application
RUN pnpm exec nest build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006

# Install runtime dependencies for Prisma and process signal handling
RUN apk add --no-cache libc6-compat openssl dumb-init

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy root node_modules and built workspaces
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

USER nestjs

EXPOSE 3006

WORKDIR /app/apps/api

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]

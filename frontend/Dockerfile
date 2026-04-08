# syntax=docker/dockerfile:1
# ^^^^ Enables BuildKit features (cache mounts, heredocs, etc.)

# ==== STAGE 1: DEPENDENCIES ===========================================================
# Isolated stage so the node_modules layer is only invalidated when package*.json changes,
# not on every source file change.
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
# --mount=type=cache persists the npm download cache between builds on the same host.
# Packages that haven't changed are served from cache — no network round-trip.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ==== STAGE 2: BUILD ==================================================================
FROM node:22-alpine AS build

WORKDIR /app
# Bring in the pre-installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source — .dockerignore keeps this lean (no .git, no .next, no dev env files)
COPY . .
RUN npm run build

# ==== STAGE 3: RUNTIME ================================================================
# The standalone output produced by Next.js (output: 'standalone' in next.config.mjs)
# is a self-contained server bundle — no node_modules install required at runtime.
# This is the primary driver of image size reduction.
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    TZ=America/Chicago

# tzdata provides full IANA timezone data; Alpine base does not include it
RUN apk add --no-cache tzdata

WORKDIR /app

# standalone/ contains server.js and a minimal, pre-bundled node_modules subset.
# .next/static/ and public/ are NOT auto-included — they must be copied separately.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

EXPOSE 3000
USER node
# server.js is the standalone entry point — replaces `npm start`
CMD ["node", "server.js"]

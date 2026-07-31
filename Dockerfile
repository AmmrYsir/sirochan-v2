# Multi-stage Bun build for Astro 7 application
FROM oven/bun:1 AS base
WORKDIR /app

# Step 1: Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Step 2: Build the project
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Step 3: Production runner stage
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/public ./public

EXPOSE 4321

CMD ["bun", "./dist/server/entry.mjs"]

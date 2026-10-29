# Install stage
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile || bun install --production

# Runtime stage
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY sql ./sql
COPY scripts ./scripts
COPY data ./data

USER bun
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]

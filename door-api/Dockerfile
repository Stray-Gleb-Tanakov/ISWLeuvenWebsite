# Same setup as food-api: Node runs the .ts sources directly, no build step.

# Install stage
FROM node:24-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Runtime stage
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node
EXPOSE 3000

CMD ["node", "src/index.ts"]

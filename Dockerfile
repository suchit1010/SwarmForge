# Multi-stage Docker build for Google Cloud Run
# Base Node.js 22 LTS
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
ENV NODE_ENV=production
RUN npm run build

# Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.grok ./.grok

# Cloud Run listens on PORT 8080
EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]

# Multi-stage build for the NestJS API
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (with devDependencies needed for the build)
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source and compile
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
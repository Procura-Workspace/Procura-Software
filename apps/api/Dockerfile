# Stage 1: Build the backend and shared package
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @procura/shared build
RUN pnpm --filter @procura/api build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/dist ./packages/shared/dist
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/dist ./apps/api/dist
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main.js"]

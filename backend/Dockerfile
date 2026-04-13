# ============================================================
# Disfracesly Backend — Dockerfile
# Multi-stage: development (nodemon) / production (node)
# ============================================================

# --- Shared base ---
FROM node:20-alpine AS base
WORKDIR /app

# Dependencias del sistema para Prisma + bcrypt
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

# --- Development ---
FROM base AS development
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
# Aplica schema via db push y levanta con nodemon (hot reload)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run dev"]

# --- Production ---
FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

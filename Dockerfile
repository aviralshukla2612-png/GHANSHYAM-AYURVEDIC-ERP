# ===================================================================
# Ghanshyam Ayurvedic ERP — Multi-Stage Production Dockerfile
# Combines NestJS Backend (Port 5000) & Next.js 15 Frontend (Port 3000)
# ===================================================================

# -------------------------------------------------------------------
# Stage 1: Build NestJS Backend
# -------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend ./
RUN npx prisma generate
RUN npm run build

# -------------------------------------------------------------------
# Stage 2: Build Next.js Frontend
# -------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:5000}
RUN npm run build

# -------------------------------------------------------------------
# Stage 3: Production Runner Image
# -------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install required system packages
RUN apk add --no-cache bash openssl sqlite

ENV NODE_ENV=production
ENV PORT=5000

# Copy Backend artifacts & dependencies
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy Frontend artifacts & dependencies
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy Startup Entrypoint Script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose Next.js frontend (3000) and NestJS backend (5000)
EXPOSE 3000 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

#!/bin/bash
set -e

echo "======================================================="
echo "🚀 Starting Ghanshyam Ayurvedic ERP Application"
echo "======================================================="

mkdir -p /app/data
export DATABASE_URL="${DATABASE_URL:-file:/app/data/dev.db}"

# Navigate to backend directory
cd /app/backend

# Ensure Prisma Database schema is applied (non-interactive)
echo "📦 Running Prisma DB push ($DATABASE_URL)..."
npx prisma db push --accept-data-loss --skip-generate

# Ensure initial seed data is applied cleanly via compiled JS
echo "🌱 Running Prisma Database Seed..."
node dist/prisma/seed.js || true

# Start NestJS backend in background
echo "⚡ Starting NestJS Backend Server on port 5000..."
node dist/src/main.js &

# Wait briefly for backend server startup
sleep 2

# Navigate to frontend directory & start Next.js
cd /app/frontend
echo "💻 Starting Next.js Frontend Server on port 3000..."
exec npm start -- -p 3000

#!/bin/bash
set -e

echo "======================================================="
echo "🚀 Starting Ghanshyam Ayurvedic ERP Application"
echo "======================================================="

# Navigate to backend directory
cd /app/backend

# Ensure Prisma Database schema is applied
echo "📦 Running Prisma DB push..."
npx prisma db push --skip-generate

# Seed DB if dev.db does not exist yet
if [ ! -f "/app/backend/prisma/dev.db" ]; then
    echo "🌱 Initializing database with seed data..."
    npm run prisma:seed || true
fi

# Start NestJS backend in background
echo "⚡ Starting NestJS Backend Server on port 5000..."
node dist/main.js &

# Wait briefly for backend server startup
sleep 2

# Navigate to frontend directory & start Next.js
cd /app/frontend
echo "💻 Starting Next.js Frontend Server on port 3000..."
exec npm start -- -p 3000

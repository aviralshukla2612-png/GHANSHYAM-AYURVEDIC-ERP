#!/bin/bash
# ===================================================================
# Ghanshyam Ayurvedic ERP — VPS Automated Git Pull & Docker Deploy
# ===================================================================
set -e

echo "======================================================="
echo "🔄 Ghanshyam Ayurvedic ERP: Auto-Pull & Docker Deploy"
echo "======================================================="

# 1. Pull latest changes from Git
echo "📥 1. Pulling latest code changes from Git repository..."
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "   Current branch: $CURRENT_BRANCH"
    git pull origin "$CURRENT_BRANCH" || git pull
else
    echo "⚠️ Not a git repository or git pull skipped."
fi

# 2. Build and restart Docker container
echo "🏗️  2. Building & starting Docker containers..."
if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null; then
        docker compose up -d --build --force-recreate
    elif command -v docker-compose &> /dev/null; then
        docker-compose up -d --build --force-recreate
    else
        echo "⚡ Building image directly via Docker CLI..."
        docker build -t ghanshyam-erp .
        docker stop ghanshyam-erp 2>/dev/null || true
        docker rm ghanshyam-erp 2>/dev/null || true
        docker run -d --name ghanshyam-erp --restart always -p 3002:3000 -p 5002:5000 ghanshyam-erp
    fi
else
    echo "❌ Error: Docker is not installed or not running on this system."
    exit 1
fi

# 3. Clean up dangling images to free disk space
echo "🧹 3. Pruning unused Docker images..."
docker image prune -f

echo "======================================================="
echo "✅ Deployment finished successfully!"
echo "🌐 Frontend Access: http://<YOUR-VPS-IP>:3002"
echo "🔌 Backend API:     http://<YOUR-VPS-IP>:5002"
echo "📚 Swagger Docs:    http://<YOUR-VPS-IP>:5002/api/docs"
echo "======================================================="

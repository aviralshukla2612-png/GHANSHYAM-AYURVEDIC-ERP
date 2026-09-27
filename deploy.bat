@echo off
REM ===================================================================
REM Ghanshyam Ayurvedic ERP — Windows Automated Git Pull & Docker Deploy
REM ===================================================================

echo =======================================================
echo Ghanshyam Ayurvedic ERP: Auto-Pull ^& Docker Deploy
echo =======================================================

echo 1. Pulling latest changes from Git...
git pull

echo 2. Building and starting Docker container...
docker compose up -d --build --force-recreate

echo 3. Cleaning up dangling Docker images...
docker image prune -f

echo =======================================================
echo Deployment completed!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Swagger:  http://localhost:5000/api/docs
echo =======================================================
pause

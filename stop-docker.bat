@echo off
echo [DOCKER] Dang dung tat ca container FinTracker Pro...
cd /d "%~dp0"
docker compose down
echo ✅ Da dung tat ca container.
pause

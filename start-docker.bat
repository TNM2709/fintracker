@echo off
REM ========================================================
REM FinTracker Pro - Khoi Chay Toan Bo He Thong Bang Docker
REM Frontend Port: 7173 | Backend Port: 8080 | Postgres: 5432
REM ========================================================

echo [DOCKER] Dang khoi chay cac container (Postgres, Backend, Frontend 7173)...
cd /d "%~dp0"
docker compose up -d --build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo ✅ Toan bo he thong da chay ngam thanh cong!
    echo    - Frontend App: http://localhost:7173
    echo    - Backend API:  http://localhost:8080/health
    echo    - Database:     PostgreSQL tren port 5432
    echo.
    echo    De dung he thong, chay: stop-docker.bat
    echo ========================================================
    start http://localhost:7173
) else (
    echo [LOI] Khong the chay Docker. Vui long kiem tra Docker Desktop da duoc mo chua!
)
pause

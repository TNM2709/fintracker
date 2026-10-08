@echo off
chcp 65001 >nul
title FinTracker Pro - Khoi Chay Ung Dung

echo ========================================================
echo        🚀 FINTRACKER PRO - FINANCIAL ASSET ENGINE
echo ========================================================
echo [1/3] Kiem tra Go Backend server.exe...

where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\Go\bin\go.exe" (
        set "PATH=C:\Program Files\Go\bin;%PATH%"
    )
)

cd /d "%~dp0backend"
if not exist "server.exe" (
    echo [Dang bien dich Go Backend lan dau...]
    go build -o server.exe ./cmd/server
    if errorlevel 1 (
        echo [LOI] Khong the bien dich Go backend. Vui long cai dat Go!
        pause
        exit /b 1
    )
)

echo [2/3] Khoi chay Go Backend Server (Port 8080)...
start /b "" server.exe

echo [3/3] Dang mo trinh duyet den FinTracker Pro...
timeout /t 2 /nobreak >nul
start http://localhost:8080

echo.
echo ========================================================
echo    ✅ FinTracker Pro da san sang hoat dong!
echo    - Ung dung Web & API: http://localhost:8080
echo    - Che do Dev: Chay 'npm run dev' tai frontend/ (Port 7173)
echo    - Chay Docker Full-Stack: Chay file 'start-docker.bat' (Port 7173)
echo    - De dung server: Chay file 'stop-app.bat' hoac 'stop-docker.bat'
echo ========================================================
echo.
pause

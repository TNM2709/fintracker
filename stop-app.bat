@echo off
chcp 65001 >nul
title FinTracker Pro - Dung Ung Dung

echo ========================================================
echo        🛑 FINTRACKER PRO - DUNG HE THONG
echo ========================================================
echo Dang tat tien trinh server.exe...

taskkill /F /IM server.exe >nul 2>&1
if errorlevel 0 (
    echo [OK] Da dung Go Backend Server.
) else (
    echo [INFO] Khong tim thay tien trinh server.exe dang chay.
)

echo.
echo ========================================================
echo    ✅ He thong da duoc dung an toan.
echo ========================================================
echo.
pause

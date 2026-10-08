@echo off
REM ========================================================
REM FinTracker Pro - Database Migration Utility
REM Usage:
REM   migrate.bat up       - Apply all pending migrations
REM   migrate.bat down     - Rollback last migration
REM   migrate.bat status   - Show migration status
REM ========================================================

where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\Go\bin\go.exe" (
        set "PATH=C:\Program Files\Go\bin;%PATH%"
    )
)

set CMD=%1
if "%CMD%"=="" set CMD=status

cd /d "%~dp0backend"
echo [MIGRATE] Running migration command: %CMD%
go run ./cmd/migrate %CMD%

cd /d "%~dp0"

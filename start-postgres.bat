@echo off
REM ========================================================
REM FinTracker Pro - Start PostgreSQL Database via Docker
REM ========================================================

echo [POSTGRES] Checking Docker and starting PostgreSQL container...
cd /d "%~dp0"
docker compose up -d postgres
if %ERRORLEVEL% NEQ 0 (
    echo [POSTGRES] Failed to start Docker container. Please make sure Docker Desktop is running.
) else (
    echo [POSTGRES] PostgreSQL is up and running on port 5432!
    echo [POSTGRES] Applying migrations...
    call migrate.bat up
)

@echo off
title IoT Platform Startup
echo ===================================
echo Starting IoT Platform Services...
echo ===================================

:: Ensure we are in the project root directory
cd /d "%~dp0"

echo [1/3] Starting ChirpStack (Docker)
cd chirpstack
docker-compose up -d
cd ..
echo ChirpStack started.
echo.

echo [2/3] Starting Supabase Local
:: Running supabase start in the background or synchronous. 
:: `call` ensures the script continues after npx finishes.
call npx supabase start --ignore-health-check
echo Supabase started.
echo.

echo [3/3] Starting Next.js Frontend
:: `start cmd /k` opens a new terminal window just for Next.js so you can see its logs.
:: Alternatively, use `start /B npm run dev` to run it completely hidden in the background.
start "IoT Dashboard Frontend" cmd /k "npm run dev"

echo ===================================
echo Everything is running!
echo Frontend: http://localhost:3001
echo Supabase: http://127.0.0.1:54323
echo ===================================
timeout /t 5

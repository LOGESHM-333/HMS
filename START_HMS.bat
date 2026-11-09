@echo off
title MediCore HMS - Full Stack Launcher
color 0A

echo.
echo ==========================================
echo   MediCore HMS - Hospital Management System
echo   PostgreSQL 16 + React + Express Backend
echo ==========================================
echo.

cd /d "c:\Users\ADMIN\Downloads\HMS-main\HMS-main"

echo [1/2] Starting Express Backend (port 5000)...
start "MediCore Backend" cmd /k "node ./node_modules/tsx/dist/cli.mjs server/index.ts"

timeout /t 4 /nobreak >nul

echo [2/2] Starting React Frontend (port 3000)...
start "MediCore Frontend" cmd /k "node ./node_modules/vite/bin/vite.js --port=3000 --host=0.0.0.0"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo   MediCore HMS is RUNNING!
echo.
echo   Frontend:    http://localhost:3000
echo   DB Viewer:   http://localhost:3000/db-viewer.html
echo   Backend API: http://localhost:5000/api
echo   Database:    PostgreSQL medicore_db (port 5432)
echo ==========================================
echo.
echo Portals available:
echo   - Admin Portal (admin/admin123)
echo   - Doctor Portal
echo   - Nurse Portal  
echo   - Patient Portal
echo   - Super Admin Portal
echo.

start "" "http://localhost:3000"
pause


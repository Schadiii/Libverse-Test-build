@echo off
title Libverse Launcher
echo Starting Libverse Environment...

:: Start Backend Server (FastAPI on Port 8000)
start "Libverse Backend" cmd /k "cd /d "%~dp0backend" && py LibverseServer.py"

:: Start Frontend Server (Vite on Port 5173)
start "Libverse Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Done! Both servers are starting in separate windows.

@echo off
title Ice Cream Shop

echo Starting Ice Cream Shop...
echo.

:: Start backend in a new window
start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to start before opening frontend
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait 4 seconds for frontend to start before opening browser
timeout /t 4 /nobreak >nul

:: Open app in a new Chrome window (not a new tab)
start chrome --new-window http://localhost:5173

echo.
echo App is running!
echo - Backend:  http://localhost:8000
echo - Frontend: http://localhost:5173
echo.
echo Close the Backend and Frontend windows to stop the app.

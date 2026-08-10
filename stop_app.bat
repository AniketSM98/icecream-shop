@echo off
title Stopping Ice Cream Shop

echo Stopping Ice Cream Shop...
echo.

:: Kill uvicorn (backend)
taskkill /f /im python.exe >nul 2>&1

:: Kill node (frontend)
taskkill /f /im node.exe >nul 2>&1

echo App stopped successfully.
echo You can close this window.
pause

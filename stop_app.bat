@echo off
title Stopping Ice Cream Shop

echo Stopping Ice Cream Shop...
echo.

:: Kill uvicorn (backend)
taskkill /f /im python.exe >nul 2>&1

:: Kill node (frontend)
taskkill /f /im node.exe >nul 2>&1

:: Close the Backend and Frontend cmd windows by title
taskkill /f /fi "WINDOWTITLE eq Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Frontend" >nul 2>&1

echo App stopped successfully.
timeout /t 2 /nobreak >nul

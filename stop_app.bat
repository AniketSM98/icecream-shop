@echo off
title Stopping Ice Cream Shop

echo Stopping Ice Cream Shop...
echo.

:: Close Chrome window showing localhost:5173
powershell -command "Get-Process chrome | Where-Object { $_.MainWindowTitle -like '*localhost:5173*' } | Stop-Process -Force" >nul 2>&1

:: Kill uvicorn (backend)
taskkill /f /im python.exe >nul 2>&1

:: Kill node (frontend)
taskkill /f /im node.exe >nul 2>&1

:: Close the Backend and Frontend cmd windows by title
taskkill /f /fi "WINDOWTITLE eq Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Frontend" >nul 2>&1

echo App stopped successfully.
timeout /t 2 /nobreak >nul

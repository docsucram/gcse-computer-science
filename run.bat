@echo off
setlocal
title GCSE Computer Science Revision Lab
cd /d "%~dp0"

echo ========================================================
echo   GCSE Computer Science Revision Lab - Local Launcher
echo   AQA 8525 ^| OCR J277 ^| Edexcel 1CP2
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Node.js detected.
    echo [INFO] Starting local static server on http://localhost:3000/ ...
    
    :: Launch the zero-dependency server in a separate background window
    start "GCSE Revision Server" node server.js
    
    :: Wait a moment for server to bind
    timeout /t 1 /nobreak >nul
    
    echo [INFO] Opening Revision Hub in your default browser...
    start http://localhost:3000/
    echo.
    echo [SUCCESS] Local server is running at http://localhost:3000/
    echo You can keep this window open or close it. To stop the server,
    echo close the "GCSE Revision Server" window.
    echo.
    pause
    exit /b 0
) else (
    echo [NOTICE] Node.js not detected in PATH.
    echo [INFO] Launching index.html directly in your default browser...
    start "" index.html
    echo.
    pause
    exit /b 0
)

@echo off
setlocal enabledelayedexpansion
title GCSE Computer Science Sorting Visualizer

echo ========================================================
echo   GCSE Computer Science Sorting Visualizer ^& Lab
echo                    AQA 8525 Spec
echo ========================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ to run this app.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] First time run detected. Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

echo Choose an action:
echo  [1] Start Dev Server (Default)
echo  [2] Build Production Bundle (outputs to /dist)
echo  [3] Preview Production Build
echo  [4] Reinstall Dependencies
echo.
set /p choice="Enter choice [1-4] (default is 1): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto preview
if "%choice%"=="4" goto install

:dev
echo.
echo Starting development server...
echo Press Ctrl+C at any time to stop the server.
echo.
call npm run dev -- --open
goto end

:build
echo.
echo Building optimized production bundle...
call npm run build
echo.
echo Build complete. Output is in the 'dist' folder.
pause
goto end

:preview
echo.
echo Previewing production build...
call npm run preview -- --open
goto end

:install
echo.
echo Reinstalling dependencies...
call npm install
echo.
echo Done.
pause
goto end

:end
endlocal

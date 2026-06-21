@echo off
setlocal enabledelayedexpansion
color 0A
mode con: cols=100 lines=30
title DB Proxy IPOS 5 Manager

set "BASE_DIR=%~dp0"

:menu
cd /d "%BASE_DIR%"
cls
echo ===================================================
echo      DB Proxy IPOS 5 - Manager
echo ===================================================
echo.
echo  [1] Start Proxy (Manual - with CMD)
echo  [2] Install as Windows Service (Auto-start)
echo  [3] Uninstall Windows Service
echo  [4] Configure Settings (.env)
echo.
echo  [5] Test Connection (Local)
echo  [6] Test via Tailscale Funnel
echo.
echo  [7] View Log File (server.log)
echo  [8] Exit
echo.
echo ===================================================
echo.

set /p choice=Enter your choice (1-8): 

if "%choice%"=="1" goto start_manual
if "%choice%"=="2" goto install_service
if "%choice%"=="3" goto uninstall_service
if "%choice%"=="4" goto config_env

if "%choice%"=="5" goto test_local
if "%choice%"=="6" goto test_funnel

if "%choice%"=="7" goto view_logs
if "%choice%"=="8" goto exit

echo.
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:start_manual
cls
echo Starting Proxy manually...
echo (Press Ctrl+C to stop)
echo.
node src/index.js
pause
goto menu

:install_service
cls
echo Installing proxy as a Windows service...
call scripts\install-and-run.bat
pause
goto menu

:uninstall_service
cls
echo Uninstalling Windows service...
call scripts\uninstall-service.bat
pause
goto menu

:config_env
cls
echo Opening configuration file (.env)...
if exist .env (
    notepad .env
) else (
    echo Error: .env file not found.
    pause
)
goto menu

:test_local
cls
echo Testing local connection...
call tools\test-local.bat
pause
goto menu

:test_funnel
cls
echo Testing via Tailscale Funnel...
call tools\test-funnel.bat
pause
goto menu

:view_logs
cls
if exist server.log (
    notepad server.log
) else (
    echo No log file found (server.log).
    pause
)
goto menu

:exit
cls
echo Goodbye!
timeout /t 2 >nul
exit /b 0

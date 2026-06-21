@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

echo Current directory: %CD%
echo ===================================================
echo DB Proxy IPOS 5 - Installation
echo ===================================================
echo.

echo Step 1: Refreshing service...
sc query "DBProxyIPOS5" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Existing service found. Stopping and uninstalling...
    net stop "DBProxyIPOS5" >nul 2>&1
    call npm run uninstall-service
    timeout /t 3 >nul
) else (
    echo No existing service found.
)
echo.

echo Step 2: Installing as Windows service...
call npm run install-service
if %ERRORLEVEL% neq 0 (
    echo Error installing service.
    pause
    exit /b 1
)
echo.

echo ===================================================
echo Installation Complete!
echo ===================================================
echo.
echo Proxy is now running as a Windows service.
echo Auto-start on boot: YES
echo.
echo Local URL: http://localhost:3001
echo.
echo To check: http://localhost:3001/health
echo.
pause > nul

@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

echo ===================================================
echo DB Proxy IPOS 5 - Uninstall Service
echo ===================================================
echo.

echo Stopping service...
net stop "DBProxyIPOS5" >nul 2>&1

echo Uninstalling service...
call npm run uninstall-service
if %ERRORLEVEL% neq 0 (
    echo Error uninstalling service.
    pause
    exit /b 1
)
echo.
echo Service successfully uninstalled.
pause > nul

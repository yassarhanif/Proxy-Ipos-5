@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

set API_URL=http://localhost:3001

echo ===================================================
echo Test Local Connection
echo ===================================================
echo.
echo Testing health endpoint...
echo.

curl -s "%API_URL%/health"
echo.
echo.

if %ERRORLEVEL% neq 0 (
    echo ERROR: Cannot connect to %API_URL%
    echo Make sure the proxy is running.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo Testing query endpoint...
echo ===================================================
echo.

setlocal enabledelayedexpansion
set "BODY={\"sql\":\"SELECT 1 AS test\",\"params\":[]}"

curl -s -X POST "%API_URL%/api/query" ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: key_untuk_dashboard" ^
  -d "{""sql"":""SELECT 1 AS test"",""params"":[]}"
echo.
echo.

echo ===================================================
echo Done!
echo ===================================================
echo.
pause > nul

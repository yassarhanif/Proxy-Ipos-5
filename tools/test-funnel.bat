@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

echo ===================================================
echo Test via Tailscale Funnel
echo ===================================================
echo.

echo Getting Tailscale Funnel URL...
for /f "tokens=*" %%a in ('tailscale funnel status') do (
    echo %%a
)

echo.
echo Opening browser to test health endpoint...

for /f "tokens=*" %%a in ('tailscale funnel status 2^>nul ^| findstr "https://"') do (
    start "" "%%a/health"
)

echo If browser doesn't open, check your Tailscale URL manually.
echo.
pause > nul

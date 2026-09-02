@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-admin.ps1"
if errorlevel 1 (
  echo.
  echo Failed to start the admin server. See the error message above.
  pause
)

@echo off
echo ================================
echo Claude-Flow Immediate Fix Script
echo ================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version
echo.

REM Kill any stuck processes
echo Killing stuck processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 >nul

REM Clear problematic cache
echo Clearing claude-flow cache...
rd /s /q "%USERPROFILE%\.claude-flow\cache" 2>nul
rd /s /q "%USERPROFILE%\.claude-flow\sessions" 2>nul
del /f "%USERPROFILE%\.claude-flow\*.db" 2>nul
del /f "%USERPROFILE%\.claude-flow\*.lock" 2>nul

REM Clear npm cache
echo Clearing npm cache...
call npm cache clean --force

REM Set memory limits
echo Setting memory limits...
set NODE_OPTIONS=--max-old-space-size=4096

REM Check if using correct Node version
echo.
echo IMPORTANT: You should be using Node.js v20.x (LTS)
echo If you see v21.x or v22.x above, please switch versions!
echo.

REM Reinstall claude-flow with specific version
echo Reinstalling claude-flow...
call npm uninstall -g claude-flow
call npm install -g claude-flow@latest

REM Create config directory if not exists
if not exist "%USERPROFILE%\.claude-flow" mkdir "%USERPROFILE%\.claude-flow"

REM Create stable config
echo Creating stable configuration...
(
echo {
echo   "sessionTimeout": 3600000,
echo   "maxRetries": 5,
echo   "keepAliveInterval": 30000,
echo   "gracefulShutdown": true,
echo   "processCleanup": {
echo     "enabled": true,
echo     "forceKill": false,
echo     "timeout": 5000
echo   },
echo   "database": {
echo     "type": "sqlite",
echo     "synchronous": "FULL",
echo     "journal_mode": "WAL",
echo     "busy_timeout": 5000
echo   }
echo }
) > "%USERPROFILE%\.claude-flow\config.json"

echo.
echo ================================
echo Fix Applied Successfully!
echo ================================
echo.
echo Next steps:
echo 1. Make sure you're using Node.js v20.x (use nvm to switch if needed)
echo 2. Run claude-flow with: npx claude-flow@latest
echo 3. If issues persist, run this script again
echo.
pause
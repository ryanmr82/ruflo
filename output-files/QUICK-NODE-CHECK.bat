@echo off
echo ==========================================
echo Node.js Version Check for Claude-Flow
echo ==========================================
echo.

node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo Current Node.js: %NODE_VER%
echo.

echo %NODE_VER% | findstr /C:"v21." /C:"v22." /C:"v23." > nul
if %errorlevel% equ 0 (
    echo [ERROR] You have a problematic Node.js version!
    echo.
    echo This version has the EPERM bug that causes Claude-Flow disconnections.
    echo GitHub Issue: nodejs/node#51766
    echo.
    echo SOLUTION: Downgrade to Node.js v20.x LTS
    echo.
    echo Option 1: Direct download
    echo   - Go to: https://nodejs.org/en/download/
    echo   - Download Node.js v20 LTS
    echo.
    echo Option 2: Using nvm-windows
    echo   - nvm install 20.18.0
    echo   - nvm use 20.18.0
    echo.
) else (
    echo [OK] Your Node.js version should work with Claude-Flow
    echo.
)

echo ==========================================
echo Checking npm version...
echo ==========================================
npm --version
echo.

echo Press any key to run the community fix...
pause > nul

powershell.exe -ExecutionPolicy Bypass -File "C:\Claude-Flow\COMMUNITY-VERIFIED-FIX.ps1"
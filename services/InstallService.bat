@echo off
:: Batch file to install TurtleWow Cache Cleaner Service
:: This will request Administrator privileges

echo Installing TurtleWow Cache Cleaner Service...
echo.
echo This script requires Administrator privileges.
echo Please accept the UAC prompt when it appears.
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    powershell -ExecutionPolicy Bypass -File "C:\Claude-Flow\services\CreateTurtleWowService.ps1"
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo.
echo Installation complete. Press any key to exit...
pause >nul
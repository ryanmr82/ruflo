@echo off
:: Uninstall script for TurtleWow Cache Cleaner Service
:: This will remove the service completely

echo Uninstalling TurtleWow Cache Cleaner Service...
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    
    :: Stop and delete the scheduled task
    schtasks /end /tn "TurtleWowCacheCleaner" 2>nul
    schtasks /delete /tn "TurtleWowCacheCleaner" /f 2>nul
    
    if %errorLevel% == 0 (
        echo Service uninstalled successfully.
    ) else (
        echo Service was not found or already uninstalled.
    )
    
    echo.
    echo Log files remain in: C:\Claude-Flow\services\
    echo You can delete them manually if desired.
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo.
echo Press any key to exit...
pause >nul
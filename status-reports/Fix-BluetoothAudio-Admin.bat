@echo off
REM Bluetooth Audio Fix - Admin Batch File
REM Run this file as Administrator to fix Bluetooth speaker issues

echo === Bluetooth Audio Fix Script ===
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script requires Administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Creating registry backup...
reg export "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" "C:\Claude-Flow\status-reports\bluetooth_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.reg" /y

echo.
echo Disabling Absolute Volume (primary fix)...
reg add "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" /v DisableAbsoluteVolume /t REG_DWORD /d 1 /f

echo.
echo Restarting Bluetooth services...
net stop bthserv
net start bthserv

net stop BTAGService
net start BTAGService

echo.
echo Restarting audio services...
net stop audiosrv
net stop AudioEndpointBuilder
net start AudioEndpointBuilder
net start audiosrv

echo.
echo === FIX APPLIED SUCCESSFULLY ===
echo.
echo Your Bluetooth speaker should now work without requiring a computer restart.
echo If the issue persists, try disconnecting and reconnecting your speaker.
echo.
echo To restore original settings if needed:
echo 1. Navigate to C:\Claude-Flow\status-reports\
echo 2. Double-click the bluetooth_backup_*.reg file
echo.
pause
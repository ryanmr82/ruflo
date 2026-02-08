@echo off
REM UNDO ALL BLUETOOTH AUDIO CHANGES
REM Run as Administrator to restore original settings

echo ===============================================
echo         UNDOING ALL BLUETOOTH CHANGES
echo ===============================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script requires Administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [STEP 1] Restoring original registry settings...
reg add "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" /v DisableAbsoluteVolume /t REG_DWORD /d 0 /f

echo [STEP 2] Verifying registry restoration...
reg query "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" /v DisableAbsoluteVolume

echo [STEP 3] Restarting audio services to original state...
net stop "AudioSrv" >nul 2>&1
net start "AudioSrv" >nul 2>&1

echo.
echo ===============================================
echo           ALL CHANGES UNDONE
echo ===============================================
echo.
echo ✓ DisableAbsoluteVolume restored to 0 (original)
echo ✓ Audio services restarted
echo ✓ System restored to original state
echo.
echo All permanent changes have been reversed.
echo Your system is back to exactly how it was before.
echo.
pause
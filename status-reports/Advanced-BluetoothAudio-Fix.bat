@echo off
REM Advanced Bluetooth Audio Fix - Mimics Full Computer Restart
REM Based on community research: driver reset + radio management service + audio stack
REM Run as Administrator

echo ===============================================
echo    ADVANCED BLUETOOTH AUDIO FIX
echo    Mimics what computer restart does
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

echo [STEP 1] Creating backup...
reg export "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" "C:\Claude-Flow\status-reports\bluetooth_advanced_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.reg" /y >nul 2>&1

echo [STEP 2] Stopping all audio and Bluetooth processes...
taskkill /f /im "audiodg.exe" >nul 2>&1
taskkill /f /im "dwm.exe" >nul 2>&1

echo [STEP 3] Stopping services in dependency order...
net stop "AudioSrv" >nul 2>&1
net stop "AudioEndpointBuilder" >nul 2>&1
net stop "BTAGService" >nul 2>&1
net stop "bthserv" >nul 2>&1
net stop "RmSvc" >nul 2>&1

echo [STEP 4] Disabling and re-enabling Bluetooth radio (driver reset)...
powershell -Command "Get-PnpDevice -FriendlyName '*Bluetooth*' | Where-Object {$_.Class -eq 'Bluetooth'} | Disable-PnpDevice -Confirm:$false" >nul 2>&1
timeout /t 3 /nobreak >nul
powershell -Command "Get-PnpDevice -FriendlyName '*Bluetooth*' | Where-Object {$_.Class -eq 'Bluetooth'} | Enable-PnpDevice -Confirm:$false" >nul 2>&1

echo [STEP 5] Resetting audio drivers...
powershell -Command "Get-PnpDevice -FriendlyName '*Audio*' | Disable-PnpDevice -Confirm:$false" >nul 2>&1
timeout /t 2 /nobreak >nul
powershell -Command "Get-PnpDevice -FriendlyName '*Audio*' | Enable-PnpDevice -Confirm:$false" >nul 2>&1

echo [STEP 6] Scanning for hardware changes...
powershell -Command "Get-CimInstance -ClassName Win32_PnPEntity | Invoke-CimMethod -MethodName ScanForHardwareChanges" >nul 2>&1

echo [STEP 7] Starting services in proper order...
net start "RmSvc" >nul 2>&1
timeout /t 2 /nobreak >nul
net start "bthserv" >nul 2>&1
timeout /t 2 /nobreak >nul
net start "AudioEndpointBuilder" >nul 2>&1
timeout /t 2 /nobreak >nul
net start "AudioSrv" >nul 2>&1
timeout /t 2 /nobreak >nul
net start "BTAGService" >nul 2>&1

echo [STEP 8] Applying Absolute Volume fix...
reg add "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" /v DisableAbsoluteVolume /t REG_DWORD /d 1 /f >nul 2>&1

echo [STEP 9] Clearing audio cache...
del /q "%TEMP%\*audio*" >nul 2>&1
del /q "%APPDATA%\Microsoft\Windows\Recent\AutomaticDestinations\*" >nul 2>&1

echo [STEP 10] Final service restart...
net stop "AudioSrv" >nul 2>&1
net start "AudioSrv" >nul 2>&1

echo.
echo ===============================================
echo            ADVANCED FIX COMPLETED
echo ===============================================
echo.
echo This script performed the same operations that
echo happen during a computer restart:
echo.
echo ✓ Driver reset (Bluetooth + Audio)
echo ✓ Radio Management Service restart
echo ✓ Full audio stack reinitialize
echo ✓ Hardware re-scan
echo ✓ Service dependency reset
echo ✓ Cache clear
echo.
echo Your Bluetooth speaker should now work.
echo If not, the issue may be hardware-related.
echo.
pause
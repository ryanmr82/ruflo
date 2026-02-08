@echo off
echo ================================================
echo   GuildShopSync - One-Time Setup
echo ================================================
echo.
echo This sets up automatic price syncing.
echo After this, just click "Sync Prices" in WoW
echo and prices upload automatically.
echo.
echo Press any key to continue...
pause > nul

:: Create VBS wrapper to run hidden
echo Set WshShell = CreateObject("WScript.Shell") > "%~dp0RunHidden.vbs"
echo WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%~dp0AutoSync.ps1""", 0, False >> "%~dp0RunHidden.vbs"

:: Create scheduled task to run at login
schtasks /create /tn "GuildShopSync" /tr "wscript.exe \"%~dp0RunHidden.vbs\"" /sc onlogon /rl limited /f

:: Start it now
schtasks /run /tn "GuildShopSync"

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo The auto-sync is now running. From now on:
echo.
echo   1. Open AUX in WoW at the Auction House
echo   2. Click "Sync Prices" button
echo   3. That's it! Prices upload automatically.
echo.
echo You will see a Windows notification when
echo the upload completes.
echo.
pause

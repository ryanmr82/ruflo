@echo off
echo ================================================
echo   GuildShopSync - Background Service Installer
echo ================================================
echo.
echo This installs a background service that:
echo  - Watches for the "Sync Guild Shop" button click in WoW
echo  - Automatically uploads prices to the guild website
echo  - Shows a Windows notification when upload completes
echo.
echo Press any key to install...
pause > nul

powershell -ExecutionPolicy Bypass -File "%~dp0GuildShopSync.ps1" -Install

echo.
echo ================================================
echo   Installation Complete!
echo ================================================
echo.
echo The service is now running. When you click
echo "Sync Guild Shop" in aux-addon:
echo.
echo  1. It scans all consume items
echo  2. You log out or /reload
echo  3. Prices upload automatically
echo  4. You see a Windows notification
echo.
pause

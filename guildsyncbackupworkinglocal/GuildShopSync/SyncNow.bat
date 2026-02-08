@echo off
echo Syncing prices from aux-addon to guild website...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0GuildShopSync.ps1" -RunOnce
echo.
pause

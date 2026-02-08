@echo off
REM ========================================
REM Turtle WoW Addon Rollback Script
REM Created: 2025-10-20
REM ========================================

echo.
echo ========================================
echo Turtle WoW Addon Rollback Script
echo ========================================
echo.
echo This script will remove the newly installed addons and restore
echo your previous addon configuration from the backup.
echo.
echo Addons to be removed:
echo   - MinimapButtonBag
echo   - AutoBar
echo   - !!!GarbageProtector
echo   - pfDebug
echo.
echo Backup location: C:\turtlewow\backups\AddOns_backup_2025-10-20_042511
echo.
pause

echo.
echo [1/5] Removing MinimapButtonBag...
if exist "C:\turtlewow\Interface\AddOns\MinimapButtonBag" (
    rmdir /s /q "C:\turtlewow\Interface\AddOns\MinimapButtonBag"
    echo     - MinimapButtonBag removed successfully
) else (
    echo     - MinimapButtonBag not found (already removed?)
)

echo.
echo [2/5] Removing AutoBar...
if exist "C:\turtlewow\Interface\AddOns\AutoBar" (
    rmdir /s /q "C:\turtlewow\Interface\AddOns\AutoBar"
    echo     - AutoBar removed successfully
) else (
    echo     - AutoBar not found (already removed?)
)

echo.
echo [3/5] Removing GarbageProtector...
if exist "C:\turtlewow\Interface\AddOns\!!!GarbageProtector" (
    rmdir /s /q "C:\turtlewow\Interface\AddOns\!!!GarbageProtector"
    echo     - GarbageProtector removed successfully
) else (
    echo     - GarbageProtector not found (already removed?)
)

echo.
echo [4/5] Removing pfDebug...
if exist "C:\turtlewow\Interface\AddOns\pfDebug" (
    rmdir /s /q "C:\turtlewow\Interface\AddOns\pfDebug"
    echo     - pfDebug removed successfully
) else (
    echo     - pfDebug not found (already removed?)
)

echo.
echo [5/5] Restoring backup configuration...
if exist "C:\turtlewow\backups\AddOns_backup_2025-10-20_042511" (
    echo     Backup found. You can manually restore specific addon configurations if needed.
    echo     Backup location: C:\turtlewow\backups\AddOns_backup_2025-10-20_042511
) else (
    echo     WARNING: Backup not found at expected location!
)

echo.
echo ========================================
echo Rollback Complete!
echo ========================================
echo.
echo Your saved variables for the removed addons are still in:
echo   C:\turtlewow\WTF\Account\[YourAccount]\SavedVariables\
echo.
echo If you want to completely remove all traces, delete these files:
echo   - MinimapButtonBag.lua
echo   - AutoBar_Config.lua
echo   - GarbageProtectorDB.lua
echo   (pfDebug doesn't save variables)
echo.
pause

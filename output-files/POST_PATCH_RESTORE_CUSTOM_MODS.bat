@echo off
REM ================================================================
REM TURTLE WOW POST-PATCH RESTORATION SCRIPT
REM Created: November 4, 2025
REM Purpose: Restore custom addon modifications after patch
REM ================================================================

echo.
echo ================================================================
echo TURTLE WOW CUSTOM MODIFICATIONS RESTORATION
echo ================================================================
echo.
echo This script will restore your 3 custom addon modifications:
echo   1. Bagshui - Soul Shard Manager GUI
echo   2. Chronometer - Death detection fix
echo   3. ShardCapPlus - Auto-delete cap enforcement
echo.
echo IMPORTANT: Only run this if your custom mods broke after patch!
echo.
echo From: C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04
echo To: C:\TurtleWoW\Interface\AddOns
echo.
pause

echo.
echo ================================================================
echo RESTORING CUSTOM MODIFICATIONS
echo ================================================================
echo.

REM Check if backup exists
if not exist "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04" (
    echo [ERROR] Backup directory not found!
    echo Please run PRE_PATCH_BACKUP_COMMANDS.bat first.
    pause
    exit /b 1
)

REM Restore Bagshui
echo [1/3] Restoring Bagshui Soul Shard Manager...
copy "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\Bagshui_Inventory.Ui_2025_11_04.lua" "C:\TurtleWoW\Interface\AddOns\Bagshui\Components\Inventory.Ui.lua" /Y
if %ERRORLEVEL% EQU 0 (
    echo [OK] Bagshui restored successfully
) else (
    echo [FAIL] Bagshui restoration failed
)

REM Restore Chronometer
echo [2/3] Restoring Chronometer death detection...
copy "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\Chronometer_2025_11_04.lua" "C:\TurtleWoW\Interface\AddOns\Chronometer-TWoW\Core\Chronometer.lua" /Y
if %ERRORLEVEL% EQU 0 (
    echo [OK] Chronometer restored successfully
) else (
    echo [FAIL] Chronometer restoration failed
)

REM Restore ShardCapPlus
echo [3/3] Restoring ShardCapPlus auto-delete...
copy "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\ShardCapPlus_2025_11_04.lua" "C:\TurtleWoW\Interface\AddOns\ShardCapPlus\ShardCapPlus.lua" /Y
if %ERRORLEVEL% EQU 0 (
    echo [OK] ShardCapPlus restored successfully
) else (
    echo [FAIL] ShardCapPlus restoration failed
)

echo.
echo ================================================================
echo RESTORATION COMPLETE
echo ================================================================
echo.
echo All custom modifications have been restored.
echo.
echo Next steps:
echo 1. Close this window
echo 2. Launch WoW
echo 3. Type: /reload
echo 4. Test each modification:
echo    - Bagshui: Open bags as Warlock, check for Soul Shard Manager panel
echo    - Chronometer: Cast DoTs in raid, kill mob, verify timers clear
echo    - ShardCapPlus: Farm shards past cap, exit combat, verify auto-delete
echo.
pause

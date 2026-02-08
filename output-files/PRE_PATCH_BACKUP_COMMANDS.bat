@echo off
REM ================================================================
REM TURTLE WOW PRE-PATCH BACKUP SCRIPT
REM Created: November 4, 2025
REM Purpose: Execute all 5 backup levels before WoW patch
REM ================================================================

echo.
echo ================================================================
echo TURTLE WOW PRE-PATCH BACKUP SCRIPT
echo ================================================================
echo.
echo This script will create 5 levels of backups:
echo   Level 1: Full TurtleWoW directory (~10GB, 10-15 min)
echo   Level 2: Custom addon modifications (<1MB, <1 min)
echo   Level 3: SavedVariables/WTF configs (~500MB, 2-5 min)
echo   Level 4: Combat log tools (~2MB, <1 min)
echo   Level 5: Documentation (~5MB, <1 min)
echo.
echo Total estimated time: 15-20 minutes
echo Total estimated size: ~11GB
echo.
pause

echo.
echo ================================================================
echo LEVEL 1: FULL SYSTEM BACKUP (~10GB)
echo ================================================================
echo.
echo Backing up entire TurtleWoW directory...
echo Destination: C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04
echo.

xcopy /E /I /H /Y "C:\TurtleWoW" "C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Level 1 backup completed successfully!
) else (
    echo [ERROR] Level 1 backup failed! Error code: %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ================================================================
echo LEVEL 2: CUSTOM MODIFICATIONS BACKUP (<1MB)
echo ================================================================
echo.
echo Backing up modified addon files...
echo Destination: C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04
echo.

mkdir "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04" 2>nul

copy "C:\TurtleWoW\Interface\AddOns\Bagshui\Components\Inventory.Ui.lua" "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\Bagshui_Inventory.Ui_2025_11_04.lua"
copy "C:\TurtleWoW\Interface\AddOns\Chronometer-TWoW\Core\Chronometer.lua" "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\Chronometer_2025_11_04.lua"
copy "C:\TurtleWoW\Interface\AddOns\ShardCapPlus\ShardCapPlus.lua" "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\ShardCapPlus_2025_11_04.lua"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Level 2 backup completed successfully!
    dir "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04"
) else (
    echo [ERROR] Level 2 backup failed! Error code: %ERRORLEVEL%
)

echo.
echo ================================================================
echo LEVEL 3: SAVEDVARIABLES BACKUP (~500MB)
echo ================================================================
echo.
echo Backing up character configs and addon settings...
echo Destination: C:\TurtleWoW_WTF_BACKUP_PRE_PATCH_2025_11_04
echo.

xcopy /E /I /H /Y "C:\TurtleWoW\WTF" "C:\TurtleWoW_WTF_BACKUP_PRE_PATCH_2025_11_04"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Level 3 backup completed successfully!
) else (
    echo [ERROR] Level 3 backup failed! Error code: %ERRORLEVEL%
)

echo.
echo ================================================================
echo LEVEL 4: COMBAT LOG TOOLS BACKUP (~2MB)
echo ================================================================
echo.
echo Backing up custom Python scripts and databases...
echo Destination: C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04
echo.

mkdir "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04" 2>nul

xcopy /E /I /Y "C:\turtlewow\logs\*.py" "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\"
xcopy /E /I /Y "C:\turtlewow\logs\*.json" "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\"
xcopy /E /I /Y "C:\turtlewow\logs\*.bat" "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\"
copy "C:\turtlewow\logs\requirements.txt" "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Level 4 backup completed successfully!
    dir "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04"
) else (
    echo [ERROR] Level 4 backup failed! Error code: %ERRORLEVEL%
)

echo.
echo ================================================================
echo LEVEL 5: DOCUMENTATION BACKUP (~5MB)
echo ================================================================
echo.
echo Backing up all documentation files...
echo Destination: C:\TURTLEWOW_DOCS_BACKUP_2025_11_04
echo.

mkdir "C:\TURTLEWOW_DOCS_BACKUP_2025_11_04" 2>nul

xcopy /E /I /Y "C:\Claude-Flow\output-files\*.md" "C:\TURTLEWOW_DOCS_BACKUP_2025_11_04\"
xcopy /E /I /Y "C:\Claude-Flow\output-files\*.txt" "C:\TURTLEWOW_DOCS_BACKUP_2025_11_04\"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Level 5 backup completed successfully!
) else (
    echo [ERROR] Level 5 backup failed! Error code: %ERRORLEVEL%
)

echo.
echo ================================================================
echo BACKUP VERIFICATION
echo ================================================================
echo.
echo Verifying all backups exist...
echo.

set BACKUP_FAILED=0

if exist "C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04\Interface\AddOns" (
    echo [OK] Level 1: Full system backup exists
) else (
    echo [FAIL] Level 1: Full system backup MISSING!
    set BACKUP_FAILED=1
)

if exist "C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04\Bagshui_Inventory.Ui_2025_11_04.lua" (
    echo [OK] Level 2: Custom mods backup exists
) else (
    echo [FAIL] Level 2: Custom mods backup MISSING!
    set BACKUP_FAILED=1
)

if exist "C:\TurtleWoW_WTF_BACKUP_PRE_PATCH_2025_11_04\Account" (
    echo [OK] Level 3: SavedVariables backup exists
) else (
    echo [FAIL] Level 3: SavedVariables backup MISSING!
    set BACKUP_FAILED=1
)

if exist "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\flask_app.py" (
    echo [OK] Level 4: Combat log tools backup exists
) else (
    echo [FAIL] Level 4: Combat log tools backup MISSING!
    set BACKUP_FAILED=1
)

if exist "C:\TURTLEWOW_DOCS_BACKUP_2025_11_04\PRE_PATCH_DOCUMENTATION_REPOSITORY.md" (
    echo [OK] Level 5: Documentation backup exists
) else (
    echo [FAIL] Level 5: Documentation backup MISSING!
    set BACKUP_FAILED=1
)

echo.
echo ================================================================
echo BACKUP SUMMARY
echo ================================================================
echo.

if %BACKUP_FAILED% EQU 0 (
    echo [SUCCESS] ALL BACKUPS COMPLETED SUCCESSFULLY!
    echo.
    echo Backup Locations:
    echo   L1: C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04
    echo   L2: C:\TurtleWoW_CUSTOM_MODS_BACKUP_2025_11_04
    echo   L3: C:\TurtleWoW_WTF_BACKUP_PRE_PATCH_2025_11_04
    echo   L4: C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04
    echo   L5: C:\TURTLEWOW_DOCS_BACKUP_2025_11_04
    echo.
    echo You are now ready for the WoW patch!
    echo.
    echo IMPORTANT: Keep these backups until you verify the patch works.
    echo.
) else (
    echo [ERROR] SOME BACKUPS FAILED!
    echo Please review the errors above and re-run the script.
    echo.
)

echo ================================================================
echo.
pause

@echo off
REM ================================================================
REM HONORSPY TURTLE ROLLBACK SCRIPT
REM Created: November 4, 2025
REM Purpose: Restore HonorSpyTurtle to pre-modification state
REM ================================================================

echo.
echo ================================================================
echo HONORSPY TURTLE ROLLBACK
echo ================================================================
echo.
echo This script will restore HonorSpyTurtle to its original state
echo before the November 4, 2025 modifications.
echo.
echo Changes to be REVERTED:
echo   - Column click sorting
echo   - Rank Points column rename (back to "RP")
echo   - Scroll buttons
echo.
echo From: C:\TurtleWoW\Interface\AddOns_HonorSpyTurtle_BACKUP_2025_11_04
echo To: C:\TurtleWoW\Interface\AddOns\HonorSpyTurtle
echo.
echo IMPORTANT: Close World of Warcraft before continuing!
echo.
pause

echo.
echo ================================================================
echo RESTORING ORIGINAL FILES
echo ================================================================
echo.

REM Check if backup exists
if not exist "C:\TurtleWoW\Interface\AddOns_HonorSpyTurtle_BACKUP_2025_11_04" (
    echo [ERROR] Backup directory not found!
    echo Expected: C:\TurtleWoW\Interface\AddOns_HonorSpyTurtle_BACKUP_2025_11_04
    echo.
    echo Please verify the backup location and try again.
    pause
    exit /b 1
)

REM Restore localization.lua
echo [1/2] Restoring localization.lua...
copy /Y "C:\TurtleWoW\Interface\AddOns_HonorSpyTurtle_BACKUP_2025_11_04\localization.lua" "C:\TurtleWoW\Interface\AddOns\HonorSpyTurtle\localization.lua"
if %ERRORLEVEL% EQU 0 (
    echo [OK] localization.lua restored successfully
) else (
    echo [FAIL] localization.lua restoration failed
)

REM Restore standings.lua
echo [2/2] Restoring standings.lua...
copy /Y "C:\TurtleWoW\Interface\AddOns_HonorSpyTurtle_BACKUP_2025_11_04\standings.lua" "C:\TurtleWoW\Interface\AddOns\HonorSpyTurtle\standings.lua"
if %ERRORLEVEL% EQU 0 (
    echo [OK] standings.lua restored successfully
) else (
    echo [FAIL] standings.lua restoration failed
)

echo.
echo ================================================================
echo RESTORATION COMPLETE
echo ================================================================
echo.
echo HonorSpyTurtle has been restored to its original state.
echo.
echo Next steps:
echo 1. Launch World of Warcraft
echo 2. Type: /reload
echo 3. Test HonorSpy: /honorspy show
echo 4. Verify columns show "RP" (not "Rank Points")
echo 5. Verify clicking columns does nothing (original behavior)
echo.
echo If you want to re-apply the modifications:
echo   - Refer to HONORSPY_MODIFICATIONS_SUMMARY_2025_11_04.md
echo   - Manually edit the files again
echo   - OR ask for assistance to re-implement features
echo.
pause

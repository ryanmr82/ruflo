@echo off
REM ===============================================
REM Clear AUX Addon Cache - Turtle WoW Fix
REM Created: 2025-08-29
REM Purpose: Fix AUX Auctions tab showing wrong prices
REM ===============================================

title Clear AUX Cache - Turtle WoW
color 0A

echo.
echo ================================================
echo   AUX CACHE CLEANER - TURTLE WOW
echo ================================================
echo.

REM Check if WoW is running
tasklist /FI "IMAGENAME eq turtle-wow.exe" 2>NUL | find /I /N "turtle-wow.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [WARNING] Turtle WoW is currently running!
    echo.
    echo Please EXIT Turtle WoW completely before running this fix.
    echo Press any key to exit...
    pause >nul
    exit
)

tasklist /FI "IMAGENAME eq WoW.exe" 2>NUL | find /I /N "WoW.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [WARNING] WoW.exe is currently running!
    echo.
    echo Please EXIT Turtle WoW completely before running this fix.
    echo Press any key to exit...
    pause >nul
    exit
)

echo [STEP 1] Checking for AUX cache file...
echo.

set AUX_CACHE="C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua"

if exist %AUX_CACHE% (
    echo [FOUND] AUX cache file exists
    echo File: %AUX_CACHE%
    echo.
    
    echo [STEP 2] Creating backup...
    copy %AUX_CACHE% %AUX_CACHE%.backup_%DATE:~-4,4%-%DATE:~-10,2%-%DATE:~-7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2% >nul 2>&1
    
    echo [STEP 3] Deleting corrupted cache file...
    del %AUX_CACHE%
    
    if not exist %AUX_CACHE% (
        echo [SUCCESS] AUX cache cleared successfully!
        echo.
        echo ================================================
        echo   CACHE CLEARED - READY TO LAUNCH WOW
        echo ================================================
        echo.
        echo What was fixed:
        echo - AUX Auctions tab will show correct prices
        echo - Prices will match Blizzard UI
        echo - Cache will rebuild automatically
        echo.
        echo Next steps:
        echo 1. Launch Turtle WoW
        echo 2. Check AUX Auctions tab
        echo 3. Verify prices match Blizzard UI
        echo.
    ) else (
        echo [ERROR] Failed to delete cache file!
        echo File may be in use or protected.
        echo.
    )
) else (
    echo [INFO] AUX cache file not found
    echo This means either:
    echo - Cache is already clear
    echo - AUX hasn't been used yet
    echo - Different account name
    echo.
    echo File checked: %AUX_CACHE%
    echo.
)

echo ================================================
echo   OPERATION COMPLETE
echo ================================================
echo.
echo Press any key to close...
pause >nul
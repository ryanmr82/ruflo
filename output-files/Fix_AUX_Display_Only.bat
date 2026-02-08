@echo off
REM ===============================================
REM Fix AUX Display Issue - Selective Cache Clear
REM Created: 2025-08-29
REM Purpose: Clear only auction display cache, keep settings
REM ===============================================

title Fix AUX Display - Turtle WoW
color 0E

echo.
echo ================================================
echo   AUX DISPLAY FIX - TURTLE WOW
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

echo [STEP 1] Creating PowerShell script to fix AUX cache...
echo.

REM Create a PowerShell script to selectively edit the cache
(
echo $auxFile = "C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua"
echo if ^(Test-Path $auxFile^) ^{
echo     Write-Host "[FOUND] AUX cache file exists"
echo     $backup = $auxFile + ".backup_display_fix_" + ^(Get-Date -Format "yyyy-MM-dd_HH-mm-ss"^)
echo     Copy-Item $auxFile $backup
echo     Write-Host "[BACKUP] Created: $backup"
echo     
echo     $content = Get-Content $auxFile -Raw
echo     
echo     # Clear history data but keep settings
echo     $pattern = '\["history"\] = \{[^}]*\},'
echo     $replacement = '["history"] = {},'
echo     $content = $content -replace $pattern, $replacement
echo     
echo     # Write back the modified content
echo     $content ^| Set-Content $auxFile
echo     Write-Host "[SUCCESS] Cleared auction history cache while preserving settings"
echo ^} else ^{
echo     Write-Host "[ERROR] AUX cache file not found"
echo ^}
) > "%TEMP%\fix_aux_display.ps1"

echo [STEP 2] Running selective cache fix...
powershell -ExecutionPolicy Bypass -File "%TEMP%\fix_aux_display.ps1"

echo.
echo [STEP 3] Cleaning up temporary files...
del "%TEMP%\fix_aux_display.ps1" >nul 2>&1

echo.
echo ================================================
echo   DISPLAY FIX COMPLETE
echo ================================================
echo.
echo What was fixed:
echo - Cleared auction price history cache
echo - Preserved your AUX settings and preferences  
echo - Kept addon functionality intact
echo.
echo Next steps:
echo 1. Launch Turtle WoW
echo 2. Open Auction House
echo 3. Search for items - prices should now show correctly
echo 4. AUX will rebuild fresh price data as you browse
echo.
echo ================================================
echo   READY TO LAUNCH WOW
echo ================================================
echo.
echo Press any key to close...
pause >nul
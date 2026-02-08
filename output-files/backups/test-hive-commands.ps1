# Test Script for Hive-Mind and Hive-Swarm Commands
# This verifies that commands work after terminal restart

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "   HIVE COMMANDS PERSISTENCE TEST   " -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

# Test 1: Check if commands are in PATH
Write-Host "`n[TEST 1] Checking PATH environment..." -ForegroundColor Green

$pathEntries = $env:Path -split ';'
$claudeFlowInPath = $pathEntries | Where-Object { $_ -like "*claude-flow*" }

if ($claudeFlowInPath) {
    Write-Host "✅ C:\claude-flow found in PATH" -ForegroundColor Green
    Write-Host "   Entry: $claudeFlowInPath" -ForegroundColor Gray
} else {
    Write-Host "❌ C:\claude-flow NOT in PATH" -ForegroundColor Red
    Write-Host "   Run: powershell -ExecutionPolicy Bypass -File 'C:\Claude-Flow\output-files\setup-path.ps1'" -ForegroundColor Yellow
}

# Test 2: Check if batch files exist
Write-Host "`n[TEST 2] Checking batch files..." -ForegroundColor Green

if (Test-Path "C:\claude-flow\hive-mind.bat") {
    Write-Host "✅ hive-mind.bat exists" -ForegroundColor Green
} else {
    Write-Host "❌ hive-mind.bat missing" -ForegroundColor Red
}

if (Test-Path "C:\claude-flow\hive-swarm.bat") {
    Write-Host "✅ hive-swarm.bat exists" -ForegroundColor Green
} else {
    Write-Host "❌ hive-swarm.bat missing" -ForegroundColor Red
}

# Test 3: Check if PowerShell scripts exist
Write-Host "`n[TEST 3] Checking PowerShell scripts..." -ForegroundColor Green

if (Test-Path "C:\claude-flow\hive-mind.ps1") {
    Write-Host "✅ hive-mind.ps1 exists" -ForegroundColor Green
    
    # Check if it's the proper version
    $content = Get-Content "C:\claude-flow\hive-mind.ps1" -Raw
    if ($content -match "HIVE-MIND MODE - Strategic Queen Coordinator") {
        Write-Host "✅ hive-mind.ps1 is MIND MODE version (correct)" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-mind.ps1 may be old version" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ hive-mind.ps1 missing" -ForegroundColor Red
}

if (Test-Path "C:\claude-flow\hive-swarm.ps1") {
    Write-Host "✅ hive-swarm.ps1 exists" -ForegroundColor Green
    
    # Check if it's the proper version
    $content = Get-Content "C:\claude-flow\hive-swarm.ps1" -Raw
    if ($content -match "HIVE-SWARM MODE - Distributed Agent Coordination") {
        Write-Host "✅ hive-swarm.ps1 is SWARM MODE version (correct)" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-swarm.ps1 may be old version" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ hive-swarm.ps1 missing" -ForegroundColor Red
}

# Test 4: Check PowerShell profile
Write-Host "`n[TEST 4] Checking PowerShell profile..." -ForegroundColor Green

if (Test-Path $PROFILE) {
    $profileContent = Get-Content $PROFILE -Raw
    if ($profileContent -match "function hive-mind") {
        Write-Host "✅ hive-mind function in PowerShell profile" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-mind function not in profile" -ForegroundColor Yellow
    }
    
    if ($profileContent -match "function hive-swarm") {
        Write-Host "✅ hive-swarm function in PowerShell profile" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-swarm function not in profile" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ PowerShell profile not found" -ForegroundColor Yellow
}

# Test 5: Check if commands are available
Write-Host "`n[TEST 5] Testing command availability..." -ForegroundColor Green

# Test from CMD context
$cmdTest = & cmd /c "where hive-mind 2>nul"
if ($cmdTest) {
    Write-Host "✅ hive-mind accessible from CMD" -ForegroundColor Green
} else {
    Write-Host "⚠ hive-mind not accessible from CMD (restart required)" -ForegroundColor Yellow
}

$cmdTest = & cmd /c "where hive-swarm 2>nul"
if ($cmdTest) {
    Write-Host "✅ hive-swarm accessible from CMD" -ForegroundColor Green
} else {
    Write-Host "⚠ hive-swarm not accessible from CMD (restart required)" -ForegroundColor Yellow
}

# Test from PowerShell context
$psTest = Get-Command hive-mind -ErrorAction SilentlyContinue
if ($psTest) {
    Write-Host "✅ hive-mind accessible from PowerShell" -ForegroundColor Green
} else {
    Write-Host "⚠ hive-mind not accessible from PowerShell (restart required)" -ForegroundColor Yellow
}

$psTest = Get-Command hive-swarm -ErrorAction SilentlyContinue
if ($psTest) {
    Write-Host "✅ hive-swarm accessible from PowerShell" -ForegroundColor Green
} else {
    Write-Host "⚠ hive-swarm not accessible from PowerShell (restart required)" -ForegroundColor Yellow
}

# Test 6: Check hive_prompt.txt
Write-Host "`n[TEST 6] Checking hive_prompt.txt..." -ForegroundColor Green

if (Test-Path "C:\claude-flow\hive_prompt.txt") {
    $fileSize = (Get-Item "C:\claude-flow\hive_prompt.txt").Length
    Write-Host "✅ hive_prompt.txt exists ($fileSize bytes)" -ForegroundColor Green
} else {
    Write-Host "⚠ hive_prompt.txt not found - create your task here" -ForegroundColor Yellow
    Write-Host "   Path: C:\claude-flow\hive_prompt.txt" -ForegroundColor Gray
}

# Summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "        TEST SUMMARY" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

$allGood = $true

if ($claudeFlowInPath -and 
    (Test-Path "C:\claude-flow\hive-mind.bat") -and 
    (Test-Path "C:\claude-flow\hive-swarm.bat") -and
    (Test-Path "C:\claude-flow\hive-mind.ps1") -and
    (Test-Path "C:\claude-flow\hive-swarm.ps1")) {
    
    Write-Host "`n✅ All files are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Close this terminal completely" -ForegroundColor White
    Write-Host "2. Open a new terminal (PowerShell, CMD, or Git Bash)" -ForegroundColor White
    Write-Host "3. Test commands:" -ForegroundColor White
    Write-Host "   - Type: hive-mind" -ForegroundColor Gray
    Write-Host "   - Type: hive-swarm" -ForegroundColor Gray
    
} else {
    Write-Host "`n⚠ Some components need attention" -ForegroundColor Yellow
    Write-Host "Please review the test results above" -ForegroundColor White
}

Write-Host "`n=====================================" -ForegroundColor Cyan
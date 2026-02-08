# Hive-Mind Status Checker
# This script verifies if multi-agent spawning is working

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "     HIVE-MIND STATUS CHECKER" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check for active Claude processes
Write-Host "1. CHECKING ACTIVE CLAUDE PROCESSES:" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor DarkGray
$claudeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*claude*" -or $_.CommandLine -like "*claude*" } 2>$null
if ($claudeProcesses) {
    Write-Host "Found $($claudeProcesses.Count) Claude process(es):" -ForegroundColor Yellow
    $claudeProcesses | ForEach-Object {
        Write-Host "  - PID: $($_.Id) | Name: $($_.ProcessName)" -ForegroundColor Cyan
    }
} else {
    # Alternative check using tasklist
    $tasklistOutput = tasklist | findstr /i claude
    if ($tasklistOutput) {
        Write-Host "Claude processes found via tasklist:" -ForegroundColor Yellow
        Write-Host $tasklistOutput -ForegroundColor Cyan
    } else {
        Write-Host "  No Claude processes currently running" -ForegroundColor Red
    }
}

# 2. Check Hive-Mind database activity
Write-Host "`n2. CHECKING HIVE-MIND DATABASE:" -ForegroundColor Green
Write-Host "--------------------------------" -ForegroundColor DarkGray
$hiveDB = "C:\Claude-Flow\.hive-mind\hive.db"
$hiveWAL = "C:\Claude-Flow\.hive-mind\hive.db-wal"
if (Test-Path $hiveDB) {
    $dbInfo = Get-Item $hiveDB
    $walInfo = Get-Item $hiveWAL -ErrorAction SilentlyContinue
    Write-Host "  Database found: $($dbInfo.Length / 1KB) KB" -ForegroundColor Yellow
    Write-Host "  Last modified: $($dbInfo.LastWriteTime)" -ForegroundColor Cyan
    if ($walInfo -and $walInfo.Length -gt 0) {
        Write-Host "  ✓ Active WAL file: $($walInfo.Length / 1KB) KB (ACTIVE WRITES!)" -ForegroundColor Green
        $timeDiff = (Get-Date) - $walInfo.LastWriteTime
        if ($timeDiff.TotalMinutes -lt 5) {
            Write-Host "  ✓ Database activity in last 5 minutes!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  Hive database not found" -ForegroundColor Red
}

# 3. Check for active Hive-Mind sessions
Write-Host "`n3. CHECKING ACTIVE SESSIONS:" -ForegroundColor Green
Write-Host "----------------------------" -ForegroundColor DarkGray
$sessionsPath = "C:\Claude-Flow\.hive-mind\sessions"
if (Test-Path $sessionsPath) {
    $recentSessions = Get-ChildItem $sessionsPath -Filter "*.txt" -ErrorAction SilentlyContinue | Where-Object { 
        $_.LastWriteTime -gt (Get-Date).AddMinutes(-30) 
    } | Sort-Object LastWriteTime -Descending
    
    if ($recentSessions) {
        Write-Host "  Found $($recentSessions.Count) recent session(s):" -ForegroundColor Yellow
        $recentSessions | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor Cyan
            Write-Host "    Created: $($_.LastWriteTime)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  No recent sessions (last 30 min)" -ForegroundColor Red
    }
}

# 4. Check NPX claude-flow status
Write-Host "`n4. CHECKING CLAUDE-FLOW STATUS:" -ForegroundColor Green
Write-Host "--------------------------------" -ForegroundColor DarkGray
try {
    $statusOutput = npx claude-flow@latest hive-mind status 2>&1 | Out-String
    if ($statusOutput -like "*No active hive mind*") {
        Write-Host "  No active hive mind swarm" -ForegroundColor Red
    } elseif ($statusOutput -like "*swarm*" -or $statusOutput -like "*active*") {
        Write-Host "  ✓ ACTIVE HIVE-MIND DETECTED!" -ForegroundColor Green
        Write-Host $statusOutput -ForegroundColor Cyan
    } else {
        Write-Host "  Status unclear, raw output:" -ForegroundColor Yellow
        Write-Host ($statusOutput | Select-Object -First 10) -ForegroundColor DarkGray
    }
} catch {
    Write-Host "  Could not check claude-flow status" -ForegroundColor Red
}

# 5. Check for multiple agent indicators
Write-Host "`n5. MULTI-AGENT INDICATORS:" -ForegroundColor Green
Write-Host "---------------------------" -ForegroundColor DarkGray

# Check for parallel task files
$outputFiles = Get-ChildItem "C:\Claude-Flow\output-files" -Filter "*" -ErrorAction SilentlyContinue | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-10) }
if ($outputFiles.Count -gt 1) {
    Write-Host "  ✓ Multiple recent output files ($($outputFiles.Count)) - possible parallel work" -ForegroundColor Green
} else {
    Write-Host "  Single or no recent output files" -ForegroundColor Yellow
}

# Check Windows Terminal/Console windows
$terminals = Get-Process | Where-Object { $_.ProcessName -in @("WindowsTerminal", "conhost", "cmd", "powershell") }
if ($terminals.Count -gt 2) {
    Write-Host "  ✓ Multiple terminal windows ($($terminals.Count)) - possible agent terminals" -ForegroundColor Green
} else {
    Write-Host "  Normal terminal count" -ForegroundColor Yellow
}

# 6. Real-time monitoring suggestion
Write-Host "`n6. REAL-TIME MONITORING COMMANDS:" -ForegroundColor Green
Write-Host "----------------------------------" -ForegroundColor DarkGray
Write-Host "  Run these in separate windows to monitor:" -ForegroundColor Yellow
Write-Host '  - Watch processes: while ($true) { Get-Process *claude* | ft; Start-Sleep 2; Clear }' -ForegroundColor Cyan
Write-Host '  - Watch database: while ($true) { Get-Item C:\Claude-Flow\.hive-mind\*.db* | ft Name,Length,LastWriteTime; Start-Sleep 2; Clear }' -ForegroundColor Cyan
Write-Host '  - Watch sessions: npx claude-flow@latest hive-mind status' -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         ANALYSIS COMPLETE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Final verdict
Write-Host "`nVERDICT:" -ForegroundColor Yellow
$activeIndicators = 0
if ($claudeProcesses -or $tasklistOutput) { $activeIndicators++ }
if ($walInfo -and $walInfo.Length -gt 0) { $activeIndicators++ }
if ($recentSessions) { $activeIndicators++ }

if ($activeIndicators -ge 2) {
    Write-Host "✓ HIVE-MIND APPEARS TO BE ACTIVE!" -ForegroundColor Green
    Write-Host "  Evidence: $activeIndicators/3 indicators present" -ForegroundColor Cyan
} elseif ($activeIndicators -eq 1) {
    Write-Host "⚠ PARTIAL HIVE-MIND ACTIVITY DETECTED" -ForegroundColor Yellow
    Write-Host "  Only $activeIndicators indicator found - may be single agent mode" -ForegroundColor DarkGray
} else {
    Write-Host "✗ NO HIVE-MIND ACTIVITY DETECTED" -ForegroundColor Red
    Write-Host "  System appears to be idle or in single-agent mode" -ForegroundColor DarkGray
}
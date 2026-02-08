# Live Agent Monitor - Shows real-time agent activity
# Run this WHILE hive-mind is running to see agent activity

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     LIVE HIVE-MIND AGENT MONITOR      ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor DarkGray

$iteration = 0
while ($true) {
    $iteration++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Clear-Host
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     LIVE HIVE-MIND AGENT MONITOR      ║" -ForegroundColor Yellow  
    Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║ Timestamp: $timestamp | Scan #$iteration" -ForegroundColor White
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
    
    # 1. Check Claude processes
    Write-Host "`n🤖 CLAUDE PROCESSES:" -ForegroundColor Green
    $claudeCount = 0
    $processes = Get-Process -ErrorAction SilentlyContinue | Where-Object { 
        $_.ProcessName -like "*claude*" -or 
        $_.ProcessName -like "*node*" -and $_.CommandLine -like "*claude*" 
    }
    
    if ($processes) {
        $claudeCount = $processes.Count
        $processes | ForEach-Object {
            Write-Host "  ✓ PID $($_.Id): $($_.ProcessName) (CPU: $($_.CPU))" -ForegroundColor Cyan
        }
    } else {
        # Fallback to tasklist
        $tasklist = tasklist | findstr /i "claude node"
        if ($tasklist) {
            $claudeCount = ($tasklist | Measure-Object -Line).Lines
            Write-Host "  ✓ Found $claudeCount process(es) via tasklist" -ForegroundColor Cyan
        } else {
            Write-Host "  ✗ No Claude processes detected" -ForegroundColor Red
        }
    }
    
    # 2. Check database activity
    Write-Host "`n💾 DATABASE ACTIVITY:" -ForegroundColor Green
    $walFile = "C:\Claude-Flow\.hive-mind\hive.db-wal"
    if (Test-Path $walFile) {
        $wal = Get-Item $walFile
        $sizeMB = [math]::Round($wal.Length / 1MB, 2)
        $ageSeconds = ((Get-Date) - $wal.LastWriteTime).TotalSeconds
        
        if ($ageSeconds -lt 10) {
            Write-Host "  ✓ ACTIVE! Last write: $([int]$ageSeconds) seconds ago" -ForegroundColor Green
            Write-Host "  ✓ WAL size: $sizeMB MB" -ForegroundColor Cyan
        } elseif ($ageSeconds -lt 60) {
            Write-Host "  ⚠ Recent activity: $([int]$ageSeconds) seconds ago" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ No recent activity (${ageSeconds}s ago)" -ForegroundColor Red
        }
    }
    
    # 3. Check active sessions
    Write-Host "`n📁 ACTIVE SESSIONS:" -ForegroundColor Green
    $sessionFiles = Get-ChildItem "C:\Claude-Flow\.hive-mind\sessions" -Filter "*.txt" -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) }
    
    if ($sessionFiles) {
        Write-Host "  ✓ $($sessionFiles.Count) active session file(s)" -ForegroundColor Cyan
        $latest = $sessionFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "  Latest: $($latest.Name)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ✗ No active sessions" -ForegroundColor Red
    }
    
    # 4. Agent status summary
    Write-Host "`n🐝 HIVE STATUS:" -ForegroundColor Green
    
    if ($claudeCount -gt 1) {
        Write-Host "  ✓✓✓ MULTI-AGENT MODE ACTIVE! ($claudeCount agents)" -ForegroundColor Green -BackgroundColor DarkGreen
    } elseif ($claudeCount -eq 1) {
        Write-Host "  ⚠ SINGLE AGENT MODE (1 agent)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ NO AGENTS RUNNING" -ForegroundColor Red
    }
    
    # Visual agent indicator
    Write-Host "`n🎯 AGENT VISUALIZATION:" -ForegroundColor Magenta
    Write-Host -NoNewline "  "
    for ($i = 1; $i -le 8; $i++) {
        if ($i -le $claudeCount) {
            Write-Host -NoNewline "🤖" -ForegroundColor Green
        } else {
            Write-Host -NoNewline "⭕" -ForegroundColor DarkGray
        }
        Write-Host -NoNewline " "
    }
    Write-Host ""
    
    # Quick status command
    Write-Host "`n📊 Quick Status (npx output):" -ForegroundColor Yellow
    $quickStatus = npx claude-flow@latest hive-mind status 2>&1 | Select-Object -First 5 | Out-String
    if ($quickStatus -like "*active*" -or $quickStatus -like "*swarm*") {
        Write-Host $quickStatus -ForegroundColor Green
    } else {
        Write-Host "  No active swarm detected" -ForegroundColor DarkGray
    }
    
    Start-Sleep -Seconds 3
}
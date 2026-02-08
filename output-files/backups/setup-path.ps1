# Add Claude-Flow to System PATH Permanently
# This script configures PATH for persistent access to hive-mind and hive-swarm

Write-Host "Claude-Flow PATH Configuration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Red
    Write-Host "Adding to User PATH only..." -ForegroundColor Yellow
    
    # Add to User PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    # Check if C:\claude-flow is already in User PATH
    if ($userPath -notlike "*C:\claude-flow*") {
        $newUserPath = "$userPath;C:\claude-flow"
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Host "Added C:\claude-flow to User PATH" -ForegroundColor Green
    } else {
        Write-Host "C:\claude-flow already in User PATH" -ForegroundColor Green
    }
    
} else {
    Write-Host "Running with Administrator privileges" -ForegroundColor Green
    
    # Get current System PATH
    $systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    
    # Check if C:\claude-flow is already in System PATH
    if ($systemPath -notlike "*C:\claude-flow*") {
        # Add C:\claude-flow to System PATH
        $newSystemPath = "$systemPath;C:\claude-flow"
        
        try {
            [Environment]::SetEnvironmentVariable("Path", $newSystemPath, "Machine")
            Write-Host "Successfully added C:\claude-flow to System PATH" -ForegroundColor Green
        } catch {
            Write-Host "Failed to modify System PATH" -ForegroundColor Red
        }
    } else {
        Write-Host "C:\claude-flow already in System PATH" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Verifying files..." -ForegroundColor Cyan

# Test files exist
if (Test-Path "C:\claude-flow\hive-mind.bat") {
    Write-Host "hive-mind.bat exists" -ForegroundColor Green
} else {
    Write-Host "hive-mind.bat not found" -ForegroundColor Red
}

if (Test-Path "C:\claude-flow\hive-swarm.bat") {
    Write-Host "hive-swarm.bat exists" -ForegroundColor Green
} else {
    Write-Host "hive-swarm.bat not found" -ForegroundColor Red
}

if (Test-Path "C:\claude-flow\hive-mind.ps1") {
    Write-Host "hive-mind.ps1 exists" -ForegroundColor Green
} else {
    Write-Host "hive-mind.ps1 not found" -ForegroundColor Red
}

if (Test-Path "C:\claude-flow\hive-swarm.ps1") {
    Write-Host "hive-swarm.ps1 exists" -ForegroundColor Green
} else {
    Write-Host "hive-swarm.ps1 not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "1. Close and reopen terminal for PATH changes to take effect" -ForegroundColor White
Write-Host "2. PATH changes are permanent and survive system restarts" -ForegroundColor White
Write-Host ""
Write-Host "Commands available after terminal restart:" -ForegroundColor Cyan
Write-Host "  hive-mind  - MIND MODE (Queen-led strategic planning)" -ForegroundColor White
Write-Host "  hive-swarm - SWARM MODE (Distributed parallel execution)" -ForegroundColor White
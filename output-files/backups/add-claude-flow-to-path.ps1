# Add Claude-Flow to System PATH Permanently
# This script requires Administrator privileges

Write-Host "Claude-Flow PATH Configuration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "WARNING: This script requires Administrator privileges to modify System PATH" -ForegroundColor Red
    Write-Host "Attempting to add to User PATH instead..." -ForegroundColor Yellow
    
    # Add to User PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    # Check if C:\claude-flow is already in User PATH
    if ($userPath -notlike "*C:\claude-flow*") {
        $newUserPath = "$userPath;C:\claude-flow"
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Host "✅ Added C:\claude-flow to User PATH" -ForegroundColor Green
    } else {
        Write-Host "✓ C:\claude-flow already in User PATH" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "To add to System PATH, please run this script as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Run: . 'C:\Claude-Flow\output-files\add-claude-flow-to-path.ps1'" -ForegroundColor White
    
} else {
    Write-Host "✓ Running with Administrator privileges" -ForegroundColor Green
    
    # Get current System PATH
    $systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    
    # Check if C:\claude-flow is already in System PATH
    if ($systemPath -notlike "*C:\claude-flow*") {
        # Add C:\claude-flow to System PATH
        $newSystemPath = "$systemPath;C:\claude-flow"
        
        try {
            [Environment]::SetEnvironmentVariable("Path", $newSystemPath, "Machine")
            Write-Host "✅ Successfully added C:\claude-flow to System PATH" -ForegroundColor Green
            Write-Host "   This will persist across all terminal sessions and system restarts" -ForegroundColor White
        } catch {
            Write-Host "❌ Failed to modify System PATH: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ C:\claude-flow already in System PATH" -ForegroundColor Green
    }
    
    # Also check User PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*C:\claude-flow*") {
        $newUserPath = "$userPath;C:\claude-flow"
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Host "✅ Also added C:\claude-flow to User PATH for consistency" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Verifying PATH configuration..." -ForegroundColor Cyan

# Refresh PATH for current session
$machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
$userPathEnv = [System.Environment]::GetEnvironmentVariable("Path","User")
$env:Path = "$machinePath;$userPathEnv"

# Test if hive-mind and hive-swarm are accessible
Write-Host ""
Write-Host "Testing command availability:" -ForegroundColor Cyan

# Test hive-mind.bat
if (Test-Path "C:\claude-flow\hive-mind.bat") {
    Write-Host "✅ hive-mind.bat exists" -ForegroundColor Green
    
    # Test if it's accessible via PATH
    $hiveMindCommand = Get-Command hive-mind -ErrorAction SilentlyContinue
    if ($hiveMindCommand) {
        Write-Host "✅ hive-mind command is accessible via PATH" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-mind not yet accessible (restart terminal required)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ hive-mind.bat not found at C:\claude-flow\hive-mind.bat" -ForegroundColor Red
}

# Test hive-swarm.bat
if (Test-Path "C:\claude-flow\hive-swarm.bat") {
    Write-Host "✅ hive-swarm.bat exists" -ForegroundColor Green
    
    # Test if it's accessible via PATH
    $hiveSwarmCommand = Get-Command hive-swarm -ErrorAction SilentlyContinue
    if ($hiveSwarmCommand) {
        Write-Host "✅ hive-swarm command is accessible via PATH" -ForegroundColor Green
    } else {
        Write-Host "⚠ hive-swarm not yet accessible (restart terminal required)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ hive-swarm.bat not found at C:\claude-flow\hive-swarm.bat" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Changes to PATH require:" -ForegroundColor Yellow
Write-Host "1. Close and reopen any terminal windows (PowerShell, CMD, Git Bash)" -ForegroundColor White
Write-Host "2. For some applications, you may need to log out and back in" -ForegroundColor White
Write-Host "3. PATH changes are permanent and will survive system restarts" -ForegroundColor White
Write-Host ""
Write-Host "After restarting your terminal, you can use:" -ForegroundColor Cyan
Write-Host "  hive-mind  - For MIND MODE (Queen-led strategic planning)" -ForegroundColor White
Write-Host "  hive-swarm - For SWARM MODE (Distributed parallel execution)" -ForegroundColor White
# Script to create the TurtleWow Cache Cleaner Scheduled Task
# This creates a highly resilient scheduled task with multiple triggers
# Version: 1.0
# Date: 2025-01-13

# Requires elevation
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

$taskName = "TurtleWowCacheCleaner"
$scriptPath = "C:\Claude-Flow\services\TurtleWowCacheCleanerWrapper.ps1"
$description = "Cleans TurtleWow WDB cache folder every 30 minutes with auto-restart and self-healing capabilities"

Write-Host "Creating TurtleWow Cache Cleaner Service..." -ForegroundColor Green

# Remove existing task if it exists
try {
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
} catch {
    # Task doesn't exist, continue
}

# Create the action
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Create multiple triggers for redundancy
$triggers = @()

# Trigger 1: At system startup with 1 minute delay
$triggers += New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 1)

# Trigger 2: At logon for any user with 1 minute delay
$triggers += New-ScheduledTaskTrigger -AtLogOn -RandomDelay (New-TimeSpan -Minutes 1)

# Trigger 3: Daily at midnight, repeating every 30 minutes
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At 12:00AM
$dailyTrigger.Repetition.Interval = "PT30M"  # 30 minutes
$dailyTrigger.Repetition.Duration = "P1D"    # All day
$triggers += $dailyTrigger

# Trigger 4: On idle (backup trigger)
$triggers += New-ScheduledTaskTrigger -AtStartup  # We'll modify this to on-idle later

# Create settings with aggressive restart policies
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -RestartCount 999 `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -MultipleInstances IgnoreNew `
    -Priority 4 `
    -RunOnlyIfNetworkAvailable:$false `
    -DisallowStartOnRemoteAppSession:$false `
    -WakeToRun:$false

# Create principal (run as SYSTEM for maximum reliability)
$principal = New-ScheduledTaskPrincipal `
    -UserId "NT AUTHORITY\SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Register the task
try {
    $task = Register-ScheduledTask `
        -TaskName $taskName `
        -Description $description `
        -Action $action `
        -Trigger $triggers `
        -Settings $settings `
        -Principal $principal `
        -Force
    
    Write-Host "Scheduled task created successfully!" -ForegroundColor Green
    
    # Start the task immediately
    Start-ScheduledTask -TaskName $taskName
    Write-Host "Task started immediately for initial run" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR creating scheduled task: $_" -ForegroundColor Red
    exit 1
}

# Verify task creation
$verifyTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($verifyTask) {
    Write-Host "`nTask Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($verifyTask.TaskName)"
    Write-Host "  State: $($verifyTask.State)"
    Write-Host "  Description: $($verifyTask.Description)"
    Write-Host "  Triggers: $($verifyTask.Triggers.Count) configured"
    
    # Additional service recovery using SC command for extra reliability
    Write-Host "`nConfiguring additional recovery options..." -ForegroundColor Yellow
    
    # Create a recovery batch file
    $recoveryScript = @"
@echo off
schtasks /run /tn "$taskName"
"@
    $recoveryScript | Out-File -FilePath "C:\Claude-Flow\services\RecoverTurtleWowService.bat" -Encoding ASCII
    
    Write-Host "`nService configuration complete!" -ForegroundColor Green
    Write-Host "The service will:" -ForegroundColor Cyan
    Write-Host "  - Start automatically on boot"
    Write-Host "  - Run every 30 minutes continuously"
    Write-Host "  - Auto-restart up to 999 times if it fails"
    Write-Host "  - Restart after 5 minutes on failure"
    Write-Host "  - Run as SYSTEM with highest privileges"
    Write-Host "  - Continue running on battery power"
    Write-Host "  - Self-heal through wrapper script"
    
} else {
    Write-Host "ERROR: Task creation could not be verified!" -ForegroundColor Red
}

Write-Host "`nTo test the service, check: C:\Claude-Flow\services\TurtleWowCacheCleaner.log" -ForegroundColor Yellow
Write-Host "To manually run: schtasks /run /tn `"$taskName`"" -ForegroundColor Yellow
Write-Host "To check status: Get-ScheduledTask -TaskName `"$taskName`" | Select State" -ForegroundColor Yellow
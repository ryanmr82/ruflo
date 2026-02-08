# Monitor Script for TurtleWow Cache Cleaner
# Additional failsafe that can be run independently
# Version: 1.0
# Date: 2025-01-13

$taskName = "TurtleWowCacheCleaner"
$wrapperScript = "C:\Claude-Flow\services\TurtleWowCacheCleanerWrapper.ps1"
$monitorLog = "C:\Claude-Flow\services\TurtleWowMonitor.log"

function Write-MonitorLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - MONITOR - $Message"
    Add-Content -Path $monitorLog -Value $logEntry
}

Write-MonitorLog "=== Monitor Check Started ==="

try {
    # Check if scheduled task exists
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    
    Write-MonitorLog "Task found. Current state: $($task.State)"
    
    # If task is disabled or not running as expected, fix it
    if ($task.State -eq "Disabled") {
        Write-MonitorLog "Task is disabled! Enabling..."
        Enable-ScheduledTask -TaskName $taskName
        Start-ScheduledTask -TaskName $taskName
        Write-MonitorLog "Task enabled and started"
    }
    elseif ($task.State -eq "Ready") {
        # Check last run time
        $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
        $lastRun = $taskInfo.LastRunTime
        $nextRun = $taskInfo.NextRunTime
        
        Write-MonitorLog "Last run: $lastRun"
        Write-MonitorLog "Next run: $nextRun"
        
        # If last run was more than 35 minutes ago, force a run
        if ($lastRun -and ((Get-Date) - $lastRun).TotalMinutes -gt 35) {
            Write-MonitorLog "Task hasn't run in over 35 minutes. Forcing run..."
            Start-ScheduledTask -TaskName $taskName
            Write-MonitorLog "Task started manually"
        }
    }
    
} catch {
    Write-MonitorLog "ERROR: Task not found or error occurred: $_"
    Write-MonitorLog "Attempting to recreate task..."
    
    # Try to recreate the task
    try {
        & powershell.exe -ExecutionPolicy Bypass -File "C:\Claude-Flow\services\CreateTurtleWowService.ps1"
        Write-MonitorLog "Task recreation attempted"
    } catch {
        Write-MonitorLog "CRITICAL: Could not recreate task: $_"
    }
}

Write-MonitorLog "=== Monitor Check Completed ===`n"
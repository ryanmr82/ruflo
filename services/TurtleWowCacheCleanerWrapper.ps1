# TurtleWow Cache Cleaner Wrapper with Self-Healing
# This wrapper ensures the main script runs and handles failures
# Version: 1.0
# Date: 2025-01-13

$ErrorActionPreference = "Stop"
$mainScript = "C:\Claude-Flow\services\TurtleWowCacheCleaner.ps1"
$wrapperLog = "C:\Claude-Flow\services\TurtleWowCacheCleanerWrapper.log"
$maxRetries = 3
$retryDelay = 30 # seconds

function Write-WrapperLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - WRAPPER - $Message"
    Add-Content -Path $wrapperLog -Value $logEntry
}

Write-WrapperLog "=== Wrapper Started ==="

# Self-healing loop
$attempt = 0
$success = $false

while ($attempt -lt $maxRetries -and -not $success) {
    $attempt++
    
    try {
        Write-WrapperLog "Attempt $attempt of $maxRetries - Executing main script..."
        
        # Check if main script exists
        if (-not (Test-Path $mainScript)) {
            throw "Main script not found at: $mainScript"
        }
        
        # Execute main script
        & powershell.exe -ExecutionPolicy Bypass -File $mainScript
        
        # If we get here, execution was successful
        $success = $true
        Write-WrapperLog "Main script executed successfully"
        
    }
    catch {
        Write-WrapperLog "ERROR on attempt $attempt : $_"
        
        if ($attempt -lt $maxRetries) {
            Write-WrapperLog "Waiting $retryDelay seconds before retry..."
            Start-Sleep -Seconds $retryDelay
        }
    }
}

if (-not $success) {
    Write-WrapperLog "CRITICAL: All attempts failed after $maxRetries tries"
    
    # Try to ensure scheduled task is still configured correctly
    try {
        $taskName = "TurtleWowCacheCleaner"
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($task) {
            Write-WrapperLog "Scheduled task exists, attempting to verify settings..."
            # Task exists, log its state
            Write-WrapperLog "Task State: $($task.State)"
        } else {
            Write-WrapperLog "Scheduled task not found - may need recreation"
        }
    }
    catch {
        Write-WrapperLog "Could not check scheduled task status: $_"
    }
}

Write-WrapperLog "=== Wrapper Finished ==="
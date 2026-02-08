# TurtleWow WDB Cache Cleaner Service Script
# This script cleans the WDB cache folder every 30 minutes
# Version: 1.0
# Date: 2025-01-13

# Configuration
$targetFolder = "C:\turtlewow\wdb"
$logFile = "C:\Claude-Flow\services\TurtleWowCacheCleaner.log"
$maxLogSize = 10MB

# Function to write to log
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - $Message"
    
    # Check log size and rotate if needed
    if (Test-Path $logFile) {
        $logSize = (Get-Item $logFile).Length
        if ($logSize -gt $maxLogSize) {
            # Archive old log
            $archiveFile = $logFile.Replace(".log", "_$(Get-Date -Format 'yyyyMMdd_HHmmss').log")
            Move-Item $logFile $archiveFile -Force
            # Keep only last 3 archives
            Get-ChildItem (Split-Path $logFile) -Filter "TurtleWowCacheCleaner_*.log" | 
                Sort-Object CreationTime -Descending | 
                Select-Object -Skip 3 | 
                Remove-Item -Force
        }
    }
    
    Add-Content -Path $logFile -Value $logEntry
}

# Main cleaning function
function Clear-WDBCache {
    try {
        Write-Log "Starting WDB cache cleaning process..."
        
        # Check if folder exists
        if (-not (Test-Path $targetFolder)) {
            Write-Log "Target folder does not exist: $targetFolder"
            return
        }
        
        # Get items in folder
        $items = Get-ChildItem -Path $targetFolder -Force -ErrorAction SilentlyContinue
        
        if ($items.Count -eq 0) {
            Write-Log "No items found in cache folder"
            return
        }
        
        Write-Log "Found $($items.Count) items to delete"
        
        # Delete each item
        $deletedCount = 0
        $failedCount = 0
        
        foreach ($item in $items) {
            try {
                # Force delete with all attributes cleared
                if ($item.PSIsContainer) {
                    Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
                } else {
                    # Clear readonly/hidden/system attributes if present
                    $item.Attributes = 'Normal'
                    Remove-Item -Path $item.FullName -Force -ErrorAction Stop
                }
                $deletedCount++
                Write-Log "Deleted: $($item.Name)"
            }
            catch {
                $failedCount++
                Write-Log "Failed to delete: $($item.Name) - Error: $_"
            }
        }
        
        Write-Log "Cleaning complete. Deleted: $deletedCount, Failed: $failedCount"
        
    }
    catch {
        Write-Log "ERROR in Clear-WDBCache: $_"
    }
}

# Main execution
Write-Log "=== TurtleWow Cache Cleaner Started ==="
Clear-WDBCache
Write-Log "=== TurtleWow Cache Cleaner Finished ==="
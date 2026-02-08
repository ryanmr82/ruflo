# TurtleWow Cache Cleaner Service

## Overview
This is a lightweight, resilient Windows service that automatically cleans the TurtleWow WDB cache folder every 30 minutes. The service is designed to run 24/7 with multiple self-healing and auto-restart mechanisms.

## Target Folder
- **Location**: `C:\turtlewow\wdb`
- **Purpose**: Cleans WDB cache files that accumulate during TurtleWow gameplay

## Components

### 1. Main Script (`TurtleWowCacheCleaner.ps1`)
- Core cleaning logic
- Safely deletes all files in the WDB folder
- Comprehensive logging with automatic log rotation
- Handles locked files gracefully

### 2. Wrapper Script (`TurtleWowCacheCleanerWrapper.ps1`)
- Self-healing layer with retry logic
- Attempts up to 3 retries on failure
- Logs all attempts and errors
- Verifies scheduled task health

### 3. Monitor Script (`MonitorTurtleWowService.ps1`)
- Additional failsafe mechanism
- Can be run independently to check service health
- Re-enables task if disabled
- Forces run if task hasn't executed in 35+ minutes

### 4. Installation Script (`CreateTurtleWowService.ps1`)
- Creates scheduled task with multiple triggers
- Configures auto-restart (999 attempts)
- Sets up to run as SYSTEM for maximum reliability
- Includes boot-time and logon triggers

## Features

### Reliability
- **Auto-start on boot**: Starts 1 minute after system startup
- **Multiple triggers**: Boot, logon, and 30-minute intervals
- **Self-healing**: Wrapper script with retry logic
- **Auto-restart**: Up to 999 restart attempts on failure
- **Restart interval**: 5 minutes between restart attempts
- **Run as SYSTEM**: Maximum privileges and reliability

### Performance
- **Lightweight**: Minimal resource usage
- **Quick execution**: Typically completes in seconds
- **Non-blocking**: Won't interfere with system operations
- **Battery-friendly**: Continues on battery power

### Logging
- **Main log**: `TurtleWowCacheCleaner.log`
- **Wrapper log**: `TurtleWowCacheCleanerWrapper.log`
- **Monitor log**: `TurtleWowMonitor.log`
- **Auto-rotation**: Logs rotate at 10MB
- **Archive retention**: Keeps last 3 archives

## Installation

### Method 1: Batch File (Recommended)
1. Run `InstallService.bat` as Administrator
2. Accept the UAC prompt when it appears
3. Service will start immediately after installation

### Method 2: PowerShell
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File "C:\Claude-Flow\services\CreateTurtleWowService.ps1"
```

## Management Commands

### Check Status
```powershell
Get-ScheduledTask -TaskName "TurtleWowCacheCleaner" | Select State
```

### Manual Run
```cmd
schtasks /run /tn "TurtleWowCacheCleaner"
```

### Stop Service
```cmd
schtasks /end /tn "TurtleWowCacheCleaner"
```

### View Logs
```powershell
Get-Content "C:\Claude-Flow\services\TurtleWowCacheCleaner.log" -Tail 50
```

### Monitor Health
```powershell
& "C:\Claude-Flow\services\MonitorTurtleWowService.ps1"
```

## Uninstallation

### Method 1: Batch File
Run `UninstallService.bat` as Administrator

### Method 2: Manual
```cmd
schtasks /delete /tn "TurtleWowCacheCleaner" /f
```

## Troubleshooting

### Service Not Running
1. Check if task exists: `Get-ScheduledTask -TaskName "TurtleWowCacheCleaner"`
2. Check logs in `C:\Claude-Flow\services\`
3. Run monitor script to auto-fix issues
4. Re-run installation if needed

### Files Not Being Deleted
1. Check if WoW client is running (may lock files)
2. Review main log for specific errors
3. Verify folder path exists: `C:\turtlewow\wdb`

### High Resource Usage
- This should not occur as the script is lightweight
- Check wrapper log for excessive retries
- Ensure no infinite loops in logs

## Recovery Procedures

### If Service Fails
1. The wrapper will retry 3 times automatically
2. Scheduled task will restart after 5 minutes
3. Monitor script can be run to force recovery
4. Re-installation will fix most issues

### Manual Recovery
```powershell
# Force restart
schtasks /end /tn "TurtleWowCacheCleaner"
schtasks /run /tn "TurtleWowCacheCleaner"

# Re-enable if disabled
Enable-ScheduledTask -TaskName "TurtleWowCacheCleaner"
```

## Safety Features
- Never deletes outside target folder
- Handles locked files gracefully
- Comprehensive error logging
- Non-destructive to system files
- Runs in isolated context

## Version History
- **v1.0** (2025-01-13): Initial release with full self-healing capabilities
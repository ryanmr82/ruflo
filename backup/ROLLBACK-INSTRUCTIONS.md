# Rollback Instructions for Hive-Mind-Advanced Fix

## What Was Changed
Modified `C:\Claude-Flow\Hive-Mind-Advanced.ps1` to automatically clean up old hive-mind session prompt files before launching Claude Code. This prevents context contamination from auto-generated swarm templates.

## Backup Location
Original file backed up to: `C:\Claude-Flow\backup\Hive-Mind-Advanced-backup-*.ps1`

## If You Need to Rollback

### Quick Rollback (PowerShell):
```powershell
# Find the most recent backup
$backup = Get-ChildItem "C:\Claude-Flow\backup\Hive-Mind-Advanced-backup-*.ps1" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Restore it
Copy-Item $backup.FullName "C:\Claude-Flow\Hive-Mind-Advanced.ps1" -Force

Write-Host "Rollback complete! Original file restored." -ForegroundColor Green
```

### Manual Rollback:
1. Open `C:\Claude-Flow\backup\`
2. Find the backup file: `Hive-Mind-Advanced-backup-YYYYMMDD-HHMMSS.ps1`
3. Copy it to `C:\Claude-Flow\Hive-Mind-Advanced.ps1`

## Changes Made (Lines 248-274)
**Added:**
- Automatic cleanup of `hive-mind-prompt-*.txt` files from:
  - `$Workspace\.hive-mind\sessions\`
  - `$ClaudeFlowDir\.hive-mind\sessions\`
- Status messages showing cleanup progress
- Removed the conditional check for hiveMindPromptFile (no longer needed)

**Why This Was Safe:**
- These files are auto-generated templates, not conversation history
- They're recreated every time you run the command
- No valuable data is lost
- Prevents Claude Code from loading conflicting context

## To Verify the Fix is Working
After running `hive-mind-advanced`, you should see:
```
Cleaning old session prompts...
Removed X old prompt file(s)
Context cleanup complete

EXECUTING HIVE MIND WITH CLEAN CONTEXT...
```

And Claude should now only load `hive_prompt.txt` without the swarm coordinator instructions.

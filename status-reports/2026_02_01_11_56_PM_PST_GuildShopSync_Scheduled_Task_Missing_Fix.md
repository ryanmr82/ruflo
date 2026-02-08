# GuildShopSync - Scheduled Task Missing + SetupTask.ps1 Bug Fix

**Date:** February 1, 2026, 11:56 PM PST
**Session Topic:** Price scanner not syncing, not visible in tray, scheduled task completely missing

---

## Summary

The GuildShopSync price scanner service was not running because the Windows Scheduled Task "GuildShopSync" did not exist. The task was never successfully created by any installer version because `SetupTask.ps1` had a bug: it used `$env:USERNAME` (which resolves to `rr218400`) instead of the full Windows identity, causing `Register-ScheduledTask` to fail silently. The service only ever worked because the installer launches it directly after install -- but once the PC reboots, it never comes back.

---

## Root Cause Analysis

### The Bug in SetupTask.ps1 (Line 27)

**Before (BROKEN):**
```powershell
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Limited -LogonType Interactive
```
- `$env:USERNAME` resolves to `rr218400` (short name)
- `Register-ScheduledTask` with this value throws "The parameter is incorrect" or "Access denied"
- The script always printed "success" regardless (no error handling)

**After (FIXED):**
```powershell
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -RunLevel Limited -LogonType Interactive
```
- Uses full identity (e.g., `DOMAIN\User` format)
- Added try/catch with `schtasks` fallback
- Added verification that the task actually exists before reporting success

### Timeline of Failure

| Date | Event |
|------|-------|
| Jan 27 20:19 | v2.8/2.9 installed. Installer launched SyncService.ps1 directly. SetupTask.ps1 failed silently. |
| Jan 27 20:26 | First successful upload (service running from installer's direct launch) |
| Jan 29 03:10 | Upload worked (service still running, PC never rebooted) |
| Jan 30 00:53 | Last successful upload |
| Jan 30 → Feb 1 | PC rebooted or service crashed. **No scheduled task = no restart.** |
| Feb 1 21:48 | User did a price scan. `triggerUpload = true` set but nobody to process it. |
| Feb 1 23:55 | This session: task manually created with admin UAC, service launched, upload processed. |

### Why Previous Fixes Didn't Solve This

- **v2.6**: Focused on path resolution (Registry vs env var). SetupTask.ps1 didn't exist yet.
- **v2.7**: Used `schtasks /create` + `Set-ScheduledTask` two-step approach. `Set-ScheduledTask` got "Access Denied."
- **v2.8**: Introduced `SetupTask.ps1` with `Register-ScheduledTask`. Used `$env:USERNAME` -- silently failed.
- **v2.9**: Same bug inherited from v2.8.

**The fundamental issue was never the task settings -- it was that the task was never created in the first place.**

---

## What Was Done

### 1. Diagnosis
- Confirmed scheduled task "GuildShopSync" did not exist
- Confirmed no SyncService.ps1 process running
- Confirmed no log directory (service never ran since install)
- Confirmed SavedVariables had `triggerUpload = true` (pending upload from 21:48)
- Confirmed server API was functional (last upload was 3:13 PM from earlier session)

### 2. Immediate Fixes
- Created scheduled task via admin-elevated PowerShell (UAC prompt)
- Launched SyncService.ps1 manually
- Touched SavedVariables file to trigger pending upload
- Verified 66 prices uploaded successfully to website

### 3. Permanent Fix (SetupTask.ps1)
- Changed `$env:USERNAME` to `[System.Security.Principal.WindowsIdentity]::GetCurrent().Name`
- Added try/catch with `schtasks /create` fallback
- Added verification step that checks if task actually exists before reporting success
- Updated server-side source file

---

## Files Modified

### Linux Server (132.226.72.121)
| File | Change |
|------|--------|
| `/home/opc/GuildShopSync/source/SetupTask.ps1` | Bug fix: full user identity, error handling, fallback, verification |

### Local Machine
| File | Change |
|------|--------|
| Windows Task Scheduler: `GuildShopSync` | **CREATED** - Logon trigger, 30s delay, battery OK, restart 999x |
| `%LOCALAPPDATA%\GuildShopSync\service.log` | New entries from this session |
| `C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\GuildShopSync.lua` | `triggerUpload` changed from true to false (upload processed) |

### Temp Files Created (auto-cleanup)
| File | Purpose |
|------|---------|
| `%TEMP%\create_task_admin.ps1` | Admin-elevated task creation |
| `%TEMP%\fix_guildsync.ps1` | Initial fix attempts |
| `%TEMP%\launch_sync.ps1` | Service launch |
| `%TEMP%\trigger_upload.ps1` | File touch to trigger upload |
| `%TEMP%\check_*.ps1` | Diagnostic scripts |
| `%TEMP%\SetupTask_fixed.ps1` | Fixed SetupTask source (uploaded to server) |

---

## Verification

- [x] Scheduled task exists: `GuildShopSync` - State: Ready
- [x] Task settings: Battery OK, RestartCount 999, ExecutionTimeLimit 0, StartWhenAvailable
- [x] SyncService.ps1 running: PID 50192
- [x] Service log shows: "Uploaded 66 prices successfully" at 23:56:22
- [x] Website updated: GFPP ahPrice 17698, updated 2026-02-02T07:56:22Z
- [x] SavedVariables: `triggerUpload = false`
- [x] Server SetupTask.ps1 updated with bug fix

---

## Scheduled Task XML (Verified Working)

```xml
<Task version="1.3">
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-21-2596418657-3148283732-196079588-1001</UserId>
      <LogonType>InteractiveToken</LogonType>
    </Principal>
  </Principals>
  <Settings>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <RestartOnFailure>
      <Count>999</Count>
      <Interval>PT1M</Interval>
    </RestartOnFailure>
    <StartWhenAvailable>true</StartWhenAvailable>
  </Settings>
  <Triggers>
    <LogonTrigger><Delay>PT30S</Delay></LogonTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Program Files (x86)\GuildShopSync\SyncService.ps1"</Arguments>
    </Exec>
  </Actions>
</Task>
```

---

## Lessons Learned

1. **`$env:USERNAME` is unreliable for task registration** -- Use `[System.Security.Principal.WindowsIdentity]::GetCurrent().Name` for the full `DOMAIN\User` format
2. **Always verify the result** -- `Write-Host 'success'` without checking the actual outcome is a silent failure factory
3. **The installer's `[Run]` section masks the bug** -- The service starts because the installer launches it directly, giving the illusion that the scheduled task works. The bug only manifests after reboot.
4. **Multiple fallback methods needed** -- `Register-ScheduledTask` can fail for various reasons; having a `schtasks /create` fallback covers more edge cases.
5. **Task creation requires admin** -- The installer runs elevated (Inno Setup), but if SetupTask.ps1 fails, there's no non-admin way to create the task later.

---

## Things That Didn't Work

1. **`Register-ScheduledTask` with `$env:USERNAME`** -- Returns "The parameter is incorrect" for UserId `rr218400`
2. **`Register-ScheduledTask` without admin** -- Returns "Access is denied" (0x80070005)
3. **`schtasks /create` with spaces in path** -- PowerShell splits the `/tr` argument at spaces in "Program Files (x86)"
4. **XML task import without admin** -- Also returns "Access is denied"

---

## Remaining Action Items

- [x] **Recompile installer with fixed SetupTask.ps1** -- v3.0 compiled with Inno Setup 6.7.0 and uploaded to server (Feb 2, 2026)
- [ ] **Consider adding a self-repair mechanism** -- SyncService.ps1 could check on startup if the scheduled task exists and offer to create it (via UAC prompt if needed).
- [x] **Version bump** -- All files bumped to v3.0, installer compiled and deployed

## v3.0 Build & Deployment (Feb 2, 2026)

### Version Bumps Applied
| File | Change |
|------|--------|
| `GuildShopSync.iss` | `#define MyAppVersion "3.0"` |
| `SyncService.ps1` | Header v3.0, tray menu "GuildShopSync v3.0" |
| `README.txt` | Title v3.0, added "What's New in v3.0" section |
| `GuildShopSync.lua` | Comment v3.0, loaded message v3.0 |
| `GuildShopSync.toc` | `## Version: 3.0` |
| `SetupTask.ps1` | Already fixed (no version reference in file) |

### Files Deployed to Server
| File | Path |
|------|------|
| Installer | `/home/opc/tbc-website/static/GuildShopSync-Setup-v3.0.exe` (2.1MB) |
| Version JSON | `/home/opc/tbc-website/static/scanner-version.json` (updated to v3.0) |
| All source files | `/home/opc/GuildShopSync/source/*` |
| Installer script | `/home/opc/GuildShopSync/GuildShopSync.iss` |

### Verification
- [x] `scanner-version.json` shows version 3.0
- [x] Public download URL returns HTTP 200: `https://tbcguild.duckdns.org/GuildShopSync-Setup-v3.0.exe`
- [x] Website service restarted (`tbc-website.service` active and running)
- [x] Consumes page dynamically reads version from JSON (no code changes needed)

---

## Rollback

If the scheduled task causes issues:
```powershell
# Remove the task
Unregister-ScheduledTask -TaskName 'GuildShopSync' -Confirm:$false

# Kill the service
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'SyncService' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

---

**Status:** COMPLETE - Service running, prices synced, scheduled task created, server-side bug fixed, v3.0 compiled and deployed to website

# GuildShopSync v2.8 - Installer Fix & System Tray Icon

**Date:** January 27, 2026 3:45 AM PST
**Session Topic:** Fix GuildShopSync installer for reboot survival + add system tray icon

---

## Summary

Fixed the GuildShopSync installer (v2.7 -> v2.8) to properly create the Windows scheduled task with correct settings. Added a system tray icon to SyncService.ps1 so users can see the service status.

---

## What Was Accomplished

### 1. Root Cause of v2.7 Failure

The v2.7 installer used a two-step approach:
1. `schtasks /create` - Creates task with default (bad) settings
2. `powershell.exe Set-ScheduledTask` - Tries to fix battery settings

**Problem:** `Set-ScheduledTask` got **Access Denied** even though the installer runs as admin. The `schtasks` command created the task but with wrong default settings (battery restrictions, no restart, 72-hour time limit). The PowerShell fix silently failed.

After a reboot/wake-from-sleep, the task ran but the process was killed (exit code -1073741510 / STATUS_CONTROL_C_EXIT) and never restarted because RestartCount was 0.

### 2. Installer Fix (v2.8)

Replaced the two-step approach with a dedicated `SetupTask.ps1` script:
- Uses `Register-ScheduledTask` (not `schtasks`) for full control over ALL settings
- Called from the installer's `[Run]` section under admin elevation
- Sets ALL settings at creation time in one atomic call:
  - AllowStartIfOnBatteries
  - DontStopIfGoingOnBatteries
  - StartWhenAvailable
  - RestartInterval: 1 minute
  - RestartCount: 999
  - ExecutionTimeLimit: 0 (unlimited)

### 3. System Tray Icon (New Feature)

SyncService.ps1 now shows a persistent green circle icon in the system tray:
- **Right-click context menu:** Version, status, last upload time, upload count, "Open Log Folder", "Exit (restarts in ~1 min)"
- **Double-click:** Shows status balloon popup
- **Icon visible = service running** - easy to tell at a glance
- Uses `Application.Run()` message loop instead of `while(true) { sleep }` for responsive UI

### 4. Other Improvements

- **Logging:** Service writes to `%LOCALAPPDATA%\GuildShopSync\service.log`
- **Recursive watcher:** Single FileSystemWatcher with `IncludeSubdirectories` instead of per-file watchers
- **Clean uninstall:** Uses `Unregister-ScheduledTask` instead of `schtasks /delete`

---

## Files Modified

### Linux Server (132.226.72.121)

| File | Change |
|------|--------|
| `/home/opc/GuildShopSync/GuildShopSync.iss` | v2.7 -> v2.8, replaced schtasks with SetupTask.ps1 |
| `/home/opc/GuildShopSync/source/SyncService.ps1` | v2.8 with tray icon, logging, recursive watcher |
| `/home/opc/GuildShopSync/source/SetupTask.ps1` | **NEW** - Task creation script |
| `/home/opc/GuildShopSync/source/README.txt` | Updated to v2.8 with tray icon docs |
| `/home/opc/tbc-website/static/GuildShopSync-Setup-v2.8.exe` | **NEW** - Compiled installer |
| `/home/opc/tbc-website/static/GuildShopSync-v2.8.zip` | **NEW** - Manual install package |
| `/home/opc/tbc-website/islands/ConsumesShop.tsx` | Download link updated to v2.8 |

### Local Machine

| File | Change |
|------|--------|
| `C:\Program Files (x86)\GuildShopSync\SyncService.ps1` | Updated to v2.8 |
| `C:\Program Files (x86)\GuildShopSync\SetupTask.ps1` | **NEW** - Copied from build |
| `C:\Program Files (x86)\GuildShopSync\README.txt` | Updated to v2.8 |
| Windows Task Scheduler: GuildShopSync | Recreated with correct settings |
| Registry: `HKCU\Software\GuildShopSync\Version` | Updated to 2.8 |

---

## Technical Details

### Before (v2.7 .iss)
```
; Two-step - BROKEN
Filename: "schtasks"; Parameters: "/create /tn ""GuildShopSync"" ... /sc onlogon /delay 0000:30 ..."
Filename: "powershell.exe"; Parameters: "... Set-ScheduledTask ... DisallowStartIfOnBatteries = $false ..."
```

### After (v2.8 .iss)
```
; Single step via SetupTask.ps1 - WORKS
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\SetupTask.ps1"" -ServicePath ""{app}\SyncService.ps1"""
```

### SetupTask.ps1 (runs under installer's admin elevation)
```powershell
Register-ScheduledTask -TaskName 'GuildShopSync'
    -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
```

---

## Verification

- [x] Download link works: HTTP 200 for GuildShopSync-Setup-v2.8.exe
- [x] Website shows "Download Price Scanner v2.8"
- [x] Local task has correct settings (battery=off, restart=999, timelimit=0)
- [x] SyncService running with tray icon visible
- [x] Installer compiled successfully with Inno Setup 6.7.0

---

## Rollback

If issues arise, revert to v2.7:
1. Change download link back to v2.7 in ConsumesShop.tsx
2. Restart tbc-website service
3. v2.7 files still on server

---

**Status:** COMPLETE

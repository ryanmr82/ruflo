# GuildShopSync v2.6 - Registry Path Fix

## Task Summary
Fixed the GuildShopSync installer to properly sync prices to the website by using Registry-based path resolution instead of unreliable environment variables.

## Date
January 20, 2026, 4:43 PM PST

## Server
torreyserver (132.226.72.121) - TBC Guild Website

---

## Problem Identified

### Root Cause Analysis
The installer version (v2.5) was not syncing prices to the website for other users while the original manual solution worked. Investigation revealed:

**Original Working Solution:**
```
Location: C:\Users\ryanr\AppData\Roaming\...\Startup\GuildShopSync.vbs
    → Launches: C:\Claude-Flow\output-files\consumes-bot\GuildShopSync\AutoSync.ps1

Key code (line 6): $WatchPath = "C:\turtlewow\WTF\Account"  ← HARDCODED - ALWAYS WORKS
```

**Broken Installer Version (v2.5):**
```
Location: C:\Program Files\GuildShopSync\SyncService.ps1

Key code (line 5): $WatchPath = $env:GUILDSHOPSYNC_WOWPATH + "\WTF\Account"  ← USES ENV VAR
```

**Why It Failed:**
1. `setx` command only sets environment variables for FUTURE processes
2. Scheduled tasks don't reliably inherit user environment variables
3. If `$env:GUILDSHOPSYNC_WOWPATH` is NULL → path becomes `"\WTF\Account"` (invalid)
4. Script silently fails to find any files to watch

---

## Solution Applied (v2.6)

### 1. SyncService.ps1 - Complete Rewrite of Path Resolution

**New path resolution order:**
1. Read from Registry: `HKCU\Software\GuildShopSync\WoWPath` (set by installer)
2. Fallback to environment variable (legacy support)
3. Fallback to common TurtleWoW paths (C:\turtlewow, D:\turtlewow, etc.)
4. Exit with error log if no valid path found

**Added Features:**
- Error logging to `%LOCALAPPDATA%\GuildShopSync\error.log`
- Path validation before starting file watcher
- Support for 7 common installation paths

### 2. GuildShopSync.iss - Installer Improvements

**Cleanup of Prior Versions:**
- Detects and silently uninstalls previous installer versions
- Kills any running PowerShell sync processes
- Removes old scheduled tasks before creating new one
- Cleans up old VBS startup scripts from manual installations
- Removes legacy environment variable (GUILDSHOPSYNC_WOWPATH)

**Version Detection:**
- Now reads from Registry for previous install path
- Shows previous version number in upgrade dialog

**Uninstall Improvements:**
- Removes error log folder
- Cleans up environment variables

### 3. Version Bumped to 2.6

---

## Files Modified

### Local Windows
| File | Change |
|------|--------|
| `C:\Claude-Flow\output-files\consumes-bot\GuildShopSync-Installer\source\SyncService.ps1` | Complete rewrite of path resolution |
| `C:\Claude-Flow\output-files\consumes-bot\GuildShopSync-Installer\GuildShopSync.iss` | Added cleanup, version bump to 2.6 |
| `C:\Claude-Flow\output-files\consumes-bot\GuildShopSync-Installer\source\README.txt` | Version bump |

### Linux Server
| File | Change |
|------|--------|
| `/home/opc/GuildShopSync/source/SyncService.ps1` | Updated via SCP |
| `/home/opc/GuildShopSync/GuildShopSync.iss` | Updated via SCP |
| `/home/opc/GuildShopSync/source/README.txt` | Updated via SCP |
| `/home/opc/tbc-website/static/GuildShopSync-v2.6.zip` | New distribution zip |

### Git Repository
- Commit: `v2.6: Fix sync path resolution - use Registry instead of env var`
- Pushed to: `https://github.com/ryanmr82/guild-shop-sync.git`

---

## Backup Created

**Location:** `C:\Claude-Flow\guildsyncbackupworkinglocal\`

**Contents:**
- `GuildShopSync\` - Original working sync scripts
  - `AutoSync.ps1`
  - `GuildShopSync.ps1`
  - `Install.bat`
  - `Setup-AutoSync.bat`
  - `SyncNow.bat`
  - `DoSetup.ps1`
  - `RunHidden.vbs`
  - `lastsync.txt`
  - `sync.log`
- `GuildShopSync.vbs` - Original startup VBS

---

## Local Environment Cleaned

For clean testing of new installer:
1. Killed running sync process (PID 18048)
2. Removed `GuildShopSync.vbs` from Windows Startup folder
3. Old solution backed up to `guildsyncbackupworkinglocal`

---

## To Build the Installer

Inno Setup is NOT installed on this machine. To compile the .exe installer:

**Option 1: Install Inno Setup**
1. Download from: https://jrsoftware.org/isdl.php
2. Install Inno Setup 6.x
3. Run: `powershell -File "C:\Claude-Flow\output-files\consumes-bot\GuildShopSync-Installer\compile.ps1"`
4. Installer will be created at: `...\GuildShopSync-Installer\output\GuildShopSync-Setup-v2.6.exe`

**Option 2: Manual Distribution**
- Use the zip file: `https://tbcguild.duckdns.org/static/GuildShopSync-v2.6.zip`
- Users manually copy addon to WoW and run SyncService.ps1

---

## Files Available on Server

| File | Size | Description |
|------|------|-------------|
| `GuildShopSync-Setup-v2.6.exe` | 2.1 MB | **NEW** Fixed installer |
| `GuildShopSync-v2.6.zip` | 6.7 KB | Fixed version (manual install zip) |
| `GuildShopSync-v2.0.zip` - `v2.4.zip` | Various | Legacy versions (can be removed) |

**Old v2.5 files have been removed from server.**

---

## Testing Instructions

1. Run the new installer (once compiled)
2. Select TurtleWoW folder when prompted
3. Open WoW, go to Auction House
4. Click "Sync Prices" button
5. Click "Reload UI & Sync" when prompted
6. Verify notification appears: "Uploaded X prices to guild website!"
7. Check website: https://tbcguild.duckdns.org/consumes

---

## Rollback Procedure

If issues arise, restore original working solution:
1. Copy `C:\Claude-Flow\guildsyncbackupworkinglocal\GuildShopSync.vbs` to:
   `C:\Users\ryanr\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`
2. Reboot or double-click the VBS to start the sync service

---

## Technical Details

### New SyncService.ps1 Path Resolution Function

```powershell
function Get-WoWPath {
    # 1. Try Registry first (set by installer)
    try {
        $regPath = Get-ItemProperty -Path "HKCU:\Software\GuildShopSync" -Name "WoWPath"
        if ($regPath -and (Test-Path $regPath.WoWPath)) {
            return $regPath.WoWPath
        }
    } catch {}

    # 2. Try environment variable (legacy)
    if ($env:GUILDSHOPSYNC_WOWPATH -and (Test-Path $env:GUILDSHOPSYNC_WOWPATH)) {
        return $env:GUILDSHOPSYNC_WOWPATH
    }

    # 3. Try common paths
    $commonPaths = @("C:\turtlewow", "D:\turtlewow", ...)
    foreach ($path in $commonPaths) {
        if (Test-Path "$path\WoW.exe") { return $path }
    }

    return $null
}
```

---

## Lessons Learned

1. **Environment variables via `setx` are unreliable** - They only affect future processes, not current ones
2. **Scheduled tasks have their own environment** - Don't assume user environment variables are inherited
3. **Always validate paths before use** - Silent failures are hard to debug
4. **Registry is more reliable** - Direct registry reads work consistently across processes
5. **Provide fallback paths** - Common installation locations as safety net

---

## Status
**COMPLETE** - v2.6 installer compiled and deployed to server

### Installer Build Details
- Inno Setup 6.7.0 installed to `C:\Users\ryanr\AppData\Local\Programs\Inno Setup 6\`
- Compiled: `C:\Claude-Flow\output-files\consumes-bot\GuildShopSync-Installer\output\GuildShopSync-Setup-v2.6.exe`
- Uploaded to server: `/home/opc/tbc-website/static/GuildShopSync-Setup-v2.6.exe` (2.1 MB)
- Old v2.5 installer and zip removed from server

---

## Related Documentation
- Previous: `2026_01_16_11_14_PM_PST_Guild_Consume_Shop_Design_Document.md`
- Git Repo: `https://github.com/ryanmr82/guild-shop-sync`

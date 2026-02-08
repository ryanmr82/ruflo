# GuildShopSync Installer v2.7 Fix

**Date:** January 23, 2026 12:25 PM PST
**Session Topic:** GuildShopSync Price Scanner - Installer Fix for Reboot Persistence

---

## Summary

Fixed the GuildShopSync installer so that the price upload service survives PC reboots. Updated from v2.6 to v2.7 with fixes for scheduled task configuration.

---

## What Was Accomplished

### 1. Root Cause Identified
- The scheduled task **existed and ran** at PC boot (6:17 AM)
- **Failed with error code -1073741510** (process terminated)
- Two issues found:
  - Task ran immediately at logon (before Windows settled)
  - Task had "No Start On Batteries" restriction

### 2. Installer Script Updated (GuildShopSync.iss)
- **Version bumped**: 2.6 → 2.7
- **Added 30-second delay**: `/delay 0000:30` to scheduled task creation
- **Added battery configuration**: PowerShell command to disable battery restrictions:
  ```powershell
  $settings.DisallowStartIfOnBatteries = $false
  $settings.StopIfGoingOnBatteries = $false
  ```

### 3. Files Updated
- `/home/opc/GuildShopSync/GuildShopSync.iss` - Installer script
- `/home/opc/GuildShopSync/source/README.txt` - Version to v2.7
- `/home/opc/GuildShopSync/source/SyncService.ps1` - Version comment to v2.7

### 4. Installer Built and Deployed
- Compiled using Inno Setup 6.7.0 on Windows
- Uploaded to: `/home/opc/tbc-website/static/GuildShopSync-Setup-v2.7.exe`
- Zip created: `/home/opc/tbc-website/static/GuildShopSync-v2.7.zip`

### 5. Website Updated
- Download button in `/home/opc/tbc-website/islands/ConsumesShop.tsx`
- Changed from: `📥 Download Price Scanner`
- Changed to: `📥 Download Price Scanner v2.7`
- Link updated to v2.7 exe

### 6. Website Service Restarted
- `sudo systemctl restart tbc-website`
- Verified download link works (HTTP 200)

---

## Files Modified (Full Paths)

### Linux Server (132.226.72.121)
| File | Change |
|------|--------|
| `/home/opc/GuildShopSync/GuildShopSync.iss` | Version bump + scheduled task fixes |
| `/home/opc/GuildShopSync/source/README.txt` | Version to v2.7 |
| `/home/opc/GuildShopSync/source/SyncService.ps1` | Version comment to v2.7 |
| `/home/opc/tbc-website/islands/ConsumesShop.tsx` | Download button text + link |
| `/home/opc/tbc-website/static/GuildShopSync-Setup-v2.7.exe` | NEW - Compiled installer |
| `/home/opc/tbc-website/static/GuildShopSync-v2.7.zip` | NEW - Manual install package |

### Windows Machine (Local Build)
| File | Purpose |
|------|---------|
| `C:\Users\ryanr\AppData\Local\Temp\GuildShopSync-build\` | Temp build directory |

---

## Commands Used

### SSH to Linux Server
```bash
ssh -i "C:\Users\ryanr\.ssh\git-key" opc@132.226.72.121
```

### Compile Installer (Windows)
```powershell
& 'C:\Users\ryanr\AppData\Local\Programs\Inno Setup 6\ISCC.exe' 'C:\Users\ryanr\AppData\Local\Temp\GuildShopSync-build\GuildShopSync.iss'
```

### Upload Files
```bash
scp -i "C:\Users\ryanr\.ssh\git-key" "...\GuildShopSync-Setup-v2.7.exe" opc@132.226.72.121:/home/opc/tbc-website/static/
```

### Restart Website
```bash
sudo systemctl restart tbc-website
```

---

## Technical Details - The Fix

### Before (v2.6)
```
schtasks /create /tn "GuildShopSync" /tr "powershell.exe ..." /sc onlogon /rl limited /f
```
- No delay
- Default battery settings (won't run on battery)

### After (v2.7)
```
schtasks /create /tn "GuildShopSync" /tr "powershell.exe ..." /sc onlogon /delay 0000:30 /rl limited /f
```
Plus PowerShell to configure battery:
```powershell
$task = Get-ScheduledTask -TaskName 'GuildShopSync'
$settings = $task.Settings
$settings.DisallowStartIfOnBatteries = $false
$settings.StopIfGoingOnBatteries = $false
Set-ScheduledTask -TaskName 'GuildShopSync' -Settings $settings
```

---

## Lessons Learned

1. **Scheduled Task Battery Settings** - Windows scheduled tasks default to not running on battery. Must explicitly configure.

2. **Startup Delay Important** - Tasks that run at logon may fail if they start before Windows is fully initialized. Adding a delay helps.

3. **Inno Setup Quote Escaping** - In Inno Setup, quotes in strings are doubled (`""`), not backslash-escaped (`\"`).

4. **Error Code -1073741510** - This is STATUS_CONTROL_C_EXIT (0xC000013A), indicating the process was terminated externally. Often happens with tasks that start too early at boot.

---

## Things That Didn't Work

1. **Initial sed append** - Heredoc escaping in bash over SSH was problematic
2. **Python with `$` signs** - Bash interpreted `$` before Python could process them
3. **Backslash escaping in .iss** - Inno Setup uses `""` not `\"`

---

## Verification Steps

1. Download link works: `https://tbcguild.duckdns.org/GuildShopSync-Setup-v2.7.exe`
2. Website button shows "📥 Download Price Scanner v2.7"
3. Installer compiled successfully with Inno Setup 6.7.0

---

## Rollback Procedure

If issues arise, revert to v2.6:
1. Change download link back to v2.6.exe in ConsumesShop.tsx
2. Restart tbc-website service
3. Original .iss backup at: `/home/opc/GuildShopSync/GuildShopSync.iss.v2.6.bak`

---

## Next Steps for User

1. **Uninstall current v2.6** from Windows Settings → Apps
2. **Download v2.7** from https://tbcguild.duckdns.org/consumes
3. **Run installer** to install v2.7
4. **Test reboot** to verify service starts automatically

---

**Status:** ✅ COMPLETE

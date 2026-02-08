# TurtleWoW Error 132 Fix and Mod Updates

**Date:** December 31, 2025 @ 1:23 AM PST
**Status:** COMPLETED - REQUIRES TESTING
**Session Type:** Critical Bug Fix / Mod Updates

---

## Executive Summary

Investigated repeated Error 132 (Fatal Exception) crashes occurring at the CharacterSelect screen. Identified multiple issues:

1. **VanillaHelpers.dll was NOT in dlls.txt** - Required for HD Patch: Reforged but missing from config
2. **nampower.dll was outdated** - v2.19.1 installed, v2.23.1 available (fixes "crashes on launch")
3. **UnitXP_SP3 is outdated** - v52 installed, v70 available (manual update required)
4. **Patch-I.mpq (Interface patch)** - Removed as per user request

---

## Part 1: Error Analysis

### Error 132 Crashes (Fatal Exception)
**Time:** Dec 31, 2025 @ 1:12-1:13 AM (4+ crashes in 1 minute)
**Location:** CharacterSelect screen
**Type:** ACCESS_VIOLATION at 0x0044ADA1
**Memory:** "The memory could not be written"

```
Exception: 0xC0000005 (ACCESS_VIOLATION) at 0023:0044ADA1
The instruction at "0x0044ADA1" referenced memory at "0x13E210E8"
```

Stack trace showed "Interface" and "CharacterSel" in memory - indicating addon/interface loading issue.

### Error 124 Also Detected (Texture Memory)
**File:** Texture.cpp Line 2149
**Error:** "SMem3: Pointer does not refer to a valid allocated block of memory"

This indicated HD patch texture loading issues, likely due to missing VanillaHelpers.dll.

---

## Part 2: Root Causes Identified

### 1. Missing VanillaHelpers.dll from dlls.txt
**Critical Issue:** VanillaHelpers.dll v1.1.1 existed in C:\TurtleWoW\ but was NOT listed in dlls.txt.

The HD Patch: Reforged **requires** VanillaHelpers.dll to function properly. Without it in dlls.txt, the DLL wasn't being loaded, causing texture memory errors.

**Before:**
```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
SuperWoWhook.dll
```

**After:**
```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
SuperWoWhook.dll
VanillaHelpers.dll
```

### 2. Outdated nampower.dll
| Property | Old | New |
|----------|-----|-----|
| Version | v2.19.1 | v2.23.1 |
| File Size | 725 KB | 794 KB |
| Release Date | Dec 20, 2025 | Dec 30, 2025 |

**Key Change:** v2.23.1 release notes: "retry initial hooks to fix crashes on launch"

### 3. Outdated UnitXP_SP3.dll
| Property | Current | Latest |
|----------|---------|--------|
| Version | v52 | v70 |
| Date | Sep 7, 2025 | Dec 6, 2025 |

**Key Change:** v70 release notes: "fixed crash in d3dx9 font preloading"

**Note:** Automatic download failed due to Codeberg bot protection. Manual update required.

### 4. Extra HD Patches (Dec 21)
Additional patches were added after the Dec 20 upgrade:
- Patch-I.mpq (Interface) - 86 MB - **REMOVED per user request**
- Patch-L.mpq (A Little Extra for Females) - 47 MB
- Patch-N.mpq (Darker Nights) - 201 KB
- Patch-O.mpq (Raid Visuals) - 6 MB
- Patch-S.mpq (Sounds & Music) - 263 MB
- Patch-U.mpq (Ultra HD Textures) - 2.1 GB

---

## Part 3: Fixes Applied

### Fix 1: Added VanillaHelpers.dll to dlls.txt
```powershell
# Edited C:\TurtleWoW\dlls.txt
# Added line: VanillaHelpers.dll
```

### Fix 2: Updated nampower.dll to v2.23.1
```powershell
# Backup created
Copy-Item 'C:\TurtleWoW\nampower.dll' 'C:\TurtleWoW\backups\nampower_v2.19.1_backup_2025-12-31.dll'

# Downloaded v2.23.1 from gitea.com/avitasia/nampower/releases
# Installed to C:\TurtleWoW\nampower.dll
```

### Fix 3: Removed Patch-I.mpq (Interface patch)
```powershell
# Moved to backup location
Move-Item 'C:\TurtleWoW\Data\Patch-I.mpq' 'C:\TurtleWoW\backups\Patch-I_backup_2025-12-31.mpq'
```

---

## Part 4: Manual Action Required

### UnitXP_SP3 Update (v52 -> v70)
Codeberg has bot protection preventing automated downloads. User must manually:

1. Visit: https://codeberg.org/konaka/UnitXP_SP3/releases
2. Download: `UnitXP_SP3 v70.zip` (216 KB)
3. Extract `UnitXP_SP3.dll` to `C:\TurtleWoW\`
4. Optionally update addon: Extract `UnitXP_SP3_Addon` folder to `C:\TurtleWoW\Interface\AddOns\`

**Backup location:** `C:\TurtleWoW\backups\UnitXP_SP3_v52_backup_2025-12-31.dll`

---

## Part 5: Files Modified

### Files Updated
| File | Change |
|------|--------|
| `C:\TurtleWoW\dlls.txt` | Added VanillaHelpers.dll |
| `C:\TurtleWoW\nampower.dll` | Updated v2.19.1 -> v2.23.1 |

### Files Moved to Backup
| Original | Backup Location |
|----------|-----------------|
| nampower.dll (v2.19.1) | `C:\TurtleWoW\backups\nampower_v2.19.1_backup_2025-12-31.dll` |
| UnitXP_SP3.dll (v52) | `C:\TurtleWoW\backups\UnitXP_SP3_v52_backup_2025-12-31.dll` |
| Patch-I.mpq | `C:\TurtleWoW\backups\Patch-I_backup_2025-12-31.mpq` |

---

## Part 6: HD Patch Letter Reference

| Patch | Content |
|-------|---------|
| A | Player Characters & NPCs |
| B | Buildings |
| C | Creatures |
| D | Doodads |
| E | Environment |
| G | Gear & Weapons (or Ground) |
| **I** | **Interface** (REMOVED) |
| L | A Little Extra for Females |
| M | Maps & Loading Screens |
| N | Darker Nights |
| O | Raid Visuals Mod (depends on S) |
| S | Sounds & Music |
| U | Ultra HD Character Textures & Gear |
| V | Visual Effects for Spells |

**Note:** Patches B, D, and E must be installed together or not at all.

---

## Part 7: Rollback Procedures

### Rollback nampower.dll
```powershell
Copy-Item 'C:\TurtleWoW\backups\nampower_v2.19.1_backup_2025-12-31.dll' 'C:\TurtleWoW\nampower.dll' -Force
```

### Rollback UnitXP_SP3.dll
```powershell
Copy-Item 'C:\TurtleWoW\backups\UnitXP_SP3_v52_backup_2025-12-31.dll' 'C:\TurtleWoW\UnitXP_SP3.dll' -Force
```

### Restore Patch-I.mpq (Interface)
```powershell
Move-Item 'C:\TurtleWoW\backups\Patch-I_backup_2025-12-31.mpq' 'C:\TurtleWoW\Data\Patch-I.mpq'
```

### Remove VanillaHelpers.dll from dlls.txt
Edit `C:\TurtleWoW\dlls.txt` and remove the line `VanillaHelpers.dll`

---

## Part 8: Testing Checklist

After these changes, verify:
- [ ] Game launches without Error 132
- [ ] CharacterSelect screen loads successfully
- [ ] Character can log in without crashes
- [ ] HD textures display correctly (no texture memory errors)
- [ ] Interface elements display correctly (after removing Patch-I)

---

## Part 9: Sources

- **nampower v2.23.1:** https://gitea.com/avitasia/nampower/releases
- **UnitXP_SP3 v70:** https://codeberg.org/konaka/UnitXP_SP3/releases
- **HD Patch: Reforged Forum:** https://forum.turtle-wow.org/viewtopic.php?t=21355
- **VanillaHelpers:** https://github.com/thaumaturgists/VanillaHelpers

---

## Part 10: Lessons Learned

1. **dlls.txt is critical** - DLLs must be listed here to be loaded by the game
2. **Check dlls.txt after upgrades** - The Dec 20 upgrade added VanillaHelpers.dll but it didn't persist in dlls.txt
3. **HD patches require VanillaHelpers** - Without it, texture memory errors occur
4. **nampower updates frequently** - Check gitea.com/avitasia/nampower for latest
5. **Codeberg has bot protection** - Cannot automate downloads, must use browser

---

---

## Part 11: Additional Fixes (Follow-up Session)

### Sound Not Working Fix
**Root Cause:** Config.wtf was missing ALL volume settings. Sound system initialized correctly (Sound.log showed DirectSound with 64 channels) but no volume levels were set.

**Fix Applied:** Added to Config.wtf:
```
SET MasterVolume "1"
SET SoundVolume "1"
SET MusicVolume "0.5"
SET AmbienceVolume "0.6"
SET EnableAllSound "1"
SET BackgroundSound "1"
```

### Visual Glitch Fix (White Textures on Window Mode Switch)
**Root Cause:**
1. DXVK `d3d9.enableDialogMode` was disabled (commented out)
2. Patch-U.mpq (Ultra HD Textures - 2.1GB) causing texture corruption on window mode switch
3. Missing gxWindow/gxMaximize settings in Config.wtf

**Fixes Applied:**
1. Enabled `d3d9.enableDialogMode = True` in dxvk.conf
2. Removed Patch-U.mpq (moved to backups)
3. Added `gxWindow "1"` and `gxMaximize "1"` to Config.wtf
4. Cleared WDB cache for texture refresh

### Non-Core HD Patches Analysis

| Patch | Size | Purpose | Status |
|-------|------|---------|--------|
| Patch-I.mpq | 86 MB | Interface | **REMOVED** (per user request) |
| Patch-L.mpq | 47 MB | A Little Extra for Females | Kept |
| Patch-N.mpq | 201 KB | Darker Nights | Kept |
| Patch-O.mpq | 6 MB | Raid Visuals | Kept |
| Patch-S.mpq | 263 MB | Sounds & Music | Kept |
| Patch-U.mpq | 2.1 GB | Ultra HD Textures | **REMOVED** (texture corruption) |

**Note:** Patch-O depends on Patch-S to work properly.

### Files Modified (Follow-up)

| File | Change |
|------|--------|
| `C:\TurtleWoW\WTF\Config.wtf` | Added sound volume settings + window mode settings |
| `C:\TurtleWoW\dxvk.conf` | Enabled d3d9.enableDialogMode |
| `C:\TurtleWoW\WDB\*` | Cleared cache |

### Files Moved to Backup (Follow-up)

| Original | Backup Location |
|----------|-----------------|
| Patch-U.mpq | `C:\TurtleWoW\backups\Patch-U_backup_2025-12-31.mpq` |

### Restore Patch-U (if needed)
```powershell
Move-Item 'C:\TurtleWoW\backups\Patch-U_backup_2025-12-31.mpq' 'C:\TurtleWoW\Data\Patch-U.mpq'
```

---

## Part 12: Second Follow-up Session (Dec 31, 2025 ~2:00 AM PST)

### Issues Reported
1. Visual glitches still occurring when switching window modes
2. Sound still not working (even at login screen)
3. User wanted remaining non-core patches removed (L, N, O, S)

### DLL Version Verification
| DLL | Installed | Latest | Status |
|-----|-----------|--------|--------|
| nampower.dll | 794 KB (v2.23.1) | 776 KiB (v2.23.1) | UP TO DATE |
| UnitXP_SP3.dll | 200 KB (v70) | 216 KiB (v70) | UP TO DATE (user installed) |

### Fixes Applied

#### 1. Removed ALL Non-Core HD Patches
```powershell
Move-Item 'C:\TurtleWoW\Data\Patch-L.mpq' 'C:\TurtleWoW\backups\Patch-L_backup_2025-12-31.mpq'
Move-Item 'C:\TurtleWoW\Data\Patch-N.mpq' 'C:\TurtleWoW\backups\Patch-N_backup_2025-12-31.mpq'
Move-Item 'C:\TurtleWoW\Data\Patch-O.mpq' 'C:\TurtleWoW\backups\Patch-O_backup_2025-12-31.mpq'
Move-Item 'C:\TurtleWoW\Data\Patch-S.mpq' 'C:\TurtleWoW\backups\Patch-S_backup_2025-12-31.mpq'
```

#### 2. DXVK Visual Glitch Fix
Changed `dxvk.allowFse` from True to False:
```
# Disable exclusive fullscreen to fix window mode switching glitches
dxvk.allowFse = False
```

#### 3. Re-Added VanillaHelpers.dll to dlls.txt
**CRITICAL**: VanillaHelpers.dll was missing from dlls.txt again (game overwrote it).

Current dlls.txt:
```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
SuperWoWhook.dll
VanillaHelpers.dll
```

#### 4. Comprehensive Sound Settings Added to Config.wtf
```
SET MasterVolume "1"
SET SoundVolume "1"
SET MusicVolume "0.5"
SET AmbienceVolume "0.60000002384186"
SET EnableAllSound "1"
SET BackgroundSound "1"
SET SoundOutputSystem "1"
SET SoundBufferSize "150"
SET EnableSFX "1"
SET EnableErrorSpeech "1"
SET EnableEmoteSounds "1"
SET EnableMusic "1"
SET SoundMemoryCache "128"
SET SoundNumChannels "64"
SET SoundInBackground "1"
```

#### 5. Window Mode Settings
```
SET gxWindow "1"
SET gxMaximize "1"
```

#### 6. Cleared Caches
- WDB folder cleared
- Cache folder cleared

### Files Moved to Backup (This Session)
| Original | Backup Location |
|----------|-----------------|
| Patch-L.mpq | `C:\TurtleWoW\backups\Patch-L_backup_2025-12-31.mpq` |
| Patch-N.mpq | `C:\TurtleWoW\backups\Patch-N_backup_2025-12-31.mpq` |
| Patch-O.mpq | `C:\TurtleWoW\backups\Patch-O_backup_2025-12-31.mpq` |
| Patch-S.mpq | `C:\TurtleWoW\backups\Patch-S_backup_2025-12-31.mpq` |

### Remaining Core HD Patches
Only official TurtleWoW patches remain:
- Patch-A.mpq (Player Characters & NPCs)
- Patch-B.mpq (Buildings)
- Patch-C.mpq (Creatures)
- Patch-D.mpq (Doodads)
- Patch-E.mpq (Environment)
- Patch-G.mpq (Gear & Weapons)
- Patch-M.mpq (Maps & Loading Screens)
- patch-2 through patch-9.mpq (TurtleWoW game patches)

### Sound Troubleshooting Notes
Sound.log shows correct initialization:
```
Output system: 2 'Direct Sound'
Driver: 0 'Primary Sound Driver'
Channels: 64 (64 software, 0 2D hardware)
Output rate: 44100 Hz
```

Sound system IS initializing properly. If sound still doesn't work after these settings:
1. Check Windows Volume Mixer - ensure WoW isn't muted
2. Try running these in-game: `/console SoundMemoryCache 128`
3. Check TurtleWoW Launcher → Tweaks for sound checkbox

### Sources
- [TurtleWoW No Sound Forum Thread](https://forum.turtle-wow.org/viewtopic.php?t=18905)
- [TurtleWoW Sound Issues](https://forum.turtle-wow.org/viewtopic.php?t=5826)
- [nampower releases](https://gitea.com/avitasia/nampower/releases)
- [UnitXP_SP3 releases](https://codeberg.org/konaka/UnitXP_SP3/releases)

---

*Documentation created: December 31, 2025 @ 1:23 AM PST*
*Last updated: December 31, 2025 @ 2:15 AM PST*
*Total session duration: ~1 hour*

# TurtleHD Reforged - Full Installation ChangeLog & Rollback Guide

**Date:** December 21, 2025 @ 12:37 AM PST
**Status:** COMPLETED
**Type:** Major Graphics Mod Installation

---

## Executive Summary

Complete installation of HD Patch: Reforged by Stormhand81 for Turtle WoW, including all 13 available patches totaling ~11.9 GB. This upgrade replaced the previous September 2025 TurtleHD installation (2 patches, ~2.3 GB).

---

## ChangeLog

### Session 1: December 20, 2025 ~2:00 PM PST
**Initial HD Patch Upgrade**

| Action | Details |
|--------|---------|
| Backed up old patches | `C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\` |
| Installed VanillaHelpers.dll | v1.1.1 (254 KB) - Required dependency |
| Updated dlls.txt | Added VanillaHelpers.dll entry |
| Downloaded core patches | A, B, C, D, E, G, M (7 patches, ~8.9 GB) |
| Cleared WDB cache | Removed and recreated folder |

### Session 2: December 20, 2025 ~3:30 PM PST
**Client Mod Updates**

| Action | Details |
|--------|---------|
| Backed up mods | `C:\TurtleWoW\backups\Mods_Backup_2025-12-20\` |
| Updated nampower.dll | v2.19.1 (725 KB) |
| Updated VanillaFixes | v1.5.3 with DXVK 2.6.1 |
| Installed dxvk.conf | New configuration file |

### Session 3: December 21, 2025 ~12:30 AM PST
**Optional Patches Installation**

| Action | Details |
|--------|---------|
| Downloaded Patch-I | Interface enhancements (83 MB) |
| Downloaded Patch-L | Extra Female models (46 MB) |
| Downloaded Patch-N | Darker Nights (197 KB) |
| Downloaded Patch-O | Raid Visuals (5.8 MB) |
| Downloaded Patch-S | Sounds & Music (251 MB) |
| Downloaded Patch-U | Ultra HD Textures (2.0 GB) |
| Cleared WDB cache | Final cache clear |

---

## Final Installed State

### HD Patches (13 Total)

| Patch | Size (Bytes) | Size (Human) | Install Date | Purpose |
|-------|--------------|--------------|--------------|---------|
| Patch-A.mpq | 1,881,849,845 | 1.88 GB | Dec 20 14:13 | HD Characters & NPCs |
| Patch-B.mpq | 1,608,961,636 | 1.61 GB | Dec 20 14:15 | HD Buildings |
| Patch-C.mpq | 1,852,961,750 | 1.85 GB | Dec 20 14:16 | HD Creatures |
| Patch-D.mpq | 1,662,394,963 | 1.66 GB | Dec 20 14:16 | HD Doodads |
| Patch-E.mpq | 712,591,523 | 680 MB | Dec 20 14:15 | HD Environment |
| Patch-G.mpq | 777,338,394 | 742 MB | Dec 20 14:16 | HD Ground Textures |
| Patch-I.mpq | 86,049,963 | 83 MB | Dec 21 00:31 | Interface Enhancements |
| Patch-L.mpq | 47,465,567 | 46 MB | Dec 21 00:31 | Extra Female Models |
| Patch-M.mpq | 433,501,937 | 414 MB | Dec 20 14:16 | HD Maps & Loading Screens |
| Patch-N.mpq | 201,008 | 197 KB | Dec 21 00:31 | Darker Nights |
| Patch-O.mpq | 6,037,090 | 5.8 MB | Dec 21 00:31 | Raid Visuals (requires Patch-S) |
| Patch-S.mpq | 262,617,076 | 251 MB | Dec 21 00:32 | Sounds & Music |
| Patch-U.mpq | 2,125,560,142 | 2.0 GB | Dec 21 00:32 | Ultra HD Textures |

**Total Size: ~11.9 GB**

### Client Mods Updated

| File | Version | Size | Date |
|------|---------|------|------|
| nampower.dll | v2.19.1 | 725,504 bytes | Dec 20 |
| VanillaFixes.exe | v1.5.3 | 88,576 bytes | Dec 20 |
| VfPatcher.dll | v1.5.3 | 72,704 bytes | Dec 20 |
| d3d9.dll | DXVK 2.6.1 | 4,452,366 bytes | Dec 20 |
| dxvk.conf | v1.5.3 | 630 bytes | Dec 20 |
| VanillaHelpers.dll | v1.1.1 | 254,976 bytes | Dec 20 |

### Configuration Files Modified

| File | Change |
|------|--------|
| `C:\TurtleWoW\dlls.txt` | Added VanillaHelpers.dll |

---

## Backup Locations

### HD Patch Backups
```
C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\
├── patch-A_BACKUP.MPQ    (1.73 GB - September 2025 version)
└── Patch-B_BACKUP.mpq    (562 MB - September 2025 version)
```

### Client Mod Backups
```
C:\TurtleWoW\backups\Mods_Backup_2025-12-20\
├── nampower.dll          (600 KB - Previous version)
├── VanillaFixes.exe      (88 KB - Previous version)
├── VfPatcher.dll         (72 KB - Previous version)
├── vanilla-tweaks.exe    (5.9 MB - v1.6.0)
└── d3d9.dll              (4.4 MB - Previous DXVK)
```

---

## ROLLBACK PROCEDURES

### Option 1: Full Rollback to September 2025 TurtleHD

**Use this if you want to go back to the original 2-patch system:**

```batch
@echo off
echo ================================================
echo   FULL ROLLBACK - September 2025 TurtleHD
echo ================================================
echo.
echo WARNING: This will remove ALL December 2025 HD patches!
echo.
pause

cd /d "C:\TurtleWoW\Data"

echo Removing December 2025 patches...
del Patch-A.mpq
del Patch-B.mpq
del Patch-C.mpq
del Patch-D.mpq
del Patch-E.mpq
del Patch-G.mpq
del Patch-I.mpq
del Patch-L.mpq
del Patch-M.mpq
del Patch-N.mpq
del Patch-O.mpq
del Patch-S.mpq
del Patch-U.mpq

echo Restoring September 2025 patches...
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\patch-A_BACKUP.MPQ" "Patch-A.mpq"
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\Patch-B_BACKUP.mpq" "Patch-B.mpq"

echo Clearing WDB cache...
cd /d "C:\TurtleWoW"
rmdir /s /q WDB
mkdir WDB

echo.
echo Rollback complete! You now have September 2025 TurtleHD.
pause
```

Save as: `C:\TurtleWoW\ROLLBACK_TO_SEPTEMBER_2025.bat`

---

### Option 2: Remove Optional Patches Only

**Use this to keep core HD but remove optional patches (I, L, N, O, S, U):**

```batch
@echo off
echo ================================================
echo   REMOVE OPTIONAL PATCHES ONLY
echo ================================================
echo.
echo Keeping: A, B, C, D, E, G, M (core HD)
echo Removing: I, L, N, O, S, U (optional)
echo.
pause

cd /d "C:\TurtleWoW\Data"

del Patch-I.mpq
del Patch-L.mpq
del Patch-N.mpq
del Patch-O.mpq
del Patch-S.mpq
del Patch-U.mpq

cd /d "C:\TurtleWoW"
rmdir /s /q WDB
mkdir WDB

echo.
echo Optional patches removed. Core HD patches remain.
pause
```

Save as: `C:\TurtleWoW\REMOVE_OPTIONAL_PATCHES.bat`

---

### Option 3: Remove Individual Patches

**Use this to disable specific patches causing issues:**

| Patch | To Remove | Effect |
|-------|-----------|--------|
| Patch-I | `del "C:\TurtleWoW\Data\Patch-I.mpq"` | Removes interface changes |
| Patch-L | `del "C:\TurtleWoW\Data\Patch-L.mpq"` | Removes extra female models |
| Patch-N | `del "C:\TurtleWoW\Data\Patch-N.mpq"` | Removes darker nights |
| Patch-O | `del "C:\TurtleWoW\Data\Patch-O.mpq"` | Removes raid visuals |
| Patch-S | `del "C:\TurtleWoW\Data\Patch-S.mpq"` | Removes sound changes |
| Patch-U | `del "C:\TurtleWoW\Data\Patch-U.mpq"` | Removes ultra HD textures |

**IMPORTANT:** After removing any patch, always clear WDB:
```batch
rmdir /s /q "C:\TurtleWoW\WDB"
mkdir "C:\TurtleWoW\WDB"
```

---

### Option 4: Rollback Client Mods

**Restore previous nampower/VanillaFixes:**

```batch
@echo off
echo Restoring previous client mods...

copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\nampower.dll" "C:\TurtleWoW\nampower.dll"
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\VanillaFixes.exe" "C:\TurtleWoW\VanillaFixes.exe"
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\VfPatcher.dll" "C:\TurtleWoW\VfPatcher.dll"
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\d3d9.dll" "C:\TurtleWoW\d3d9.dll"
del "C:\TurtleWoW\dxvk.conf"

echo Client mods restored to previous versions.
pause
```

Save as: `C:\TurtleWoW\ROLLBACK_CLIENT_MODS.bat`

---

### Option 5: Remove VanillaHelpers.dll

**If VanillaHelpers.dll causes issues (NOTE: HD patches require it):**

```batch
del "C:\TurtleWoW\VanillaHelpers.dll"
```

Then edit `C:\TurtleWoW\dlls.txt` and remove the line:
```
VanillaHelpers.dll
```

**WARNING:** HD Patch: Reforged will NOT work without VanillaHelpers.dll!

---

## Patch Dependencies

| Patch | Depends On | Notes |
|-------|------------|-------|
| Patch-O | Patch-S | Raid Visuals requires Sound patch |
| Patch-U | Patch-A | Ultra HD depends on character DBC files |
| All HD Patches | VanillaHelpers.dll | Required for HD patches to function |

---

## Troubleshooting

### If game crashes on startup:
1. Remove Patch-U (Ultra HD) first - it's the largest
2. If still crashing, remove optional patches (I, L, N, O, S)
3. If still crashing, do full rollback to September 2025

### If specific areas crash:
1. Patch-D had a centaur tent collision fix in Dec 16 update
2. Patch-C has creature model changes
3. Try removing the patch that affects the crash area

### If performance is poor:
1. Remove Patch-U (2 GB of Ultra HD textures)
2. Remove Patch-N (Darker Nights may affect lighting)
3. Consider keeping only A, B, C, D, E (core patches)

### If audio issues:
1. Remove Patch-S (Sounds & Music)
2. This will also break Patch-O (Raid Visuals depends on S)

---

## Download Sources (For Re-Installation)

### Core Patches (A-G, M)
Downloaded via custom MediaFire script from Stormhand81's distribution

### Optional Patches (I, L, N, O, S, U)
| Patch | MediaFire URL |
|-------|---------------|
| Patch-I | https://www.mediafire.com/file/a0zywdwfy7kic4o/Patch-I.mpq/file |
| Patch-L | https://www.mediafire.com/file/cpmb9pt5ifzcymp/Patch-L.mpq/file |
| Patch-N | https://www.mediafire.com/file/9zgbg74avr3051z/Patch-N.mpq/file |
| Patch-O | https://www.mediafire.com/file/l0fpmrrdthng8wz/Patch-O.mpq/file |
| Patch-S | https://www.mediafire.com/file/ma81gpkvvndbnlb/Patch-S.mpq/file |
| Patch-U | https://www.mediafire.com/file/4t3xslqq4b669bg/Patch-U.mpq/file |

### Client Mods
| Mod | Source |
|-----|--------|
| nampower v2.19.1 | https://gitea.com/avitasia/nampower/releases |
| VanillaFixes v1.5.3 | https://github.com/hannesmann/vanillafixes/releases |
| VanillaHelpers v1.1.1 | https://github.com/thaumaturgists/VanillaHelpers/releases |

---

## Tools Installed

| Tool | Location | Purpose |
|------|----------|---------|
| HD Patch Manager | `C:\TurtleWoW_Tools\HD_Patch_Manager\` | Auto-update tool (has bugs) |
| MediaFire Download Script | `/c/Temp/mediafire_download.py` | Custom download helper |
| Upgrade Script | `C:\TurtleWoW\APPLY_HD_UPGRADE.bat` | For future upgrades |

---

## Version Information

| Component | Version | Maintainer |
|-----------|---------|------------|
| HD Patch: Reforged | December 16, 2025 | Stormhand81 |
| nampower | v2.19.1 (Dec 20, 2025) | avitasia |
| VanillaFixes | v1.5.3 (May 11, 2025) | hannesmann |
| VanillaHelpers | v1.1.1 | thaumaturgists/isfir |

---

## Quick Reference Commands

### Check installed patches:
```bash
ls -lah C:\TurtleWoW\Data\Patch-*.mpq
```

### Clear WDB cache:
```batch
rmdir /s /q "C:\TurtleWoW\WDB" && mkdir "C:\TurtleWoW\WDB"
```

### Kill WoW processes (if needed):
```batch
taskkill /F /IM WoW.exe
taskkill /F /IM turtle-wow.exe
taskkill /F /IM VanillaFixes.exe
```

---

*Documentation created: December 21, 2025 @ 12:37 AM PST*
*Total session time: ~10 hours (across multiple sessions)*
*Total data downloaded: ~11.9 GB (HD patches) + ~20 MB (mods)*

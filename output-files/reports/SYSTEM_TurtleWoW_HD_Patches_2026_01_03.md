# Turtle WoW HD Patches & Raid Visuals System Documentation

**Created:** 2026-01-03
**Last Updated:** 2026-01-03
**Type:** System Documentation
**Game Location:** `C:\TurtleWoW\`
**Data Folder:** `C:\TurtleWoW\Data\`

---

## Overview

Documentation of Turtle WoW HD graphics patches, Raid Visuals addon installation, and troubleshooting mount texture conflicts.

---

## Installed HD Patches

### Current Active Patches (as of 2026-01-03)

| Patch | Purpose | Status |
|-------|---------|--------|
| Patch-A.mpq | HD Characters, NPCs, Creatures, Items | Active |
| Patch-B.mpq | HD Environment and Buildings | Active |
| **Patch-C.mpq** | **HD Creatures** | **REMOVED - Causes mount color issues** |
| Patch-D.mpq | HD Doodads | Active |
| Patch-E.mpq | HD Environment (part of B/D/E set) | Active |
| Patch-G.mpq | HD Gear & Weapons | Active |
| Patch-I.mpq | Custom patch | Active |
| Patch-M.mpq | HD Maps & Loading Screens | Active |
| patch-O.mpq | Marceline's Raid Visuals v1.3.1 | Active |

### Patch Load Order
Patches load alphabetically. Later patches override earlier ones.

---

## Raid Visuals Addon (patch-O.mpq)

### Purpose
Adds visual ground indicators for raid mechanics:
- Rain of Fire damage circles
- Boss ability indicators (BWL, MC, AQ, Naxx)
- Spell effect zones

### Source
**GitHub:** https://github.com/MarcelineVQ/twow-raid-visuals/releases

### Version History

| Version | Status | Notes |
|---------|--------|-------|
| v1.4.6 | **INCOMPATIBLE** | Crashes in cities with HD patches (conflict with Patch-A DBC files) |
| v1.3.1 | **WORKING** | Compatible with HD patches, no city crashes |

### Installation
1. Download `patch-O.mpq` from releases
2. Place in `C:\TurtleWoW\Data\`
3. Game must be closed during installation

### Known Issue: City Crashes (v1.4.6)
**Symptom:** Game crashes when logging into characters in cities (Orgrimmar, Ironforge, etc.)
**Cause:** Both Raid Visuals v1.4.6 and HD Patch-A modify `.dbc` files. WoW client doesn't combine them gracefully.
**Solution:** Use v1.3.1 instead of v1.4.6

**GitHub Issue:** https://github.com/MarcelineVQ/twow-raid-visuals/issues/8

---

## Patch-C (HD Creatures) Issue

### Problem
Patch-C causes wrong colors on certain mounts:
- Black War Raptor
- Various other PvP mounts
- Some shop mounts

### Diagnosis Process
1. Disabled all HD patches except Patch-A - mounts displayed correctly
2. Re-enabled B, C, D - problem returned
3. Disabled C, D, kept A, B - mounts correct
4. Re-enabled C - problem returned
5. **Conclusion:** Patch-C is the culprit

### Attempted Fixes
1. Downloaded latest Patch-C from HD Patch: Reforged (Dec 22, 2025 version)
2. **Result:** Same mount color issues persisted

### Resolution
**Permanently removed Patch-C** - mount colors display correctly without it. User loses HD creature textures but keeps all other HD features.

### Download Source (if needed in future)
**Mediafire:** https://www.mediafire.com/file/00l85reelat91kv/Patch-C.mpq/file
**Forum:** https://forum.turtle-wow.org/viewtopic.php?t=21355 (HD Patch: Reforged by Stormhand)

---

## HD Patch Management Tools

### WoW HD Patch Manager (by Thx4riposte)
**Location:** `C:\TurtleWoW\WOW_HD_Patch_Manager\`
**GitHub:** https://github.com/Thx4riposte/Wow-HD-Patch-Manager

**Files:**
- `WOW_HD_Patch_Manager.exe`
- `updater.exe`

**Note:** Tool has a bug where it reports "game is open" even when WoW is closed. Manual downloads may be more reliable.

### TWPatcher
**Location:** `C:\TurtleWoW\TWPatcher.exe`
**Purpose:** Official Turtle WoW patcher for HD content

---

## Required Dependencies

### VanillaHelpers.dll
**Location:** `C:\TurtleWoW\VanillaHelpers.dll`
**Purpose:** Required for HD patches to function
**Config:** Listed in `C:\TurtleWoW\dlls.txt`

**Warning:** Windows Defender may delete this file. Add TurtleWoW folder to exclusions.

### Other DLLs in dlls.txt
- nampower.dll
- no1600x1200.dll
- UnitXP_SP3.dll
- VfPatcher.dll
- SuperWoWhook.dll
- VanillaHelpers.dll

---

## BigWigs Addon

### Installed Version
- **Version:** 2.0.0
- **Revision:** 30132
- **Fork:** Pepopo
- **Location:** `C:\TurtleWoW\Interface\AddOns\BigWigs\`

### Source
**GitHub:** https://github.com/pepopo978/BigWigs (master branch)

### Update Process
1. Close WoW
2. Delete `C:\TurtleWoW\Interface\AddOns\BigWigs\`
3. Download latest from GitHub
4. Extract to AddOns folder

---

## Troubleshooting Guide

### Mount Texture Issues (Wrong Colors)
1. Identify which patch is causing the issue
2. Disable patches one by one (rename to `.disabled`)
3. Test in-game after each change
4. Once identified, either:
   - Download newer version of that patch
   - Remove the patch permanently

### Game Crashes in Cities
1. Check Raid Visuals version (patch-O.mpq)
2. If using v1.4.x, downgrade to v1.3.1
3. Verify VanillaHelpers.dll exists

### Patch File Locked Errors
1. Close WoW completely
2. Check Task Manager for WoW.exe processes
3. Close any HD Patch Manager tools
4. Try again

---

## File Locations Summary

| Item | Path |
|------|------|
| Game Data | `C:\TurtleWoW\Data\` |
| HD Patches | `C:\TurtleWoW\Data\Patch-*.mpq` |
| Addons | `C:\TurtleWoW\Interface\AddOns\` |
| DLL Config | `C:\TurtleWoW\dlls.txt` |
| HD Patch Manager | `C:\TurtleWoW\WOW_HD_Patch_Manager\` |

---

## Related Links

- **HD Patch: Reforged Forum:** https://forum.turtle-wow.org/viewtopic.php?t=21355
- **Raid Visuals GitHub:** https://github.com/MarcelineVQ/twow-raid-visuals
- **BigWigs GitHub:** https://github.com/pepopo978/BigWigs
- **HD Patch Manager GitHub:** https://github.com/Thx4riposte/Wow-HD-Patch-Manager
- **Stormhand Ko-fi:** https://ko-fi.com/stormhand

---

**Last Updated:** 2026-01-03

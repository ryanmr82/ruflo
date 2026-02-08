# TurtleWoW Post-Update Restoration

**Date:** January 23, 2026, 3:35 PM PST
**Status:** COMPLETED SUCCESSFULLY
**Type:** Post-Update Restoration / Mod Re-application

---

## Summary

After TurtleWoW client update, restored missing mod files from backup (`C:\turtlewow_backup\TurtleWoW\`) to the updated installation (`C:\turtlewow\`). Also removed the crash-causing Patch-I.mpq.

---

## Pre-Restoration Analysis

### What the Update Changed
The TurtleWoW update only replaced executable files. It did NOT touch:
- Interface/AddOns folder (all 93 addons intact)
- WTF folder (all settings/SavedVariables intact)
- Most DLL files

### Missing Files Identified
| File | Purpose |
|------|---------|
| TWPatcher.exe | Patches WoW.exe to enable mod support |
| VanillaFixes.exe | Launcher that loads DLLs and enables DXVK |
| nampower.dll | Spell batching/performance optimization |
| UnitXP_SP3.dll | Extended unit frame functionality |

### Problem Identified
**Patch-I.mpq** (Interface patch - 86 MB) existed in the Data folder. This was previously documented as crash-causing (Error 132 at CharacterSelect) and was removed on Dec 31, 2025.

---

## Actions Performed

### Files Copied from Backup
| File | Size | Source | Destination |
|------|------|--------|-------------|
| TWPatcher.exe | 1,144,864 bytes | `C:\turtlewow_backup\TurtleWoW\` | `C:\turtlewow\` |
| VanillaFixes.exe | 88,576 bytes | `C:\turtlewow_backup\TurtleWoW\` | `C:\turtlewow\` |
| nampower.dll | 794,112 bytes | `C:\turtlewow_backup\TurtleWoW\` | `C:\turtlewow\` |
| UnitXP_SP3.dll | 200,192 bytes | `C:\turtlewow_backup\TurtleWoW\` | `C:\turtlewow\` |

### Crash-Causing Patch Removed
| Original Location | Backup Location |
|-------------------|-----------------|
| `C:\turtlewow\Data\Patch-I.mpq` | `C:\turtlewow\backups\Patch-I_removed_2026-01-23.mpq` |

---

## Verification Results

### EXEs Present
- TWPatcher.exe (1,144,864 bytes)
- VanillaFixes.exe (88,576 bytes)
- WoW.exe (4,907,008 bytes)
- turtle-wow.exe (38,240,488 bytes)
- vanilla-tweaks.exe (5,920,384 bytes)

### Critical DLLs Present
| DLL | Size |
|-----|------|
| nampower.dll | 794,112 bytes |
| UnitXP_SP3.dll | 200,192 bytes |
| VanillaHelpers.dll | 254,976 bytes |
| VfPatcher.dll | 72,704 bytes |
| SuperWoWhook.dll | 129,024 bytes |
| perf_boost.dll | 542,720 bytes |

### dlls.txt Configuration (Verified Correct)
```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
VanillaHelpers.dll
perf_boost.dll
SuperWoWhook.dll
```

### Patch-I.mpq Status
- REMOVED from `C:\turtlewow\Data\`
- Backup at `C:\turtlewow\backups\Patch-I_removed_2026-01-23.mpq`

---

## Modified Addons Status

All previously modified addons were confirmed INTACT (identical hashes between current and backup):

| Addon | Modification | Status |
|-------|--------------|--------|
| DPSMate | Parser battleground error fix (lines 1679, 1683) | PRESERVED |
| SuperMacro | Global cooldown queue system | PRESERVED |
| Cursive | Blacklist patch (CursiveBlacklist.lua) | PRESERVED |
| Spy | Astrolabe dungeon error fix | PRESERVED (now uses Ace3 libs) |
| Bagshui | Shadow Resist fix (WTF SavedVariables) | PRESERVED |

---

## HD Patches Remaining (Core Set)

| Patch | Content | Size |
|-------|---------|------|
| Patch-A.mpq | Player Characters & NPCs | 1.88 GB |
| Patch-B.mpq | Buildings | 1.61 GB |
| Patch-D.mpq | Doodads | 1.66 GB |
| Patch-E.mpq | Environment | 713 MB |
| Patch-G.mpq | Gear & Weapons | 777 MB |
| Patch-M.mpq | Maps & Loading Screens | 434 MB |
| patch-O.mpq | Raid Visuals | 6 MB |

**Removed:** Patch-I.mpq (Interface - crash-causing)

---

## How to Launch the Game

1. **Use VanillaFixes.exe** to launch the game (NOT WoW.exe directly)
2. VanillaFixes will automatically load all DLLs from dlls.txt
3. If prompted, allow VanillaFixes through Windows Defender

Alternative: Use the TurtleWoW Launcher with VanillaFixes enabled in settings.

---

## Rollback Procedures

### Restore Patch-I.mpq (NOT recommended)
```powershell
Move-Item 'C:\turtlewow\backups\Patch-I_removed_2026-01-23.mpq' 'C:\turtlewow\Data\Patch-I.mpq'
```

### Restore Original Files
All original backup files remain at `C:\turtlewow_backup\TurtleWoW\`

---

## Related Documentation

- `2025_12_31_01_23_AM_PST_TurtleWoW_Error132_Fix_And_Mod_Updates.md` - Original Patch-I removal
- `2025_12_20_05_33_PM_PST_TurtleWoW_Complete_Mod_Upgrade.md` - HD patches installation
- `2025_12_21_12_37_AM_PST_TurtleHD_Full_Installation_ChangeLog.md` - HD patch reference

---

## Community Sources Referenced

- [Turtle WoW Wiki - Client Fixes and Tweaks](https://turtle-wow.fandom.com/wiki/Client_Fixes_and_Tweaks)
- [GitHub - RetroCro/TurtleWoW-Mods](https://github.com/RetroCro/TurtleWoW-Mods)
- [Forum - VanillaFixes after latest patch](https://forum.turtle-wow.org/viewtopic.php?t=15470)

---

*Report generated: January 23, 2026, 3:35 PM PST*

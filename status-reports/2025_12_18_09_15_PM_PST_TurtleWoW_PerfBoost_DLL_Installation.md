# TurtleWoW PerfBoost DLL Installation

**Date:** December 18, 2025, 9:15 PM PST
**Status:** Completed Successfully
**Type:** Performance Optimization / Addon Installation

---

## Summary

Installed perf_boost.dll and PerfBoostSettings addon for TurtleWoW to improve FPS in raids and crowded areas through advanced render distance controls.

---

## What perf_boost Does

perf_boost.dll is a performance optimization DLL for WoW 1.12.1 that provides:

- **Selective Unit Rendering** - Control visibility ranges for players, pets, trash mobs, corpses
- **Context-Aware Settings** - Different render distances for combat vs non-combat, city vs outdoor
- **Smart Exceptions** - Raid-marked units and PvP enemies always render regardless of distance
- **Lightweight Implementation** - Uses fast distance approximation and frame-based caching

---

## Pre-Installation Analysis

**Existing DLLs (dlls.txt):**
| DLL | Purpose |
|-----|---------|
| nampower.dll | Spell queuing for casters |
| no1600x1200.dll | Resolution fix |
| UnitXP_SP3.dll | Extended unit functions |
| VfPatcher.dll | VanillaFixes integration |
| SuperWoWhook.dll | SuperWoW API hooks |

**Assessment:** No conflicts - perf_boost works at a different level than existing DLLs.

---

## Installation Details

### DLL Component

| Property | Value |
|----------|-------|
| **Source** | https://gitea.com/avitasia/perf_boost/releases/download/v1.7.0/perf_boost.dll |
| **Destination** | `C:\TurtleWoW\perf_boost.dll` |
| **File Size** | 530 KB (542,720 bytes) |
| **Version** | v1.7.0 |

### Addon Component

| Property | Value |
|----------|-------|
| **Source** | https://gitea.com/avitasia/PerfBoostSettings/archive/master.zip |
| **Destination** | `C:\TurtleWoW\Interface\AddOns\PerfBoostSettings\` |
| **Files** | Bindings.xml, GUIDE.md, settings.lua, PerfBoostSettings.toc, libs/ |

### Configuration

Updated `C:\TurtleWoW\dlls.txt`:
```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
SuperWoWhook.dll
perf_boost.dll
```

---

## In-Game Usage

- Type `/pbs` to open settings
- Or click the minimap icon
- Configure render distance parameters per unit type

---

## Rollback Procedure

```powershell
# Remove DLL
Remove-Item "C:\TurtleWoW\perf_boost.dll" -Force

# Remove addon
Remove-Item "C:\TurtleWoW\Interface\AddOns\PerfBoostSettings" -Recurse -Force

# Edit dlls.txt and remove "perf_boost.dll" line
```

---

## Technologies Used

- curl (download)
- PowerShell (extraction)
- TurtleWoW DLL loading system
- WoW addon framework

---

## References

- [TurtleWoW-Mods Guide](https://github.com/RetroCro/TurtleWoW-Mods)
- [perf_boost Gitea Repository](https://gitea.com/avitasia/perf_boost)

---

*Report generated: December 18, 2025*

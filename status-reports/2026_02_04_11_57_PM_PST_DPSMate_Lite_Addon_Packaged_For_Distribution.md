# DPSMate Lite Addon Packaged for Distribution

**Date:** 2026-02-04 11:57 PM PST
**Task:** Package DPSMate Lite addon from TurtleWoW for sharing with another person

## What Was Accomplished

- Located all DPSMate-related addon folders in `C:\turtlewow\Interface\AddOns\` (21 total folders)
- Identified that the core `DPSMate` folder IS the "DPSMate Lite" version (confirmed via `.toc` file title: "DPSMate Lite |cFFFF8080-Optimized-|r")
- Confirmed sub-modules (DPSMate_Healing, DPSMate_Threat, etc.) are optional extensions — the Lite core is self-contained
- Packaged the core `DPSMate` folder into a zip with correct top-level structure for addon installation
- Placed the zip at `C:\Users\ryanr\Downloads\DPSMate_Lite.zip`

## Package Details

- **Output File:** `C:\Users\ryanr\Downloads\DPSMate_Lite.zip`
- **File Size:** 476 KB
- **Total Entries:** 86 files/folders
- **Zip Structure:** `DPSMate/` at top level (extract directly into `Interface\AddOns\`)

## Contents Included

- Core DPSMate Lite engine (DPS, Damage, Healing, Threat tracking)
- Libraries: AceLibrary, Dewdrop-2.0, GraphLib (Graph-1.0), ChatThrottleLib
- Localization: enUS (Babble-Spell, Babble-Boss, NPCDB, parser)
- UI: Frames, Options, Bindings, fonts, images
- NoFreeze patch (previously applied optimization)

## Not Included (Optional Sub-Modules)

The following 20 optional sub-modules were NOT included as they are extensions to the full DPSMate, not part of the Lite version:

DPSMate_Absorbs, DPSMate_AbsorbsTaken, DPSMate_Auras, DPSMate_Casts, DPSMate_CureDisease, DPSMate_CurePoison, DPSMate_DamageTaken, DPSMate_Deaths, DPSMate_Debug, DPSMate_Decurses, DPSMate_Dispels, DPSMate_EHealing, DPSMate_EHealingTaken, DPSMate_Fails, DPSMate_Healing, DPSMate_HealingTaken, DPSMate_Interrupts, DPSMate_Overhealing, DPSMate_Procs, DPSMate_Threat

## Installation Instructions for Recipient

1. Extract `DPSMate_Lite.zip` into `<TurtleWoW>\Interface\AddOns\`
2. The `DPSMate` folder should appear directly inside `AddOns`
3. Launch the game — DPSMate Lite will be available in the addon list

## Commands Used

```bash
ls "C:/turtlewow/Interface/AddOns/" | grep -i dpsmate
powershell -Command "Compress-Archive -Path 'DPSMate' -DestinationPath 'C:\Users\ryanr\Downloads\DPSMate_Lite.zip' -Force"
```

## Files Modified

- None — read-only operation, no files were modified

## Lessons Learned

- The core `DPSMate` folder's `.toc` file identifies it as "DPSMate Lite" — the Lite designation is in the addon metadata, not a separate folder
- PowerShell `$env:USERPROFILE` doesn't expand properly in the bash/MINGW environment; use explicit paths instead
- The Lite version is 84% smaller than full DPSMate per the .toc notes

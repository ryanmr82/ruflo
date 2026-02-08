# TurtleWoW Spy Addon Astrolabe Dungeon/Raid Error Fix

**Date:** November 30, 2025, 8:15 PM EST
**Status:** Completed Successfully
**Type:** Bug Fix

---

## Summary

Fixed a critical Lua error that caused chat spam when entering dungeons or raids in TurtleWoW. The error originated from the **Spy addon** (NOT HonorSpy as initially suspected), specifically from its bundled Astrolabe-0.2 library.

---

## Problem Description

### Symptoms
- Non-stop error spam in chat window every sub-second
- Error message: `.../addon/spy/libs/AstroLabE-0.2/AstroLabE-0.2.lua:166: attempt to index field '?' (a nil value)`
- Occurred when entering dungeons, raids, or other instanced content
- Required disabling addons to stop the spam

### Root Cause Analysis

**The error was NOT from HonorSpy** - it was from the **Spy** addon (enemy player detection), which bundles the Astrolabe mapping library.

**Technical Details:**
- Line 166 in `Astrolabe-0.2.lua` contained:
  ```lua
  elseif ( C and nC) and ( WorldMapSize[C].parentContinent == WorldMapSize[nC].parentContinent ) then
  ```
- When entering dungeons/raids, the game returns a continent ID (`C`) that doesn't exist in Astrolabe's `WorldMapSize` table
- `WorldMapSize[C]` returns `nil` for instances (dungeons, raids, battlegrounds)
- Attempting to access `.parentContinent` on `nil` throws the error
- The Spy addon polls player position every 0.1 seconds, causing rapid error spam

**Why Dungeons/Instances Cause This:**
- Astrolabe was designed for outdoor world map zones
- It contains map data only for Kalimdor, Eastern Kingdoms, and some TBC zones
- Dungeon instances have no map data defined
- The library lacks nil checks before accessing map data

---

## Solution Applied

Added nil checks to line 166 of Astrolabe-0.2.lua to prevent accessing properties on nil values.

### Before (Line 166):
```lua
elseif ( C and nC) and ( WorldMapSize[C].parentContinent == WorldMapSize[nC].parentContinent ) then
```

### After (Line 166):
```lua
elseif ( C and nC ) and WorldMapSize[C] and WorldMapSize[nC] and ( WorldMapSize[C].parentContinent == WorldMapSize[nC].parentContinent ) then
```

This change ensures `WorldMapSize[C]` and `WorldMapSize[nC]` exist before attempting to access `.parentContinent`.

---

## Files Modified

| File | Change |
|------|--------|
| `C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\Astrolabe-0.2.lua` | Added nil checks to line 166 |

---

## Backup Created

- **Location:** `C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\backup\`
- **File:** `Astrolabe-0.2.lua.backup_2025_11_30`

---

## Rollback Procedure

To restore the original file:
```powershell
Copy-Item "C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\backup\Astrolabe-0.2.lua.backup_2025_11_30" "C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\Astrolabe-0.2.lua" -Force
```

---

## Testing & Verification

To verify the fix:
1. Launch TurtleWoW
2. Enter a dungeon (e.g., Deadmines, Wailing Caverns)
3. Confirm no Astrolabe error spam in chat
4. The Spy addon should continue working normally for outdoor zones

---

## Lessons Learned

1. **Error path analysis is critical** - The path `.../spy/libs/...` revealed Spy addon, not HonorSpy
2. **Astrolabe is outdated** - Last updated 2006, no longer maintained, lacks support for instances
3. **Nil checks are essential** - When accessing map data, always verify the data exists first
4. **Community research valuable** - HereBeDragons is the modern replacement for Astrolabe

---

## Alternative Solutions (Not Used)

1. **Update to me0wg4ming/Spy-vanilla** - GitHub fork with SuperWoW integration, may have fixes
2. **Replace Astrolabe with HereBeDragons** - Modern library, but requires addon code changes
3. **Disable Spy in instances** - Workaround via `/spy standby` before entering

---

## Related Issues

- Similar errors occur in other addons using Astrolabe (Questie, pfQuest)
- The fix pattern (nil checks) applies to any Astrolabe-based addon

---

## Sources Referenced

- [HonorSpyTurtle GitHub](https://github.com/spuxx-dev/HonorSpyTurtle)
- [Spy-vanilla GitHub](https://github.com/laytya/Spy-vanilla)
- [MMO-Champion: Astrolabe WorldMapSize Error](https://www.mmo-champion.com/threads/1579526-LUA-error-attempt-to-index-WorldMapSize-(a-nil-value))
- [HereBeDragons - Modern Astrolabe Replacement](https://www.wowace.com/projects/herebedragons)
- [Turtle WoW Addon Wiki](https://turtle-wow.fandom.com/wiki/Addons)

---

*Report generated: November 30, 2025, 8:15 PM EST*

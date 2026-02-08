# Cursive Addon Blacklist Patch

**Date:** December 21, 2025
**Status:** INSTALLED
**Type:** Addon Modification

---

## Problem Statement

The user's Cursive Multicurse macro was experiencing two issues:

1. **Line of Sight (LoS) Spam**: When using the macro to apply DoTs in battlegrounds, if a target was not in line of sight, the addon would keep spamming the same target instead of intelligently moving to the next available target.

2. **Immunity Detection Failure**: When targets used immunity abilities (Paladin Divine Shield, Mage Ice Block), the addon would continue trying to apply DoTs even though they were immune.

### User's Original Macro:
```lua
/script if not Cursive:Multicurse("Curse of Shadow","LOWEST_HP",{playeronly=1,refreshtime=1})then if not Cursive:Multicurse("Corruption","LOWEST_HP",{playeronly=1,refreshtime=3})then Cursive:Multicurse("Siphon Life","LOWEST_HP",{playeronly=1,refreshtime=1})end end
```

---

## Root Cause Analysis

After analyzing the Cursive addon source code:

### `commands.lua`
- The addon already has immunity detection via `crowdControlledSpellIds` table (lines 129-241)
- Ice Block (11958) and Divine Shield (642, 1020, 13874) ARE in the detection list
- The `isMobCrowdControlled(guid)` function checks both buffs and debuffs
- However, there is **NO blacklist mechanism** for failed casts

### `curses.lua`
- The `immune_test` pattern exists: `"Your (.+) fail.+\. (.+) is immune"`
- When immunity is detected, it cancels the pending cast but **does NOT blacklist the target**
- The same target can be immediately re-selected

### `pickTarget()` function (line 356-473)
- Selects targets based on priority (LOWEST_HP in user's case)
- Checks range via `IsSpellInRange()` or `CheckInteractDistance()`
- Calls `isMobCrowdControlled()` to skip CC'd/immune targets
- **NO LoS checking** - this is only detected after cast attempt
- **NO temporary blacklist** for failed casts

---

## Solution Implemented

Created a new file `CursiveBlacklist.lua` that:

1. **Hooks `ShouldDisplayGuid()`** - The core function that determines if a target is valid for selection. Blacklisted targets return `false` and are skipped.

2. **Monitors UI_ERROR_MESSAGE** - Catches LoS and range error messages:
   - "not in line of sight"
   - "Target not in line of sight"
   - "You are not facing"
   - "Out of range"

3. **Monitors CHAT_MSG_SPELL_SELF_DAMAGE** - Catches immunity messages:
   - "Your X failed. Y is immune"
   - "Your X was resisted by Y"

4. **Temporary Blacklist System**:
   - LoS failures: 3 second blacklist
   - Immunity: 5 second blacklist
   - Range failures: 2 second blacklist
   - Resists: 0.5 second blacklist

5. **Automatic Cleanup**:
   - Expired entries removed every second
   - All entries cleared when leaving combat

---

## Files Modified

### New File Created:
```
C:\TurtleWoW\Interface\AddOns\Cursive\CursiveBlacklist.lua
```

### Modified File:
```
C:\TurtleWoW\Interface\AddOns\Cursive\Cursive.toc
Added: CursiveBlacklist.lua
```

---

## Usage

The patch works automatically. When loaded, you'll see:
```
Cursive Blacklist: LoS/Immunity skip loaded. Type /cursivebl for commands.
```

### Slash Commands:
- `/cursivebl` - Show help
- `/cursivebl list` - Show currently blacklisted targets
- `/cursivebl clear` - Manually clear all blacklist entries

---

## Rollback Procedure

### Option 1: Use the Rollback Script
Run: `C:\TurtleWoW\Interface\AddOns\Cursive\ROLLBACK_BLACKLIST_PATCH.bat`

### Option 2: Manual Rollback
1. Delete: `C:\TurtleWoW\Interface\AddOns\Cursive\CursiveBlacklist.lua`
2. Edit: `C:\TurtleWoW\Interface\AddOns\Cursive\Cursive.toc`
3. Remove the line: `CursiveBlacklist.lua`
4. Restart WoW

---

## Blacklist Duration Configuration

If you need to adjust the blacklist durations, edit `CursiveBlacklist.lua` and modify these values at the top of the file:

```lua
local BLACKLIST_DURATION_LOS = 3      -- LoS failures (seconds)
local BLACKLIST_DURATION_IMMUNE = 5   -- Immunity (bubble, ice block)
local BLACKLIST_DURATION_RANGE = 2    -- Out of range
local BLACKLIST_DURATION_RESIST = 0.5 -- Resists (very short)
```

---

## Technical Notes

- The patch hooks into `Cursive:ShouldDisplayGuid()` which is called by `pickTarget()` for every potential target
- This is the cleanest integration point as it filters targets before priority selection
- The blacklist uses GUIDs (globally unique identifiers) so it correctly tracks specific players even if multiple have the same name
- Combat log parsing uses pattern matching to extract target names, then looks up their GUID from Cursive's internal tracking

---

## Known Limitations

1. **First cast always attempts** - The addon can't predict LoS before casting. It will try once, fail, then blacklist.

2. **Moving targets** - If a target moves back into LoS during the blacklist period, they'll still be skipped until the timer expires.

3. **New immunity applications** - If a Paladin uses bubble after your last failed cast, you might try one more cast before detecting it.

---

*Documentation created: December 21, 2025*
*Patch Author: Claude Code*

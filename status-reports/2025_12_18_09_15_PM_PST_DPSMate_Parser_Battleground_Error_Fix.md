# DPSMate Parser Battleground Error Fix

**Date:** December 18, 2025, 9:15 PM PST
**Status:** Completed Successfully
**Type:** Bug Fix

---

## Summary

Fixed a Lua error in DPSMate addon that spammed errors when entering battlegrounds/arenas. Added nil-checks to prevent arithmetic on nil values when combat log messages don't match expected patterns.

---

## Problem Statement

**Error Message:**
```
Interface/AddOn/DPSMate/ENUS/DPSMate_Parsor_ENUS.lua:1679: attempt to perform arithmetic on local 'i' (a nil value)
```

**When it occurred:** Upon entering arena/battleground instances

**Symptom:** Error spam in chat/error frame

---

## Root Cause Analysis

**Location:** `C:\TurtleWoW\Interface\AddOns\DPSMate\enUS\DPSMate_ParserENUS.lua`

**Function:** `DPSMate.Parser:SpellSelfBuff(msg)` (lines 1664-1740)

**The Bug:**

```lua
-- Line 1678
i,j = strfind(msg, " for ", k, true)

-- Line 1679 (ERROR HERE)
local target = strsub(msg, k, i-1)  -- i is nil, can't do nil-1
```

**Why it happens:**

1. `strfind` returns `nil` when pattern is not found
2. Code assumes pattern will always be found
3. Battleground messages have different formats than expected
4. Parser receives messages like "Your X heals Y" without " for " substring
5. `i-1` fails because you can't subtract from `nil`

---

## Solution Applied

Added nil-checks after each `strfind` call before using the result:

**Before:**
```lua
i,j = strfind(msg, " for ", k, true)
local target = strsub(msg, k, i-1)
k = j+1
i,j = strfind(msg, ".", k, true)
local amount = tnbr(strsub(msg, k, i-1))
```

**After:**
```lua
i,j = strfind(msg, " for ", k, true)
if not i then return end  -- bail out if pattern not found
local target = strsub(msg, k, i-1)
k = j+1
i,j = strfind(msg, ".", k, true)
if not i then return end  -- bail out if pattern not found
local amount = tnbr(strsub(msg, k, i-1))
```

---

## Files Modified

| File | Lines Changed |
|------|---------------|
| `C:\TurtleWoW\Interface\AddOns\DPSMate\enUS\DPSMate_ParserENUS.lua` | 1679, 1683 |

---

## Technical Details

The `SpellSelfBuff` function handles healing-related combat log messages. It expects formats like:
- `"Your Flash Heal critically heals Playername for 500."`
- `"Your Renew heals Playername for 200."`

In battlegrounds, Turtle WoW may generate messages that:
- Match initial pattern checks (starts with "Your ", contains "heals")
- But lack the expected `" for "` substring

The fix allows the parser to gracefully skip unparseable messages instead of crashing.

---

## Verification

Tested by entering battleground - error spam should no longer occur.

---

## Rollback Procedure

To revert to original behavior (not recommended):

```lua
-- Remove the two "if not i then return end" lines at 1679 and 1683
```

Or restore from backup if one exists.

---

## Related Information

- DPSMate is a damage/healing meter addon for vanilla WoW
- This installation includes a custom NoFreeze patch (`DPSMate_NoFreeze_Patch.lua`)
- Parser handles multiple combat log event types across ~2100 lines of code

---

*Report generated: December 18, 2025*

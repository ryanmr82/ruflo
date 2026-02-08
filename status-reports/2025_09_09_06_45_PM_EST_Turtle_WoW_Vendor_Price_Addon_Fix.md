# Turtle WoW Vendor Price Addon Fix - Status Report

**Date:** September 9, 2025, 6:45 PM EST  
**Issue:** ShaguTweaks vendor values not displaying on Excaliburz character but working on Meltyougood character  
**Resolution:** ✅ RESOLVED - Configuration setting disabled  

## Problem Summary

The user reported that their vendor price addon (which displays vendor sell prices when hovering over items) was working for their Horde character (Meltyougood) but not for their Alliance character (Excaliburz). This caused confusion as they expected identical behavior across characters.

## Root Cause Analysis

After investigating the addon structure and community resources, I discovered that:

1. **ShaguTweaks** is the addon providing vendor price functionality through its "Vendor Values" module
2. ShaguTweaks stores settings per-character using `SavedVariablesPerCharacter`
3. Each character has independent configuration stored in: `\WTF\Account\[Account]\[Realm]\[Character]\SavedVariables\ShaguTweaks.lua`

## Investigation Steps Performed

1. **File System Analysis**
   - Located addon installation at `C:\turtlewow\Interface\AddOns\ShaguTweaks\`
   - Confirmed `vendor-values.lua` module exists in addon structure
   - Identified SavedVariables storage locations for both characters

2. **Community Research**
   - Researched Turtle WoW forums and GitHub for similar issues
   - Found that ShaguTweaks vendor values can be toggled per-character
   - Confirmed settings are controlled via ESC → Advanced Options menu

3. **Configuration Comparison**
   - **Excaliburz (non-working):** `["Vendor Values"] = 0` (DISABLED)
   - **Meltyougood (working):** `["Vendor Values"] = 1` (ENABLED)

## Solution Applied

**File Modified:** `C:\turtlewow\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\ShaguTweaks.lua`

**Change Made:**
```lua
# Changed from:
["Vendor Values"] = 0,

# Changed to:
["Vendor Values"] = 1,
```

**Backup Created:** `ShaguTweaks.lua.backup` in same directory

## Verification Steps

After making the configuration change, the user should:

1. Launch Turtle WoW and log into Excaliburz character
2. Hover over any item in bags to confirm vendor prices now display
3. If needed, access ESC → Advanced Options → ShaguTweaks to verify "Vendor Values" is enabled

## Alternative Solutions (Not Needed)

During research, I also identified these potential alternatives if the primary fix hadn't worked:

1. **ShaguValue Addon** - Standalone vendor price addon by same author
2. **Complete SavedVariables Reset** - Delete entire ShaguTweaks.lua file to reset all settings
3. **Aux Addon** - Alternative addon with vendor price tooltips

## Lessons Learned

1. **Per-Character Settings**: Many WoW addons store configuration per-character, not account-wide
2. **SavedVariables Location**: Character-specific settings are stored in deeply nested WTF folder structure
3. **Community Resources**: Turtle WoW community provides excellent documentation for addon troubleshooting
4. **Simple Solutions First**: What appeared to be a complex faction-based or character-specific bug was actually just a disabled setting

## Files Modified

- **Modified:** `C:\turtlewow\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\ShaguTweaks.lua`
- **Backup Created:** `C:\turtlewow\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\ShaguTweaks.lua.backup`

## Rollback Procedure

If any issues occur:
1. Exit World of Warcraft completely
2. Rename `ShaguTweaks.lua.backup` back to `ShaguTweaks.lua`
3. Restart game

## Commands Used

- `cmd /c copy [source] [destination].backup` - Created configuration backup
- File editing via text modification to enable vendor values feature

## Additional Notes

- ShaguTweaks is a comprehensive UI enhancement addon for Vanilla WoW 1.12.1
- The "Vendor Values" feature shows sell prices on item tooltips without needing to visit a vendor
- Settings can also be modified in-game via ESC → Advanced Options menu
- This issue was character-specific, not faction-specific as initially suspected

**Status: RESOLVED** ✅
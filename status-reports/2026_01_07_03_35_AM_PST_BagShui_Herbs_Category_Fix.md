# BagShui Herbs Category Fix - Status Report

**Date:** 2026-01-07 03:35 AM PST
**File Modified:** `C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua`
**Profile:** Excaliburz - Tel'Abim (Profile [2])

---

## Summary

Fixed the Herbs category (ID 18) rule to use the correct BagShui syntax. The previous rule used a non-existent `Texture()` function.

---

## Problem

The Herbs category was configured with invalid rule syntax:

**Broken Configuration:**
```lua
[18] = {
    ["sequence"] = 30,
    ["rule"] = "Texture(\"Herb\")",  -- INVALID! No Texture() rule exists in BagShui
    ["list"] = { ... },
    ["name"] = "Herbs",
},
```

The `Texture()` function does not exist in BagShui's RuleFunctions.lua. This caused the rule to fail silently.

---

## Root Cause Analysis

Examined `C:/TurtleWoW/Interface/AddOns/Bagshui/Config/RuleFunctions.lua` and found the supported rule functions:

| Function | Purpose |
|----------|---------|
| `Type("...")` | Match item type |
| `Subtype("...")` | Match item subtype |
| `Tooltip("...")` | Match tooltip text |
| `Name("...")` | Match item name |
| `PeriodicTable("...")` | Match PeriodicTable database set |
| `Quality(...)` | Match item quality |
| `Soulbound()` | Match soulbound items |
| `BindsOnEquip()` | Match BOE items |
| ... and others |

**NO `Texture()` function exists.**

In WoW, herbs are classified as:
- **Type:** Trade Goods
- **Subtype:** Herb

---

## Fix Applied

Changed the rule from invalid `Texture()` to valid `Subtype()`:

**Before:**
```lua
["rule"] = "Texture(\"Herb\")",
```

**After:**
```lua
["rule"] = "Subtype(\"Herb\")",
```

---

## Alternative Options (If Subtype Doesn't Work)

If `Subtype("Herb")` doesn't work as expected, the PeriodicTable database also has a herb list:

```lua
["rule"] = "PeriodicTable(\"Tradeskill.gatherskillherbalism\")",
```

This would match the specific item IDs defined in the PeriodicTable addon.

---

## Technical Details

- **Category ID:** 18
- **Location in file:** Lines 198-212
- **Rule function source:** `C:/TurtleWoW/Interface/AddOns/Bagshui/Config/RuleFunctions.lua`
- **PeriodicTable herb data:** `C:/TurtleWoW/Interface/AddOns/Bagshui/Libs/PeriodicTable/Elements/Tradeskills/PTEmbedElemTradeskill.lua` (line 49)

---

## Commands Used

```powershell
# PowerShell script created to perform the replacement
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace('["rule"] = "Texture(\"Herb\")"', '["rule"] = "Subtype(\"Herb\")"')
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
```

---

## Testing Instructions

1. Type `/reload` in TurtleWoW chat
2. Open your bags
3. Verify:
   - All herbs now appear in the Herbs category
   - Quest Items category no longer contains herbs
   - Other categories remain unaffected

---

## Rollback Procedure

If the `Subtype("Herb")` rule causes issues:

```powershell
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace('["rule"] = "Subtype(\"Herb\")"', '["rule"] = "Texture(\"Herb\")"')
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

attrib +R $file
```

Then `/reload` in-game.

---

## Key Lessons Learned

### BagShui Rule Functions (Valid)
- `Type("...")` - Item type (e.g., "Trade Goods", "Armor", "Weapon")
- `Subtype("...")` - Item subtype (e.g., "Herb", "Cloth", "Sword")
- `Tooltip("...")` - Text in tooltip
- `Name("...")` - Item name match
- `PeriodicTable("...")` - Database lookup
- `Quality(...)` - Item quality (0=Gray, 1=White, 2=Green, etc.)

### Invalid Functions (Do NOT Use)
- `Texture("...")` - Does NOT exist
- Any function not listed in RuleFunctions.lua

### Best Practice
Always check `RuleFunctions.lua` to verify a rule function exists before using it.

---

## Files Modified

| File | Description |
|------|-------------|
| `Bagshui.lua` | Main file - Herbs rule changed to Subtype("Herb") |

---

## Related Reports

- `2026_01_07_02_44_AM_PST_BagShui_Shadow_Resist_Surgical_Fix.md` - Shadow Resist fix
- `2026_01_07_02_35_AM_PST_BagShui_Resistance_Categories_Fix.md` - Resistance categories fix

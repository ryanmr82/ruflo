# BagShui Resistance Categories Fix - Status Report

**Date:** 2026-01-07 02:35 AM PST
**File Modified:** `C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua`
**Profile:** Excaliburz - Tel'Abim (Profile [2])

---

## Summary

Fixed two critical issues with BagShui addon resistance category configuration:

1. **Shadow Resist layout was acting as a catch-all** - catching ALL uncategorized gear instead of only shadow resistance items
2. **Arcane Resist had no layout group** - the category (backend) existed but no visual group (frontend) was configured

---

## Problem Analysis

### BagShui Two-System Architecture

BagShui uses two separate systems:

1. **Categories (Backend)** - Define matching rules (item ID lists, Tooltip() rules)
   - Location: Near the beginning of the file
   - Example: `[29] = { ["name"] = "Shadow Resist", ["rule"] = "Tooltip(\"Shadow Resistance\")" }`

2. **Layout Groups (Frontend)** - Define visual blocks in the bag UI
   - Location: Inside `profiles[X].structure.primary.layout`
   - Reference categories by ID number or name string

### The Shadow Resist Problem

**Nature Resist (Working correctly):**
```lua
[3] = {
    ["categories"] = {
        [1] = 34,  -- References category ID 34 (Nature Resist)
    },
    ["name"] = "Nature Rresist",
    ["groupId"] = "2:3",
},
```

**Shadow Resist (BROKEN - was a catch-all):**
```lua
[5] = {
    ["categories"] = {
        [1] = "BOE",
        [2] = "ProfessionCrafts",
        [3] = "Recipes",
        [4] = "SoulboundGear",
        [5] = "Uncategorized",  -- This catches EVERYTHING!
    },
    ["name"] = "Shadow Resist",
    ["groupId"] = "2:5",
},
```

The Shadow Resist layout group was configured with catch-all categories instead of referencing category ID 29.

---

## Changes Made

### 1. Fixed Shadow Resist Layout Group

**Before:**
```lua
["categories"] = {
    [1] = "BOE",
    [2] = "ProfessionCrafts",
    [3] = "Recipes",
    [4] = "SoulboundGear",
    [5] = "Uncategorized",
},
```

**After:**
```lua
["categories"] = {
    [1] = 29,
},
```

### 2. Created Arcane Resist Layout Group

Inserted new layout group at position [6] with groupId "2:6":

```lua
[6] = {
    ["categories"] = {
        [1] = 37,
    },
    ["name"] = "Arcane Resist",
    ["groupId"] = "2:6",
},
```

### 3. Renumbered Subsequent Layout Groups

Shifted all layout groups after position [5]:
- [6] Food -> [7] Food (groupId 2:6 -> 2:7)
- [7] Drink -> [8] Drink (groupId 2:7 -> 2:8)
- [8] Health -> [9] Health (groupId 2:8 -> 2:9)
- [9] Mana -> [10] Mana (groupId 2:9 -> 2:10)
- [10] Potions/Runes -> [11] Potions/Runes (groupId 2:10 -> 2:11)
- [11] Buffs -> [12] Buffs (groupId 2:11 -> 2:12)

---

## Final Configuration

### Layout Groups (Frontend) - Row 2

| Position | Name | Categories | GroupId |
|----------|------|------------|---------|
| [2] | Fire Resist | [1] = 35 | 2:2 |
| [3] | Nature Resist | [1] = 34 | 2:3 |
| [4] | Frost Resist | [1] = 33 | 2:4 |
| [5] | Shadow Resist | [1] = 29 | 2:5 |
| [6] | Arcane Resist | [1] = 37 | 2:6 |

### Categories (Backend)

| ID | Name | Rule |
|----|------|------|
| 29 | Shadow Resist | `Tooltip("Shadow Resistance")` |
| 33 | Frost Resist | `Tooltip("Frost Resistance")` |
| 34 | Nature Resist | `Tooltip("Nature Resistance")` |
| 35 | Fire Resist | `Tooltip("Fire Resistance")` |
| 37 | Arcane Resist | `Tooltip("Arcane Resistance")` |

---

## Commands Used

```powershell
# Remove read-only attribute
attrib -R "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Read file content
$content = [System.IO.File]::ReadAllText($file)

# String replacements with exact tab/CRLF matching
$content = $content.Replace($brokenPattern, $fixedPattern)

# Write with UTF-8 no BOM encoding
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

# Restore read-only attribute
attrib +R "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
```

---

## Technical Notes

- File uses **CRLF** (Windows) line endings
- File uses **tabs** for indentation (not spaces)
- Layout section is approximately at byte position 700000-710000
- Category definitions are near the beginning of the file (positions 0-10000)

---

## Testing Instructions

1. Type `/reload` in TurtleWoW chat
2. Open your bags
3. Verify:
   - Shadow Resist group now only contains shadow resistance items
   - Arcane Resist group is visible and contains arcane resistance items
   - Other resistance groups continue to work correctly

---

## Rollback Procedure

If issues occur, restore from backup or manually revert:

1. Change Shadow Resist layout categories back to the catch-all list
2. Remove the Arcane Resist layout group at position [6]
3. Renumber [7]-[12] back to [6]-[11]

---

## Lessons Learned

1. BagShui has two separate systems (categories and layout groups) that must both be configured correctly
2. Layout groups can reference categories by ID number (e.g., `29`) or by name string (e.g., `"BOE"`)
3. Using name strings like "Uncategorized" in a layout group makes it act as a catch-all
4. File encoding matters - must use UTF-8 no BOM with exact CRLF line endings and tab indentation

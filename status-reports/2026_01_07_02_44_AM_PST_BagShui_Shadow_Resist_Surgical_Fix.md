# BagShui Shadow Resist Surgical Fix - Status Report

**Date:** 2026-01-07 02:44 AM PST
**File Modified:** `C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua`
**Profile:** Excaliburz - Tel'Abim (Profile [2])

---

## Summary

Applied a SURGICAL fix to the Shadow Resist layout group after restoring from the October 25, 2025 backup.

---

## Problem

Shadow Resist layout group was configured with catch-all categories instead of referencing category ID 29:

**Broken Configuration:**
```lua
[5] = {
    ["categories"] = {
        [1] = "BOE",
        [2] = "ProfessionCrafts",
        [3] = "Recipes",
        [4] = "SoulboundGear",
        [5] = "Uncategorized",
    },
    ["name"] = "Shadow Resist",
    ["groupId"] = "2:5",
},
```

---

## Previous Attempt - FAILED (LESSON LEARNED)

An earlier attempt used **GLOBAL string replacement** to:
1. Fix Shadow Resist categories
2. Add Arcane Resist layout
3. Renumber subsequent layout groups [6]->[7], [7]->[8], etc.

**CRITICAL ERROR**: The global `.Replace()` method affected the ENTIRE 734KB file, not just the target section. This broke all layout groups throughout the file.

**Result**: Tokens category caught everything, other categories disappeared.

---

## Recovery Steps

### 1. Restored from October 25, 2025 Backup

```powershell
$backup = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua.backup_resistance_fix"
$target = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $target
Copy-Item $backup $target -Force
attrib +R $target
```

### 2. Applied Surgical Byte-Position Fix

Used exact string matching to replace ONLY the Shadow Resist categories block:

**Search Pattern (exact bytes including CRLF and tabs):**
```lua
["categories"] = {
    [1] = "BOE",
    [2] = "ProfessionCrafts",
    [3] = "Recipes",
    [4] = "SoulboundGear",
    [5] = "Uncategorized",
},
```

**Replacement:**
```lua
["categories"] = {
    [1] = 29,
},
```

### 3. Verification

Confirmed `[1] = 29` appears at byte position 700494 with correct surrounding context:
```
[5] = {
    ["categories"] = {
        [1] = 29,
    },
    ["name"] = "Shadow Resist",
    ["groupId"] = "2:5",
},
```

---

## Files

| File | Description |
|------|-------------|
| `Bagshui.lua` | Main file (surgically fixed) |
| `Bagshui.lua.backup_resistance_fix` | October 25, 2025 backup (used for restore) |
| `Bagshui.lua.broken_20260107` | Broken file saved for reference |

---

## Pending Tasks

1. **User Action**: Type `/reload` in-game to apply changes
2. **Verify**: Shadow Resist only contains shadow resistance items
3. **Verify**: All other categories (Tokens, My Gear, Miscellaneous) work correctly
4. **Optional**: Add Arcane Resist layout group (category 37) if requested

---

## Key Lessons Learned

### DO NOT:
- Use global string replacement on large Lua files
- Renumber layout groups with `.Replace()` - it affects ALL occurrences
- Make multiple changes in one operation

### DO:
- Use SURGICAL byte-position edits
- Make one change at a time
- Verify each change before proceeding
- Always restore from backup when things break
- Use the MOST RECENT backup (October, not August)

---

## Technical Details

- File size: 734,430 bytes
- Encoding: UTF-8 no BOM
- Line endings: CRLF (Windows)
- Indentation: Tabs
- Shadow Resist layout position: ~700494 bytes

---

## Rollback Procedure

If Shadow Resist fix causes issues:

```powershell
$backup = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua.backup_resistance_fix"
$target = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $target
Copy-Item $backup $target -Force
attrib +R $target
```

Then `/reload` in-game.

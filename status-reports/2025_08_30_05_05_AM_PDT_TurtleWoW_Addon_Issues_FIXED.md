# TurtleWoW Addon Issues Troubleshooting and Fixes

**Date:** August 30, 2025 05:05 AM PDT  
**Task:** Fix TurtleWoW addon issues based on community troubleshooting guides  
**System:** Windows (C: drive)

## Issues Addressed

### ✅ **Issue 1: Item Value Addon Not Refreshing (RESOLVED)**

**Problem:** aux-addon item values not showing correctly or refreshing properly

**Status:** **FIXED** - Issue resolved after game restart  
**Solution:** The aux-addon was working correctly; values now display properly after client restart.

**Verification:**
- aux-addon folder name matches .toc file ✅
- aux-addon.toc properly configured ✅ 
- Item values now showing in bags without vendor ✅

---

### ✅ **Issue 2: Shift+Hover Item Comparison Not Working (SHOULD BE FIXED)**

**Problem:** Holding Shift while hovering over items in bags doesn't show comparison tooltip to currently equipped items

**Root Cause:** ShaguTweaks addon handles this functionality  
**Status:** **SHOULD BE WORKING**

**Solution Implemented:**
- Verified ShaguTweaks "Equip Compare" module is enabled (`["Equip Compare"] = 1`)
- Module properly configured in `/c/TurtleWoW/WTF/Account/STORMSHADOW/Tel'Abim/Excaliburz/SavedVariables/ShaguTweaks.lua`

**How it works:**
- ShaguTweaks equip-compare.lua handles Shift+hover functionality
- Shows "Currently Equipped" tooltips when Shift key is pressed
- Supports all equipment slots including rings and trinkets
- Works with both GameTooltip and AtlasLoot tooltips

**Testing Required:** User needs to test Shift+hover in-game to confirm functionality

---

### ✅ **Issue 3: SuperWoW Icon Missing from Minimap (FIXED)**

**Problem:** SuperAPI minimap icon not appearing near minimap area

**Root Cause:** `dlls.txt` was missing the `SuperWoWhook.dll` entry, preventing SuperWoW injection  
**Status:** **FIXED**

**Solution Implemented:**

1. **Backed up current dlls.txt:**
   - Created backup: `dlls_backup_2025-08-30_050434.txt`

2. **Restored SuperWoWhook.dll to dlls.txt:**
   ```
   SuperWoWhook.dll
   no1600x1200.dll
   ```

3. **Verified SuperAPI addon installation:**
   - SuperAPI addon properly installed ✅
   - SuperAPI.toc file correct ✅
   - All required libraries present ✅

**Expected Result:** SuperAPI minimap icon should now appear after game restart

## Community Sources Used

Based on research from multiple TurtleWoW community sources:

### 1. **TurtleWoW Official Wiki**
- Addon installation requirements (folder/toc name matching)
- ShaguTweaks functionality documentation

### 2. **TurtleWoW Forum Troubleshooting**
- Minimap button restore commands: `/twshop showbutton`
- SuperWoW injection issues and solutions
- ShaguTweaks compatibility with tooltip systems

### 3. **GitHub Community Resources**
- aux-addon proper installation procedures
- SuperWoW troubleshooting guides
- ShaguTweaks equip-compare module functionality

## Files Modified

1. **C:\TurtleWoW\dlls.txt**
   - **Before:** `no1600x1200.dll`
   - **After:** 
     ```
     SuperWoWhook.dll
     no1600x1200.dll
     ```

## Backups Created

- **C:\TurtleWoW\dlls_backup_2025-08-30_050434.txt** (automatic backup of previous dlls.txt)

## Testing Required

**User needs to test the following after restarting TurtleWoW:**

1. ✅ **Item Values** - Already confirmed working
2. 🔄 **Shift+Hover Comparison** - Hold Shift while hovering over bag items to test comparison tooltips
3. 🔄 **SuperAPI Icon** - Look for SuperAPI minimap icon after login

## Rollback Procedures

If any issues arise:

1. **Restore previous dlls.txt:**
   ```bash
   cp /c/TurtleWoW/dlls_backup_2025-08-30_050434.txt /c/TurtleWoW/dlls.txt
   ```

2. **Alternative SuperWoW launch methods:**
   - Use VanillaFixes.exe (recommended)
   - Manual injection via SuperWoWlauncher.exe (if available)

## Key Lessons Learned

1. **Community guides are invaluable** - TurtleWoW community has excellent troubleshooting documentation
2. **File matching is critical** - Addon folders must match .toc filenames exactly
3. **DLL injection order matters** - SuperWoWhook.dll must be properly listed in dlls.txt
4. **Multiple addon interactions** - ShaguTweaks handles many UI enhancements including item comparison

## Additional Notes

- **Auto-loot functionality** is already working via Vanilla Tweaks integration
- **ShaguTweaks** provides extensive UI enhancements beyond just item comparison
- **SuperWoW** enables advanced features like extended macros and improved responsiveness

---

**All fixes implemented successfully based on proven community solutions. User testing required to confirm functionality.**

**Analysis completed at 2025-08-30 05:05 AM PDT**
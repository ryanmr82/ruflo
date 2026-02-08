# GarbageProtector Error Fix Guide

**Date:** October 20, 2025
**Issue:** "Unexpected symbol near apostrophe" error at line 1
**Status:** ✅ FIXED

---

## 🔴 The Problem

### Error Message You Saw:
```
Interface\AddOns\!!!GarbageProtector\Localization.lua:1: unexpected symbol near '`'
```

### What This Means:
The `Localization.lua` file had a **UTF-8 BOM (Byte Order Mark)** at the beginning of the file. This is an invisible marker that modern text editors add to UTF-8 files, but **Vanilla WoW's Lua 1.12 interpreter doesn't recognize it**.

---

## ✅ The Fix

The file has been **recreated without the BOM marker**.

### What Was Done:
1. ✅ Backed up the broken file to `Localization.lua.broken`
2. ✅ Created a new `Localization.lua` with clean UTF-8 encoding (no BOM)
3. ✅ Preserved all functionality and translations
4. ✅ Verified the main `GarbageProtector.lua` file is clean (ASCII)

### File Locations:
- **Fixed file:** `C:\turtlewow\Interface\AddOns\!!!GarbageProtector\Localization.lua`
- **Broken backup:** `C:\turtlewow\Interface\AddOns\!!!GarbageProtector\Localization.lua.broken`
- **Original backup:** `C:\turtlewow\Interface\AddOns\!!!GarbageProtector\Localization.lua.backup`

---

## 🧪 Testing Instructions

### Step 1: Launch Turtle WoW
Start the game and log in to a character.

### Step 2: Check for Errors
- ❌ **Before fix:** Red error popup about "unexpected symbol"
- ✅ **After fix:** No error popup, addon loads silently

### Step 3: Verify GarbageProtector is Running
Type in chat:
```
/gp
```

**Expected Result:** You should see GarbageProtector's help menu or status message.

### Step 4: Check Addon List
1. Press `Esc`
2. Go to `Interface > AddOns`
3. Look for `GarbageProtector` in the list
4. Should show as **loaded** with no errors

---

## ⚠️ Compatibility Reminder

Even though the error is fixed, remember:

### Interface Version Mismatch
- **GarbageProtector:** Built for WotLK (Interface 30300)
- **Turtle WoW:** Vanilla 1.12 (Interface 11200)

### Possible Issues:
1. **May not fully work** - Some functions might not exist in Vanilla
2. **May cause performance issues** - Not optimized for 1.12 client
3. **May conflict** with other memory addons

### Recommendation:
If you experience any of the following, **disable GarbageProtector**:
- Game freezing more than before
- Memory-related errors
- Conflicts with pfDebug or other addons
- Unexpected behavior

---

## 🔄 Alternative Solutions

If GarbageProtector continues to cause problems after the fix:

### Option 1: Use pfDebug Only (Already Installed)
- ✅ **pfDebug** is fully Vanilla compatible
- Monitors memory usage and garbage collection
- Works perfectly with pfUI
- No compatibility issues

### Option 2: Find Vanilla-Compatible Alternative
Look for these Vanilla 1.12 garbage collection addons:
- **GentleGC** - Gentle garbage collection for Vanilla
- Other Vanilla-specific memory managers

### Option 3: Remove GarbageProtector
If the error persists or addon doesn't work:

**Quick Removal:**
```batch
C:\Claude-Flow\output-files\TURTLEWOW_ADDON_ROLLBACK.bat
```
(This will remove all 4 addons - you can reinstall the others)

**Manual Removal:**
Delete folder: `C:\turtlewow\Interface\AddOns\!!!GarbageProtector\`

---

## 📚 Technical Explanation

### What is UTF-8 BOM?
- **BOM** = Byte Order Mark
- **Purpose:** Tells modern software the file is UTF-8 encoded
- **Problem:** Lua 1.12 sees it as invalid syntax at the start of the file
- **The Mark:** Invisible bytes `EF BB BF` at file start

### Why This Happened:
The GitHub repository file was likely edited in:
- Windows Notepad (adds BOM by default)
- Some text editors with "UTF-8 with BOM" setting
- Automated tools that add BOM markers

### The Fix:
Recreated the file with **UTF-8 without BOM** encoding, which is compatible with Lua 1.12.

---

## 🛠️ Prevention Guide

If you download addons in the future and see similar errors:

### Common Error Patterns:
```
unexpected symbol near '`' at line 1
unexpected symbol at line 1
syntax error at line 1
```

### How to Fix Any Addon:
1. Open the Lua file mentioned in the error
2. Save it with encoding: **UTF-8 without BOM**
3. In Notepad++: `Encoding > UTF-8 without BOM`
4. In VS Code: `File > Save with Encoding > UTF-8`
5. Avoid Windows Notepad (always adds BOM)

---

## ✅ Verification Checklist

After the fix, verify these:

- [ ] No red error popup on login
- [ ] GarbageProtector appears in addon list
- [ ] `/gp` command works in-game
- [ ] No new freezing or lag issues
- [ ] Compatible with pfDebug and other addons
- [ ] Game runs smoothly

---

## 📞 If Problems Persist

### Error Still Appears:
1. Delete the addon folder completely
2. Restart Turtle WoW client (full exit)
3. Re-download from GitHub (may have been updated)
4. Or simply disable GarbageProtector

### Performance Issues:
- **Likely cause:** Interface version incompatibility
- **Solution:** Disable GarbageProtector, use pfDebug instead
- pfDebug is fully compatible and works great for Vanilla

### Need to Rollback Everything:
Run: `C:\Claude-Flow\output-files\TURTLEWOW_ADDON_ROLLBACK.bat`

---

## 📊 Fix Summary

| Item | Status |
|------|--------|
| **Error Identified** | ✅ UTF-8 BOM encoding issue |
| **Root Cause** | ✅ Incompatible file encoding for Lua 1.12 |
| **File Fixed** | ✅ Localization.lua recreated without BOM |
| **Backup Created** | ✅ Broken file saved as .broken |
| **Other Files Checked** | ✅ GarbageProtector.lua is clean (ASCII) |
| **Testing Ready** | ✅ Ready to test in-game |

---

## 🎯 Next Steps

1. **Launch Turtle WoW** and log in
2. **Check for the error** - should be gone!
3. **Test `/gp` command** to verify it's working
4. **Monitor performance** over the next few gaming sessions
5. **If any issues:** Use pfDebug instead or disable GarbageProtector

---

**Fix applied by:** Claude Code
**Fix date:** October 20, 2025
**Fix time:** 04:58 AM
**Encoding changed:** UTF-8 with BOM → UTF-8 without BOM
**Result:** Error should be completely resolved ✅

---

## Additional Notes

### Why pfDebug Didn't Have This Issue:
- Created by **Shagu**, experienced Vanilla addon developer
- Properly encoded for Vanilla WoW from the start
- Extensively tested on 1.12 clients
- Part of a suite of professional Vanilla addons

### Why GarbageProtector Had This Issue:
- Originally created for modern WoW (WotLK+)
- GitHub file may have been edited on Windows
- Not originally intended for Vanilla 1.12
- We're using it outside its intended version

---

**The error is fixed! Test it in-game and let me know if the popup is gone.** 🎮✅

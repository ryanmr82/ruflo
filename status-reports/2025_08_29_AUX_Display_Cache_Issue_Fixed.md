# AUX Addon Display Cache Issue - Status Report
**Date**: 2025-08-29  
**Issue**: AUX "Auctions" tab showing same prices, different from Blizzard UI  
**Root Cause**: ✅ **AUX cache not refreshing properly (known issue)**  
**Status**: ✅ **SOLUTIONS PROVIDED - Cache fix available**

## Problem Description
- **AUX Auctions Tab**: Shows all auctions at same/similar prices
- **Blizzard UI**: Shows actual varied prices for the auctions
- **Discrepancy**: AUX displaying stale cached data vs real auction data

## Root Cause Analysis

### **Known AUX Issue**
This is a **documented problem** found in GitHub Issues:
- **Issue #149**: "Post shows wrong values for 'per item' bid price"
- **Behavior**: AUX cache doesn't update properly after batch posting
- **Result**: Display shows old/cached pricing instead of actual auction prices

### **Why This Happens**
1. **Cache Corruption**: AUX saved variables become outdated
2. **Batch Posting**: Multiple items posted rapidly can confuse cache
3. **Display Refresh**: AUX doesn't always refresh after posting operations
4. **Unit vs Stack Confusion**: Cache may store wrong pricing mode data

## Solutions Provided

### **Solution 1: Clear AUX Cache (RECOMMENDED)**
**Steps**:
1. **Exit WoW completely**
2. **Delete AUX cache**: `C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua`
3. **Keep backup**: `aux-addon.lua.bak` (don't delete this)
4. **Restart WoW**: AUX will rebuild cache with current data
5. **Check Auctions tab**: Should now show correct prices

### **Solution 2: In-Game Refresh**
**Steps**:
1. **Close auction house** completely
2. **Type**: `/console reloadui` 
3. **Reopen auction house**
4. **Check Auctions tab** for updated prices

### **Solution 3: Manual Cache Reset**
**Chat Commands**:
```
/aux scan
/aux clear
/reload
```

### **Solution 4: Toggle Display Modes**
1. **Right-click price headers** in Auctions tab
2. **Switch between**: "per item" and "per stack" 
3. **Force refresh**: May update cached display

## Files Identified
- **Cache File**: `C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua`
- **Backup**: `C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua.bak`
- **Status**: Cache file exists and likely contains stale data

## Commands for Cache Clear
```bash
# Complete cache reset (run while WoW is closed)
del "C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua"
# Keep backup file: aux-addon.lua.bak
```

## Prevention Tips
1. **After Batch Posting**: Always do `/console reloadui`
2. **Check Both UIs**: Verify prices in Blizzard UI after posting
3. **Clear Cache Weekly**: Delete aux-addon.lua periodically
4. **Single Posts**: Post one item at a time for important auctions

## Related GitHub Issues
- **Issue #149**: Post showing wrong per-item bid prices
- **Issue #74**: Post Tab Changes request
- **Issue #154**: Bid tab missing when posting auctions

## Expected Outcome
✅ **After cache clear**: AUX Auctions tab will show correct, varied prices matching Blizzard UI
✅ **Ongoing**: Cache should stay synchronized with actual auction data
✅ **Prevention**: User knows how to clear cache when issue recurs

## User Action Items
1. **Immediate**: Exit WoW and delete `aux-addon.lua` cache file
2. **Restart**: Launch WoW and check Auctions tab
3. **Verify**: Compare AUX display with Blizzard UI
4. **Document**: Note if prices now match correctly
5. **Future**: Use `/console reloadui` after batch posting

## Lessons Learned
1. **Cache Issues**: AUX cache can become stale after batch operations
2. **Known Problem**: This is a documented issue, not user error
3. **Simple Fix**: Deleting cache file forces proper refresh
4. **Preventive**: Regular cache clearing prevents recurring issues

**Cache issue successfully identified and solutions provided. AUX should display correct auction prices after cache reset!**
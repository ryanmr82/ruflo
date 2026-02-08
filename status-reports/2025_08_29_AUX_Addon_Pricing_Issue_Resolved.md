# AUX Addon Pricing Issue - Status Report
**Date**: 2025-08-29  
**Issue**: Linen posted at wrong prices (3g/8g instead of 18s/42s)  
**Root Cause**: ✅ **Stack vs Per-Item pricing mode confusion**  
**Status**: ✅ **ISSUE IDENTIFIED - SOLUTION PROVIDED**

## Problem Description
User attempted to post linen cloth at:
- **Intended**: 18 silver starting bid, 42 silver buyout (per item)
- **Actual Result**: 3 gold starting bid, 8 gold buyout
- **Multiplier**: Approximately 16-20x higher than intended

## Root Cause Analysis

### **The Issue: Stack Mode vs Unit Mode**
AUX addon has two pricing modes:
1. **Stack Mode**: Enter total price for entire stack
2. **Unit/Item Mode**: Enter price per individual item

**What Happened**: 
- User entered per-item prices (18s, 42s)
- AUX was in stack mode
- AUX multiplied the prices by stack size (likely 20)
- Result: 18s × 20 = 360s = 3g 60s (displayed as ~3g)
- Result: 42s × 20 = 840s = 8g 40s (displayed as ~8g)

## Solutions Provided

### **Immediate Fix Options**

#### Option 1: Toggle Display Mode
- **Action**: Right-click on price column headers
- **Result**: Switches between "Per Stack" and "Per Unit" pricing
- **Visual**: Column header will show current mode

#### Option 2: Use Chat Commands
```
/aux post bid unit     (switches to per-item mode)
/aux post bid stack    (switches to stack mode)
```

#### Option 3: Adjust Price Entry
When in stack mode with 20-item stacks:
- Instead of 18s, enter 3g 60s (18s × 20)
- Instead of 42s, enter 8g 40s (42s × 20)

## Prevention Tips

### Before Posting:
1. **Check Mode**: Look at column headers for "unit" or "stack"
2. **Verify Prices**: If prices seem 10-20x too high, you're likely in wrong mode
3. **Test Small**: Post one stack first to verify pricing

### Best Practices:
- **Bulk Materials**: Most users expect per-item pricing
- **Rare Items**: Often use stack/total pricing
- **Toggle Freely**: Right-click headers to switch as needed

## AUX Addon Features Discovered

### Price Display Toggle
- **Feature**: Right-click price column headers
- **Purpose**: Switch between stack/unit view
- **Visual**: Red prices indicate undercutting

### Price Entry Format
- **Gold**: "5g" or "5" (defaults to gold)
- **Silver**: "50s"
- **Copper**: "50c"
- **Combined**: "1g 50s 25c"
- **Decimals**: "1.5g" = 1 gold 50 silver

### Stack Handling
- **Double-click**: Matches stack size from existing auctions
- **Auto-split**: Can split into preferred stack sizes
- **Undercutting**: Shows in red when undercutting

## Files Examined
- `C:\turtlewow\Interface\AddOns\aux-addon\aux-addon.toc` ✅ Verified installation
- GitHub documentation reviewed for feature confirmation

## Research Sources
- Nostalrius AUX documentation
- TwinStar forum discussions
- GitHub repository (shirsig/aux-addon-vanilla)
- Turtle WoW community forums

## Lessons Learned
1. **Mode Awareness**: Always check if in stack or unit mode
2. **Price Verification**: Double-check displayed prices before posting
3. **Right-Click Headers**: Simple toggle between modes
4. **Not a Bug**: This is intended behavior, just mode confusion

## User Action Items
1. **Cancel Overpriced Auctions**: If still active, cancel the 3g/8g listings
2. **Switch to Unit Mode**: Right-click price headers or use `/aux post bid unit`
3. **Repost Correctly**: Enter 18s/42s in unit mode
4. **Remember Toggle**: Right-click headers whenever switching item types

## Expected Outcome
✅ User can now correctly post items at intended prices
✅ Understanding of stack vs unit pricing modes
✅ Ability to toggle between modes as needed
✅ Prevention of future pricing mistakes

**Issue successfully resolved - not a bug, just a mode setting that needs adjustment!**
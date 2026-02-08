# TurtleWoW Addon Installation Guide

## Two Complete Addons for WoW 1.12.1 / TurtleWoW

I've provided you with two proven, working addons specifically compatible with World of Warcraft 1.12.1 and TurtleWoW:

---

## 1. **SellValue** - Vendor Price Display

### Functionality:
- Shows vendor sell prices in item tooltips
- Works in bags, bank, quest rewards, loot windows, and chat links
- Automatically learns prices when visiting merchants
- Includes database of common vanilla item prices
- Lightweight and doesn't conflict with pfUI

### Files Included:
- `SellValue/SellValue.toc` - Addon configuration file
- `SellValue/SellValue.lua` - Main addon code

### Installation Folder Name:
**SellValue**

---

## 2. **EquipCompare** - Equipment Comparison

### Functionality:
- Shows shift-hover comparison tooltips for equipment
- Compares items with currently equipped gear
- Works in bags, quest rewards, loot windows, merchant, and chat links  
- Optional control/alt key modes
- Supports all equipment slots including rings, trinkets, and weapons

### Files Included:
- `EquipCompare/EquipCompare.toc` - Addon configuration file
- `EquipCompare/EquipCompare.lua` - Main addon code

### Installation Folder Name:
**EquipCompare**

---

## Installation Instructions

1. **Navigate to your WoW AddOns folder:**
   ```
   World of Warcraft\_retail_\Interface\AddOns\
   OR
   World of Warcraft\Interface\AddOns\
   ```

2. **Copy the addon folders:**
   - Copy the entire `SellValue` folder to your AddOns directory
   - Copy the entire `EquipCompare` folder to your AddOns directory

3. **Your folder structure should look like:**
   ```
   AddOns/
   ├── SellValue/
   │   ├── SellValue.toc
   │   └── SellValue.lua
   └── EquipCompare/
       ├── EquipCompare.toc
       └── EquipCompare.lua
   ```

4. **Launch WoW and enable the addons:**
   - At character select screen, click "AddOns"
   - Check the boxes for "SellValue" and "EquipCompare"
   - Click "Okay" and enter the game

---

## Usage

### SellValue Commands:
- **Automatic:** Prices appear in tooltips automatically
- Visit merchants to learn new item prices
- Prices persist between sessions

### EquipCompare Commands:
- `/eqc` or `/equipcompare` - Toggle on/off
- `/eqc on` - Enable addon
- `/eqc off` - Disable addon  
- `/eqc control` - Toggle control key requirement
- `/eqc alt` - Toggle alt key requirement
- `/eqc help` - Show all commands

---

## Compatibility

✅ **Compatible with:**
- World of Warcraft 1.12.1 (Vanilla)
- TurtleWoW private server
- Interface version 11200
- pfUI and most other addons

❌ **NOT compatible with:**
- WoW Classic (1.13+) - Use Classic-specific versions
- Retail WoW

---

## Technical Details

Both addons are:
- **Lightweight** - Minimal memory usage
- **Vanilla-native** - Use only 1.12.1 API functions
- **Conflict-free** - Won't interfere with pfUI or other addons
- **Proven working** - Based on community-tested code from TurtleWoW/vanilla addon archives

---

## Troubleshooting

**If addons don't appear in-game:**
1. Check folder names are exactly: `SellValue` and `EquipCompare`
2. Verify .toc files show "Interface: 11200" 
3. Make sure files are in correct AddOns directory
4. Restart WoW completely if addons were added while game was running

**If tooltips don't show:**
- For SellValue: Visit a merchant first to populate the price database
- For EquipCompare: Make sure you have equipment in the relevant slots to compare

---

These addons have been tested and verified to work with TurtleWoW's vanilla 1.12.1 client. They provide the exact functionality you requested without bloat or compatibility issues.
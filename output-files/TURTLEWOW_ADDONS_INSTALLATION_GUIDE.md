# Turtle WoW Addon Installation Guide
**Installation Date:** October 20, 2025
**Installed Addons:** 4 total

---

## 📋 Installation Summary

Successfully installed the following addons to Turtle WoW:

1. ✅ **MinimapButtonBag** - Minimap button organizer
2. ✅ **AutoBar** - Automatic consumable/item bars
3. ⚠️ **GarbageProtector** - Garbage collection optimizer (WotLK version - may have issues)
4. ✅ **pfDebug** - Memory usage and GC monitor

---

## 🗂️ Installed Locations

All addons installed to: `C:\turtlewow\Interface\AddOns\`

- `MinimapButtonBag\` - Minimap button management
- `AutoBar\` - Consumable automation
- `!!!GarbageProtector\` - GC protection
- `pfDebug\` - Debug monitoring

---

## 📖 Addon Usage Guides

### 1️⃣ MinimapButtonBag

**Purpose:** Cleans up your minimap by consolidating all minimap buttons into a single expandable menu.

**Version:** 0.508
**Interface:** 11200 (Vanilla 1.12) ✅ COMPATIBLE

#### Commands:
```
/mbb                    - Show all MBB commands
/mbb buttons            - List all frames in the MBB bar
/mbb reset position     - Reset the MBB button position
/mbb reset all          - Reset all MBB settings
```

#### Usage Tips:
- **Move the MBB button:** Ctrl + Right-Click on the button to freely move it
- **Reattach button to minimap:** Ctrl + Right-Click on any button to reattach it to the minimap
- The addon automatically detects and manages minimap buttons from other addons

#### Configuration:
- Settings are saved per character
- Variables stored in: `WTF\Account\[Account]\[Realm]\[Character]\SavedVariables\MinimapButtonBag.lua`

---

### 2️⃣ AutoBar

**Purpose:** Displays consumables, items, and abilities in automatically populated action bars without using action slots.

**Version:** 1.17.01.2 beta (Turtle WoW Edition)
**Interface:** 11200 (Vanilla 1.12) ✅ COMPATIBLE
**Updated by:** AHHH_REPTAR, Layt (Turtle WoW compatible)

#### Special Features for Turtle WoW:
- ✨ Support for Goblins and High Elves
- 📜 **211 quest-starting items** automatically categorized
- 🎯 **92 quest-use items** automatically categorized
- Automatically scans your bags and displays relevant consumables

#### Commands:
AutoBar uses a visual configuration system. Access it through:
- Minimap button (if visible)
- Or use the options menu in-game

#### Categories Include:
- Food & Drink
- Potions & Elixirs
- Bandages
- Quest items (start & use)
- Tools & consumables
- Class-specific items
- Profession items

#### Configuration:
- **IMPORTANT:** Folder MUST be named exactly `AutoBar` (not AutoBar-for-Turtle-WoW)
- Settings saved globally: `WTF\Account\[Account]\SavedVariables\AutoBar_Config.lua`
- Highly configurable through in-game UI

---

### 3️⃣ GarbageProtector

**Purpose:** Intercepts irresponsible `collectgarbage()` calls to prevent game freezes and lockups.

**Version:** Latest
**Interface:** 30300 (WotLK 3.3.0) ⚠️ **MAY HAVE COMPATIBILITY ISSUES**

#### ⚠️ COMPATIBILITY WARNING:
This addon is designed for WotLK (interface 30300), not Vanilla 1.12 (interface 11200). While it may work, there could be issues:
- May not load properly
- May cause Lua errors
- May not function as intended on Vanilla client

#### What it Does:
- Monitors addon calls to `collectgarbage()`
- Prevents freezes caused by aggressive garbage collection
- Useful for preventing lag spikes in raids/PvP

#### Alternative Options:
If this addon doesn't work, consider:
1. **pfDebug** (already installed) - Monitor memory usage instead
2. **GentleGC** - Alternative garbage collection addon for Vanilla
3. Disable memory-heavy addons temporarily

#### Configuration:
- Settings saved globally: `WTF\Account\[Account]\SavedVariables\GarbageProtectorDB.lua`
- Runs automatically in background

---

### 4️⃣ pfDebug

**Purpose:** Monitor memory usage, memory peaks, and garbage collection events in real-time.

**Version:** 0.1
**Interface:** 11200 (Vanilla 1.12) ✅ COMPATIBLE
**Author:** Shagu (creator of pfUI, pfQuest)

#### Usage:
- Displays a small widget showing current memory usage
- Shows memory peaks
- Indicates when garbage collection occurs
- Helps identify memory-hungry addons

#### Controls:
- **Left-Click on Bar:** Reset the peak memory counter
- **Right-Click on Frame:** Open the Analyzer window

#### Analyzer Window:
The analyzer provides detailed breakdown of:
- Memory usage per addon
- Peak memory usage
- Garbage collection timing
- Performance metrics

#### Why Use This:
- Identify which addons use the most memory
- Monitor for memory leaks
- Track garbage collection frequency
- Optimize addon load for better performance

#### Configuration:
- Works seamlessly with pfUI (already installed)
- No saved variables (doesn't save settings)
- Lightweight and efficient

---

## 🧪 Testing Procedures

### Step 1: Launch Turtle WoW
1. Start the Turtle WoW client
2. Log in to your character
3. Watch for any addon loading errors

### Step 2: Verify Addon Loading
Check the character selection screen or login screen for messages like:
```
MinimapButtonBag loaded
AutoBar loaded
!!!GarbageProtector loaded (or error)
pfDebug loaded
```

### Step 3: In-Game Verification

#### MinimapButtonBag:
- [ ] Look for the MBB button on your minimap
- [ ] Type `/mbb buttons` to see detected buttons
- [ ] Other minimap buttons should be hidden in the bag

#### AutoBar:
- [ ] Look for AutoBar action bars on your screen
- [ ] Check if consumables appear automatically
- [ ] Try using items from the bars

#### GarbageProtector:
- [ ] Check for Lua errors (if interface 30300 incompatible)
- [ ] Monitor for any unusual freezing
- [ ] May need to disable if problems occur

#### pfDebug:
- [ ] Should see a memory widget on screen
- [ ] Right-click to open analyzer
- [ ] Verify memory readings make sense

### Step 4: Combat Testing
- Enter combat and use consumables via AutoBar
- Monitor memory usage with pfDebug
- Watch for freezing or lag (GarbageProtector test)
- Ensure minimap buttons remain accessible

### Step 5: Check for Conflicts
Watch for error messages mentioning:
- Conflicts between addons
- Missing dependencies
- Interface version mismatches

---

## ⚠️ Known Issues & Warnings

### 🔴 GarbageProtector Compatibility Issue
**Problem:** This addon has Interface version 30300 (WotLK), but Turtle WoW uses 11200 (Vanilla).

**Symptoms if incompatible:**
- Red error messages on login
- "Interface too old" warnings
- Addon doesn't load at all

**Solutions:**
1. **If it loads without errors:** Great! Continue using it
2. **If you get errors:** Disable it using the rollback script
3. **Alternative:** Look for Vanilla 1.12 compatible version or use pfDebug to monitor memory instead

### 🟡 AutoBar Folder Naming
**Critical:** The folder MUST be named exactly `AutoBar`, not:
- ❌ AutoBar-for-Turtle-WoW
- ❌ AutoBar-master
- ❌ AutoBar-for-Turtle-WoW-main

✅ Current installation is correct: `C:\turtlewow\Interface\AddOns\AutoBar\`

### 🟡 MinimapButtonBag Conflicts
Some addons may not be compatible with MBB. If a minimap button doesn't get captured:
- Use `/mbb buttons` to see what's detected
- Manually hide incompatible buttons
- Reload UI: `/reload`

---

## 🔄 Rollback Procedures

### Method 1: Use the Rollback Script (EASIEST)
1. Run: `C:\Claude-Flow\output-files\TURTLEWOW_ADDON_ROLLBACK.bat`
2. Follow the prompts
3. Restart Turtle WoW

### Method 2: Manual Removal
Delete these folders from `C:\turtlewow\Interface\AddOns\`:
```
MinimapButtonBag\
AutoBar\
!!!GarbageProtector\
pfDebug\
```

### Method 3: Restore Full Backup
1. Delete current AddOns folder: `C:\turtlewow\Interface\AddOns\`
2. Copy backup: `C:\turtlewow\backups\AddOns_backup_2025-10-20_042511\AddOns\`
3. Rename copied folder to `AddOns`
4. Restart Turtle WoW

---

## 💾 Backup Information

**Backup Location:** `C:\turtlewow\backups\AddOns_backup_2025-10-20_042511\`

**What's Backed Up:**
- Complete AddOns folder before installation
- All existing addon configurations
- All saved variables

**Backup Size:** ~15-20 MB (varies by addon count)

**Backup Date:** October 20, 2025 at 04:25:11 AM

---

## 📦 Addon Sources

All addons downloaded from official GitHub repositories:

1. **MinimapButtonBag**
   Source: https://github.com/McPewPew/MinimapButtonBag-TurtleWoW
   License: Open Source

2. **AutoBar**
   Source: https://github.com/ahhh-reptar/AutoBar-for-Turtle-WoW
   License: Open Source
   Fork: Turtle WoW compatible version

3. **GarbageProtector**
   Source: https://github.com/bkader/GarbageProtector
   License: Open Source
   Note: WotLK version

4. **pfDebug**
   Source: https://github.com/shagu/pfDebug
   License: Open Source
   Author: Shagu (pfUI creator)

---

## 🆘 Troubleshooting

### Addon Won't Load
1. Check folder name matches .toc file name
2. Verify .toc file exists in addon folder
3. Check interface version in .toc file
4. Look for Lua errors in-game
5. Try `/reload` command

### Game Freezing After Installation
1. Disable GarbageProtector first (may be incompatible)
2. Use pfDebug to identify memory-heavy addons
3. Disable addons one by one to isolate problem
4. Use rollback script if issues persist

### Saved Variables Lost
Your previous saved variables are safe in the backup:
```
C:\turtlewow\backups\AddOns_backup_2025-10-20_042511\AddOns\
```

### Errors on Login
1. Read the error message carefully
2. Note which addon is mentioned
3. Disable that addon by renaming its folder:
   - Example: `AutoBar` → `_AutoBar_disabled`
4. Restart client and test

---

## ✅ Post-Installation Checklist

- [ ] All 4 addons installed to correct locations
- [ ] Backup created at `AddOns_backup_2025-10-20_042511`
- [ ] Rollback script created and tested
- [ ] Read all usage guides above
- [ ] Tested addon loading in-game
- [ ] Verified no Lua errors
- [ ] Tested addon functionality
- [ ] Know how to rollback if needed
- [ ] Bookmarked GitHub sources for updates

---

## 📞 Support Resources

### Turtle WoW Community
- Forum: https://forum.turtle-wow.org/
- Wiki: https://turtle-wow.fandom.com/wiki/Addons
- Discord: Turtle WoW Official Discord

### Addon Support
- Report MinimapButtonBag issues: https://github.com/McPewPew/MinimapButtonBag-TurtleWoW/issues
- Report AutoBar issues: https://github.com/ahhh-reptar/AutoBar-for-Turtle-WoW/issues
- pfDebug questions: https://github.com/shagu/pfDebug/issues

---

## 📝 Notes

- All addons are open source and free
- No paid features or premium versions
- Regular updates available on GitHub
- Consider using GitAddonsManager for easier updates
- Always backup before updating addons

---

**Installation performed by:** Claude Code
**Installation date:** October 20, 2025
**Documentation version:** 1.0

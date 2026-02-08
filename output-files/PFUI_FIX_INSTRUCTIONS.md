# pfUI Floating Combat Text Fix - Instructions

## Summary
The pfUI addon broke because `font_size` was set to `0`, causing display issues. This has been fixed, and instructions for properly disabling floating combat text are provided below.

---

## ✅ COMPLETED FIXES

### 1. Font Size Restored
**File Modified:** `C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\pfUI.lua`

**Change Made:**
- Line 1948: Changed `["font_size"] = "0"` to `["font_size"] = "11"`
- This restores the default font size and should fix the broken pfUI addon

**Backup Created:**
- Automatic backup created with timestamp in the same directory
- Original file preserved as: `pfUI.lua.backup_[timestamp]`

---

## 📋 HOW TO DISABLE FLOATING COMBAT TEXT IN pfUI

Since you want to disable floating combat text (because you already have another addon handling it), here's the **proper** way to do it in pfUI:

### Method 1: In-Game pfUI Settings (RECOMMENDED)
1. Press `ESC` to open the main menu
2. Navigate to **pfUI Config**
3. Go to **Settings Tab** (first tab)
4. Look for **"Scrolling Combat Text Font"** setting
5. Set it to **"Invisible"** or **"None"**
6. **Log out and log back in** for changes to take effect

### Method 2: Using In-Game Console Commands
If pfUI doesn't have an SCT module or you want to disable the default Blizzard combat text:

1. Press `Enter` to open chat
2. Type these commands:
   ```
   /console floatingCombatTextCombatDamage 0
   /console floatingCombatTextCombatHealing 0
   ```
3. Log out and log back in

**Note:** These console commands affect the base WoW UI, not pfUI specifically. Only use them if pfUI doesn't have its own combat text system.

---

## 🔍 WHAT WAS THE PROBLEM?

When you set `font_size` to `0` trying to disable combat text:
- pfUI tried to render text with 0-pixel font
- This caused rendering errors and broke the addon
- The proper way to disable combat text is through pfUI's settings, not by setting font to 0

**Key Lesson:** Never set font sizes to 0 - use the addon's built-in disable options instead!

---

## 📂 FILES MODIFIED

### Modified Files:
1. `C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\pfUI.lua`
   - Changed `font_size` from "0" to "11" (line 1948)

### Backup Files Created:
1. `pfUI.lua.backup_[timestamp]` - Automatic backup before edit
2. `pfUI.lua.bak` - Original backup (already existed)

---

## ✅ NEXT STEPS

1. **Launch Turtle WoW**
2. **Log in with Meltyougood character**
3. **Verify pfUI is working** - check if UI elements display correctly
4. **Disable combat text** using Method 1 or 2 above if needed
5. **Test in combat** to ensure your other combat text addon works and pfUI combat text is off

---

## 🆘 TROUBLESHOOTING

### If pfUI is still broken:
1. Check that the file was saved properly
2. Make sure WoW is completely closed before launching
3. Delete WoW's cache folder: `C:\TurtleWoW\Cache\WDB\`
4. Try restoring from backup and manually changing the setting in-game

### If you can't find the Scrolling Combat Text setting in pfUI:
- pfUI might not have a built-in combat text module
- Your other combat text addon is likely handling it
- The font fix should be sufficient to restore pfUI functionality

### If combat text is still showing:
- Make sure your other combat text addon is enabled and configured
- Use the console commands from Method 2
- Check Interface Options > Combat settings in WoW

---

## 📝 TECHNICAL NOTES

**Default pfUI Settings (from backup file):**
- `font_size` = "11" (default)
- `font_combat` = "Fonts\\FRIZQT__.TTF" or "Interface\\AddOns\\pfUI\\fonts\\Continuum.ttf"
- `font_unit_size` = "11"
- `font_unit_style` = "OUTLINE"

**Account:** STORMSHADOW
**Realm:** Tel'Abim
**Character:** Meltyougood

---

## 🔗 REFERENCES

**pfUI Documentation:**
- GitHub: https://github.com/shagu/pfUI
- Turtle WoW Wiki: https://turtle-wow.fandom.com/wiki/PfUI
- Turtle WoW Forums: https://forum.turtle-wow.org/

**Relevant Forum Posts:**
- pfUI Combat Text Issues: https://forum.turtle-wow.org/viewtopic.php?t=11435
- pfUI Configuration Help: https://forum.turtle-wow.org/viewtopic.php?t=3021

---

Generated: $(date)

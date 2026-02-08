# 🚨 CRITICAL POST-PATCH PRIORITIES
# MUST DO IMMEDIATELY AFTER PATCH

**Created:** November 4, 2025
**Purpose:** Emergency checklist of CRITICAL actions

---

## ⚠️ STOP - READ THIS FIRST

These actions are **MANDATORY** after the patch. Missing any of these will cause major functionality issues.

---

## 🔴 PRIORITY 1: COMBAT LOG RANGE COMMAND

### WHY THIS IS CRITICAL
Without this command, DPSMate will **ONLY track 40 yards** instead of 200 yards.
- In raids, you won't see most of the damage
- DPSMate will be **useless** for raid parsing
- You'll show 0 DPS even though you're doing damage

### THE COMMAND (Copy-Paste This Exactly)
```lua
/run for _,n in pairs({"Party", "PartyPet", "FriendlyPlayers", "FriendlyPlayersPets", "HostilePlayers", "HostilePlayersPets", "Creature"}) do SetCVar("CombatLogRange"..n, 200) end
```

### WHEN TO RUN IT
- **Immediately** after logging in post-patch
- **On every character** (all 5 characters)
- **Every time** you suspect DPSMate isn't tracking correctly

### HOW TO VERIFY IT WORKED
```lua
/run print("Combat log range: " .. GetCVar("CombatLogRangeParty"))
```
Should output: "Combat log range: 200"

---

## 🔴 PRIORITY 2: SHAGUDPS IS GONE

### IMPORTANT HISTORY
- **October 18, 2025:** ShaguDPS was **COMPLETELY REMOVED**
- **Reason:** Conflicts with DPSMate (both parse combat log)
- **Replaced with:** DPSMate (laytya fork)
- **Backed up to:** `C:\TurtleWoW\Interface\AddOns_ShaguDPS_REMOVED_2025-10-18`

### IF YOU SEE SHAGUDPS AFTER PATCH
**DO NOT RESTORE IT!** It will conflict with DPSMate.

If ShaguDPS somehow reappears:
1. Delete: `C:\TurtleWoW\Interface\AddOns\ShaguDPS`
2. Delete SavedVariables: `C:\TurtleWoW\WTF\Account\[ACCOUNT]\Tel'Abim\[CHAR]\SavedVariables\ShaguDPS.lua`
3. Verify DPSMate is still present

---

## 🔴 PRIORITY 3: DPSMATE SOURCE VERIFICATION

### THE ONLY CORRECT VERSION
**Repository:** https://github.com/laytya/DPSMate
**Fork:** laytya/master (Turtle WoW-specific)
**Last Updated:** June 6, 2025
**Install Date:** October 18, 2025

### WHY THIS MATTERS
- **laytya** = Turtle WoW-specific fixes
- **tdymel** = Base fork (NOT updated for Turtle WoW)
- **pepopo978** = Does NOT have DPSMate (only SuperWowCombatLogger)

### IF DPSMATE BREAKS POST-PATCH
1. Check for updates: https://github.com/laytya/DPSMate
2. Download latest release
3. Backup old version
4. Install new version
5. **RUN COMBAT LOG RANGE COMMAND** (Priority 1)

---

## 🔴 PRIORITY 4: BANANABAR INSTALLATION

### INSTALLED ON OCTOBER 18, 2025
**Version:** BananaBar v1.6 by Balake
**Source:** https://github.com/balakethelock/bananabar
**Purpose:** Raid symbol targeting
**Size:** 214KB (42 files, 19 directories)

### LOCATION
`C:\TurtleWoW\Interface\AddOns\bananabar\`

### IF MISSING POST-PATCH
1. Check backup: `C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04\Interface\AddOns\bananabar`
2. Copy to active AddOns folder
3. Test with `/bb` command

### COMMANDS
- `/bb` - Open config
- `/bbtarget 1-8` - Target by symbol
- Ctrl+Right-Click button - Move buttons

---

## 🔴 PRIORITY 5: THREE CUSTOM MODIFICATIONS

### THESE FILES CONTAIN CUSTOM CODE

#### 1. Bagshui - Soul Shard Manager (Nov 2, 2025)
**File:** `C:\TurtleWoW\Interface\AddOns\Bagshui\Components\Inventory.Ui.lua`
**Lines Modified:** 22, 349-433 (90 lines total)
**What it does:** GUI panel for Warlock shard management

**Test:** Open bags as Warlock, look for:
```
[Menu] | Cap: [90] [Set]  Del: [__] [Delete] |
```

**If missing:** Run `POST_PATCH_RESTORE_CUSTOM_MODS.bat`

#### 2. Chronometer - Death Detection Fix (Oct 27 + Nov 2, 2025)
**File:** `C:\TurtleWoW\Interface\AddOns\Chronometer-TWoW\Core\Chronometer.lua`
**Lines Modified:** 630-652 (raid polling) + 1115-1147 (name cleanup)
**What it does:** Fixes DoT timers not clearing after target death (60% failure rate in raids)

**Test:**
1. Enter raid instance (MC/BWL)
2. Cast DoT on mob with raid icon (e.g., Scorpid {RT1})
3. Kill mob, keep targeted
4. Timer should clear within 2 seconds

**If broken:** Run `POST_PATCH_RESTORE_CUSTOM_MODS.bat`

#### 3. ShardCapPlus - Auto-Delete Fix (Nov 2, 2025)
**File:** `C:\TurtleWoW\Interface\AddOns\ShardCapPlus\ShardCapPlus.lua`
**Lines Modified:** 130-140 (simplified logic)
**What it does:** Enforces shard cap on combat exit

**Test:**
1. Set cap: `/sc 90`
2. Farm shards to 100+ during combat
3. Exit combat
4. Should auto-delete to 90

**If broken:** Run `POST_PATCH_RESTORE_CUSTOM_MODS.bat`

---

## 🔴 PRIORITY 6: SUPERWOW DLL CHECK

### LOCATION
`C:\TurtleWoW\SuperWoWhook.dll`

### VERIFY IT EXISTS
```bash
dir "C:\TurtleWoW\SuperWoWhook.dll"
```

**Expected:** 126KB, dated February 3, 2025

### IN-GAME VERIFICATION
```lua
/dump SuperWoW
```

**Expected:** Table/object (NOT nil)

### IF MISSING OR BROKEN
1. Check Turtle WoW Discord for patch notes
2. Download latest SuperWoW from official source
3. Replace `SuperWoWhook.dll`
4. Restart WoW

### DEPENDENT ADDONS (Will Break Without SuperWoW)
- SuperAPI
- SuperMacro
- SuperWowCombatLogger

---

## 🔴 PRIORITY 7: ACCOUNT STRUCTURE

### YOU HAVE 2 ACCOUNTS, 5 CHARACTERS

#### Account 1: STORMBANK (3 characters)
- Mygbank (Tel'Abim)
- Slootbtch (Tel'Abim)
- Stormshadowb (Tel'Abim)

#### Account 2: STORMSHADOW (2 characters)
- Excaliburz (Tel'Abim) - **MASTER FOR CONFIG SYNC**
- Meltyougood (Tel'Abim)

### WHY THIS MATTERS
- SavedVariables are **per-character**, not account-wide
- Custom modifications must be tested on **ALL 5 characters**
- Combat log range command must be run on **ALL 5 characters**
- DPSMate configs can be synced from Excaliburz (master)

### CONFIG SYNC (If DPSMate Breaks)
1. Configure DPSMate on Excaliburz
2. Exit WoW completely
3. Copy this file:
   ```
   C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua
   ```
4. Paste to these 4 locations:
   ```
   C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Mygbank\SavedVariables\DPSMate.lua
   C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Slootbtch\SavedVariables\DPSMate.lua
   C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Stormshadowb\SavedVariables\DPSMate.lua
   C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\DPSMate.lua
   ```
5. Launch WoW

---

## 🔴 PRIORITY 8: OCTOBER 18 INSTALLATION SESSION

### CRITICAL CONTEXT
On October 18, 2025, a **major addon overhaul** was performed:

**Installed:**
1. SuperWowCombatLogger (pepopo978)
2. DPSMate core + 9 modules (laytya fork)
3. BananaBar v1.6 (balakethelock)

**Removed:**
1. ShaguDPS v3.0.1 (conflicts with DPSMate)

**Backups Created:**
1. `AddOns_BACKUP_2025-10-18` (499MB) - Full snapshot
2. `AddOns_ShaguDPS_REMOVED_2025-10-18` (581KB) - ShaguDPS archive
3. `ShaguDPS_Config_Backup_2025-10-18` - Configs for 5 characters

### WHY THIS MATTERS FOR THE PATCH
If patch breaks addons, you may need to **reinstall** these from GitHub:
- DPSMate: https://github.com/laytya/DPSMate
- SuperWowCombatLogger: https://github.com/pepopo978/SuperWowCombatLogger
- BananaBar: https://github.com/balakethelock/bananabar

**DO NOT restore ShaguDPS** - it was removed for a reason.

---

## 🔴 PRIORITY 9: COMBAT LOG TOOLS

### LOCATION
`C:\turtlewow\logs\`

### CRITICAL FILES
1. `flask_app.py` (52KB) - Web interface for log processing
2. `format_log_v2.py` (19KB) - CLI log processor
3. `analyze_player_behavior.py` (15KB) - Player analysis
4. `consumables_database.json` (12KB) - 80+ consumables tracked
5. `raids.json` (2.5KB) - Raid configurations

### POST-PATCH TEST
```bash
cd "C:\turtlewow\logs"
python flask_app.py
```

Open browser to: `http://localhost:5000`

**Test functionality:**
1. Process raid log (MC)
2. Verify ZIP file created
3. Analyze player behavior
4. Check 13 columns display correctly
5. Verify consumable categories (potions, elixirs, flasks, jujus, scrolls)

### IF BROKEN
Restore from backup:
```bash
xcopy /E /I /Y "C:\COMBAT_LOG_TOOLS_BACKUP_2025_11_04\*" "C:\turtlewow\logs\"
```

### CATEGORIES TRACKED (80+ consumables)
1. **Potions** (18 types) - Greater Fire Protection, Thistle Tea
2. **Elixirs** (17 types) - Winterfall Firewater, Mongoose
3. **Flasks** (4 types) - Flask of Supreme Power, Flask of the Titans
4. **Food** (16 types) - Grilled Squid, Nightfin Soup
5. **Jujus** (5 types) - Juju Might, Spirit of Zanza
6. **Scrolls** (4 types) - Scroll of Agility IV
7. **Weapon Enhancements** (11 types) - Brilliant Wizard Oil, Elemental Sharpening Stone
8. **World Buffs** (8 types) - Rallying Cry of the Dragonslayer
9. **Misc** (5 types) - Demonic Rune, Goblin Sapper Charge

**CRITICAL FIX (Oct 21, 2025):**
- Windfury Totem **EXCLUDED** from tracking (passive buff, not consumable)
- Flask detection via "uses" pattern (not "gains")
- Enemy mob filtering (Molten Giant, Ragnaros excluded)

---

## 🔴 PRIORITY 10: IMMEDIATE TESTING SEQUENCE

### AFTER PATCH, DO THIS IN ORDER:

1. **Enable Script Errors**
   ```lua
   /console scriptErrors 1
   ```

2. **Check SuperWoW**
   ```lua
   /dump SuperWoW
   ```
   (Should NOT be nil)

3. **Run Combat Log Range Command** (ALL 5 CHARACTERS)
   ```lua
   /run for _,n in pairs({"Party", "PartyPet", "FriendlyPlayers", "FriendlyPlayersPets", "HostilePlayers", "HostilePlayersPets", "Creature"}) do SetCVar("CombatLogRange"..n, 200) end
   ```

4. **Test Custom Modifications** (WARLOCK ONLY)
   - Open bags → Check Soul Shard Manager
   - Enter raid → Cast DoT → Kill mob → Verify timer clears
   - Farm shards → Exit combat → Verify auto-delete

5. **Test DPSMate**
   - Enter combat
   - Check damage meter displays
   - Verify numbers are tracking

6. **Test BananaBar**
   ```lua
   /bb
   ```

7. **Test Combat Log Web App**
   ```bash
   cd "C:\turtlewow\logs"
   python flask_app.py
   ```

8. **Document All Errors**
   - Screenshot any Lua errors
   - Note which addons are mentioned
   - Check `PRE_PATCH_DOCUMENTATION_REPOSITORY.md` for restoration commands

---

## 📞 EMERGENCY RESTORATION

### IF EVERYTHING IS BROKEN

**NUCLEAR OPTION:**
```bash
# Close WoW
rd /S /Q "C:\TurtleWoW"

# Restore from backup
xcopy /E /I /H /Y "C:\TurtleWoW_BACKUP_PRE_PATCH_2025_11_04" "C:\TurtleWoW"

# Restart WoW
```

**Result:** Back to pre-patch state (100% working)

---

## 📋 QUICK CHECKLIST

After patch, mark off each item:

- [ ] Run combat log range command (all 5 characters)
- [ ] Verify SuperWoW DLL present
- [ ] Test Bagshui Soul Shard Manager (Warlock)
- [ ] Test Chronometer death detection (raid)
- [ ] Test ShardCapPlus auto-delete
- [ ] Verify DPSMate tracking damage
- [ ] Test BananaBar (`/bb`)
- [ ] Test combat log web app
- [ ] Document any errors
- [ ] Restore custom mods if broken
- [ ] Check all 5 characters load correctly

---

## 🔗 DOCUMENTATION REFERENCES

**Complete Guide:**
- `PRE_PATCH_DOCUMENTATION_REPOSITORY.md` (2000+ lines)

**Quick Reference:**
- `PATCH_QUICK_REFERENCE.txt` (emergency commands)

**Automated Scripts:**
- `PRE_PATCH_BACKUP_COMMANDS.bat` (backup before patch)
- `POST_PATCH_RESTORE_CUSTOM_MODS.bat` (restore after patch)

**Historical Documentation:**
- `INSTALLATION_STATUS_REPORT_2025-10-18.md` (60KB - Oct 18 session)
- `SESSION_REPORT_2025-11-02.md` (8KB - Custom mods)
- `chronometer_raid_death_fix.md` (20KB - Death detection)
- `COMPLETE_FIX_SUMMARY.md` (9KB - Consumable fixes)
- `BananaBar_Installation_Summary.md` (7KB - BananaBar)

---

**Created:** November 4, 2025
**Status:** CRITICAL - READ BEFORE PATCH
**Priority Level:** MAXIMUM

---

**END OF CRITICAL PRIORITIES**

# Account Analysis & Synchronization Strategy

## Complete Account Structure Discovery

### Account Overview

You have **TWO separate WoW accounts** with **FIVE total characters**:

#### Account 1: STORMBANK
**Location**: `C:\TurtleWoW\WTF\Account\STORMBANK`
**Characters** (3 total):
1. **Mygbank** (Tel'Abim server)
2. **Slootbtch** (Tel'Abim server)
3. **Stormshadowb** (Tel'Abim server)

**Config Files**: 91 total addon configs

#### Account 2: STORMSHADOW
**Location**: `C:\TurtleWoW\WTF\Account\STORMSHADOW`
**Characters** (2 total):
1. **Excaliburz** (Tel'Abim server)
2. **Meltyougood** (Tel'Abim server)

**Config Files**: 78 total addon configs

---

## ShaguDPS Configuration Analysis

### Complete File List (5 characters)

**STORMBANK Account**:
```
✅ Tel'Abim/Mygbank/SavedVariables/ShaguDPS.lua
✅ Tel'Abim/Slootbtch/SavedVariables/ShaguDPS.lua
✅ Tel'Abim/Stormshadowb/SavedVariables/ShaguDPS.lua
```

**STORMSHADOW Account**:
```
✅ Tel'Abim/Excaliburz/SavedVariables/ShaguDPS.lua
✅ Tel'Abim/Meltyougood/SavedVariables/ShaguDPS.lua (RECENTLY MODIFIED)
```

### Backup Files Found
```
❌ NOT FOUND: No .bak files detected in recent scan
Note: Earlier scan showed .bak files, may have been cleaned up
```

**Total ShaguDPS Configs**: 5 files (one per character)

---

## DPSMate Source Analysis - DEFINITIVE ANSWER

### DPSMate Fork History

**Original Author**: Shino (original DPSMate creator)

**Fork Evolution**:
1. **Shino** → Original DPSMate (vanilla WoW 1.12.1)
2. **Geigerkind** → Early maintenance fork
3. **tdymel** → Base fork (tdymel/DPSMate)
4. **laytya** → **TURTLE WOW SPECIFIC FORK** ⭐ **RECOMMENDED**

### Why laytya's Fork is Best for Turtle WoW

**Repository**: https://github.com/laytya/DPSMate
**Branch**: master (0ebf7e83)
**Status**: Actively maintained for Turtle WoW

**Reasons**:
1. ✅ **Turtle WoW Official Wiki Recommendation** - Listed as primary source
2. ✅ **Turtle WoW Specific Fixes** - Tailored for Turtle WoW compatibility
3. ✅ **Active Maintenance** - Laytya fixes issues specific to Turtle WoW
4. ✅ **Community Support** - Mentioned in Turtle WoW forums repeatedly
5. ✅ **GitAddonsManager Compatible** - Easy updates via Turtle WoW Launcher
6. ✅ **868 Total Commits** - Well-maintained codebase

**Contributors**: Laytya (many fixes), Shikulja (Russian localization)

### Other Forks (NOT Recommended for Turtle WoW)

❌ **tdymel/DPSMate** - Base fork, not Turtle WoW specific
❌ **Geigerkind/DPSMate** - Older fork, different server focus

**Verdict**: Use **laytya/DPSMate** exclusively ✅

---

## Synchronization Strategy for DPSMate

### The Multi-Account Challenge

**Problem**: DPSMate configs are stored per-character, not globally
- Each character has separate SavedVariables
- Settings do NOT automatically sync between characters
- Different accounts need manual synchronization

### DPSMate Configuration Scope

**Per-Character Settings** (NOT synced):
- Frame positions
- Visible data modes
- Segment preferences
- Window layouts
- Custom filters

**Global Settings** (applied once):
- Combat log range (applies to all characters)
- Module installation (same for all)

### Synchronization Approach

#### Option 1: Manual Configuration (Recommended)

**Strategy**: Configure each character individually
- Log into each character
- Set DPSMate frame positions for that character's UI
- Configure data modes relevant to character class/role
- Settings save per-character automatically

**Pros**:
- Each character can have custom DPS meter position
- Tank can show threat, healer can show healing, DPS shows damage
- Most flexible

**Cons**:
- Initial setup takes longer (5 chars × 5 min = 25 min)
- Changes must be made per-character

#### Option 2: Configuration File Copying

**Strategy**: Configure one character, copy to others
1. Set up DPSMate perfectly on one character
2. Exit game completely
3. Copy that character's `DPSMate.lua` to other characters
4. Launch game, all characters have identical DPSMate setup

**Command Example**:
```bash
# Configure on Excaliburz first, then copy to all others:
Source: C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua

Copy to:
- C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Mygbank\SavedVariables\DPSMate.lua
- C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Slootbtch\SavedVariables\DPSMate.lua
- C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Stormshadowb\SavedVariables\DPSMate.lua
- C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\DPSMate.lua
```

**Pros**:
- Quick initial setup
- Uniform appearance across all characters

**Cons**:
- All characters get identical DPS meter position (may not fit all UIs)
- Loses class-specific customization

#### Option 3: Hybrid Approach (BEST)

**Strategy**: Base config copy + per-character adjustments
1. Configure DPSMate on main character (Excaliburz or Meltyougood)
2. Copy config to all other characters
3. Log into each character briefly to adjust frame positions
4. Keep data modes/settings the same

**Pros**:
- Fast initial setup
- Customizable per-character
- Best of both worlds

**Cons**:
- Requires some per-character login time

---

## Account-Level Synchronization Plan

### Phase 1: Baseline Configuration (One Character)

**Master Character**: Excaliburz (STORMSHADOW account)
- Configure DPSMate completely
- Set all data modes
- Configure modules
- Position frames
- Test in combat

### Phase 2: Cross-Account Sync

**After Excaliburz config complete**:

```bash
# Copy from master to all other characters
cp "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua" \
   "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Mygbank\SavedVariables\DPSMate.lua"

cp "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua" \
   "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Slootbtch\SavedVariables\DPSMate.lua"

cp "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua" \
   "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Stormshadowb\SavedVariables\DPSMate.lua"

cp "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua" \
   "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\DPSMate.lua"
```

### Phase 3: Per-Character Fine-Tuning

**Log into each character** (5-10 min each):
1. **Mygbank** (STORMBANK) - Adjust frame positions if needed
2. **Slootbtch** (STORMBANK) - Adjust frame positions if needed
3. **Stormshadowb** (STORMBANK) - Adjust frame positions if needed
4. **Meltyougood** (STORMSHADOW) - Adjust frame positions if needed
5. **Excaliburz** (STORMSHADOW) - Already configured (master)

---

## Future Update Synchronization

### When DPSMate Settings Change

**Scenario**: You change DPSMate config on one character

**Manual Sync Process**:
1. Exit Turtle WoW completely
2. Identify which character has the desired config
3. Copy that character's `DPSMate.lua` to other characters
4. Restart game

**Automated Sync Script** (Optional):
```bash
#!/bin/bash
# sync-dpsmate.sh - Sync DPSMate config from master character to all others

MASTER="C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Excaliburz\SavedVariables\DPSMate.lua"

TARGETS=(
  "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Mygbank\SavedVariables\DPSMate.lua"
  "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Slootbtch\SavedVariables\DPSMate.lua"
  "C:\TurtleWoW\WTF\Account\STORMBANK\Tel'Abim\Stormshadowb\SavedVariables\DPSMate.lua"
  "C:\TurtleWoW\WTF\Account\STORMSHADOW\Tel'Abim\Meltyougood\SavedVariables\DPSMate.lua"
)

for target in "${TARGETS[@]}"; do
  cp "$MASTER" "$target"
  echo "Synced to: $target"
done
```

**Note**: Create this script for easy future syncing

---

## Updated Execution Plan - Account Sync Integration

### Modified Phase 6: Account Synchronization

**NEW STEP 6.6: Configure Master Character**
```bash
Priority: HIGH
Character: Excaliburz (STORMSHADOW) - Choose as master
Action: Complete DPSMate configuration
  - Frame positions
  - Data modes (damage, healing, threat)
  - Segment settings
  - Module preferences
  - Combat log range (already set globally)
Save: Exit game to save DPSMate.lua
```

**NEW STEP 6.7: Sync Configuration Across Accounts**
```bash
Priority: HIGH
Action: Copy DPSMate.lua from master to all characters
Source: STORMSHADOW/Tel'Abim/Excaliburz/SavedVariables/DPSMate.lua
Targets: All 4 other characters (Mygbank, Slootbtch, Stormshadowb, Meltyougood)
Verification: Check file timestamps match
```

**NEW STEP 6.8: Test All Characters (Both Accounts)**
```bash
Priority: CRITICAL
Test Plan:
  1. Log into STORMBANK/Mygbank - Verify DPSMate loads with synced config
  2. Log into STORMBANK/Slootbtch - Verify DPSMate loads
  3. Log into STORMBANK/Stormshadowb - Verify DPSMate loads
  4. Log into STORMSHADOW/Meltyougood - Verify DPSMate loads
  5. Return to STORMSHADOW/Excaliburz - Verify master config intact

Check Each:
  - DPSMate frames appear
  - Frame positions match (or can be adjusted)
  - Data modes configured
  - /dps commands work
  - No Lua errors
```

---

## ShaguDPS Removal - Account-Aware Strategy

### Updated Phase 2: Multi-Account ShaguDPS Removal

**STEP 2.3 UPDATED: Remove All ShaguDPS SavedVariables**
```bash
Priority: CRITICAL
Action: Delete ShaguDPS configs from BOTH accounts

STORMBANK Account (3 characters):
  ✅ Tel'Abim/Mygbank/SavedVariables/ShaguDPS.lua
  ✅ Tel'Abim/Slootbtch/SavedVariables/ShaguDPS.lua
  ✅ Tel'Abim/Stormshadowb/SavedVariables/ShaguDPS.lua

STORMSHADOW Account (2 characters):
  ✅ Tel'Abim/Excaliburz/SavedVariables/ShaguDPS.lua
  ✅ Tel'Abim/Meltyougood/SavedVariables/ShaguDPS.lua (RECENTLY MODIFIED - preserve in backup!)

Total Files to Remove: 5
```

**STEP 2.2 UPDATED: Archive ShaguDPS Configs (Per-Account)**
```bash
Priority: HIGH
Action: Create account-specific backups

STORMBANK Backup:
  Source: WTF/Account/STORMBANK/Tel'Abim/*/SavedVariables/ShaguDPS.lua
  Dest: ShaguDPS_Config_Backup_2025-10-18/STORMBANK/
  Files: 3 characters

STORMSHADOW Backup:
  Source: WTF/Account/STORMSHADOW/Tel'Abim/*/SavedVariables/ShaguDPS.lua
  Dest: ShaguDPS_Config_Backup_2025-10-18/STORMSHADOW/
  Files: 2 characters (including recently modified Meltyougood)

Reason: Account separation makes restoration easier
```

---

## Verification Checklist - Multi-Account Edition

### All Characters Must Pass

**STORMBANK Account**:
- [ ] Mygbank - DPSMate loaded, no errors, config synced
- [ ] Slootbtch - DPSMate loaded, no errors, config synced
- [ ] Stormshadowb - DPSMate loaded, no errors, config synced

**STORMSHADOW Account**:
- [ ] Excaliburz - DPSMate loaded, no errors, MASTER CONFIG
- [ ] Meltyougood - DPSMate loaded, no errors, config synced

**Global Checks** (applies to all):
- [ ] Combat log range = 200 yards (set once, applies to all)
- [ ] SuperWowCombatLogger loaded (same addon folder for all)
- [ ] No ShaguDPS remnants (verified on all characters)
- [ ] Memory usage acceptable (check on each character)

---

## Key Takeaways

### Account Structure
✅ **2 Accounts**: STORMBANK (3 chars) + STORMSHADOW (2 chars)
✅ **5 Characters Total**: All on Tel'Abim server
✅ **169 Total Config Files**: 91 (STORMBANK) + 78 (STORMSHADOW)

### DPSMate Source
✅ **Best Fork**: laytya/DPSMate
✅ **Why**: Turtle WoW specific, actively maintained, official wiki recommendation
✅ **Repository**: https://github.com/laytya/DPSMate (master branch)

### Synchronization Strategy
✅ **Master Character**: Excaliburz (STORMSHADOW)
✅ **Sync Method**: Hybrid (copy base config + per-char adjustments)
✅ **Automation**: Optional script for future updates

### Execution Impact
⏱️ **Additional Time**: +15 minutes for multi-account sync
📦 **Config Files to Backup**: 5 ShaguDPS files (across 2 accounts)
🔄 **Testing Required**: All 5 characters (not just one)

---

**Document Version**: 1.1
**Date**: 2025-10-18
**Status**: UPDATED WITH ACCOUNT SYNC STRATEGY

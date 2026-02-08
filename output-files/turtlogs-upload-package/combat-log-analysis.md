# TurtleLogs Combat Log Format Analysis

## Overview

This document summarizes findings from analyzing why combat logs from SuperWowCombatLogger were not parsing correctly on TurtleLogs, specifically for the Razorgore fight in BWL.

---

## The Problem

- User's combat log (smaller file) displayed Razorgore fight incorrectly on TurtleLogs
- Another person's combat log (larger file) from the SAME raid displayed correctly
- Some DPS showed with lower numbers, some DPS missing entirely, ALL healers missing
- Other boss fights parsed correctly, only Razorgore had issues

---

## Root Causes Identified

### 1. Missing CAST: Structured Log Entries

**Working log has:**
```
12/25 02:06:25.871  CAST: Jazhinkavoyn channels Possess(19832) on Razorgore the Untamed.
12/25 02:06:28.209  CAST: Razorgore the Untamed begins to cast Destroy Egg(19873).
12/25 02:11:50.687  CAST: Razorgore the Untamed casts Conflagration(23023) on Razorgore the Untamed.
```

**Broken log has:** 0 CAST: entries

The `CAST:` format includes spell IDs and structured data. Added to SuperWowCombatLogger on **November 17, 2025**.

### 2. Missing GUIDs in COMBATANT_INFO

**Working log:**
```
COMBATANT_INFO:...&Bambow&HUNTER&...&0x000000000009821A&0xF14003324000000B
```

**Broken log:**
```
COMBATANT_INFO:...&Bambow&HUNTER&...&nil
```

GUIDs uniquely identify players and allow reliable correlation between COMBATANT_INFO and damage entries. Added to SuperWowCombatLogger on **November 18, 2025**.

### 3. Missing Phase 2 Transition Marker

For Razorgore specifically, TurtleLogs needs:
```
CAST: Razorgore the Untamed casts Conflagration(23023) on Razorgore the Untamed.
```

This marks when Phase 2 begins (Razorgore breaks free after all eggs destroyed). Without this marker, TurtleLogs can't determine encounter boundaries for Razorgore's unique 2-phase fight.

### 4. Apostrophe Formatting Difference

**Working log:** `Morow 's Earth Shock` (space before apostrophe)
**Broken log:** `Morow's Earth Shock` (no space)

This formatting is applied by `format_log_for_upload.py` script.

---

## The format_log_for_upload.py Script

Located in: `SuperWowCombatLogger/format_log_for_upload.py`

### Purpose
Post-processes raw WoWCombatLog.txt before uploading to TurtleLogs/MonkeyLogs.

### Key Transformations

#### 1. You/Your Replacement
```
Raw:       "You hit Razorgore for 500"
Formatted: "PlayerName hits Razorgore for 500"
```

#### 2. Apostrophe Spacing (lines 178-182)
```python
# handle 's at beginning of line
rf"  ([{L}'\- ]*?\S)'s ([A-Z])": r"  \g<1> 's \g<2>",
rf"from ([{L}'\- ]*?\S)'s ([A-Z])": r"from \g<1> 's \g<2>",
```
Converts `Player's Spell` to `Player 's Spell`

#### 3. Pet Attribution (lines 162-168)
```python
rf"  ([{L}][{L} ]+[{L}]) \(([{L}]+)\) (hits|crits|misses)": r"  \g<2>'s Auto Attack (pet) \g<3>",
```
Pet damage credited to owner under "Auto Attack (pet)"

#### 4. Shaman Totem Attribution (lines 189-190)
```python
rf"  [A-Z][{L} ]* Totem [IVX]+ \((.*?)\) 's": r"  \g<1> 's",
```
Totem damage appears as if shaman cast it

#### 5. Self-Damage Separation (lines 205-208)
```python
rf"  ([{L}' ]*?) 's (.*) (hits|crits) ([{L}' ]*?) for": r"  \g<1> (self damage) 's \g<2> \g<3> \g<4> for",
```
Marks self-damage so it doesn't count as DPS

---

## COMBATANT_INFO Format

Full format with fields:
```
COMBATANT_INFO: timestamp&PlayerName&CLASS&Race&Faction&PetName&Guild&Rank&RankIndex&Slot1:Enchant:Gem1:Gem2&Slot2:...&...&TalentString&PlayerGUID&TargetGUID
```

### Key Fields:
- Field 1: Timestamp (e.g., "24.12.25 15:56:51")
- Field 2: Player Name
- Field 3: Class (WARRIOR, MAGE, etc.)
- Field 4: Race
- Field 5: Faction (2=Horde, 1=Alliance?)
- Field 6: Pet Name (or "nil")
- Field 7: Guild Name
- Field 8: Guild Rank
- Field 9: Rank Index
- Fields 10-27: Equipment slots with enchant/gem data
- Field 28: Talent string (contains `}` characters)
- Field 29: Player GUID (e.g., "0x00000000000DBC39")
- Field 30: Target/Boss GUID (or "nil")

### Example with GUIDs (working):
```
COMBATANT_INFO: 25.12.25 02:12:00&Bambow&HUNTER&Orc&2&Fenrir&Thralls Book Club&Officer&2&16939:2586:0:0&...&0x000000000009821A&0xF14003324000000B
```

### Example without GUIDs (broken):
```
COMBATANT_INFO: 24.12.25 16:12:24&Nookiez&MAGE&Scourge&2&nil&Mindless Self Indulgence&Officer&2&...&nil
```

---

## Parsing Implications for TurtleLogs Website

### If parsing by GUID (preferred):
1. Extract player GUID from COMBATANT_INFO
2. Match damage/healing entries to players by GUID
3. Reliable, unambiguous matching

### If parsing by text/name (fallback):
1. Match damage entries by player name text patterns
2. Regex patterns must handle:
   - `Player 's Spell` (with space)
   - `Player's Spell` (without space)
   - Pet format: `PetName (OwnerName)`
   - Totem format: `Totem Name (OwnerName)`
3. Less reliable, can miss entries or misattribute

### Razorgore-Specific Parsing:
1. Look for Phase 2 marker: `CAST: Razorgore the Untamed casts Conflagration(23023)`
2. Or detect first damage to Razorgore as Phase 2 start
3. The Possess mechanic: `CAST: PlayerName channels Possess(19832) on Razorgore`
4. Egg destruction: `CAST: Razorgore the Untamed casts Destroy Egg(19873)`

---

## Questions for Website Code Review

1. Does the upload parser expect GUIDs in COMBATANT_INFO?
2. Does it require the `CAST:` structured format or can it parse without?
3. How does it handle apostrophe formatting (`'s` vs ` 's`)?
4. How are encounter boundaries determined for multi-phase fights like Razorgore?
5. Is `format_log_for_upload.py` transformations expected/required?
6. How is healer data parsed differently from DPS data?

---

## File Locations

- SuperWowCombatLogger addon: `Interface/AddOns/SuperWowCombatLogger/`
- Python formatter: `SuperWowCombatLogger/format_log_for_upload.py`
- Raw combat log: `Logs/WoWCombatLog.txt`
- GitHub repo: https://github.com/pepopo978/SuperWowCombatLogger

---

## Timeline of SuperWowCombatLogger Updates

- **Nov 10, 2025**: User's addon version (VERSION 14)
- **Nov 17, 2025**: CAST: structured log messages added
- **Nov 18, 2025**: Player GUIDs added to COMBATANT_INFO
- **Dec 5, 2025**: Latest version downloaded

---

*Analysis performed: December 25, 2025*

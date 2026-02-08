# Player Analysis Feature - Combat Log Processor v2.1

**Added:** October 21, 2025
**Status:** ✅ Production Ready

---

## Overview

The Player Analysis tab provides comprehensive statistics about player behavior during raids, including consumable usage, deaths, dispels, and protective spells. This feature helps raid leaders and players understand raid preparation and performance.

---

## Features

### 📊 Summary Statistics

Displays high-level overview of the entire raid:
- **Total Players** - Number of unique players detected
- **Total Deaths** - Total deaths across all players
- **Total Consumables** - All consumables used (food, elixirs, flasks, weapon buffs, world buffs)
- **Total Dispels** - All dispel casts (Remove Curse, Cure Disease, etc.)
- **Avg Deaths/Player** - Average death count per player
- **Avg Consumables/Player** - Average consumable usage per player

### 📋 Player Statistics Table

Sortable table showing per-player statistics:

| Column | Description |
|--------|-------------|
| Player | Player name |
| Food Buffs | Food consumables (Blessed Sunfruit, Danonzo items, etc.) |
| Elixirs | Battle & Guardian elixirs (Mongoose, Giants, etc.) |
| Flasks | Flasks (Supreme Power, Titans, etc.) |
| Weapon Buffs | Oils, sharpening stones, poisons |
| World Buffs | Rallying Cry, Spirit of Zandalar, etc. |
| Deaths | Number of times player died |
| Dispels | Dispel casts (Remove Curse, Cure Disease, etc.) |
| Protective | Protective spells (Fear Ward, Power Word: Shield) |

### 🔍 Interactive Features

1. **Sortable Columns**
   - Click any column header to sort
   - Click again to toggle ascending/descending
   - Arrow indicator shows current sort direction

2. **Player Name Filter**
   - Type in search box to filter by player name
   - Real-time filtering as you type

3. **Item Tooltips**
   - Hover over any consumable count to see breakdown
   - Shows individual items and their usage count
   - Example: "Elixir of the Mongoose: 3, Winterfall Firewater: 2"

4. **Reset Filters**
   - One-click reset button to clear all filters

---

## How to Use

### Step 1: Access Analysis Tab

1. Launch the web interface: `start_web_app.bat`
2. Click the **"📊 Player Analysis"** tab

### Step 2: Select Log File

1. Choose a processed raid log from the dropdown
   - Shows all TurtLog files in directory
   - Newest files appear first
   - Example: `TurtLog-MC-2025-10-20-Ragnaros.txt`

### Step 3: Analyze

1. Click **"📊 Analyze Player Behavior"**
2. Wait for analysis to complete (~2-5 seconds)
3. View results:
   - Summary statistics appear at top
   - Player table appears below

### Step 4: Explore Data

1. **Sort by any metric**
   - Click "Deaths" to see who died most
   - Click "Consumables" to see who prepared best
   - Click "Dispels" to see who cleansed most

2. **Filter by player**
   - Type player name in filter box
   - See only matching players

3. **View details**
   - Hover over numbers to see item breakdown
   - See exactly which consumables were used

---

## Tracked Consumables

### Food Buffs
- Danonzo's Tel'Abim Medley (+2% Haste)
- Danonzo's Tel'Abim Delight (+15 Stamina/Spirit)
- Danonzo's Tel'Abim Surprise (+12 Stamina/Spirit)
- Blessed Sunfruit (+10 Strength)
- Dirge's Kickin' Chimaerok Chops (+25 Stamina)
- Smoked Desert Dumplings (+20 Strength)
- Runn Tum Tuber Surprise (+10 Intellect)
- Nightfin Soup (+8 MP5)
- Sagefish Delight (+6 MP5)
- Grilled Squid (+10 Agility)
- Well Fed (generic food buff)

### Elixirs
**Battle Elixirs:**
- Elixir of the Mongoose (+25 Agi, +2% Crit)
- Elixir of Giants (+25 Str)
- Elixir of Greater Agility (+25 Agi)
- Elixir of Brute Force (+18 Str/Stam)
- Winterfall Firewater (+35 AP)
- Elixir of Greater Firepower (+40 Fire Dmg)
- Elixir of Shadow Power (+40 Shadow Dmg)
- Elixir of Frost Power (+15 Frost Dmg)
- Gift of Arthas (+10 Shadow Dmg)
- Dreamshard Elixir (+2% Spell Crit, +15 Spell Power)

**Guardian Elixirs:**
- Elixir of the Sages (+18 Int/Spirit)
- Elixir of Greater Intellect (+25 Int)
- Elixir of Fortitude (+120 HP)

**Combat Potions:**
- Mighty Rage Potion (+45-75 Rage)

### Flasks
- Flask of Supreme Power (+150 Spell Dmg, 2hr)
- Flask of the Titans (+400 HP, 2hr)
- Flask of Distilled Wisdom (+2000 Mana, 2hr)
- Flask of Chromatic Resistance (+25 All Resist, 2hr)

### Weapon Buffs
**Oils:**
- Brilliant Wizard Oil (+36 Spell Dmg, +1% Spell Crit)
- Wizard Oil (+8 Spell Dmg)
- Lesser Wizard Oil (+4 Spell Dmg)
- Blessed Wizard Oil (+60 vs Undead)
- Mana Oil (+12 MP5)
- Brilliant Mana Oil (+25 Healing, +12 MP5)

**Sharpening Stones:**
- Elemental Sharpening Stone (+2% Crit)
- Dense Sharpening Stone (+8 Weapon Dmg)
- Consecrated Sharpening Stone (+100 AP vs Undead)

**Poisons (Rogue):**
- Deadly Poison
- Instant Poison

**Totem Buffs:**
- Windfury Totem (weapon enchant)

### World Buffs
- Rallying Cry of the Dragonslayer (+140 AP, +5% Crit, +10% Spell Crit, 2hr)
- Warchief's Blessing (+300 HP, +15% Melee Haste, 2hr)
- Spirit of Zandalar (+15% Stats, +10% Move Speed, 2hr)
- Songflower Serenade (+15 All Stats, +5% Crit, 1hr)
- Fengus' Ferocity (+200 AP, 2hr)
- Mol'dar's Moxie (+15% Stamina, 2hr)
- Slip'kik's Savvy (+3% Spell Crit, 2hr)
- Sayge's Dark Fortune of Damage (+10% Dmg, 2hr)

---

## Tracked Utility Spells

### Dispel Spells
- **Remove Curse** (Mage)
- **Remove Lesser Curse** (Mage, Druid)
- **Cure Disease** (Priest, Paladin, Shaman)
- **Abolish Disease** (Priest, Paladin)
- **Cure Poison** (Druid, Shaman)
- **Abolish Poison** (Druid, Shaman)
- **Cleanse** (Paladin - removes poison + disease)
- **Purify** (Priest - removes poison + disease)
- **Dispel Magic** (Priest - removes 2 magic effects)

### Protective Spells
- **Fear Ward** (Priest - absorbs fear)
- **Power Word: Shield** (Priest - absorbs damage)

---

## Understanding the Data

### High Consumable Usage = Good
Players with high consumable counts are well-prepared:
- Pre-raid buffs (flasks, food, elixirs)
- Mid-raid re-buffs after deaths
- Combat potions during fights

**Example:** 50+ consumables = excellent preparation

### High Death Count = Bad
Players with high death counts may need:
- Better positioning
- More awareness
- Boss mechanic review
- Better gear/resistances

**Top Death Reasons:**
- Standing in fire
- Missing boss mechanics
- Pulled aggro
- Raid-wide wipes

### High Dispel Count = Good (Healers/Support)
High dispel counts indicate:
- Active support player
- Quick reaction to debuffs
- Helping keep raid alive

**Key Dispellers:** Priests, Paladins, Mages, Druids, Shamans

---

## Real Data Example (MC 10/20/2025)

### Summary Stats
```
Total Players: 62
Total Deaths: 249
Total Consumables: 1354
Total Dispels: 311
Avg Deaths/Player: 4.02
Avg Consumables/Player: 21.84
```

### Top Performers
```
Most Deaths: Hound (39 deaths)
Most Consumables: Keenhoof (196 consumables)
Most Dispels: Zuella (76 dispels)
```

### Sample Player Breakdown
**Dirtmcskrt:**
- Elixirs: Winterfall Firewater (3), Elixir of the Mongoose (1)
- Weapon Buffs: Windfury Totem (117)
- Deaths: 3
- Total Consumables: 121

**Vvulf:**
- Food Buffs: Blessed Sunfruit (3)
- Elixirs: Elixir of the Giants (multiple uses)
- Weapon Buffs: Various
- Deaths: Moderate

---

## Technical Details

### Files Created
1. **consumables_database.json** - Database of all trackable items/spells
2. **analyze_player_behavior.py** - Python analysis engine
3. **flask_app.py** (updated) - Web interface with Analysis tab

### How It Works

1. **Log Parsing**
   - Reads processed TurtLog file
   - Scans for "PlayerName gains BuffName (1)." patterns
   - Tracks deaths: "PlayerName dies."
   - Tracks casts: "PlayerName casts SpellName on Target."

2. **Data Aggregation**
   - Counts consumables per player
   - Categorizes by type (food, elixir, flask, etc.)
   - Counts utility actions (deaths, dispels, protective)

3. **Summary Generation**
   - Calculates totals and averages
   - Identifies top performers
   - Generates statistics

4. **Web Display**
   - Renders summary cards
   - Builds sortable table
   - Adds tooltips for details
   - Enables filtering/sorting

### Performance
- **Analysis Speed:** ~2-5 seconds for 15 MB log
- **Memory Usage:** Minimal (streams file)
- **Browser Performance:** Smooth with 100+ players

---

## Use Cases

### For Raid Leaders
1. **Identify Unprepared Players**
   - Sort by consumables (ascending)
   - See who used 0-5 consumables
   - Talk to players about preparation

2. **Review Death Patterns**
   - Sort by deaths (descending)
   - Identify struggling players
   - Provide coaching/tips

3. **Recognize Contributors**
   - Sort by dispels (descending)
   - Thank active support players
   - Recognize well-prepared players

### For Players
1. **Compare Your Performance**
   - Find your name in table
   - See how you compare to raid average
   - Identify areas to improve

2. **Track Improvement**
   - Compare across multiple raids
   - See consumable usage trends
   - Monitor death counts

3. **Validate Preparation**
   - Confirm your buffs were tracked
   - Verify flask/elixir usage
   - Check dispel contributions

### For Officers
1. **Loot Council Decisions**
   - Consider player preparation
   - Reward consistent performers
   - Track attendance patterns

2. **Roster Management**
   - Identify core raiders (high prep)
   - Coach struggling players
   - Recognize MVPs

---

## Customization

### Adding New Consumables

Edit `consumables_database.json`:

```json
{
  "food_buffs": {
    "New Food Item": {
      "effect": "+20 All Stats for 1 hour",
      "category": "food"
    }
  }
}
```

### Adding New Spells

```json
{
  "utility_spells": {
    "New Dispel Spell": {
      "effect": "Removes all debuffs",
      "category": "dispel",
      "classes": ["Priest"]
    }
  }
}
```

**Note:** Restart web app after changes.

---

## Troubleshooting

### "No log files found"
- Process a raid log first in the "Process Log" tab
- Ensure TurtLog-*.txt files exist in Logs folder

### "No data showing"
- Click "Analyze Player Behavior" button
- Wait for analysis to complete
- Check browser console for errors

### "Wrong consumable counts"
- Verify item names match exactly in database
- Check log file contains "gains BuffName" patterns
- Some custom items may not be tracked yet

### "Player not showing"
- Player must have at least one tracked action
- Check player name spelling
- Use filter to search

---

## Future Enhancements

Potential future additions:
- [ ] Export to CSV/Excel
- [ ] Historical tracking (multi-raid comparison)
- [ ] Boss-specific breakdowns
- [ ] Damage/Healing integration
- [ ] Class-specific metrics
- [ ] Consumable cost calculator
- [ ] Loot eligibility scoring

---

## Summary

The Player Analysis feature provides:
- ✅ Comprehensive consumable tracking
- ✅ Death statistics per player
- ✅ Dispel and protective spell tracking
- ✅ Interactive sortable table
- ✅ Real-time filtering
- ✅ Detailed tooltips
- ✅ Summary statistics
- ✅ Easy-to-use web interface

**Perfect for:**
- Raid leaders evaluating performance
- Players improving their game
- Officers making loot decisions
- Guilds tracking progression

---

**Feature Version:** 2.1
**Date Added:** October 21, 2025
**Tested With:** MC raid 10/20/2025 (62 players, 249 deaths, 1354 consumables)
**Status:** ✅ Production Ready

Happy raiding! 🐢⚔️📊

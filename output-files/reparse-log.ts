#!/usr/bin/env -S deno run --unstable-kv --allow-read --allow-write

/**
 * Re-parse a combat log from disk and update the database entry
 * Usage: deno run --unstable-kv --allow-read --allow-write reparse-log.ts <logId>
 *
 * This script reads the raw log file from ./logs/<logId>.txt,
 * re-parses it with the fixed parsePlayerStats() function,
 * and updates the database entry with the new playerStats.
 */

// =============== TYPES ===============
interface PlayerStats {
  name: string;
  deaths: number;
  totalConsumables: number;
  food: Record<string, number>;
  potions: Record<string, number>;
  elixirs: Record<string, number>;
  flasks: Record<string, number>;
  jujus: Record<string, number>;
  scrolls: Record<string, number>;
  weaponEnhancements: Record<string, number>;
  worldBuffs: Record<string, number>;
  misc: Record<string, number>;
  dispels: Record<string, number>;
  protective: Record<string, number>;
  cc: {
    total: number;
    interrupts: Record<string, number>;
    stuns: Record<string, number>;
    polymorphs: Record<string, number>;
    fears: Record<string, number>;
    roots: Record<string, number>;
    kicks: Record<string, number>;
    other: Record<string, number>;
    byTarget: Record<string, number>;
  };
}

// =============== CONSTANTS (copied from logs.ts) ===============
const ENEMY_MOBS = new Set([
  // MC Bosses
  'Lucifron', 'Magmadar', 'Gehennas', 'Garr', 'Shazzrah', 'Baron Geddon',
  'Sulfuron Harbinger', 'Golemagg the Incinerator', 'Majordomo Executus', 'Ragnaros',
  // MC Trash
  'Ancient Core Hound', 'Core Hound', 'Core Rager', 'Flame Imp', 'Flameskin Incendosaur',
  'Flamewaker Elite', 'Flamewaker Healer', 'Flamewaker Priest', 'Flamewaker Protector',
  'Lava Annihilator', 'Lava Elemental', 'Lava Reaver', 'Lava Spawn', 'Lava Surger',
  'Molten Destroyer', 'Molten Giant', 'Shadowforge Blazeweaver', 'Shadowforge Guardian',
  'Shadowforge Hierophant', 'Small Incendic Egg', 'Large Incendic Egg', 'Son of Flame', 'Spawn of Incindis',
  'Firesworn', 'Flameguard',
  // BWL Bosses
  'Razorgore the Untamed', 'Vaelastrasz the Corrupt', 'Broodlord Lashlayer',
  'Firemaw', 'Ebonroc', 'Flamegor', 'Chromaggus', 'Nefarian',
  // BWL Trash
  'Blackwing Mage', 'Blackwing Spellbinder', 'Blackwing Warlock', 'Blackwing Technician',
  'Death Talon Captain', 'Death Talon Flamescale', 'Death Talon Seether', 'Death Talon Wyrmkin',
  'Death Talon Wyrmguard', 'Death Talon Overseer', 'Death Talon Hatcher',
  'Corrupted Blue Whelp', 'Corrupted Bronze Whelp', 'Corrupted Green Whelp', 'Corrupted Red Whelp',
  'Blackwing Legionnaire', 'Blackwing Taskmaster', 'Corrupted Whelp',
  'Black Drakonid', 'Blue Drakonid', 'Bronze Drakonid', 'Green Drakonid', 'Red Drakonid',
  'Chromatic Drakonid', 'Drakonid Chaneller', 'Grethok the Controller',
  'Lab Pack', 'Goblin Technician',
  // AQ40 Bosses
  'The Prophet Skeram', 'Battleguard Sartura', 'Fankriss the Unyielding', 'Viscidus',
  'Princess Huhuran', "Emperor Vek'nilash", "Emperor Vek'lor", 'Ouro', "C'Thun",
  'Bug Trio', 'Princess Yauj', 'Vem', 'Lord Kri',
  // AQ40 Trash
  'Anubisath Sentinel', 'Anubisath Defender', 'Anubisath Warder', 'Obsidian Eradicator',
  'Qiraji Mindslayer', 'Qiraji Brainwasher', 'Vekniss Soldier', 'Vekniss Warrior',
  'Vekniss Guardian', 'Vekniss Stinger', 'Vekniss Wasp', 'Vekniss Hive Crawler',
  // Other raids
  'Onyxia', 'Azuregos', 'Lord Kazzak', 'Taerar', 'Emeriss', 'Lethon', 'Ysondre',
  'High Priestess Jeklik', 'High Priest Venoxis', 'High Priestess Mar\'li', 'High Priest Thekal',
  'High Priestess Arlokk', 'Hakkar', 'Jin\'do the Hexxer', 'Bloodlord Mandokir',
  'Gahz\'ranka', 'Edge of Madness',
  // AQ20
  'Kurinnaxx', 'General Rajaxx', 'Moam', 'Buru the Gorger', 'Ayamiss the Hunter', 'Ossirian the Unscarred',
]);

// Comprehensive buff/consumable list
const ALL_BUFFS = new Map<string, { category: string; name: string }>([
  // FOOD
  ['Tender Wolf Steak', { category: 'food', name: 'Tender Wolf Steak' }],
  ['Monster Omelet', { category: 'food', name: 'Monster Omelet' }],
  ['Grilled Squid', { category: 'food', name: 'Grilled Squid' }],
  ['Smoked Desert Dumplings', { category: 'food', name: 'Smoked Desert Dumplings' }],
  ['Runn Tum Tuber Surprise', { category: 'food', name: 'Runn Tum Tuber Surprise' }],
  ['Dirge\'s Kickin\' Chimaerok Chops', { category: 'food', name: 'Dirge\'s Kickin\' Chimaerok Chops' }],
  ['Nightfin Soup', { category: 'food', name: 'Nightfin Soup' }],
  ['Blessed Sunfruit', { category: 'food', name: 'Blessed Sunfruit' }],
  ['Blessed Sunfruit Juice', { category: 'food', name: 'Blessed Sunfruit Juice' }],
  ['Sagefish Delight', { category: 'food', name: 'Sagefish Delight' }],
  ['Hot Wolf Ribs', { category: 'food', name: 'Hot Wolf Ribs' }],
  ['Heavy Kodo Stew', { category: 'food', name: 'Heavy Kodo Stew' }],
  ['Dragonbreath Chili', { category: 'food', name: 'Dragonbreath Chili' }],
  ['Thistle Tea', { category: 'food', name: 'Thistle Tea' }],
  ['Winter Squid', { category: 'food', name: 'Winter Squid' }],
  ['Scorpok Assay', { category: 'food', name: 'Scorpok Assay' }],

  // POTIONS
  ['Major Mana Potion', { category: 'potion', name: 'Major Mana Potion' }],
  ['Greater Mana Potion', { category: 'potion', name: 'Greater Mana Potion' }],
  ['Super Mana Potion', { category: 'potion', name: 'Super Mana Potion' }],
  ['Major Healing Potion', { category: 'potion', name: 'Major Healing Potion' }],
  ['Greater Healing Potion', { category: 'potion', name: 'Greater Healing Potion' }],
  ['Superior Healing Potion', { category: 'potion', name: 'Superior Healing Potion' }],
  ['Greater Fire Protection Potion', { category: 'potion', name: 'Greater Fire Protection Potion' }],
  ['Greater Nature Protection Potion', { category: 'potion', name: 'Greater Nature Protection Potion' }],
  ['Greater Shadow Protection Potion', { category: 'potion', name: 'Greater Shadow Protection Potion' }],
  ['Greater Frost Protection Potion', { category: 'potion', name: 'Greater Frost Protection Potion' }],
  ['Greater Arcane Protection Potion', { category: 'potion', name: 'Greater Arcane Protection Potion' }],
  ['Free Action Potion', { category: 'potion', name: 'Free Action Potion' }],
  ['Limited Invulnerability Potion', { category: 'potion', name: 'Limited Invulnerability Potion' }],
  ['Restorative Potion', { category: 'potion', name: 'Restorative Potion' }],
  ['Swiftness Potion', { category: 'potion', name: 'Swiftness Potion' }],
  ['Rage Potion', { category: 'potion', name: 'Rage Potion' }],
  ['Great Rage Potion', { category: 'potion', name: 'Great Rage Potion' }],
  ['Mighty Rage Potion', { category: 'potion', name: 'Mighty Rage Potion' }],
  ['Living Action Potion', { category: 'potion', name: 'Living Action Potion' }],
  ['Purification Potion', { category: 'potion', name: 'Purification Potion' }],
  ['Magic Resistance Potion', { category: 'potion', name: 'Magic Resistance Potion' }],
  ['Invisibility Potion', { category: 'potion', name: 'Invisibility Potion' }],
  ['Lesser Invisibility Potion', { category: 'potion', name: 'Lesser Invisibility Potion' }],
  ['Wildvine Potion', { category: 'potion', name: 'Wildvine Potion' }],

  // ELIXIRS
  ['Elixir of the Mongoose', { category: 'elixir', name: 'Elixir of the Mongoose' }],
  ['Elixir of Giants', { category: 'elixir', name: 'Elixir of Giants' }],
  ['Elixir of the Giants', { category: 'elixir', name: 'Elixir of the Giants' }],
  ['Elixir of Superior Defense', { category: 'elixir', name: 'Elixir of Superior Defense' }],
  ['Elixir of Shadow Power', { category: 'elixir', name: 'Elixir of Shadow Power' }],
  ['Elixir of Greater Firepower', { category: 'elixir', name: 'Elixir of Greater Firepower' }],
  ['Elixir of Frost Power', { category: 'elixir', name: 'Elixir of Frost Power' }],
  ['Greater Arcane Elixir', { category: 'elixir', name: 'Greater Arcane Elixir' }],
  ['Arcane Elixir', { category: 'elixir', name: 'Arcane Elixir' }],
  ['Elixir of Greater Agility', { category: 'elixir', name: 'Elixir of Greater Agility' }],
  ['Elixir of Agility', { category: 'elixir', name: 'Elixir of Agility' }],
  ['Elixir of Fortitude', { category: 'elixir', name: 'Elixir of Fortitude' }],
  ['Elixir of Brute Force', { category: 'elixir', name: 'Elixir of Brute Force' }],
  ['Winterfall Firewater', { category: 'elixir', name: 'Winterfall Firewater' }],
  ['Elixir of Poison Resistance', { category: 'elixir', name: 'Elixir of Poison Resistance' }],
  ['Gift of Arthas', { category: 'elixir', name: 'Gift of Arthas' }],
  ['Elixir of Greater Intellect', { category: 'elixir', name: 'Elixir of Greater Intellect' }],
  ['Elixir of the Sages', { category: 'elixir', name: 'Elixir of the Sages' }],
  ['Elixir of Detect Demon', { category: 'elixir', name: 'Elixir of Detect Demon' }],
  ['Elixir of Demonslaying', { category: 'elixir', name: 'Elixir of Demonslaying' }],
  ['Mageblood Potion', { category: 'elixir', name: 'Mageblood Potion' }],
  ['Cerebral Cortex Compound', { category: 'elixir', name: 'Cerebral Cortex Compound' }],
  ['Spirit of Zanza', { category: 'elixir', name: 'Spirit of Zanza' }],
  ['Swiftness of Zanza', { category: 'elixir', name: 'Swiftness of Zanza' }],
  ['Sheen of Zanza', { category: 'elixir', name: 'Sheen of Zanza' }],
  ['R.O.I.D.S', { category: 'elixir', name: 'R.O.I.D.S' }],
  ['Ground Scorpok Assay', { category: 'elixir', name: 'Ground Scorpok Assay' }],
  ['Lung Juice Cocktail', { category: 'elixir', name: 'Lung Juice Cocktail' }],

  // FLASKS
  ['Flask of the Titans', { category: 'flask', name: 'Flask of the Titans' }],
  ['Flask of Supreme Power', { category: 'flask', name: 'Flask of Supreme Power' }],
  ['Flask of Distilled Wisdom', { category: 'flask', name: 'Flask of Distilled Wisdom' }],
  ['Flask of Chromatic Resistance', { category: 'flask', name: 'Flask of Chromatic Resistance' }],
  ['Flask of Petrification', { category: 'flask', name: 'Flask of Petrification' }],

  // JUJUS
  ['Juju Power', { category: 'juju', name: 'Juju Power' }],
  ['Juju Might', { category: 'juju', name: 'Juju Might' }],
  ['Juju Flurry', { category: 'juju', name: 'Juju Flurry' }],
  ['Juju Ember', { category: 'juju', name: 'Juju Ember' }],
  ['Juju Chill', { category: 'juju', name: 'Juju Chill' }],
  ['Juju Guile', { category: 'juju', name: 'Juju Guile' }],
  ['Juju Escape', { category: 'juju', name: 'Juju Escape' }],

  // SCROLLS
  ['Scroll of Strength IV', { category: 'scroll', name: 'Scroll of Strength IV' }],
  ['Scroll of Agility IV', { category: 'scroll', name: 'Scroll of Agility IV' }],
  ['Scroll of Intellect IV', { category: 'scroll', name: 'Scroll of Intellect IV' }],
  ['Scroll of Spirit IV', { category: 'scroll', name: 'Scroll of Spirit IV' }],
  ['Scroll of Stamina IV', { category: 'scroll', name: 'Scroll of Stamina IV' }],
  ['Scroll of Protection IV', { category: 'scroll', name: 'Scroll of Protection IV' }],

  // WEAPON OILS
  ['Shadow Oil', { category: 'weapon_oil', name: 'Shadow Oil' }],
  ['Frost Oil', { category: 'weapon_oil', name: 'Frost Oil' }],
  ['Brilliant Mana Oil', { category: 'weapon_oil', name: 'Brilliant Mana Oil' }],
  ['Brilliant Wizard Oil', { category: 'weapon_oil', name: 'Brilliant Wizard Oil' }],
  ['Lesser Mana Oil', { category: 'weapon_oil', name: 'Lesser Mana Oil' }],
  ['Minor Mana Oil', { category: 'weapon_oil', name: 'Minor Mana Oil' }],
  ['Lesser Wizard Oil', { category: 'weapon_oil', name: 'Lesser Wizard Oil' }],
  ['Minor Wizard Oil', { category: 'weapon_oil', name: 'Minor Wizard Oil' }],

  // SHARPENING STONES
  ['Elemental Sharpening Stone', { category: 'sharpening_stone', name: 'Elemental Sharpening Stone' }],
  ['Dense Sharpening Stone', { category: 'sharpening_stone', name: 'Dense Sharpening Stone' }],
  ['Consecrated Sharpening Stone', { category: 'sharpening_stone', name: 'Consecrated Sharpening Stone' }],
  ['Dense Weightstone', { category: 'sharpening_stone', name: 'Dense Weightstone' }],

  // POISONS
  ['Instant Poison VI', { category: 'poison', name: 'Instant Poison VI' }],
  ['Deadly Poison V', { category: 'poison', name: 'Deadly Poison V' }],
  ['Crippling Poison II', { category: 'poison', name: 'Crippling Poison II' }],
  ['Mind-numbing Poison III', { category: 'poison', name: 'Mind-numbing Poison III' }],
  ['Wound Poison IV', { category: 'poison', name: 'Wound Poison IV' }],

  // WORLD BUFFS
  ['Rallying Cry of the Dragonslayer', { category: 'world_buff', name: 'Rallying Cry of the Dragonslayer' }],
  ['Warchief\'s Blessing', { category: 'world_buff', name: 'Warchief\'s Blessing' }],
  ['Spirit of Zandalar', { category: 'world_buff', name: 'Spirit of Zandalar' }],
  ['Songflower Serenade', { category: 'world_buff', name: 'Songflower Serenade' }],
  ['Slip\'kik\'s Savvy', { category: 'world_buff', name: 'Slip\'kik\'s Savvy' }],
  ['Fengus\' Ferocity', { category: 'world_buff', name: 'Fengus\' Ferocity' }],
  ['Mol\'dar\'s Moxie', { category: 'world_buff', name: 'Mol\'dar\'s Moxie' }],
  ['Dire Maul Tribute', { category: 'world_buff', name: 'Dire Maul Tribute' }],
  ['Sayge\'s Dark Fortune of Damage', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Damage' }],
  ['Sayge\'s Dark Fortune of Agility', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Agility' }],
  ['Sayge\'s Dark Fortune of Intelligence', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Intelligence' }],
  ['Sayge\'s Dark Fortune of Spirit', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Spirit' }],
  ['Sayge\'s Dark Fortune of Stamina', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Stamina' }],
  ['Sayge\'s Dark Fortune of Strength', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Strength' }],
  ['Sayge\'s Dark Fortune of Armor', { category: 'world_buff', name: 'Sayge\'s Dark Fortune of Armor' }],

  // MISC
  ['Kreeg\'s Stout Beatdown', { category: 'misc', name: 'Kreeg\'s Stout Beatdown' }],
  ['Gordok Green Grog', { category: 'misc', name: 'Gordok Green Grog' }],
  ['Rumsey Rum Black Label', { category: 'misc', name: 'Rumsey Rum Black Label' }],
  ['Fire-toasted Bun', { category: 'misc', name: 'Fire-toasted Bun' }],
  ['Crystal Force', { category: 'misc', name: 'Crystal Force' }],
  ['Crystal Ward', { category: 'misc', name: 'Crystal Ward' }],
  ['Crystal Spire', { category: 'misc', name: 'Crystal Spire' }],
  ['Dreamtonic', { category: 'misc', name: 'Dreamtonic' }],
  ['Tea with Sugar', { category: 'misc', name: 'Tea with Sugar' }],
  ['Elixir of Dream Vision', { category: 'misc', name: 'Elixir of Dream Vision' }],
  ['Major Troll\'s Blood Potion', { category: 'misc', name: 'Major Troll\'s Blood Potion' }],
  ['Dark Rune', { category: 'misc', name: 'Dark Rune' }],
  ['Demonic Rune', { category: 'misc', name: 'Demonic Rune' }],
  ['Night Dragon\'s Breath', { category: 'misc', name: 'Night Dragon\'s Breath' }],
  ['Whipper Root Tuber', { category: 'misc', name: 'Whipper Root Tuber' }],
  ['Crystal Basilisk Spine', { category: 'misc', name: 'Crystal Basilisk Spine' }],
  ['Medivh\'s Merlot', { category: 'misc', name: 'Medivh\'s Merlot' }],
  ['Inv Misc Food 24', { category: 'misc', name: 'Inv Misc Food 24' }],
]);

// Dispel spells
const DISPEL_SPELLS = new Set([
  'Dispel Magic', 'Purge', 'Cleanse', 'Abolish Disease', 'Cure Disease',
  'Abolish Poison', 'Cure Poison', 'Remove Curse', 'Remove Lesser Curse',
  'Decursive', 'Devour Magic',
]);

// Protective spells
const PROTECTIVE_SPELLS = new Set([
  'Power Word: Shield', 'Power Word: Fortitude', 'Prayer of Fortitude',
  'Divine Spirit', 'Prayer of Spirit', 'Shadow Protection', 'Prayer of Shadow Protection',
  'Blessing of Kings', 'Greater Blessing of Kings',
  'Blessing of Might', 'Greater Blessing of Might',
  'Blessing of Wisdom', 'Greater Blessing of Wisdom',
  'Blessing of Salvation', 'Greater Blessing of Salvation',
  'Blessing of Sanctuary', 'Greater Blessing of Sanctuary',
  'Blessing of Light', 'Greater Blessing of Light',
  'Blessing of Protection', 'Divine Protection', 'Divine Shield',
  'Arcane Intellect', 'Arcane Brilliance',
  'Mark of the Wild', 'Gift of the Wild',
  'Thorns',
]);

// =============== PARSE FUNCTION (FIXED VERSION) ===============
function parsePlayerStats(logContent: string): PlayerStats[] {
  const lines = logContent.split('\n');
  const potentialPlayers = new Set<string>();
  const confirmedPlayers = new Set<string>();

  // FIRST PASS: Identify confirmed raid members
  for (const line of lines) {
    // Pattern: "PlayerName uses ItemName."
    const usesMatch = line.match(/(\w+) uses (.+?)(?:\son\s|\.)/);
    if (usesMatch) {
      const [, name, itemName] = usesMatch;
      if (ENEMY_MOBS.has(name)) continue;
      potentialPlayers.add(name);
      const trimmedItem = itemName.trim();
      if (ALL_BUFFS.has(trimmedItem)) {
        confirmedPlayers.add(name);
      }
    }

    // Pattern: "PlayerName casts SpellName on Target"
    const detectCastMatch = line.match(/(\w+) casts (.+?) on (\w+)\./);
    if (detectCastMatch) {
      const [, caster, spellName, target] = detectCastMatch;
      if (ENEMY_MOBS.has(caster)) continue;
      potentialPlayers.add(caster);
      if (!ENEMY_MOBS.has(target)) potentialPlayers.add(target);
      if (DISPEL_SPELLS.has(spellName) || PROTECTIVE_SPELLS.has(spellName)) {
        confirmedPlayers.add(caster);
        if (!ENEMY_MOBS.has(target)) confirmedPlayers.add(target);
      }
    }
  }

  // SECOND PASS: Add players who received heals/buffs from confirmed players
  for (const line of lines) {
    const healMatch = line.match(/(\w+) 's .+ heals (\w+)/);
    if (healMatch) {
      const [, healer, target] = healMatch;
      if (confirmedPlayers.has(healer) && potentialPlayers.has(target)) {
        if (!ENEMY_MOBS.has(target)) confirmedPlayers.add(target);
      }
    }

    const buffFromMatch = line.match(/(\w+) gains .+ from (\w+)/);
    if (buffFromMatch) {
      const [, target, source] = buffFromMatch;
      if (confirmedPlayers.has(source) && potentialPlayers.has(target)) {
        if (!ENEMY_MOBS.has(target)) confirmedPlayers.add(target);
      }
    }
  }

  // Initialize stats for confirmed players only
  const playerStats = new Map<string, PlayerStats>();
  for (const name of confirmedPlayers) {
    playerStats.set(name, {
      name,
      deaths: 0,
      totalConsumables: 0,
      food: {},
      potions: {},
      elixirs: {},
      flasks: {},
      jujus: {},
      scrolls: {},
      weaponEnhancements: {},
      worldBuffs: {},
      misc: {},
      dispels: {},
      protective: {},
      cc: {
        total: 0,
        interrupts: {},
        stuns: {},
        polymorphs: {},
        fears: {},
        roots: {},
        kicks: {},
        other: {},
        byTarget: {},
      },
    });
  }

  // THIRD PASS: Parse stats for confirmed players only
  for (const line of lines) {
    // Pattern 1: "PlayerName uses ItemName."
    const usesMatch = line.match(/(\w+) uses (.+?)(?:\son\s|\.)/);
    if (usesMatch) {
      const [, playerName, itemName] = usesMatch;
      const trimmedItem = itemName.trim();
      if (!confirmedPlayers.has(playerName)) continue;

      const buffInfo = ALL_BUFFS.get(trimmedItem);
      if (buffInfo) {
        const stats = playerStats.get(playerName)!;
        const category = buffInfo.category;

        if (category === "food") stats.food[trimmedItem] = (stats.food[trimmedItem] || 0) + 1;
        else if (category === "potion") stats.potions[trimmedItem] = (stats.potions[trimmedItem] || 0) + 1;
        else if (category === "elixir") stats.elixirs[trimmedItem] = (stats.elixirs[trimmedItem] || 0) + 1;
        else if (category === "flask") stats.flasks[trimmedItem] = (stats.flasks[trimmedItem] || 0) + 1;
        else if (category === "juju") stats.jujus[trimmedItem] = (stats.jujus[trimmedItem] || 0) + 1;
        else if (category === "scroll") stats.scrolls[trimmedItem] = (stats.scrolls[trimmedItem] || 0) + 1;
        else if (["weapon_oil", "sharpening_stone", "poison"].includes(category))
          stats.weaponEnhancements[trimmedItem] = (stats.weaponEnhancements[trimmedItem] || 0) + 1;
        else if (category === "world_buff") stats.worldBuffs[trimmedItem] = (stats.worldBuffs[trimmedItem] || 0) + 1;
        else if (category === "misc") stats.misc[trimmedItem] = (stats.misc[trimmedItem] || 0) + 1;

        stats.totalConsumables += 1;
      }
    }

    // Pattern 2: "PlayerName gains BuffName (1)."
    const buffMatch = line.match(/(\w+) gains (.+?) \(\d+\)\./);
    if (buffMatch) {
      const [, playerName, buffName] = buffMatch;
      if (!confirmedPlayers.has(playerName)) continue;

      const buffInfo = ALL_BUFFS.get(buffName);
      if (buffInfo) {
        const stats = playerStats.get(playerName)!;
        const category = buffInfo.category;

        if (["flask", "elixir", "potion", "food", "juju", "scroll", "misc"].includes(category)) continue;

        if (["weapon_oil", "sharpening_stone", "poison"].includes(category)) {
          stats.weaponEnhancements[buffName] = (stats.weaponEnhancements[buffName] || 0) + 1;
          stats.totalConsumables += 1;
        } else if (category === "world_buff") {
          stats.worldBuffs[buffName] = (stats.worldBuffs[buffName] || 0) + 1;
          stats.totalConsumables += 1;
        }
      }
    }

    // Pattern 3: "PlayerName dies."
    const deathMatch = line.match(/(\w+) dies\./);
    if (deathMatch) {
      const [, playerName] = deathMatch;
      if (confirmedPlayers.has(playerName)) {
        playerStats.get(playerName)!.deaths += 1;
      }
    }

    // Pattern 4: "PlayerName casts SpellName on Target."
    const dispelCastMatch = line.match(/(\w+) casts (.+?) on (\w+)\./);
    if (dispelCastMatch) {
      const [, caster, spellName] = dispelCastMatch;
      if (!confirmedPlayers.has(caster)) continue;
      const stats = playerStats.get(caster)!;

      if (DISPEL_SPELLS.has(spellName)) {
        stats.dispels[spellName] = (stats.dispels[spellName] || 0) + 1;
      }
      if (PROTECTIVE_SPELLS.has(spellName)) {
        stats.protective[spellName] = (stats.protective[spellName] || 0) + 1;
      }
    }

    // Pattern 5a: Spell interrupts
    const interruptMatch = line.match(/(\w+) interrupts (.+?) 's (.+?)\./);
    if (interruptMatch) {
      const [, player, target, spellName] = interruptMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        const key = spellName.trim();
        stats.cc.interrupts[key] = (stats.cc.interrupts[key] || 0) + 1;
        stats.cc.byTarget[target] = (stats.cc.byTarget[target] || 0) + 1;
        stats.cc.total++;
      }
    }

    // Pattern 5b: CC casts
    const ccCastMatch = line.match(/(\w+) casts (.+?)(?: on (.+?))?\./);
    if (ccCastMatch) {
      const [, player, spellName, target] = ccCastMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        const spell = spellName.trim();
        const targetName = target ? target.trim() : "AoE";

        if (/Polymorph/i.test(spell)) {
          stats.cc.polymorphs[spell] = (stats.cc.polymorphs[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Fear|Psychic Scream|Howl of Terror|Intimidating Shout/i.test(spell)) {
          stats.cc.fears[spell] = (stats.cc.fears[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Frost Nova|Entangling Roots/i.test(spell)) {
          stats.cc.roots[spell] = (stats.cc.roots[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Kidney Shot|Cheap Shot|Gouge|Blind|Sap|Hammer of Justice|Repentance|Bash|War Stomp|Hibernate/i.test(spell)) {
          stats.cc.stuns[spell] = (stats.cc.stuns[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        }
      }
    }

    // Pattern 5c: Kick/Pummel/Shield Bash
    const kickMatch = line.match(/(\w+) 's (Kick|Pummel|Shield Bash) (hits|crits) (.+?) for/);
    if (kickMatch) {
      const [, player, ability, , target] = kickMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        stats.cc.kicks[ability] = (stats.cc.kicks[ability] || 0) + 1;
        stats.cc.byTarget[target] = (stats.cc.byTarget[target] || 0) + 1;
        stats.cc.total++;
      }
    }
  }

  // FIXED: Use optional chaining and default empty objects
  return Array.from(playerStats.values())
    .filter(p => p.totalConsumables > 0 || p.deaths > 0 || Object.keys(p.dispels || {}).length > 0 || Object.keys(p.cc?.interrupts || {}).length > 0)
    .sort((a, b) => b.totalConsumables - a.totalConsumables);
}

// =============== SUMMARY FUNCTION ===============
function generateSummary(players: PlayerStats[], loot: any[]) {
  const totalPlayers = players.length;
  const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0);
  const totalConsumables = players.reduce((sum, p) => sum + p.totalConsumables, 0);
  const totalDispels = players.reduce((sum, p) => sum + Object.values(p.dispels || {}).reduce((a, b) => a + b, 0), 0);
  const totalCC = players.reduce((sum, p) => sum + (p.cc?.total || 0), 0);

  const mostDeathsPlayer = players.reduce((max, p) => p.deaths > max.deaths ? p : max, { name: "None", deaths: 0 } as PlayerStats);
  const mostConsumablesPlayer = players.reduce((max, p) => p.totalConsumables > max.totalConsumables ? p : max, { name: "None", totalConsumables: 0 } as PlayerStats);
  const mostDispelsPlayer = players.reduce((max, p) => {
    const dispelCount = Object.values(p.dispels || {}).reduce((a, b) => a + b, 0);
    const maxDispelCount = Object.values(max.dispels || {}).reduce((a: number, b: number) => a + b, 0);
    return dispelCount > maxDispelCount ? p : max;
  }, { name: "None", dispels: {} } as PlayerStats);
  const mostCCPlayer = players.reduce((max, p) => {
    const ccCount = p.cc?.total || 0;
    const maxCCCount = max.cc?.total || 0;
    return ccCount > maxCCCount ? p : max;
  }, { name: "None", cc: { total: 0 } } as PlayerStats);

  const totalLootDrops = loot.length;
  const epicDrops = loot.filter((l: any) => l.quality === 'epic').length;

  return {
    totalPlayers,
    totalDeaths,
    totalConsumables,
    totalDispels,
    mostDeaths: { player: mostDeathsPlayer.name, count: mostDeathsPlayer.deaths },
    mostConsumables: { player: mostConsumablesPlayer.name, count: mostConsumablesPlayer.totalConsumables },
    mostDispels: {
      player: mostDispelsPlayer.name,
      count: Object.values(mostDispelsPlayer.dispels || {}).reduce((a: number, b: number) => a + b, 0),
    },
    totalCC,
    mostCC: {
      player: mostCCPlayer.name,
      count: mostCCPlayer.cc?.total || 0,
    },
    totalLootDrops,
    epicDrops,
  };
}

// =============== MAIN ===============
const logId = Deno.args[0];

if (!logId) {
  console.error("Usage: deno run --unstable-kv --allow-read --allow-write reparse-log.ts <logId>");
  console.error("Example: deno run --unstable-kv --allow-read --allow-write reparse-log.ts BWL-1765635333587-5xpban");
  Deno.exit(1);
}

console.log(`Re-parsing log: ${logId}`);

// Open the database
const kv = await Deno.openKv("./data.db");

// Get the existing entry
const entry = await kv.get(["combat_logs", logId]);

if (!entry.value) {
  console.error(`Log not found in database: ${logId}`);
  kv.close();
  Deno.exit(1);
}

const log = entry.value as any;
console.log(`Found log: ${log.raidName}`);
console.log(`Current playerStats count: ${(log.playerStats || []).length}`);
console.log(`Current loot count: ${(log.loot || []).length}`);

// Read the raw log file from disk
const logFilePath = `./logs/${logId}.txt`;
let rawContent: string;

try {
  rawContent = await Deno.readTextFile(logFilePath);
  console.log(`Read ${rawContent.length} bytes from ${logFilePath}`);
} catch (err) {
  console.error(`Failed to read log file: ${logFilePath}`);
  console.error(err);
  kv.close();
  Deno.exit(1);
}

// Re-parse the log with FIXED function
console.log("Re-parsing player stats with fixed function...");
const playerStats = parsePlayerStats(rawContent);
console.log(`Parsed ${playerStats.length} players`);

// Generate new summary
const summary = generateSummary(playerStats, log.loot || []);

// Update the database entry
const updatedLog = {
  ...log,
  playerStats,
  summary,
  reparsedAt: new Date().toISOString(),
};

console.log("Updating database entry...");
await kv.set(["combat_logs", logId], updatedLog);
console.log("Done!");

console.log(`\nUpdated stats:`);
console.log(`  playerStats count: ${playerStats.length}`);
console.log(`  loot count: ${updatedLog.loot.length}`);
console.log(`  totalConsumables: ${summary.totalConsumables}`);
console.log(`  totalDeaths: ${summary.totalDeaths}`);

kv.close();

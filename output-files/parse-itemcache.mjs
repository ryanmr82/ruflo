#!/usr/bin/env node
// Parse WoW 1.12 itemcache.wdb file to extract item tooltips
// WDB format: header + records of [itemId, size, itemData]

import fs from 'fs';
import path from 'path';

const WDB_PATH = 'C:/turtlewow/WDB/itemcache.wdb';
const OUTPUT_PATH = './item-tooltips.json';

// Item quality names
const QUALITY_NAMES = ['Poor', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Artifact'];

// Inventory slot names
const SLOT_NAMES = {
  0: null,
  1: 'Head',
  2: 'Neck',
  3: 'Shoulder',
  4: 'Shirt',
  5: 'Chest',
  6: 'Waist',
  7: 'Legs',
  8: 'Feet',
  9: 'Wrist',
  10: 'Hands',
  11: 'Finger',
  12: 'Trinket',
  13: 'One-Hand',
  14: 'Shield',
  15: 'Ranged',
  16: 'Back',
  17: 'Two-Hand',
  18: 'Bag',
  19: 'Tabard',
  20: 'Robe',
  21: 'Main Hand',
  22: 'Off Hand',
  23: 'Holdable',
  24: 'Ammo',
  25: 'Thrown',
  26: 'Ranged',
  27: 'Quiver',
  28: 'Relic',
};

// Item class names
const CLASS_NAMES = {
  0: 'Consumable',
  1: 'Container',
  2: 'Weapon',
  3: 'Gem',
  4: 'Armor',
  5: 'Reagent',
  6: 'Projectile',
  7: 'Trade Goods',
  9: 'Recipe',
  11: 'Quiver',
  12: 'Quest',
  13: 'Key',
  15: 'Miscellaneous',
};

// Armor subclass
const ARMOR_SUBCLASS = {
  0: 'Miscellaneous',
  1: 'Cloth',
  2: 'Leather',
  3: 'Mail',
  4: 'Plate',
  5: 'Buckler',
  6: 'Shield',
  7: 'Libram',
  8: 'Idol',
  9: 'Totem',
};

// Weapon subclass
const WEAPON_SUBCLASS = {
  0: 'Axe',
  1: 'Axe',
  2: 'Bow',
  3: 'Gun',
  4: 'Mace',
  5: 'Mace',
  6: 'Polearm',
  7: 'Sword',
  8: 'Sword',
  9: 'Obsolete',
  10: 'Staff',
  11: 'Exotic',
  12: 'Exotic',
  13: 'Fist Weapon',
  14: 'Miscellaneous',
  15: 'Dagger',
  16: 'Thrown',
  17: 'Spear',
  18: 'Crossbow',
  19: 'Wand',
  20: 'Fishing Pole',
};

// Stat types
const STAT_TYPES = {
  0: null,
  1: 'Health',
  2: 'Mana',
  3: 'Agility',
  4: 'Strength',
  5: 'Intellect',
  6: 'Spirit',
  7: 'Stamina',
  12: 'Defense Rating',
  13: 'Dodge Rating',
  14: 'Parry Rating',
  15: 'Block Rating',
  16: 'Hit Rating (Melee)',
  17: 'Hit Rating (Ranged)',
  18: 'Hit Rating (Spell)',
  19: 'Crit Rating (Melee)',
  20: 'Crit Rating (Ranged)',
  21: 'Crit Rating (Spell)',
  28: 'Haste Rating (Melee)',
  29: 'Haste Rating (Ranged)',
  30: 'Haste Rating (Spell)',
  31: 'Hit Rating',
  32: 'Crit Rating',
  35: 'Resilience Rating',
  36: 'Haste Rating',
  37: 'Expertise Rating',
  38: 'Attack Power',
  39: 'Ranged Attack Power',
  40: 'Feral Attack Power',
  41: 'Spell Healing',
  42: 'Spell Damage',
  43: 'Mana Regeneration',
  44: 'Armor Penetration Rating',
  45: 'Spell Power',
  46: 'Health Regeneration',
  47: 'Spell Penetration',
};

class WDBReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readUInt8() {
    const val = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readUInt16() {
    const val = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  readInt16() {
    const val = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  readUInt32() {
    const val = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readInt32() {
    const val = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readFloat() {
    const val = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return val;
  }

  readString() {
    let end = this.offset;
    while (end < this.buffer.length && this.buffer[end] !== 0) {
      end++;
    }
    const str = this.buffer.toString('utf8', this.offset, end);
    this.offset = end + 1;
    return str;
  }

  skip(bytes) {
    this.offset += bytes;
  }

  hasMore() {
    return this.offset < this.buffer.length - 8;
  }
}

function parseItem(reader, recordSize) {
  const startOffset = reader.offset;

  try {
    const item = {};

    item.itemClass = reader.readUInt32();
    item.itemSubClass = reader.readUInt32();
    item.name = reader.readString();

    // Skip name2, name3, name4 (empty in most cases)
    reader.readString();
    reader.readString();
    reader.readString();

    item.displayId = reader.readUInt32();
    item.quality = reader.readUInt32();
    item.flags = reader.readUInt32();
    item.buyPrice = reader.readUInt32();
    item.sellPrice = reader.readUInt32();
    item.inventoryType = reader.readUInt32();
    item.allowableClass = reader.readInt32();
    item.allowableRace = reader.readInt32();
    item.itemLevel = reader.readUInt32();
    item.requiredLevel = reader.readUInt32();
    item.requiredSkill = reader.readUInt32();
    item.requiredSkillRank = reader.readUInt32();
    item.requiredSpell = reader.readUInt32();
    item.requiredHonorRank = reader.readUInt32();
    item.requiredCityRank = reader.readUInt32();
    item.requiredReputationFaction = reader.readUInt32();
    item.requiredReputationRank = reader.readUInt32();
    item.maxCount = reader.readUInt32();
    item.stackable = reader.readUInt32();
    item.containerSlots = reader.readUInt32();

    // Stats (10 stat slots in vanilla)
    item.stats = [];
    for (let i = 0; i < 10; i++) {
      const statType = reader.readUInt32();
      const statValue = reader.readInt32();
      if (statType !== 0 && statValue !== 0) {
        item.stats.push({ type: statType, value: statValue });
      }
    }

    // Damage (5 damage types)
    item.damage = [];
    for (let i = 0; i < 5; i++) {
      const minDmg = reader.readFloat();
      const maxDmg = reader.readFloat();
      const dmgType = reader.readUInt32();
      if (minDmg > 0 || maxDmg > 0) {
        item.damage.push({ min: minDmg, max: maxDmg, type: dmgType });
      }
    }

    // Resistances
    item.armor = reader.readUInt32();
    item.holyRes = reader.readUInt32();
    item.fireRes = reader.readUInt32();
    item.natureRes = reader.readUInt32();
    item.frostRes = reader.readUInt32();
    item.shadowRes = reader.readUInt32();
    item.arcaneRes = reader.readUInt32();

    item.delay = reader.readUInt32(); // Attack speed in ms
    item.ammoType = reader.readUInt32();
    item.rangedModRange = reader.readFloat();

    // Spells (5 spell slots)
    item.spells = [];
    for (let i = 0; i < 5; i++) {
      const spellId = reader.readUInt32();
      const spellTrigger = reader.readUInt32();
      const spellCharges = reader.readInt32();
      const spellCooldown = reader.readInt32();
      const spellCategory = reader.readUInt32();
      const spellCategoryCooldown = reader.readInt32();
      if (spellId !== 0) {
        item.spells.push({
          id: spellId,
          trigger: spellTrigger,
          charges: spellCharges,
          cooldown: spellCooldown,
        });
      }
    }

    item.bonding = reader.readUInt32();
    item.description = reader.readString();
    item.pageText = reader.readUInt32();
    item.languageId = reader.readUInt32();
    item.pageMaterial = reader.readUInt32();
    item.startQuest = reader.readUInt32();
    item.lockId = reader.readUInt32();
    item.material = reader.readInt32();
    item.sheath = reader.readUInt32();
    item.randomProperty = reader.readUInt32();
    item.block = reader.readUInt32();
    item.itemSet = reader.readUInt32();
    item.maxDurability = reader.readUInt32();
    item.area = reader.readUInt32();
    item.map = reader.readUInt32();
    item.bagFamily = reader.readUInt32();

    return item;
  } catch (e) {
    // Skip to end of record if parsing fails
    reader.offset = startOffset + recordSize;
    return null;
  }
}

function generateTooltipHtml(item) {
  const lines = [];

  // Name with quality color
  const qualityClass = `q${item.quality}`;
  lines.push(`<b class="${qualityClass}">${item.name}</b>`);

  // Item level
  if (item.itemLevel > 0) {
    lines.push(`<span style="color:#ffd100">Item Level ${item.itemLevel}</span>`);
  }

  // Binding
  if (item.bonding === 1) lines.push('Binds when picked up');
  else if (item.bonding === 2) lines.push('Binds when equipped');
  else if (item.bonding === 3) lines.push('Binds when used');

  // Slot and type
  const slot = SLOT_NAMES[item.inventoryType];
  let typeStr = '';
  if (item.itemClass === 4) { // Armor
    typeStr = ARMOR_SUBCLASS[item.itemSubClass] || '';
  } else if (item.itemClass === 2) { // Weapon
    typeStr = WEAPON_SUBCLASS[item.itemSubClass] || '';
  }

  if (slot && typeStr) {
    lines.push(`<table><tr><td>${slot}</td><td style="text-align:right">${typeStr}</td></tr></table>`);
  } else if (slot) {
    lines.push(slot);
  }

  // Armor
  if (item.armor > 0) {
    lines.push(`${item.armor} Armor`);
  }

  // Block
  if (item.block > 0) {
    lines.push(`${item.block} Block`);
  }

  // Weapon damage
  if (item.damage.length > 0 && item.damage[0].max > 0) {
    const dmg = item.damage[0];
    const speed = item.delay / 1000;
    const dps = ((dmg.min + dmg.max) / 2) / speed;
    lines.push(`${Math.round(dmg.min)} - ${Math.round(dmg.max)} Damage`);
    lines.push(`<table><tr><td>Speed ${speed.toFixed(2)}</td><td style="text-align:right">(${dps.toFixed(1)} DPS)</td></tr></table>`);
  }

  // Stats
  for (const stat of item.stats) {
    const statName = STAT_TYPES[stat.type];
    if (statName) {
      const sign = stat.value >= 0 ? '+' : '';
      lines.push(`<span style="color:#1eff00">${sign}${stat.value} ${statName}</span>`);
    }
  }

  // Resistances
  if (item.fireRes > 0) lines.push(`<span style="color:#1eff00">+${item.fireRes} Fire Resistance</span>`);
  if (item.natureRes > 0) lines.push(`<span style="color:#1eff00">+${item.natureRes} Nature Resistance</span>`);
  if (item.frostRes > 0) lines.push(`<span style="color:#1eff00">+${item.frostRes} Frost Resistance</span>`);
  if (item.shadowRes > 0) lines.push(`<span style="color:#1eff00">+${item.shadowRes} Shadow Resistance</span>`);
  if (item.arcaneRes > 0) lines.push(`<span style="color:#1eff00">+${item.arcaneRes} Arcane Resistance</span>`);

  // Required level
  if (item.requiredLevel > 1) {
    lines.push(`Requires Level ${item.requiredLevel}`);
  }

  // Description (flavor text)
  if (item.description) {
    lines.push(`<span style="color:#ffd100">"${item.description}"</span>`);
  }

  return lines.join('<br>');
}

async function main() {
  console.log('Reading itemcache.wdb...');

  const buffer = fs.readFileSync(WDB_PATH);
  const reader = new WDBReader(buffer);

  // Read WDB header
  const signature = reader.buffer.toString('ascii', 0, 4);
  reader.skip(4);

  if (signature !== 'BDIW') {
    console.error('Invalid WDB signature:', signature);
    return;
  }

  const version = reader.readUInt32();
  const locale = reader.buffer.toString('ascii', reader.offset, reader.offset + 4);
  reader.skip(4);
  const recordSize = reader.readUInt32();
  const recordVersion = reader.readUInt32();

  console.log(`WDB version: ${version}, locale: ${locale}`);

  const items = {};
  let count = 0;
  let errors = 0;

  while (reader.hasMore()) {
    const itemId = reader.readUInt32();
    const size = reader.readUInt32();

    if (itemId === 0 || size === 0) break;

    const item = parseItem(reader, size);
    if (item && item.name) {
      item.id = itemId;
      item.tooltipHtml = generateTooltipHtml(item);
      item.qualityName = QUALITY_NAMES[item.quality] || 'Unknown';
      item.slotName = SLOT_NAMES[item.inventoryType] || null;

      items[itemId] = {
        id: itemId,
        name: item.name,
        quality: item.quality,
        qualityName: item.qualityName,
        itemLevel: item.itemLevel,
        requiredLevel: item.requiredLevel,
        slot: item.slotName,
        armor: item.armor > 0 ? item.armor : null,
        tooltipHtml: item.tooltipHtml,
      };
      count++;
    } else {
      errors++;
    }
  }

  console.log(`Parsed ${count} items (${errors} errors)`);

  // Save to JSON
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);

  // Show some examples
  console.log('\nSample items:');
  const sampleIds = Object.keys(items).slice(0, 5);
  for (const id of sampleIds) {
    console.log(`  ${id}: ${items[id].name} (${items[id].qualityName})`);
  }
}

main().catch(console.error);

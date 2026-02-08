/**
 * AtlasLoot Parser for Turtle WoW SR+ System
 * Parses AtlasLoot addon Lua files to extract raid loot data
 */

import { readFileSync, writeFileSync } from 'fs';

// Mapping codes from AtlasLoot's TextParsing.lua
const SLOT_MAP = {
  "#s1#": "Head",
  "#s2#": "Neck",
  "#s3#": "Shoulder",
  "#s4#": "Back",
  "#s5#": "Chest",
  "#s6#": "Shirt",
  "#s7#": "Tabard",
  "#s8#": "Wrist",
  "#s9#": "Hands",
  "#s10#": "Waist",
  "#s11#": "Legs",
  "#s12#": "Feet",
  "#s13#": "Ring",
  "#s14#": "Trinket",
  "#s15#": "Off-hand",
  "#s16#": "Relic",
};

const ARMOR_MAP = {
  "#a1#": "Cloth",
  "#a2#": "Leather",
  "#a3#": "Mail",
  "#a4#": "Plate",
};

const WEAPON_MAP = {
  "#h1#": "One-Hand",
  "#h2#": "Two-Hand",
  "#h3#": "Main Hand",
  "#h4#": "Off Hand",
  "#w1#": "Axe",
  "#w2#": "Bow",
  "#w3#": "Crossbow",
  "#w4#": "Dagger",
  "#w5#": "Gun",
  "#w6#": "Mace",
  "#w7#": "Polearm",
  "#w8#": "Shield",
  "#w9#": "Staff",
  "#w10#": "Sword",
  "#w11#": "Thrown",
  "#w12#": "Wand",
  "#w13#": "Fist Weapon",
  "#w14#": "Fishing Pole",
  "#w15#": "Spear",
};

const CLASS_MAP = {
  "#c1#": "Druid",
  "#c2#": "Hunter",
  "#c3#": "Mage",
  "#c4#": "Paladin",
  "#c5#": "Priest",
  "#c6#": "Rogue",
  "#c7#": "Shaman",
  "#c8#": "Warlock",
  "#c9#": "Warrior",
};

const QUALITY_MAP = {
  "=q0=": "Poor",
  "=q1=": "Common",
  "=q2=": "Uncommon",
  "=q3=": "Rare",
  "=q4=": "Epic",
  "=q5=": "Legendary",
};

// Raid boss to raid mapping
const RAID_MAP = {
  // Molten Core
  MCIncindis: { raid: "Molten Core", raidId: "MC" },
  MCLucifron: { raid: "Molten Core", raidId: "MC" },
  MCMagmadar: { raid: "Molten Core", raidId: "MC" },
  MCGehennas: { raid: "Molten Core", raidId: "MC" },
  MCGarr: { raid: "Molten Core", raidId: "MC" },
  MCShazzrah: { raid: "Molten Core", raidId: "MC" },
  MCGeddon: { raid: "Molten Core", raidId: "MC" },
  MCGolemagg: { raid: "Molten Core", raidId: "MC" },
  MCTwins: { raid: "Molten Core", raidId: "MC" },
  MCThaurissan: { raid: "Molten Core", raidId: "MC" },
  MCSulfuron: { raid: "Molten Core", raidId: "MC" },
  MCMajordomo: { raid: "Molten Core", raidId: "MC" },
  MCRagnaros: { raid: "Molten Core", raidId: "MC" },
  MCTrashMobs: { raid: "Molten Core", raidId: "MC" },
  MCRANDOMBOSSDROPS: { raid: "Molten Core", raidId: "MC" },

  // Blackwing Lair
  BWLRazorgore: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLVaelastrasz: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLLashlayer: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLFiremaw: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLEbonroc: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLFlamegor: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLChromaggus: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLNefarian: { raid: "Blackwing Lair", raidId: "BWL" },
  BWLTrashMobs: { raid: "Blackwing Lair", raidId: "BWL" },

  // AQ40
  AQ40Skeram: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Trio: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Sartura: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Fankriss: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Viscidus: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Huhuran: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Emperors: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Ouro: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40CThun: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Trash1: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },
  AQ40Trash2: { raid: "Temple of Ahn'Qiraj", raidId: "AQ40" },

  // AQ20
  AQ20Kurinnaxx: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20CAPTAIN: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Rajaxx: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Moam: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Buru: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Ayamiss: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Ossirian: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Andorov: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20ClassBooks: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Trash: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },
  AQ20Enchants: { raid: "Ruins of Ahn'Qiraj", raidId: "AQ20" },

  // Zul'Gurub
  ZGJeklik: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGVenoxis: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGMarli: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGMandokir: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGGrilek: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGHazzarah: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGRenataki: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGWushoolay: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGGahzranka: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGThekal: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGArlokk: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGJindo: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGHakkar: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGShared: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGTrash1: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGTrash2: { raid: "Zul'Gurub", raidId: "ZG" },
  ZGEnchants: { raid: "Zul'Gurub", raidId: "ZG" },

  // Naxxramas
  NAXPatchwerk: { raid: "Naxxramas", raidId: "NAXX" },
  NAXGrobbulus: { raid: "Naxxramas", raidId: "NAXX" },
  NAXGluth: { raid: "Naxxramas", raidId: "NAXX" },
  NAXThaddius: { raid: "Naxxramas", raidId: "NAXX" },
  NAXAnubRekhan: { raid: "Naxxramas", raidId: "NAXX" },
  NAXGrandWidowFaerlina: { raid: "Naxxramas", raidId: "NAXX" },
  NAXMaexxna: { raid: "Naxxramas", raidId: "NAXX" },
  NAXInstructorRazuvious: { raid: "Naxxramas", raidId: "NAXX" },
  NAXGothiktheHarvester: { raid: "Naxxramas", raidId: "NAXX" },
  NAXTheFourHorsemen: { raid: "Naxxramas", raidId: "NAXX" },
  NAXNoththePlaguebringer: { raid: "Naxxramas", raidId: "NAXX" },
  NAXHeigantheUnclean: { raid: "Naxxramas", raidId: "NAXX" },
  NAXLoatheb: { raid: "Naxxramas", raidId: "NAXX" },
  NAXSapphiron: { raid: "Naxxramas", raidId: "NAXX" },
  NAXKelThuzard: { raid: "Naxxramas", raidId: "NAXX" },
  NAXTrash: { raid: "Naxxramas", raidId: "NAXX" },

  // Onyxia
  Onyxia: { raid: "Onyxia's Lair", raidId: "ONY" },

  // Lower Karazhan Halls (Kara 10)
  LKHRolfen: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHBroodQueenAraxxna: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHGrizikil: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHClawlordHowlfang: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHLordBlackwaldII: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHMoroes: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHTrash: { raid: "Lower Karazhan Halls", raidId: "KARA10" },
  LKHEnchants: { raid: "Lower Karazhan Halls", raidId: "KARA10" },

  // Upper Karazhan Halls (Kara 40)
  UKHGnarlmoon: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHIncantagos: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHAnomalus: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHEcho: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHKing: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHSanvTasdal: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHKruul: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHRupturan: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHMephistroth: { raid: "Upper Karazhan Halls", raidId: "KARA40" },
  UKHTrash: { raid: "Upper Karazhan Halls", raidId: "KARA40" },

  // Emerald Sanctum
  ESErennius: { raid: "Emerald Sanctum", raidId: "EMERALD" },
  ESSolnius1: { raid: "Emerald Sanctum", raidId: "EMERALD" },
  ESHardMode: { raid: "Emerald Sanctum", raidId: "EMERALD" },
  ESTrash: { raid: "Emerald Sanctum", raidId: "EMERALD" },
};

// Boss name mapping (Lua key -> Display name)
const BOSS_NAMES = {
  // MC
  MCIncindis: "Incindis",
  MCLucifron: "Lucifron",
  MCMagmadar: "Magmadar",
  MCGehennas: "Gehennas",
  MCGarr: "Garr",
  MCShazzrah: "Shazzrah",
  MCGeddon: "Baron Geddon",
  MCGolemagg: "Golemagg the Incinerator",
  MCTwins: "The Flame Twins",
  MCThaurissan: "Emperor Thaurissan",
  MCSulfuron: "Sulfuron Harbinger",
  MCMajordomo: "Majordomo Executus",
  MCRagnaros: "Ragnaros",
  MCTrashMobs: "Trash Mobs",
  MCRANDOMBOSSDROPS: "Random Boss Drops",

  // BWL
  BWLRazorgore: "Razorgore the Untamed",
  BWLVaelastrasz: "Vaelastrasz the Corrupt",
  BWLLashlayer: "Broodlord Lashlayer",
  BWLFiremaw: "Firemaw",
  BWLEbonroc: "Ebonroc",
  BWLFlamegor: "Flamegor",
  BWLChromaggus: "Chromaggus",
  BWLNefarian: "Nefarian",
  BWLTrashMobs: "Trash Mobs",

  // AQ40
  AQ40Skeram: "The Prophet Skeram",
  AQ40Trio: "Bug Trio",
  AQ40Sartura: "Battleguard Sartura",
  AQ40Fankriss: "Fankriss the Unyielding",
  AQ40Viscidus: "Viscidus",
  AQ40Huhuran: "Princess Huhuran",
  AQ40Emperors: "Twin Emperors",
  AQ40Ouro: "Ouro",
  AQ40CThun: "C'Thun",
  AQ40Trash1: "Trash Mobs",
  AQ40Trash2: "Trash Mobs 2",

  // AQ20
  AQ20Kurinnaxx: "Kurinnaxx",
  AQ20CAPTAIN: "Rajaxx Captains",
  AQ20Rajaxx: "General Rajaxx",
  AQ20Moam: "Moam",
  AQ20Buru: "Buru the Gorger",
  AQ20Ayamiss: "Ayamiss the Hunter",
  AQ20Ossirian: "Ossirian the Unscarred",
  AQ20Andorov: "Lieutenant General Andorov",
  AQ20ClassBooks: "Class Books",
  AQ20Trash: "Trash Mobs",
  AQ20Enchants: "Enchants",

  // ZG
  ZGJeklik: "High Priestess Jeklik",
  ZGVenoxis: "High Priest Venoxis",
  ZGMarli: "High Priestess Mar'li",
  ZGMandokir: "Bloodlord Mandokir",
  ZGGrilek: "Gri'lek",
  ZGHazzarah: "Hazza'rah",
  ZGRenataki: "Renataki",
  ZGWushoolay: "Wushoolay",
  ZGGahzranka: "Gahz'ranka",
  ZGThekal: "High Priest Thekal",
  ZGArlokk: "High Priestess Arlokk",
  ZGJindo: "Jin'do the Hexxer",
  ZGHakkar: "Hakkar the Soulflayer",
  ZGShared: "Shared Loot",
  ZGTrash1: "Trash Mobs",
  ZGTrash2: "Trash Mobs 2",
  ZGEnchants: "Enchants",

  // Naxx
  NAXPatchwerk: "Patchwerk",
  NAXGrobbulus: "Grobbulus",
  NAXGluth: "Gluth",
  NAXThaddius: "Thaddius",
  NAXAnubRekhan: "Anub'Rekhan",
  NAXGrandWidowFaerlina: "Grand Widow Faerlina",
  NAXMaexxna: "Maexxna",
  NAXInstructorRazuvious: "Instructor Razuvious",
  NAXGothiktheHarvester: "Gothik the Harvester",
  NAXTheFourHorsemen: "The Four Horsemen",
  NAXNoththePlaguebringer: "Noth the Plaguebringer",
  NAXHeigantheUnclean: "Heigan the Unclean",
  NAXLoatheb: "Loatheb",
  NAXSapphiron: "Sapphiron",
  NAXKelThuzard: "Kel'Thuzad",
  NAXTrash: "Trash Mobs",

  // Onyxia
  Onyxia: "Onyxia",

  // LKH
  LKHRolfen: "Rolfen",
  LKHBroodQueenAraxxna: "Brood Queen Araxxna",
  LKHGrizikil: "Grizikil",
  LKHClawlordHowlfang: "Clawlord Howlfang",
  LKHLordBlackwaldII: "Lord Blackwald II",
  LKHMoroes: "Moroes",
  LKHTrash: "Trash Mobs",
  LKHEnchants: "Enchants",

  // UKH
  UKHGnarlmoon: "Gnarlmoon",
  UKHIncantagos: "Incantagos",
  UKHAnomalus: "Anomalus",
  UKHEcho: "Echo of Medivh",
  UKHKing: "The Menagerie",
  UKHSanvTasdal: "Sanv'tasdal",
  UKHKruul: "Highlord Kruul",
  UKHRupturan: "Rupturan",
  UKHMephistroth: "Mephistroth",
  UKHTrash: "Trash Mobs",

  // Emerald Sanctum
  ESErennius: "Erennius",
  ESSolnius1: "Solnius",
  ESHardMode: "Hard Mode",
  ESTrash: "Trash Mobs",
};

function parseSlotInfo(dsString) {
  let slot = null;
  let armor = null;
  let weaponType = null;
  let classRestriction = null;

  // Parse slot
  for (const [code, value] of Object.entries(SLOT_MAP)) {
    if (dsString.includes(code)) {
      slot = value;
      break;
    }
  }

  // Parse armor type
  for (const [code, value] of Object.entries(ARMOR_MAP)) {
    if (dsString.includes(code)) {
      armor = value;
      break;
    }
  }

  // Parse weapon type
  for (const [code, value] of Object.entries(WEAPON_MAP)) {
    if (dsString.includes(code)) {
      weaponType = value;
      break;
    }
  }

  // Parse class restriction
  for (const [code, value] of Object.entries(CLASS_MAP)) {
    if (dsString.includes(code)) {
      classRestriction = value;
      break;
    }
  }

  return { slot, armor, weaponType, classRestriction };
}

function determineCategory(item) {
  // Class restriction takes priority
  if (item.classRestriction) {
    return item.classRestriction;
  }

  // Armor type categories
  if (item.armor) {
    return item.armor;
  }

  // Slot-based categories
  if (item.slot) {
    if (item.slot === "Trinket") return "Trinket";
    if (item.slot === "Ring") return "Ring";
    if (item.slot === "Neck") return "Neck";
    if (item.slot === "Back") return "Cape";
  }

  // Weapon categories
  if (item.weaponType) {
    if (item.weaponType === "Shield") return "Weapon/Shield";
    return "Weapon/Shield";
  }

  return "Other";
}

function parseItemName(nameString) {
  let quality = "Common";
  let name = nameString;

  // Extract quality
  for (const [code, qualityName] of Object.entries(QUALITY_MAP)) {
    if (nameString.includes(code)) {
      quality = qualityName;
      name = name.replace(code, "");
      break;
    }
  }

  return { name: name.trim(), quality };
}

function parseLuaFile(content) {
  const items = [];

  // Parse line by line looking for item entries
  const lines = content.split("\n");
  let currentBoss = null;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for boss table start (e.g., "BWLRazorgore = {" or "    BWLRazorgore = {")
    const bossMatch = line.match(/^\s*(\w+)\s*=\s*\{/);
    if (bossMatch) {
      currentBoss = bossMatch[1];
      braceDepth = 1;
      continue;
    }

    // Track brace depth
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;

    if (braceDepth <= 0) {
      currentBoss = null;
      braceDepth = 0;
    }

    // Skip if no current boss or boss not in our raid map
    if (!currentBoss || !RAID_MAP[currentBoss]) continue;

    // Parse item entry: { itemId, "icon", "=q4=Name", "=ds=#s1#, #a1#", "dropRate" }
    const itemMatch = line.match(/\{\s*(\d+),\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"(?:,\s*"([^"]*)")?/);
    if (itemMatch) {
      const [, itemIdStr, icon, nameStr, dsStr, dropRate] = itemMatch;
      const itemId = parseInt(itemIdStr, 10);

      // Skip empty items (itemId 0)
      if (itemId === 0) continue;

      const { name, quality } = parseItemName(nameStr);
      const { slot, armor, weaponType, classRestriction } = parseSlotInfo(dsStr);

      const raidInfo = RAID_MAP[currentBoss];
      const bossName = BOSS_NAMES[currentBoss] || currentBoss;

      const item = {
        itemId,
        name,
        quality,
        slot,
        armor,
        weaponType,
        classRestriction,
        dropRate: dropRate || null,
        boss: bossName,
        bossKey: currentBoss,
        raid: raidInfo.raid,
        raidId: raidInfo.raidId,
        icon,
        category: "",
      };

      item.category = determineCategory(item);

      // Only include epic+ items for SR purposes (or all if needed)
      if (quality === "Epic" || quality === "Legendary") {
        items.push(item);
      }
    }
  }

  return items;
}

// Main execution
function main() {
  const instancesPath = "C:/turtlewow/Interface/AddOns/AtlasLoot/Database/Instances.lua";
  const worldBossesPath = "C:/turtlewow/Interface/AddOns/AtlasLoot/Database/WorldBosses.lua";

  console.log("Parsing AtlasLoot data...");

  let allItems = [];

  // Parse Instances.lua
  try {
    const instancesContent = readFileSync(instancesPath, 'utf8');
    const items = parseLuaFile(instancesContent);
    allItems = allItems.concat(items);
    console.log(`Found ${items.length} items from Instances.lua`);
  } catch (e) {
    console.error("Error reading Instances.lua:", e.message);
  }

  // Parse WorldBosses.lua if it exists
  try {
    const worldContent = readFileSync(worldBossesPath, 'utf8');
    const items = parseLuaFile(worldContent);
    allItems = allItems.concat(items);
    console.log(`Found ${items.length} items from WorldBosses.lua`);
  } catch (e) {
    console.log("WorldBosses.lua not found or error:", e.message);
  }

  // Remove duplicates by itemId
  const uniqueItems = Array.from(
    new Map(allItems.map(item => [item.itemId, item])).values()
  );

  console.log(`Total unique items: ${uniqueItems.length}`);

  // Generate output
  const output = {
    generatedAt: new Date().toISOString(),
    totalItems: uniqueItems.length,
    raids: [...new Set(uniqueItems.map(i => i.raidId))],
    categories: [...new Set(uniqueItems.map(i => i.category))],
    items: uniqueItems,
  };

  // Write to JSON file
  const outputPath = "C:/Claude-Flow/output-files/loot-database.json";
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Loot database written to ${outputPath}`);

  // Print summary by raid
  const raidSummary = {};
  for (const item of uniqueItems) {
    raidSummary[item.raidId] = (raidSummary[item.raidId] || 0) + 1;
  }
  console.log("\nItems by raid:");
  for (const [raid, count] of Object.entries(raidSummary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${raid}: ${count} items`);
  }

  // Print summary by category
  const categorySummary = {};
  for (const item of uniqueItems) {
    categorySummary[item.category] = (categorySummary[item.category] || 0) + 1;
  }
  console.log("\nItems by category:");
  for (const [cat, count] of Object.entries(categorySummary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} items`);
  }
}

main();

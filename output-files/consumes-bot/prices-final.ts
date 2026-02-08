// /routes/api/consumes/prices.ts
// API endpoints for consume price management

import { Handlers } from "$fresh/server.ts";

// Deno KV instance
const kv = await Deno.openKv();

// Key prefixes
const PRICES_KEY = ["consumes", "prices"];
const CONFIG_KEY = ["consumes", "config"];
const STATIC_PRICES_KEY = ["consumes", "staticPrices"];

// Item catalog - IDs verified against database.turtlecraft.gg
const ITEM_CATALOG: Record<string, { name: string; items: Array<{
  id: string;
  name: string;
  itemId: number;
  description: string;
  defaultStaticPrice?: number;
}> }> = {
  "protection": {
    name: "Protection & Utility",
    items: [
      { id: "GFPP", name: "Greater Fire Protection Potion", itemId: 13457, description: "Absorbs 1950-3250 fire damage for 1 hour." },
      { id: "GAPP", name: "Greater Arcane Protection Potion", itemId: 13461, description: "Absorbs 1950-3250 arcane damage for 1 hour." },
      { id: "GNPP", name: "Greater Nature Protection Potion", itemId: 13458, description: "Absorbs 1950-3250 nature damage for 1 hour." },
      { id: "GFROP", name: "Greater Frost Protection Potion", itemId: 13456, description: "Absorbs 1950-3250 frost damage for 1 hour." },
      { id: "GSPP", name: "Greater Shadow Protection Potion", itemId: 13459, description: "Absorbs 1950-3250 shadow damage for 1 hour." },
      { id: "SPP", name: "Shadow Protection Potion", itemId: 6048, description: "Absorbs 675-1125 shadow damage for 1 hour." },
      { id: "LIP", name: "Limited Invulnerability Potion", itemId: 3387, description: "Immune to physical damage for 6 seconds." },
      { id: "FAP", name: "Free Action Potion", itemId: 5634, description: "Immune to stun and movement impairing effects for 30 sec." },
      { id: "LAP", name: "Living Action Potion", itemId: 20008, description: "Immune to stun/movement effects for 5 sec, removes existing." },
      { id: "Restorative", name: "Restorative Potion", itemId: 9030, description: "Removes 1 magic, curse, poison, or disease effect." },
      { id: "Invisibility", name: "Invisibility Potion", itemId: 9172, description: "Invisibility for 18 seconds." },
      { id: "Swiftness", name: "Swiftness Potion", itemId: 2459, description: "+50% run speed for 15 seconds." },
      { id: "Purification", name: "Purification Potion", itemId: 13462, description: "Removes 1 curse and 1 poison effect." },
      { id: "Quickness", name: "Potion of Quickness", itemId: 5631, description: "+50% attack speed for 15 seconds." }
    ]
  },
  "melee": {
    name: "Tank & Melee",
    items: [
      { id: "Mongoose", name: "Elixir of the Mongoose", itemId: 13452, description: "+25 Agility and +2% Crit for 1 hour." },
      { id: "GreaterAgility", name: "Elixir of Greater Agility", itemId: 9187, description: "+25 Agility for 1 hour." },
      { id: "Giants", name: "Elixir of Giants", itemId: 9206, description: "+25 Strength for 1 hour." },
      { id: "MightyRage", name: "Mighty Rage Potion", itemId: 13442, description: "60-100 Rage instantly and +60 Strength for 20 sec." },
      { id: "GreaterStoneshield", name: "Greater Stoneshield Potion", itemId: 13455, description: "+2000 Armor for 2 minutes." },
      { id: "Fortitude", name: "Elixir of Fortitude", itemId: 3825, description: "+120 Max Health for 1 hour." },
      { id: "SuperiorDefense", name: "Elixir of Superior Defense", itemId: 13445, description: "+450 Armor for 1 hour." },
      { id: "TrollsBlood", name: "Major Troll's Blood Potion", itemId: 20004, description: "Regenerate 20 health every 5 sec for 1 hour." },
      { id: "GiftOfArthas", name: "Gift of Arthas", itemId: 9088, description: "Shadow damage on melee attackers, -10 shadow resist." },
      { id: "OilOfImmolation", name: "Oil of Immolation", itemId: 8956, description: "50 fire damage every 3 sec for 15 sec to nearby enemies." },
      { id: "ThistleTea", name: "Thistle Tea", itemId: 7676, description: "Restores 100 Energy instantly. Rogue only." },
      { id: "GoblinSapper", name: "Goblin Sapper Charge", itemId: 10646, description: "450-750 fire damage to nearby enemies and yourself." }
    ]
  },
  "caster": {
    name: "Caster",
    items: [
      { id: "Mageblood", name: "Mageblood Potion", itemId: 20007, description: "Regenerate 12 mana per 5 sec for 1 hour." },
      { id: "GAE", name: "Greater Arcane Elixir", itemId: 13454, description: "+35 Spell Damage for 1 hour." },
      { id: "ArcaneElixir", name: "Arcane Elixir", itemId: 9155, description: "+20 Spell Damage for 30 min." },
      { id: "MajorMana", name: "Major Mana Potion", itemId: 13444, description: "Restores 1350-2250 mana." },
      { id: "GFW", name: "Elixir of Greater Firepower", itemId: 21546, description: "+40 Fire Spell Damage for 1 hour." },
      { id: "GSP", name: "Elixir of Shadow Power", itemId: 9264, description: "+40 Shadow Spell Damage for 30 min." },
      { id: "GFrostP", name: "Elixir of Frost Power", itemId: 17708, description: "+15 Frost Spell Damage for 30 min." },
      { id: "GNP", name: "Elixir of Greater Nature Power", itemId: 18012, description: "+40 Nature Spell Damage for 1 hour." },
      { id: "Dreamshard", name: "Dreamshard Elixir", itemId: 61423, description: "+30 Spell Damage and Healing for 1 hour." }
    ]
  },
  "weaponbuffs": {
    name: "Weapon Buffs",
    items: [
      { id: "BrilliantManaOil", name: "Brilliant Mana Oil", itemId: 20748, description: "+12 MP5 and +25 Healing for 30 min." },
      { id: "BlessedWizardOil", name: "Blessed Wizard Oil", itemId: 23123, description: "+60 Spell Damage vs Undead for 1 hour." },
      { id: "FrostOil", name: "Frost Oil", itemId: 3829, description: "10% chance to cast Frostbolt on hit for 30 min." },
      { id: "ElementalStone", name: "Elemental Sharpening Stone", itemId: 18262, description: "+2% Crit for 30 min." }
    ]
  },
  "food": {
    name: "Food & Drink",
    items: [
      { id: "GrilledSquid", name: "Grilled Squid", itemId: 13928, description: "+10 Agility for 10 min." },
      { id: "HerbalSalad", name: "Empowering Herbal Salad", itemId: 83309, description: "+24 Healing Bonus for 15 min." },
      { id: "NightfinSoup", name: "Nightfin Soup", itemId: 13931, description: "+8 MP5 for 10 min." },
      { id: "MedivhMerlot", name: "Medivh's Merlot", itemId: 61174, description: "+25 Stamina for 15 min." },
      { id: "MedivhMerlotBlue", name: "Medivh's Merlot Blue", itemId: 61175, description: "+15 Intellect for 15 min." }
    ]
  },
  "concoctions": {
    name: "Concoctions (Turtle WoW)",
    items: [
      { id: "EmeraldMongoose", name: "Concoction of the Emerald Mongoose", itemId: 47410, description: "Mongoose + Dreamshard combined. Turtle WoW custom." },
      { id: "ArcaneGiant", name: "Concoction of the Arcane Giant", itemId: 47412, description: "Giants + Arcane Elixir combined. Turtle WoW custom." },
      { id: "Dreamwater", name: "Concoction of the Dreamwater", itemId: 47414, description: "+35 Spell Damage and +35 Attack Power for 20 min." }
    ]
  },
  "flasks": {
    name: "Flasks (G-Bank Only)",
    items: [
      { id: "Titans", name: "Flask of the Titans", itemId: 13510, defaultStaticPrice: 30, description: "+1200 Health for 2 hours. Persists through death." },
      { id: "Wisdom", name: "Flask of Distilled Wisdom", itemId: 13511, defaultStaticPrice: 20, description: "+2000 Mana for 2 hours. Persists through death." },
      { id: "SupremePower", name: "Flask of Supreme Power", itemId: 13512, defaultStaticPrice: 20, description: "+150 Spell Damage for 2 hours. Persists through death." },
      { id: "Chromatic", name: "Flask of Chromatic Resistance", itemId: 13513, defaultStaticPrice: 20, description: "+50 All Resistances for 2 hours. Persists through death." }
    ]
  }
};

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const itemId = url.searchParams.get("item");

    const configResult = await kv.get(CONFIG_KEY);
    const config = (configResult.value as Record<string, unknown>) || { discountPercent: 10 };

    const pricesResult = await kv.get(PRICES_KEY);
    const prices = (pricesResult.value as Record<string, { ahPrice: number; updatedAt: string; source: string }>) || {};

    const staticResult = await kv.get(STATIC_PRICES_KEY);
    const staticPrices = (staticResult.value as Record<string, { isStatic: boolean; staticPrice?: number }>) || {};

    const getDiscountedPrice = (ahPrice: number) => {
      if (!ahPrice) return null;
      return Math.floor(ahPrice * (1 - (config.discountPercent as number) / 100));
    };

    const getItemPriceInfo = (item: { id: string; defaultStaticPrice?: number }) => {
      const adminSetting = staticPrices[item.id];
      const priceData = prices[item.id];

      if (adminSetting?.isStatic) {
        return {
          ahPrice: priceData?.ahPrice || null,
          shopPrice: adminSetting.staticPrice || null,
          isStatic: true,
          updatedAt: priceData?.updatedAt || null
        };
      }

      if (item.defaultStaticPrice && !adminSetting) {
        return {
          ahPrice: priceData?.ahPrice || null,
          shopPrice: item.defaultStaticPrice * 10000,
          isStatic: true,
          updatedAt: priceData?.updatedAt || null
        };
      }

      return {
        ahPrice: priceData?.ahPrice || null,
        shopPrice: getDiscountedPrice(priceData?.ahPrice),
        isStatic: false,
        updatedAt: priceData?.updatedAt || null
      };
    };

    if (itemId) {
      const q = itemId.toLowerCase();
      let itemInfo = null;
      for (const cat of Object.values(ITEM_CATALOG)) {
        const found = cat.items.find((i) => i.id.toLowerCase() === q || i.name.toLowerCase().includes(q));
        if (found) {
          itemInfo = found;
          break;
        }
      }

      if (!itemInfo) {
        return new Response(JSON.stringify({ error: "Item not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const priceInfo = getItemPriceInfo(itemInfo);
      return new Response(JSON.stringify({
        item: itemInfo,
        ...priceInfo,
        source: prices[itemInfo.id]?.source || null
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (category && ITEM_CATALOG[category]) {
      const cat = ITEM_CATALOG[category];
      const items = cat.items.map((item) => {
        const priceInfo = getItemPriceInfo(item);
        return {
          id: item.id,
          name: item.name,
          itemId: item.itemId,
          ...priceInfo
        };
      });

      return new Response(JSON.stringify({
        category: category,
        name: cat.name,
        discountPercent: config.discountPercent,
        items
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const result: Record<string, { name: string; items: unknown[] }> = {};
    for (const [key, cat] of Object.entries(ITEM_CATALOG)) {
      result[key] = {
        name: cat.name,
        items: cat.items.map((item) => {
          const priceInfo = getItemPriceInfo(item);
          return {
            id: item.id,
            name: item.name,
            itemId: item.itemId,
            ...priceInfo
          };
        })
      };
    }

    return new Response(JSON.stringify({
      discountPercent: config.discountPercent,
      categories: result
    }), {
      headers: { "Content-Type": "application/json" }
    });
  },

  async POST(req) {
    try {
      const body = await req.json();

      if (!body.itemId || body.ahPrice === undefined) {
        return new Response(JSON.stringify({ error: "itemId and ahPrice required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const pricesResult = await kv.get(PRICES_KEY);
      const prices = (pricesResult.value as Record<string, unknown>) || {};

      prices[body.itemId] = {
        ahPrice: Math.round(body.ahPrice),
        updatedAt: new Date().toISOString(),
        source: body.source || "api",
        updatedBy: body.updatedBy || "unknown"
      };

      await kv.set(PRICES_KEY, prices);

      return new Response(JSON.stringify({
        success: true,
        itemId: body.itemId,
        ahPrice: (prices[body.itemId] as { ahPrice: number }).ahPrice
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async PUT(req) {
    try {
      const body = await req.json();

      if (!body.prices || typeof body.prices !== "object") {
        return new Response(JSON.stringify({ error: "prices object required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const pricesResult = await kv.get(PRICES_KEY);
      const prices = (pricesResult.value as Record<string, unknown>) || {};

      const updatedAt = new Date().toISOString();
      let count = 0;
      for (const [itemId, ahPrice] of Object.entries(body.prices)) {
        if (typeof ahPrice === "number" && ahPrice > 0) {
          prices[itemId] = {
            ahPrice: Math.round(ahPrice),
            updatedAt,
            source: body.source || "scanner",
            updatedBy: body.updatedBy || "scanner"
          };
          count++;
        }
      }

      await kv.set(PRICES_KEY, prices);

      return new Response(JSON.stringify({
        success: true,
        updatedCount: count,
        updatedAt
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

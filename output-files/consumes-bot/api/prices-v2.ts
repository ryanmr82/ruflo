// /routes/api/consumes/prices.ts
// API endpoints for consume price management

import { Handlers } from "$fresh/server.ts";

// Deno KV instance
const kv = await Deno.openKv();

// Key prefixes
const PRICES_KEY = ["consumes", "prices"];
const CONFIG_KEY = ["consumes", "config"];

// Alchemy-only Item catalog with descriptions
const ITEM_CATALOG: Record<string, { name: string; items: Array<{
  id: string;
  name: string;
  itemId: number;
  description: string;
  staticPrice?: number;
}> }> = {
  "protection": {
    name: "Protection & Utility",
    items: [
      { id: "GFPP", name: "Greater Fire Protection Potion", itemId: 13457, description: "Absorbs 1950-3250 fire damage for 1 hour. Essential for Ragnaros, Onyxia, and BWL." },
      { id: "GAPP", name: "Greater Arcane Protection Potion", itemId: 13461, description: "Absorbs 1950-3250 arcane damage for 1 hour. Used for Princess Huhuran and Twin Emps." },
      { id: "GNPP", name: "Greater Nature Protection Potion", itemId: 13458, description: "Absorbs 1950-3250 nature damage for 1 hour. Critical for AQ40 and Huhuran." },
      { id: "GFROP", name: "Greater Frost Protection Potion", itemId: 13456, description: "Absorbs 1950-3250 frost damage for 1 hour. Used for Sapphiron and Kel'Thuzad." },
      { id: "GSPP", name: "Greater Shadow Protection Potion", itemId: 13459, description: "Absorbs 1950-3250 shadow damage for 1 hour. Essential for Loatheb and C'Thun." },
      { id: "LIP", name: "Limited Invulnerability Potion", itemId: 3387, description: "Immune to physical damage for 6 seconds. PvP staple and emergency button." },
      { id: "FAP", name: "Free Action Potion", itemId: 5634, description: "Immune to stun and movement impairing effects for 30 sec. PvP and boss mechanics." },
      { id: "LAP", name: "Living Action Potion", itemId: 20008, description: "Immune to stun and movement impairing effects for 5 sec, also removes existing effects." },
      { id: "Restorative", name: "Restorative Potion", itemId: 9030, description: "Removes 1 magic, curse, poison, or disease effect. Useful for Chromaggus and trash." },
      { id: "Invisibility", name: "Invisibility Potion", itemId: 9172, description: "Invisibility for 18 seconds. Dungeon skips and sneaky plays." },
      { id: "Swiftness", name: "Swiftness Potion", itemId: 2459, description: "+50% run speed for 15 seconds. Escapes, positioning, and flag carrying." },
      { id: "Purification", name: "Purification Potion", itemId: 13462, description: "Attempts to remove 1 curse and 1 poison effect. Alternative to Restorative." },
      { id: "Quickness", name: "Potion of Quickness", itemId: 5631, description: "+50% attack speed for 15 seconds. Burst DPS window for physical damage dealers." }
    ]
  },
  "melee": {
    name: "Tank & Melee",
    items: [
      { id: "Mongoose", name: "Elixir of the Mongoose", itemId: 13452, description: "+25 Agility and +2% Crit for 1 hour. Best-in-slot for rogues and hunters." },
      { id: "Giants", name: "Elixir of Giants", itemId: 9206, description: "+25 Strength for 1 hour. Cheap and effective for warriors and ferals." },
      { id: "MightyRage", name: "Mighty Rage Potion", itemId: 13442, description: "60-100 Rage instantly and +60 Strength for 20 sec. Warrior execute phase staple." },
      { id: "GreaterStoneshield", name: "Greater Stoneshield Potion", itemId: 13455, description: "+2000 Armor for 2 minutes. Tank cooldown for big pulls or tank busters." },
      { id: "Fortitude", name: "Elixir of Fortitude", itemId: 3825, description: "+120 Max Health for 1 hour. Stacks with other buffs, good for progression." },
      { id: "SuperiorDefense", name: "Elixir of Superior Defense", itemId: 13445, description: "+450 Armor for 1 hour. Solid tank elixir that stacks with Stoneshield." },
      { id: "TrollsBlood", name: "Major Troll's Blood Potion", itemId: 20004, description: "Regenerate 20 health every 5 sec for 1 hour. Passive sustain for tanks." },
      { id: "GiftOfArthas", name: "Gift of Arthas", itemId: 9088, description: "Shadow damage on melee attackers and -10 shadow resist for 30 min. Tank threat helper." },
      { id: "OilOfImmolation", name: "Oil of Immolation", itemId: 8956, description: "Burns enemies in melee range for 50 fire damage every 3 sec for 15 sec. AoE threat." }
    ]
  },
  "caster": {
    name: "Caster",
    items: [
      { id: "Mageblood", name: "Mageblood Potion", itemId: 20007, description: "Regenerate 12 mana every 5 sec for 1 hour. Sustain for long fights." },
      { id: "GAE", name: "Greater Arcane Elixir", itemId: 13454, description: "+35 Spell Damage for 1 hour. Best general-purpose caster elixir." },
      { id: "MajorMana", name: "Major Mana Potion", itemId: 13444, description: "Restores 1350-2250 mana. Standard mana pot for raids." },
      { id: "GFW", name: "Elixir of Greater Firepower", itemId: 21546, description: "+40 Fire Spell Damage for 1 hour. Fire mages and warlocks." },
      { id: "GSP", name: "Elixir of Shadow Power", itemId: 9264, description: "+40 Shadow Spell Damage for 1 hour. Shadow priests and warlocks." },
      { id: "GFrostP", name: "Elixir of Frost Power", itemId: 17708, description: "+15 Frost Spell Damage for 1 hour. Frost mages (weaker than others)." },
      { id: "GNP", name: "Elixir of Greater Nature Power", itemId: 18012, description: "+40 Nature Spell Damage for 1 hour. Druids and nature-focused casters." },
      { id: "Dreamshard", name: "Dreamshard Elixir", itemId: 61423, description: "+30 Spell Damage and Healing for 1 hour. Turtle WoW balanced caster elixir." }
    ]
  },
  "concoctions": {
    name: "Concoctions (Turtle WoW)",
    items: [
      { id: "EmeraldMongoose", name: "Emerald Mongoose Concoction", itemId: 70231, description: "Combines Mongoose + mana regen. Turtle WoW custom for hybrid/melee." },
      { id: "ArcaneGiant", name: "Arcane Giant Concoction", itemId: 70232, description: "Combines Giants + Arcane Elixir. Turtle WoW custom for melee casters." },
      { id: "Dreamwater", name: "Dreamwater", itemId: 70058, description: "Powerful mana restoration drink. Turtle WoW custom consumable." }
    ]
  },
  "flasks": {
    name: "Flasks (G-Bank Only)",
    items: [
      { id: "Titans", name: "Flask of the Titans", itemId: 13510, staticPrice: 30, description: "+1200 Health for 2 hours. Persists through death. Tank progression flask." },
      { id: "Wisdom", name: "Flask of Distilled Wisdom", itemId: 13511, staticPrice: 20, description: "+2000 Mana for 2 hours. Persists through death. Healer progression flask." },
      { id: "SupremePower", name: "Flask of Supreme Power", itemId: 13512, staticPrice: 20, description: "+150 Spell Damage for 2 hours. Persists through death. Caster DPS flask." },
      { id: "Chromatic", name: "Flask of Chromatic Resistance", itemId: 13513, staticPrice: 20, description: "+50 All Resistances for 2 hours. Persists through death. Useful for resistance fights." }
    ]
  }
};

export const handler: Handlers = {
  // GET /api/consumes/prices - Get all prices or specific category
  async GET(req) {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const itemId = url.searchParams.get("item");

    // Get config for discount
    const configResult = await kv.get(CONFIG_KEY);
    const config = (configResult.value as Record<string, unknown>) || { discountPercent: 10 };

    // Get all prices
    const pricesResult = await kv.get(PRICES_KEY);
    const prices = (pricesResult.value as Record<string, { ahPrice: number; updatedAt: string; source: string }>) || {};

    // Helper to calculate discounted price
    const getDiscountedPrice = (ahPrice: number) => {
      if (!ahPrice) return null;
      return Math.floor(ahPrice * (1 - (config.discountPercent as number) / 100));
    };

    // If specific item requested
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

      const price = prices[itemInfo.id];
      return new Response(JSON.stringify({
        item: itemInfo,
        ahPrice: price?.ahPrice || null,
        shopPrice: itemInfo.staticPrice ? itemInfo.staticPrice * 10000 : getDiscountedPrice(price?.ahPrice),
        isStatic: !!itemInfo.staticPrice,
        updatedAt: price?.updatedAt || null,
        source: price?.source || null
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // If category requested
    if (category && ITEM_CATALOG[category]) {
      const cat = ITEM_CATALOG[category];
      const items = cat.items.map((item) => ({
        ...item,
        ahPrice: prices[item.id]?.ahPrice || null,
        shopPrice: item.staticPrice ? item.staticPrice * 10000 : getDiscountedPrice(prices[item.id]?.ahPrice),
        isStatic: !!item.staticPrice,
        updatedAt: prices[item.id]?.updatedAt || null
      }));

      return new Response(JSON.stringify({
        category: category,
        name: cat.name,
        discountPercent: config.discountPercent,
        items
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return all categories with prices
    const result: Record<string, { name: string; items: unknown[] }> = {};
    for (const [key, cat] of Object.entries(ITEM_CATALOG)) {
      result[key] = {
        name: cat.name,
        items: cat.items.map((item) => ({
          ...item,
          ahPrice: prices[item.id]?.ahPrice || null,
          shopPrice: item.staticPrice ? item.staticPrice * 10000 : getDiscountedPrice(prices[item.id]?.ahPrice),
          isStatic: !!item.staticPrice,
          updatedAt: prices[item.id]?.updatedAt || null
        }))
      };
    }

    return new Response(JSON.stringify({
      discountPercent: config.discountPercent,
      categories: result
    }), {
      headers: { "Content-Type": "application/json" }
    });
  },

  // POST /api/consumes/prices - Update prices (requires auth)
  async POST(req) {
    try {
      const body = await req.json();

      // Validate request
      if (!body.itemId || body.ahPrice === undefined) {
        return new Response(JSON.stringify({ error: "itemId and ahPrice required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get current prices
      const pricesResult = await kv.get(PRICES_KEY);
      const prices = (pricesResult.value as Record<string, unknown>) || {};

      // Update price
      prices[body.itemId] = {
        ahPrice: Math.round(body.ahPrice), // Store in copper
        updatedAt: new Date().toISOString(),
        source: body.source || "api",
        updatedBy: body.updatedBy || "unknown"
      };

      // Save
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

  // PUT /api/consumes/prices - Bulk update prices (from scanner)
  async PUT(req) {
    try {
      const body = await req.json();

      if (!body.prices || typeof body.prices !== "object") {
        return new Response(JSON.stringify({ error: "prices object required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get current prices
      const pricesResult = await kv.get(PRICES_KEY);
      const prices = (pricesResult.value as Record<string, unknown>) || {};

      // Update each price
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

      // Save
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

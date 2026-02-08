// /routes/api/consumes/prices.ts
// API endpoints for consume price management

import { Handlers } from "$fresh/server.ts";

// Deno KV instance
const kv = await Deno.openKv();

// Key prefixes
const PRICES_KEY = ["consumes", "prices"];
const CONFIG_KEY = ["consumes", "config"];

// Item catalog (shared with bot)
const ITEM_CATALOG = {
  "protection": {
    name: "Protection & Utility",
    items: [
      { id: "GFPP", name: "Greater Fire Protection Potion", itemId: 13457 },
      { id: "GAPP", name: "Greater Arcane Protection Potion", itemId: 13461 },
      { id: "GNPP", name: "Greater Nature Protection Potion", itemId: 13458 },
      { id: "GFROP", name: "Greater Frost Protection Potion", itemId: 13456 },
      { id: "GSPP", name: "Greater Shadow Protection Potion", itemId: 13459 },
      { id: "LIP", name: "Limited Invulnerability Potion", itemId: 3387 },
      { id: "FAP", name: "Free Action Potion", itemId: 5634 },
      { id: "LAP", name: "Living Action Potion", itemId: 20008 },
      { id: "MRP", name: "Magic Resistance Potion", itemId: 9036 },
      { id: "RPA", name: "Restorative Potion", itemId: 9030 },
      { id: "Invis", name: "Invisibility Potion", itemId: 9172 },
      { id: "Swim", name: "Swim Speed Potion", itemId: 6372 },
      { id: "Swiftness", name: "Swiftness Potion", itemId: 2459 }
    ]
  },
  "melee": {
    name: "Tank & Melee",
    items: [
      { id: "Mongoose", name: "Elixir of the Mongoose", itemId: 13452 },
      { id: "Giants", name: "Elixir of Giants", itemId: 9206 },
      { id: "MightyRage", name: "Mighty Rage Potion", itemId: 13442 },
      { id: "GreaterStoneshield", name: "Greater Stoneshield Potion", itemId: 13455 },
      { id: "Fortitude", name: "Elixir of Fortitude", itemId: 3825 },
      { id: "SuperiorDefense", name: "Elixir of Superior Defense", itemId: 13445 },
      { id: "Agility", name: "Elixir of Greater Agility", itemId: 9187 },
      { id: "StrengthScroll", name: "Scroll of Strength IV", itemId: 10310 },
      { id: "AgilityScroll", name: "Scroll of Agility IV", itemId: 10309 }
    ]
  },
  "caster": {
    name: "Caster",
    items: [
      { id: "Mageblood", name: "Mageblood Potion", itemId: 20007 },
      { id: "GAE", name: "Greater Arcane Elixir", itemId: 13454 },
      { id: "MajorMana", name: "Major Mana Potion", itemId: 13444 },
      { id: "GFW", name: "Elixir of Greater Firepower", itemId: 21546 },
      { id: "GSP", name: "Elixir of Shadow Power", itemId: 9264 },
      { id: "GFrostP", name: "Elixir of Frost Power", itemId: 17708 },
      { id: "BrilliantManaOil", name: "Brilliant Mana Oil", itemId: 20748 },
      { id: "BrilliantWizardOil", name: "Brilliant Wizard Oil", itemId: 20749 }
    ]
  },
  "concoctions": {
    name: "Concoctions (Turtle WoW Custom)",
    items: [
      { id: "EmeraldMongoose", name: "Emerald Mongoose Concoction", itemId: 70231 },
      { id: "ArcaneGiant", name: "Arcane Giant Concoction", itemId: 70232 },
      { id: "Dreamwater", name: "Dreamwater", itemId: 70058 }
    ]
  },
  "flasks": {
    name: "Flasks (G-Bank Only - Static Pricing)",
    items: [
      { id: "Titans", name: "Flask of the Titans", itemId: 13510, staticPrice: 30 },
      { id: "Wisdom", name: "Flask of Distilled Wisdom", itemId: 13511, staticPrice: 20 },
      { id: "SupremePower", name: "Flask of Supreme Power", itemId: 13512, staticPrice: 20 },
      { id: "Chromatic", name: "Flask of Chromatic Resistance", itemId: 13513, staticPrice: 20 }
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
    const config = configResult.value || { discountPercent: 10 };

    // Get all prices
    const pricesResult = await kv.get(PRICES_KEY);
    const prices = pricesResult.value || {};

    // Helper to calculate discounted price
    const getDiscountedPrice = (ahPrice: number) => {
      if (!ahPrice) return null;
      return Math.floor(ahPrice * (1 - config.discountPercent / 100));
    };

    // If specific item requested
    if (itemId) {
      const price = prices[itemId];
      // Find item in catalog
      let itemInfo = null;
      for (const cat of Object.values(ITEM_CATALOG)) {
        const found = cat.items.find((i: any) => i.id.toLowerCase() === itemId.toLowerCase());
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
      const items = cat.items.map((item: any) => ({
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
    const result = {};
    for (const [key, cat] of Object.entries(ITEM_CATALOG)) {
      result[key] = {
        name: cat.name,
        items: cat.items.map((item: any) => ({
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
      const prices = pricesResult.value || {};

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
        ahPrice: prices[body.itemId].ahPrice
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
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
      const prices = pricesResult.value || {};

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
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

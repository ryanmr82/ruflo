import { Handlers } from "$fresh/server.ts";

/**
 * Item Lookup API - Local First, Scrape as Fallback
 *
 * Lookup priority:
 * 1. Static item-tooltips.json (parsed from WoW client cache - 7k+ items, instant)
 * 2. Deno KV cache (previously scraped items)
 * 3. Scrape from Turtle WoW DB (slow, ~3 sec, then cached forever)
 */

interface ItemRecord {
  id: number;
  name: string;
  normalizedName?: string;
  icon?: string;
  iconUrl?: string;
  quality: number;
  qualityName?: string;
  link?: string;
  tooltipHtml: string;
  slot?: string | null;
  armor?: number | null;
  itemLevel?: number;
  requiredLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface StaticItem {
  id: number;
  name: string;
  quality: number;
  qualityName: string;
  itemLevel: number;
  requiredLevel: number;
  slot: string | null;
  armor: number | null;
  tooltipHtml: string;
}

const QUALITY_NAMES: Record<number, string> = {
  0: "Poor",
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
};

const DB_PATH = "/home/opc/tbc-website/data.db";

// Load static item database once
let staticItems: Record<string, StaticItem> | null = null;
let staticItemsByName: Record<string, StaticItem> | null = null;

async function loadStaticItems(): Promise<void> {
  if (staticItems) return;

  try {
    const data = await Deno.readTextFile("./static/item-tooltips.json");
    staticItems = JSON.parse(data);

    // Build name index
    staticItemsByName = {};
    for (const id of Object.keys(staticItems!)) {
      const item = staticItems![id];
      const normalizedName = item.name.toLowerCase().trim();
      staticItemsByName[normalizedName] = item;
    }

    console.log(`[ItemDB] Loaded ${Object.keys(staticItems!).length} items from static cache`);
  } catch (e) {
    console.error("[ItemDB] Failed to load static items:", e);
    staticItems = {};
    staticItemsByName = {};
  }
}

// Get item from static JSON by ID
function getStaticItemById(id: number): StaticItem | null {
  if (!staticItems) return null;
  return staticItems[String(id)] || null;
}

// Get item from static JSON by name
function getStaticItemByName(name: string): StaticItem | null {
  if (!staticItemsByName) return null;
  return staticItemsByName[name.toLowerCase().trim()] || null;
}

// Normalize item name for consistent lookups
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// Get item from KV database by name
async function getItemByName(kv: Deno.Kv, name: string): Promise<ItemRecord | null> {
  const normalizedName = normalizeName(name);
  const nameIndex = await kv.get<number>(["items", "by_name", normalizedName]);
  if (!nameIndex.value) return null;
  const itemRecord = await kv.get<ItemRecord>(["items", "by_id", nameIndex.value]);
  return itemRecord.value || null;
}

// Get item from KV database by ID
async function getItemById(kv: Deno.Kv, id: number): Promise<ItemRecord | null> {
  const itemRecord = await kv.get<ItemRecord>(["items", "by_id", id]);
  return itemRecord.value || null;
}

// Store item in KV database
async function storeItem(kv: Deno.Kv, item: ItemRecord): Promise<void> {
  const now = new Date().toISOString();
  item.updatedAt = now;
  if (!item.createdAt) item.createdAt = now;
  if (!item.normalizedName) item.normalizedName = normalizeName(item.name);

  await kv.atomic()
    .set(["items", "by_id", item.id], item)
    .set(["items", "by_name", item.normalizedName], item.id)
    .commit();
}

// Scrape item from Turtle WoW database (fallback only)
async function scrapeFromTurtleWow(itemName: string): Promise<ItemRecord | null> {
  let browser;
  try {
    const { chromium } = await import("npm:playwright");

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const searchUrl = `https://database.turtlecraft.gg/?search=${encodeURIComponent(itemName)}`;
    console.log(`[ItemDB] Scraping: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    let itemId: number | null = null;

    if (currentUrl.includes("?item=")) {
      const match = currentUrl.match(/item=(\d+)/);
      itemId = match ? parseInt(match[1]) : null;
    } else {
      itemId = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="?item="]');
        for (const link of links) {
          const href = link.getAttribute("href") || "";
          const match = href.match(/item=(\d+)/);
          if (match) return parseInt(match[1]);
        }
        return null;
      });
    }

    if (!itemId) {
      await browser.close();
      return null;
    }

    await page.goto(`https://database.turtlecraft.gg/?item=${itemId}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const itemInfo = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      let name = h1?.textContent?.trim() || "";
      name = name.replace(" - Items", "").trim();

      const iconEl = document.querySelector(".iconlarge") as HTMLElement;
      let icon = "inv_misc_questionmark";
      if (iconEl?.style.backgroundImage) {
        const match = iconEl.style.backgroundImage.match(/icons\/[^/]+\/([^."]+)/i);
        if (match) icon = match[1].toLowerCase();
      }

      let quality = 4;
      const h1Span = h1?.querySelector("span[class]");
      if (h1Span) {
        const className = h1Span.className.toLowerCase();
        if (className.includes("q5") || className.includes("legendary")) quality = 5;
        else if (className.includes("q4") || className.includes("epic")) quality = 4;
        else if (className.includes("q3") || className.includes("rare")) quality = 3;
        else if (className.includes("q2") || className.includes("uncommon")) quality = 2;
        else if (className.includes("q1") || className.includes("common")) quality = 1;
        else if (className.includes("q0") || className.includes("poor")) quality = 0;
      }

      const tooltipEl = document.querySelector(".tooltip");
      let tooltipHtml = "";
      if (tooltipEl) {
        const innerTable = tooltipEl.querySelector("table table");
        if (innerTable) {
          tooltipHtml = innerTable.innerHTML;
        }
      }

      return { name, icon, quality, tooltipHtml };
    });

    await browser.close();

    if (!itemInfo.name) return null;

    return {
      id: itemId,
      name: itemInfo.name,
      normalizedName: normalizeName(itemInfo.name),
      icon: itemInfo.icon,
      iconUrl: `https://wow.zamimg.com/images/wow/icons/medium/${itemInfo.icon}.jpg`,
      quality: itemInfo.quality,
      qualityName: QUALITY_NAMES[itemInfo.quality] || "Epic",
      link: `https://database.turtlecraft.gg/?item=${itemId}`,
      tooltipHtml: itemInfo.tooltipHtml,
    };
  } catch (error) {
    console.error("[ItemDB] Scrape error:", error);
    if (browser) await browser.close();
    return null;
  }
}

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const itemName = url.searchParams.get("name");
    const itemId = url.searchParams.get("id");

    if (!itemName && !itemId) {
      return new Response(
        JSON.stringify({ error: "Missing 'name' or 'id' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load static items on first request
    await loadStaticItems();

    // 1. Check static JSON first (instant)
    let staticItem: StaticItem | null = null;
    if (itemId) {
      staticItem = getStaticItemById(parseInt(itemId));
    } else if (itemName) {
      staticItem = getStaticItemByName(itemName);
    }

    if (staticItem) {
      console.log(`[ItemDB] Static HIT: ${staticItem.name} (ID: ${staticItem.id})`);
      const item = staticItem as StaticItem & { icon?: string; iconUrl?: string };
      return new Response(JSON.stringify({
        id: staticItem.id,
        name: staticItem.name,
        quality: staticItem.quality,
        qualityName: staticItem.qualityName,
        tooltipHtml: staticItem.tooltipHtml,
        slot: staticItem.slot,
        armor: staticItem.armor,
        itemLevel: staticItem.itemLevel,
        icon: item.icon || null,
        iconUrl: item.iconUrl || `https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg`,
      }), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "STATIC",
          "X-Item-ID": String(staticItem.id),
        },
      });
    }

    // 2. Check KV cache
    try {
      const kv = await Deno.openKv(DB_PATH);

      let item: ItemRecord | null = null;
      if (itemId) {
        item = await getItemById(kv, parseInt(itemId));
      } else if (itemName) {
        item = await getItemByName(kv, itemName);
      }

      if (item) {
        kv.close();
        console.log(`[ItemDB] KV HIT: ${item.name} (ID: ${item.id})`);
        return new Response(JSON.stringify(item), {
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "KV",
            "X-Item-ID": String(item.id),
          },
        });
      }

      // 3. Scrape as last resort (only if we have a name)
      if (!itemName) {
        kv.close();
        return new Response(
          JSON.stringify({ error: "Item not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`[ItemDB] Cache MISS: Scraping "${itemName}"...`);
      const scrapedItem = await scrapeFromTurtleWow(itemName);

      if (!scrapedItem) {
        kv.close();
        return new Response(
          JSON.stringify({ error: "Item not found", searchedFor: itemName }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Store for future lookups
      await storeItem(kv, scrapedItem);
      kv.close();

      console.log(`[ItemDB] Scraped and stored: ${scrapedItem.name} (ID: ${scrapedItem.id})`);

      return new Response(JSON.stringify(scrapedItem), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "SCRAPED",
          "X-Item-ID": String(scrapedItem.id),
        },
      });
    } catch (error) {
      console.error("[ItemDB] Error:", error);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};

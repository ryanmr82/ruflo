import { Handlers } from "$fresh/server.ts";

/**
 * Item Lookup API - Self-Healing with Static JSON Updates
 *
 * Lookup priority:
 * 1. Static item-tooltips.json (parsed from WoW client cache - 7k+ items, instant)
 *    - If found BUT missing icon, fall through to KV/scraper
 * 2. Deno KV cache (previously scraped items)
 * 3. Scrape from Turtle WoW DB (slow, ~3 sec, then cached forever)
 *
 * Self-healing: When an icon is scraped, it updates BOTH KV and static JSON
 * so future lookups are instant.
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
  icon?: string;
  iconUrl?: string;
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
const STATIC_JSON_PATH = "./static/item-tooltips.json";

// Load static item database once
let staticItems: Record<string, StaticItem> | null = null;
let staticItemsByName: Record<string, StaticItem> | null = null;

async function loadStaticItems(): Promise<void> {
  if (staticItems) return;

  try {
    const data = await Deno.readTextFile(STATIC_JSON_PATH);
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

// Check if static item has a valid icon
function hasValidIcon(item: StaticItem | null): boolean {
  if (!item) return false;
  return !!(item.icon && item.icon !== "inv_misc_questionmark");
}

// Update static JSON with icon data (self-healing)
async function updateStaticItemIcon(itemId: number, icon: string): Promise<void> {
  if (!staticItems) return;

  const itemIdStr = String(itemId);
  if (!staticItems[itemIdStr]) return;

  // Update in-memory cache
  staticItems[itemIdStr].icon = icon;
  staticItems[itemIdStr].iconUrl = `https://wow.zamimg.com/images/wow/icons/medium/${icon.toLowerCase()}.jpg`;

  // Also update name index
  const normalizedName = staticItems[itemIdStr].name.toLowerCase().trim();
  if (staticItemsByName && staticItemsByName[normalizedName]) {
    staticItemsByName[normalizedName].icon = icon;
    staticItemsByName[normalizedName].iconUrl = staticItems[itemIdStr].iconUrl;
  }

  // Write to file (async, don't block response)
  try {
    const jsonData = JSON.stringify(staticItems, null, 2);
    await Deno.writeTextFile(STATIC_JSON_PATH, jsonData);
    console.log(`[ItemDB] Self-healed: Updated ${staticItems[itemIdStr].name} with icon ${icon}`);
  } catch (e) {
    console.error(`[ItemDB] Failed to update static JSON:`, e);
  }
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

    // If static has item WITH valid icon, return immediately
    if (staticItem && hasValidIcon(staticItem)) {
      console.log(`[ItemDB] Static HIT (complete): ${staticItem.name} (ID: ${staticItem.id})`);
      return new Response(JSON.stringify({
        id: staticItem.id,
        name: staticItem.name,
        quality: staticItem.quality,
        qualityName: staticItem.qualityName,
        tooltipHtml: staticItem.tooltipHtml,
        slot: staticItem.slot,
        armor: staticItem.armor,
        itemLevel: staticItem.itemLevel,
        icon: staticItem.icon,
        iconUrl: staticItem.iconUrl || `https://wow.zamimg.com/images/wow/icons/medium/${staticItem.icon!.toLowerCase()}.jpg`,
      }), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "STATIC",
          "X-Item-ID": String(staticItem.id),
        },
      });
    }

    // Static item exists but missing icon - log and fall through
    if (staticItem) {
      console.log(`[ItemDB] Static HIT (missing icon): ${staticItem.name} (ID: ${staticItem.id}) - checking KV/scraper`);
    }

    // 2. Check KV cache
    try {
      const kv = await Deno.openKv(DB_PATH);

      let kvItem: ItemRecord | null = null;
      if (itemId) {
        kvItem = await getItemById(kv, parseInt(itemId));
      } else if (itemName) {
        kvItem = await getItemByName(kv, itemName);
      }

      // KV has item with valid icon
      if (kvItem && kvItem.icon && kvItem.icon !== "inv_misc_questionmark") {
        console.log(`[ItemDB] KV HIT: ${kvItem.name} (ID: ${kvItem.id})`);

        // Self-heal: Update static JSON if it was missing icon
        if (staticItem && !hasValidIcon(staticItem)) {
          updateStaticItemIcon(kvItem.id, kvItem.icon).catch(() => {});
        }

        kv.close();
        return new Response(JSON.stringify(kvItem), {
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "KV",
            "X-Item-ID": String(kvItem.id),
          },
        });
      }

      // 3. Scrape as last resort (only if we have a name to search)
      const searchName = itemName || (staticItem?.name);
      if (!searchName) {
        kv.close();
        return new Response(
          JSON.stringify({ error: "Item not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`[ItemDB] Cache MISS: Scraping "${searchName}"...`);
      const scrapedItem = await scrapeFromTurtleWow(searchName);

      if (!scrapedItem || !scrapedItem.icon || scrapedItem.icon === "inv_misc_questionmark") {
        kv.close();

        // If we have static item but couldn't get icon, return static with question mark
        if (staticItem) {
          return new Response(JSON.stringify({
            id: staticItem.id,
            name: staticItem.name,
            quality: staticItem.quality,
            qualityName: staticItem.qualityName,
            tooltipHtml: staticItem.tooltipHtml,
            slot: staticItem.slot,
            armor: staticItem.armor,
            itemLevel: staticItem.itemLevel,
            icon: null,
            iconUrl: `https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg`,
          }), {
            headers: {
              "Content-Type": "application/json",
              "X-Cache": "STATIC-INCOMPLETE",
              "X-Item-ID": String(staticItem.id),
            },
          });
        }

        return new Response(
          JSON.stringify({ error: "Item not found", searchedFor: searchName }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Store in KV for future lookups
      await storeItem(kv, scrapedItem);
      kv.close();

      // Self-heal: Update static JSON with the scraped icon
      if (staticItem) {
        updateStaticItemIcon(scrapedItem.id, scrapedItem.icon).catch(() => {});
      }

      console.log(`[ItemDB] Scraped and stored: ${scrapedItem.name} (ID: ${scrapedItem.id}, icon: ${scrapedItem.icon})`);

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

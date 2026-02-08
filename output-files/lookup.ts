import { Handlers } from "$fresh/server.ts";

/**
 * Item Lookup API - Self-Healing with Static JSON Updates
 *
 * Lookup priority:
 * 1. Static item-tooltips.json (parsed from WoW client cache - 7k+ items, instant)
 *    - If found BUT missing icon OR missing Equip effects, fall through to KV/scraper
 * 2. Deno KV cache (previously scraped items)
 * 3. Scrape from Turtle WoW DB (slow, ~3 sec, then cached forever)
 *
 * Self-healing: When data is scraped, it updates BOTH KV and static JSON
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

// Check if tooltip is complete (has Equip effects for epic+ items with armor)
function hasCompleteTooltip(item: StaticItem | ItemRecord | null): boolean {
  if (!item) return false;
  if (!item.tooltipHtml) return false;

  // For epic/legendary items with armor (gear), check if tooltip has Equip/spell effects
  if (item.quality >= 4 && item.armor && item.armor > 0) {
    const html = item.tooltipHtml.toLowerCase();
    // Check if tooltip has green text (spell effects)
    const hasEquipText = html.includes("equip:");
    const hasSpellDamage = html.includes("spell damage") || html.includes("spell power");
    const hasChanceOn = html.includes("chance on hit");
    const hasUse = html.includes("use:");
    const hasHealing = html.includes("healing");
    const hasHit = html.includes("hit by") || html.includes("to hit");
    const hasCrit = html.includes("critical");
    const hasResist = html.includes("resist");

    // If it has any of these, it's complete
    if (hasEquipText || hasSpellDamage || hasChanceOn || hasUse || hasHealing || hasHit || hasCrit || hasResist) {
      return true;
    }

    // Epic armor without any effects - likely incomplete from static cache
    return false;
  }

  // Non-armor items or lower quality - assume complete
  return true;
}

// Update static JSON with scraped data (self-healing)
async function updateStaticItem(itemId: number, scrapedItem: ItemRecord): Promise<void> {
  if (!staticItems) return;

  const itemIdStr = String(itemId);

  // Update or create entry
  if (staticItems[itemIdStr]) {
    staticItems[itemIdStr].icon = scrapedItem.icon;
    staticItems[itemIdStr].iconUrl = scrapedItem.iconUrl;
    staticItems[itemIdStr].tooltipHtml = scrapedItem.tooltipHtml;
  } else {
    staticItems[itemIdStr] = {
      id: scrapedItem.id,
      name: scrapedItem.name,
      quality: scrapedItem.quality,
      qualityName: scrapedItem.qualityName || QUALITY_NAMES[scrapedItem.quality],
      itemLevel: scrapedItem.itemLevel || 0,
      requiredLevel: scrapedItem.requiredLevel || 0,
      slot: scrapedItem.slot || null,
      armor: scrapedItem.armor || null,
      tooltipHtml: scrapedItem.tooltipHtml,
      icon: scrapedItem.icon,
      iconUrl: scrapedItem.iconUrl,
    };
  }

  // Also update name index
  const normalizedName = scrapedItem.name.toLowerCase().trim();
  if (staticItemsByName) {
    staticItemsByName[normalizedName] = staticItems[itemIdStr];
  }

  // Write to file (async, don't block response)
  try {
    const jsonData = JSON.stringify(staticItems, null, 2);
    await Deno.writeTextFile(STATIC_JSON_PATH, jsonData);
    console.log(`[ItemDB] Self-healed: Updated ${scrapedItem.name} with full tooltip data`);
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
        // Get the main content cell which contains ALL tables (stats + equip effects)
        const mainCell = tooltipEl.querySelector("table > tbody > tr > td");
        if (mainCell) {
          // Get all tables inside the main cell and combine their HTML
          const tables = mainCell.querySelectorAll(":scope > table");
          const parts: string[] = [];
          tables.forEach(table => {
            // Get the inner content of each table
            const innerTd = table.querySelector("td");
            if (innerTd) {
              parts.push(innerTd.innerHTML);
            }
          });
          tooltipHtml = parts.join("<br>");

          // Add green color to stat lines (Turtle WoW uses CSS, we need inline styles)
          // Match patterns like "+26 Agility" or "+18 Stamina" etc.
          tooltipHtml = tooltipHtml.replace(/(\+\d+[^<]*(?:Agility|Stamina|Intellect|Spirit|Strength|Attack Power|Defense|Dodge|Parry|Block|Armor|Fire Resistance|Frost Resistance|Nature Resistance|Shadow Resistance|Arcane Resistance))/g,
            '<span style="color:#1eff00">$1</span>');
        }
      }

      // Extract slot and armor from tooltip
      let slot: string | null = null;
      let armor: number | null = null;
      let itemLevel: number | null = null;

      if (tooltipEl) {
        const text = tooltipEl.textContent || "";
        const armorMatch = text.match(/(\d+) Armor/);
        if (armorMatch) armor = parseInt(armorMatch[1]);

        const ilvlMatch = text.match(/Item Level (\d+)/);
        if (ilvlMatch) itemLevel = parseInt(ilvlMatch[1]);

        // Try to get slot from table
        const slotCell = tooltipEl.querySelector("td");
        if (slotCell) {
          const slotText = slotCell.textContent?.trim();
          if (slotText && ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket", "Main Hand", "Off Hand", "One-Hand", "Two-Hand", "Ranged", "Relic"].includes(slotText)) {
            slot = slotText;
          }
        }
      }

      return { name, icon, quality, tooltipHtml, slot, armor, itemLevel };
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
      slot: itemInfo.slot,
      armor: itemInfo.armor,
      itemLevel: itemInfo.itemLevel || undefined,
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
    const forceRefresh = url.searchParams.get("refresh") === "true";

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

    // If static has item WITH valid icon AND complete tooltip, return immediately
    if (!forceRefresh && staticItem && hasValidIcon(staticItem) && hasCompleteTooltip(staticItem)) {
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

    // Static item exists but missing icon or incomplete tooltip - log and fall through
    if (staticItem) {
      const reason = !hasValidIcon(staticItem) ? "missing icon" : "incomplete tooltip";
      console.log(`[ItemDB] Static HIT (${reason}): ${staticItem.name} (ID: ${staticItem.id}) - checking KV/scraper`);
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

      // KV has item with valid icon AND complete tooltip
      if (!forceRefresh && kvItem && kvItem.icon && kvItem.icon !== "inv_misc_questionmark" && hasCompleteTooltip(kvItem)) {
        console.log(`[ItemDB] KV HIT: ${kvItem.name} (ID: ${kvItem.id})`);

        // Self-heal: Update static JSON if it was incomplete
        if (staticItem && (!hasValidIcon(staticItem) || !hasCompleteTooltip(staticItem))) {
          updateStaticItem(kvItem.id, kvItem).catch(() => {});
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

      console.log(`[ItemDB] Cache MISS/INCOMPLETE: Scraping "${searchName}"...`);
      const scrapedItem = await scrapeFromTurtleWow(searchName);

      if (!scrapedItem || !scrapedItem.icon || scrapedItem.icon === "inv_misc_questionmark") {
        kv.close();

        // If we have static item but couldn't scrape better data, return static
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
            icon: staticItem.icon || null,
            iconUrl: staticItem.iconUrl || `https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg`,
          }), {
            headers: {
              "Content-Type": "application/json",
              "X-Cache": "STATIC-INCOMPLETE",
              "X-Item-ID": String(staticItem.id),
            },
          });
        }

        // Return KV item if we have it
        if (kvItem) {
          return new Response(JSON.stringify(kvItem), {
            headers: {
              "Content-Type": "application/json",
              "X-Cache": "KV-INCOMPLETE",
              "X-Item-ID": String(kvItem.id),
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

      // Self-heal: Update static JSON with the scraped data
      if (staticItem || scrapedItem.id) {
        updateStaticItem(scrapedItem.id, scrapedItem).catch(() => {});
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

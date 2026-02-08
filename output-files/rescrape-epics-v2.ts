/**
 * Re-scrape epic items to get complete tooltips with Equip effects
 * Run with: deno run -A --unstable-kv scripts/rescrape-epics.ts
 *
 * Optional args:
 *   --limit=100    Only process first N items
 *   --start=50     Start from item N (for resuming)
 */

import { chromium } from "npm:playwright";

const STATIC_JSON_PATH = "./static/item-tooltips.json";
const DB_PATH = "./data.db";

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

// Check if tooltip seems incomplete
function isIncomplete(item: StaticItem): boolean {
  if (item.quality < 4) return false; // Only epic+
  if (!item.armor || item.armor === 0) return false; // Only armor items

  const html = item.tooltipHtml.toLowerCase();
  // If has equip/set bonus text, it's complete
  if (html.includes("equip:") || html.includes("set:") || html.includes("chance on hit") || html.includes("use:")) {
    return false;
  }
  // Epic armor without effects = incomplete
  return true;
}

async function scrapeItem(browser: any, itemId: number): Promise<{ tooltipHtml: string; icon: string } | null> {
  const page = await browser.newPage();
  try {
    await page.goto(`https://database.turtlecraft.gg/?item=${itemId}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => {
      // Get icon
      const iconEl = document.querySelector(".iconlarge") as HTMLElement;
      let icon = "inv_misc_questionmark";
      if (iconEl?.style.backgroundImage) {
        const match = iconEl.style.backgroundImage.match(/icons\/[^/]+\/([^."]+)/i);
        if (match) icon = match[1].toLowerCase();
      }

      // Get tooltip
      const tooltipEl = document.querySelector(".tooltip");
      if (!tooltipEl) return null;

      const mainCell = tooltipEl.querySelector("table > tbody > tr > td");
      if (!mainCell) return null;

      const tables = mainCell.querySelectorAll(":scope > table");
      const parts: string[] = [];
      tables.forEach(table => {
        const innerTd = table.querySelector("td");
        if (innerTd) {
          parts.push(innerTd.innerHTML);
        }
      });

      return { tooltipHtml: parts.join("<br>"), icon };
    });

    await page.close();
    return result;
  } catch (e) {
    console.error(`Failed to scrape item ${itemId}:`, e);
    await page.close();
    return null;
  }
}

async function main() {
  // Parse args
  const args = Deno.args;
  let limit = Infinity;
  let start = 0;

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--start=")) {
      start = parseInt(arg.split("=")[1]);
    }
  }

  // Load static items
  const data = await Deno.readTextFile(STATIC_JSON_PATH);
  const staticItems: Record<string, StaticItem> = JSON.parse(data);

  // Find incomplete items
  const incompleteItems: StaticItem[] = [];
  for (const id of Object.keys(staticItems)) {
    const item = staticItems[id];
    if (isIncomplete(item)) {
      incompleteItems.push(item);
    }
  }

  console.log(`Found ${incompleteItems.length} incomplete epic items total`);

  // Apply start/limit
  const itemsToProcess = incompleteItems.slice(start, start + limit);
  console.log(`Processing items ${start} to ${start + itemsToProcess.length} (${itemsToProcess.length} items)`);

  if (itemsToProcess.length === 0) {
    console.log("Nothing to do!");
    return;
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let updated = 0;
  let skipped = 0;
  let saveCounter = 0;

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const globalIndex = start + i;
    console.log(`[${globalIndex + 1}/${incompleteItems.length}] Scraping ${item.name} (ID: ${item.id})...`);

    const result = await scrapeItem(browser, item.id);

    if (result && result.tooltipHtml && result.tooltipHtml.length > item.tooltipHtml.length) {
      staticItems[String(item.id)].tooltipHtml = result.tooltipHtml;
      if (result.icon && result.icon !== "inv_misc_questionmark") {
        staticItems[String(item.id)].icon = result.icon;
        staticItems[String(item.id)].iconUrl = `https://wow.zamimg.com/images/wow/icons/medium/${result.icon}.jpg`;
      }
      updated++;
      console.log(`  ✓ Updated: ${item.name} (icon: ${result.icon})`);
    } else {
      skipped++;
      console.log(`  - Skipped (no improvement): ${item.name}`);
    }

    // Save every 50 items to avoid losing progress
    saveCounter++;
    if (saveCounter >= 50) {
      console.log(`\n--- Saving checkpoint (${updated} updated so far) ---\n`);
      await Deno.writeTextFile(STATIC_JSON_PATH, JSON.stringify(staticItems, null, 2));
      saveCounter = 0;
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }

  await browser.close();

  // Save final
  console.log(`\nSaving final static JSON...`);
  await Deno.writeTextFile(STATIC_JSON_PATH, JSON.stringify(staticItems, null, 2));

  console.log(`\n========================================`);
  console.log(`Done! Updated: ${updated}, Skipped: ${skipped}`);
  console.log(`========================================`);

  if (start + itemsToProcess.length < incompleteItems.length) {
    console.log(`\nTo continue, run with: --start=${start + itemsToProcess.length}`);
  }
}

main().catch(console.error);

#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
// Script to download consume item icons and descriptions from Turtle WoW API
// Run from the tbc-website directory: deno run --allow-net --allow-write --allow-read scripts/download-icons.ts

const API_BASE = "http://localhost:8000";
const ICONS_DIR = "./static/icons/consumes";

// All item IDs from prices.ts
const ITEMS = [
  // Protection & Utility
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
  { id: "Swiftness", name: "Swiftness Potion", itemId: 2459 },
  // Tank & Melee
  { id: "Mongoose", name: "Elixir of the Mongoose", itemId: 13452 },
  { id: "Giants", name: "Elixir of Giants", itemId: 9206 },
  { id: "MightyRage", name: "Mighty Rage Potion", itemId: 13442 },
  { id: "GreaterStoneshield", name: "Greater Stoneshield Potion", itemId: 13455 },
  { id: "Fortitude", name: "Elixir of Fortitude", itemId: 3825 },
  { id: "SuperiorDefense", name: "Elixir of Superior Defense", itemId: 13445 },
  { id: "Agility", name: "Elixir of Greater Agility", itemId: 9187 },
  { id: "StrengthScroll", name: "Scroll of Strength IV", itemId: 10310 },
  { id: "AgilityScroll", name: "Scroll of Agility IV", itemId: 10309 },
  // Caster
  { id: "Mageblood", name: "Mageblood Potion", itemId: 20007 },
  { id: "GAE", name: "Greater Arcane Elixir", itemId: 13454 },
  { id: "MajorMana", name: "Major Mana Potion", itemId: 13444 },
  { id: "GFW", name: "Elixir of Greater Firepower", itemId: 21546 },
  { id: "GSP", name: "Elixir of Shadow Power", itemId: 9264 },
  { id: "GFrostP", name: "Elixir of Frost Power", itemId: 17708 },
  { id: "BrilliantManaOil", name: "Brilliant Mana Oil", itemId: 20748 },
  { id: "BrilliantWizardOil", name: "Brilliant Wizard Oil", itemId: 20749 },
  // Concoctions (Turtle WoW Custom)
  { id: "EmeraldMongoose", name: "Emerald Mongoose Concoction", itemId: 70231 },
  { id: "ArcaneGiant", name: "Arcane Giant Concoction", itemId: 70232 },
  { id: "Dreamwater", name: "Dreamwater", itemId: 70058 },
  // Flasks
  { id: "Titans", name: "Flask of the Titans", itemId: 13510 },
  { id: "Wisdom", name: "Flask of Distilled Wisdom", itemId: 13511 },
  { id: "SupremePower", name: "Flask of Supreme Power", itemId: 13512 },
  { id: "Chromatic", name: "Flask of Chromatic Resistance", itemId: 13513 },
];

interface ItemData {
  id: string;
  itemId: number;
  name: string;
  icon: string;
  iconUrl: string;
  description: string;
}

// Extract plain text description from tooltip HTML
function extractDescription(tooltipHtml: string): string {
  if (!tooltipHtml) return "";

  // Remove HTML tags but keep line breaks
  let text = tooltipHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  // Extract the "Use:" or effect line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Look for the effect description (usually starts with "Use:" or describes the buff)
  for (const line of lines) {
    if (line.startsWith('Use:') || line.startsWith('Increases') || line.startsWith('Absorbs') ||
        line.startsWith('Makes') || line.startsWith('Restores') || line.startsWith('Grants') ||
        line.startsWith('When applied') || line.startsWith('Renders')) {
      return line;
    }
  }

  // If no effect line found, look for any line that describes the item
  for (const line of lines) {
    if (line.length > 20 && !line.includes('Requires') && !line.includes('Level') &&
        !line.includes('Potion') && !line.includes('Elixir') && !line.includes('Flask') &&
        !line.includes('Scroll') && !line.match(/^\d+/)) {
      return line;
    }
  }

  return "";
}

async function fetchItemData(itemId: number): Promise<{ icon: string; description: string } | null> {
  try {
    const response = await fetch(`${API_BASE}/api/items/lookup?id=${itemId}`);
    if (!response.ok) {
      console.error(`Failed to fetch item ${itemId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const description = extractDescription(data.tooltipHtml || "");

    return {
      icon: data.icon || "",
      description
    };
  } catch (e) {
    console.error(`Error fetching item ${itemId}:`, e);
    return null;
  }
}

async function downloadIcon(iconName: string, itemId: number): Promise<boolean> {
  try {
    const iconUrl = `${API_BASE}/icons/medium/${iconName}.png`;
    const response = await fetch(iconUrl);

    if (!response.ok) {
      console.error(`Failed to download icon ${iconName}: ${response.status}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    const filePath = `${ICONS_DIR}/${itemId}.png`;
    await Deno.writeFile(filePath, new Uint8Array(buffer));

    return true;
  } catch (e) {
    console.error(`Error downloading icon ${iconName}:`, e);
    return false;
  }
}

async function main() {
  console.log("Starting consume item data fetch...\n");

  // Ensure icons directory exists
  try {
    await Deno.mkdir(ICONS_DIR, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      throw e;
    }
  }

  const itemDescriptions: Record<string, { description: string; icon: string }> = {};
  let successCount = 0;
  let failCount = 0;

  for (const item of ITEMS) {
    console.log(`Processing ${item.name} (${item.itemId})...`);

    const data = await fetchItemData(item.itemId);
    if (!data) {
      console.log(`  ❌ Failed to fetch data`);
      failCount++;
      continue;
    }

    console.log(`  Icon: ${data.icon}`);
    console.log(`  Effect: ${data.description || "(none found)"}`);

    // Download icon
    if (data.icon) {
      const downloaded = await downloadIcon(data.icon, item.itemId);
      if (downloaded) {
        console.log(`  ✓ Icon downloaded`);
        successCount++;
      } else {
        console.log(`  ❌ Icon download failed`);
        failCount++;
      }
    }

    itemDescriptions[item.id] = {
      description: data.description,
      icon: data.icon
    };

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 100));
  }

  // Save descriptions to JSON file for the frontend to use
  const descriptionsPath = `${ICONS_DIR}/item-data.json`;
  await Deno.writeTextFile(descriptionsPath, JSON.stringify(itemDescriptions, null, 2));

  console.log(`\n✅ Complete! ${successCount} icons downloaded, ${failCount} failures`);
  console.log(`📁 Icons saved to: ${ICONS_DIR}`);
  console.log(`📄 Item data saved to: ${descriptionsPath}`);
}

main();

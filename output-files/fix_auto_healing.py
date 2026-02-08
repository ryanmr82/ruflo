#!/usr/bin/env python3
"""
Replace Playwright-based scraping with fetch-based approach in lookup.ts
"""

import re

# Read the file
with open("/home/opc/tbc-website/routes/api/items/lookup.ts", "r") as f:
    content = f.read()

# The new fetch-based scrapeFromTurtleWow function
new_scrape_function = '''// Parse item data from TurtleWoW HTML (fetch-based, no Playwright needed)
function parseItemFromHtml(html: string, itemId: number): {
  name: string;
  icon: string;
  quality: number;
  tooltipHtml: string;
  slot: string | null;
  armor: number | null;
  itemLevel: number | null;
} | null {
  // Extract icon from JavaScript: _[itemId]={icon: 'icon_name'};
  const iconRegex = new RegExp(`_\\\\[${itemId}\\\\]\\\\s*=\\\\s*\\\\{[^}]*icon:\\\\s*['"]([^'"]+)['"]`);
  const iconMatch = html.match(iconRegex);
  const icon = iconMatch ? iconMatch[1].toLowerCase() : "inv_misc_questionmark";

  // Extract name from title
  const titleMatch = html.match(/<title>([^<]+)\\s*-\\s*Items/i);
  const name = titleMatch ? titleMatch[1].trim() : "";

  if (!name) return null;

  // Extract full tooltip content from the tooltip div
  const tooltipRegex = new RegExp(
    `<div id="tooltip${itemId}-generic"[^>]*class="tooltip"[^>]*>([\\\\s\\\\S]*?)</div>\\\\s*<div style="clear`
  );
  const tooltipDivMatch = html.match(tooltipRegex);

  let tooltipHtml = "";
  if (tooltipDivMatch) {
    const tooltipContent = tooltipDivMatch[1].trim();
    const tableMatch = tooltipContent.match(/<table>[\\s\\S]*<\\/table>/);
    if (tableMatch) {
      tooltipHtml = tableMatch[0].trim();
    }
  }

  // Extract quality from tooltip class (q0-q5)
  let quality = 4; // Default to Epic
  const qualityMatch = tooltipHtml.match(/<b class="q(\\d)">/);
  if (qualityMatch) {
    quality = parseInt(qualityMatch[1]);
  }

  // Extract slot, armor, itemLevel from tooltip text
  let slot: string | null = null;
  let armor: number | null = null;
  let itemLevel: number | null = null;

  const armorMatch = tooltipHtml.match(/(\\d+) Armor/);
  if (armorMatch) armor = parseInt(armorMatch[1]);

  const ilvlMatch = tooltipHtml.match(/Item Level (\\d+)/);
  if (ilvlMatch) itemLevel = parseInt(ilvlMatch[1]);

  // Check for slot
  const slotPatterns = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket", "Main Hand", "Off Hand", "One-Hand", "Two-Hand", "Ranged", "Relic"];
  for (const s of slotPatterns) {
    if (tooltipHtml.includes(`>${s}<`)) {
      slot = s;
      break;
    }
  }

  return { name, icon, quality, tooltipHtml, slot, armor, itemLevel };
}

// Scrape item from Turtle WoW database using HTTP fetch (no Playwright/browser needed)
// If itemId is provided, scrape directly by ID (accurate)
// If only itemName is provided, search by name (may return wrong item due to partial matches)
async function scrapeFromTurtleWow(itemId: number | null, itemName?: string): Promise<ItemRecord | null> {
  const TURTLE_WOW_BASE = "https://database.turtlecraft.gg";

  try {
    // If we have item ID, go directly to item page (accurate)
    if (itemId) {
      const url = `${TURTLE_WOW_BASE}/?item=${itemId}`;
      console.log(`[ItemDB] Scraping by ID (fetch): ${url}`);

      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TBC-Website/1.0)" },
      });

      if (!response.ok) {
        console.error(`[ItemDB] Fetch failed: ${response.status}`);
        return null;
      }

      const html = await response.text();
      const parsed = parseItemFromHtml(html, itemId);

      if (!parsed || !parsed.tooltipHtml || parsed.icon === "inv_misc_questionmark") {
        console.error(`[ItemDB] Failed to parse item ${itemId}`);
        return null;
      }

      const iconUrl = getIconUrl(parsed.icon);

      return {
        id: itemId,
        name: parsed.name,
        normalizedName: normalizeName(parsed.name),
        icon: parsed.icon,
        iconUrl: iconUrl,
        quality: parsed.quality,
        qualityName: QUALITY_NAMES[parsed.quality] || "Epic",
        link: `${TURTLE_WOW_BASE}/?item=${itemId}`,
        tooltipHtml: parsed.tooltipHtml,
        slot: parsed.slot,
        armor: parsed.armor,
        itemLevel: parsed.itemLevel || undefined,
      };
    } else if (itemName) {
      // Fallback: Search by name (may return wrong item due to partial matches)
      // IMPORTANT: Turtle WoW requires apostrophes to be escaped with backslash
      const escapedName = itemName.replace(/'/g, "\\\\'");
      const searchUrl = `${TURTLE_WOW_BASE}/?search=${encodeURIComponent(escapedName)}`;
      console.log(`[ItemDB] Scraping by NAME (risky, fetch): ${searchUrl}`);

      const searchResponse = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TBC-Website/1.0)" },
        redirect: "follow",
      });

      if (!searchResponse.ok) {
        console.error(`[ItemDB] Search fetch failed: ${searchResponse.status}`);
        return null;
      }

      const searchHtml = await searchResponse.text();
      const finalUrl = searchResponse.url;

      // Check if redirected to item page
      if (finalUrl.includes("?item=")) {
        const match = finalUrl.match(/item=(\\d+)/);
        itemId = match ? parseInt(match[1]) : null;
      } else {
        // Search for first item link in results
        const linkMatch = searchHtml.match(/href="[^"]*\\?item=(\\d+)"/);
        itemId = linkMatch ? parseInt(linkMatch[1]) : null;
      }

      if (!itemId) {
        console.error(`[ItemDB] No item found for name: ${itemName}`);
        return null;
      }

      // Now fetch the actual item page
      return scrapeFromTurtleWow(itemId);
    } else {
      // No ID and no name - can't scrape
      return null;
    }
  } catch (error) {
    console.error("[ItemDB] Scrape error:", error);
    return null;
  }
}'''

# Pattern to find the old Playwright-based function
# It starts with the comment about scraping and ends before "export const handler"
old_pattern = r'// Scrape item from Turtle WoW database \(fallback only\)\n// If itemId is provided.*?(?=\nexport const handler)'

# Also need to match the alternative pattern if comment is different
old_pattern2 = r'// Validate icon against Turtle WoW.*?async function scrapeFromTurtleWow\(itemId: number \| null, itemName\?: string\): Promise<ItemRecord \| null> \{.*?\n  \}\n\}'

# Try to find and replace
match = re.search(old_pattern, content, re.DOTALL)
if match:
    # Replace the old function with the new one
    content = content[:match.start()] + new_scrape_function + "\n\n" + content[match.end():]
    print("Found and replaced using pattern 1")
else:
    # Try a more specific pattern - find the function definition directly
    # Look for the async function scrapeFromTurtleWow that imports playwright
    start_marker = "// Scrape item from Turtle WoW database (fallback only)"
    alt_start_marker = "// Validate icon against Turtle WoW"

    # Find where validateIconFromTurtleWow ends and scrapeFromTurtleWow begins
    scrape_start = content.find("async function scrapeFromTurtleWow(itemId: number | null, itemName?: string)")
    if scrape_start == -1:
        print("ERROR: Could not find scrapeFromTurtleWow function")
        exit(1)

    # Find the comment before it
    comment_search_start = max(0, scrape_start - 500)
    comment_section = content[comment_search_start:scrape_start]

    # Find the last comment block before the function
    last_comment = comment_section.rfind("// Scrape item from Turtle WoW")
    if last_comment == -1:
        last_comment = comment_section.rfind("// If itemId is provided")

    if last_comment != -1:
        actual_start = comment_search_start + last_comment
    else:
        actual_start = scrape_start

    # Find where the function ends - look for "export const handler"
    handler_start = content.find("export const handler: Handlers", scrape_start)
    if handler_start == -1:
        print("ERROR: Could not find export const handler")
        exit(1)

    # The function ends with closing braces before handler
    # Find the last closing brace before handler
    section_between = content[scrape_start:handler_start]

    # Count braces to find function end
    brace_count = 0
    func_end = scrape_start
    in_function = False
    for i, char in enumerate(content[scrape_start:handler_start]):
        if char == '{':
            brace_count += 1
            in_function = True
        elif char == '}':
            brace_count -= 1
            if in_function and brace_count == 0:
                func_end = scrape_start + i + 1
                break

    if func_end > scrape_start:
        content = content[:actual_start] + new_scrape_function + "\n\n" + content[func_end:]
        print(f"Found and replaced function from position {actual_start} to {func_end}")
    else:
        print("ERROR: Could not determine function boundaries")
        exit(1)

# Also remove the validateIconFromTurtleWow function that uses Playwright
# (it's only used for icon validation which we don't need with fetch approach)
validate_pattern = r'// Validate icon against Turtle WoW \(returns correct icon name\)\nasync function validateIconFromTurtleWow\(itemId: number\): Promise<string \| null> \{.*?\n\}'
content = re.sub(validate_pattern, '// Icon validation removed - using fetch-based approach instead', content, flags=re.DOTALL)

# Write back
with open("/home/opc/tbc-website/routes/api/items/lookup.ts", "w") as f:
    f.write(content)

print("Auto-healing fix applied - Playwright replaced with fetch-based scraping")

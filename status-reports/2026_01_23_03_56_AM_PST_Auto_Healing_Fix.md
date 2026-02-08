# Auto-Healing Fix - Playwright to Fetch Migration

## Date
January 23, 2026, 3:56 AM PST

## Summary
Fixed the auto-healing mechanism in the loot history system. Auto-healing was failing because it relied on Playwright browser automation, which requires Chromium binaries that weren't installed on the server. Replaced with a fetch-based approach that uses simple HTTP requests.

## Problem Identified

### Symptoms
- Items 13015 (Serathil) and 15438 (Supreme Gloves of the Falcon) from the Onyxia loot log (Jan 22) were not displaying correct tooltips or icons
- Auto-healing was triggered but failing silently

### Root Cause
The auto-healing scraper in `/home/opc/tbc-website/routes/api/items/lookup.ts` used Playwright browser automation:
```typescript
const { chromium } = await import("npm:playwright");
browser = await chromium.launch({ headless: true, ... });
```

Server logs showed:
```
[ItemDB] Scrape error: browserType.launch: Executable doesn't exist at /home/opc/.cache/ms-playwright/chromium-1091/chrome-linux/chrome
```

### Why This Was Wrong
The bulk cache population script (`scripts/bulk-rescrape-turtlewow.ts`) already proved that a simple HTTP fetch approach works - it populated 7,700+ items. The auto-healing mechanism should have used the same approach.

## Fix Applied

### Changes Made
**File:** `/home/opc/tbc-website/routes/api/items/lookup.ts`

Replaced the Playwright-based `scrapeFromTurtleWow()` function with a fetch-based version:

**Before (Playwright):**
```typescript
async function scrapeFromTurtleWow(itemId: number | null, itemName?: string): Promise<ItemRecord | null> {
  const { chromium } = await import("npm:playwright");
  browser = await chromium.launch({ headless: true, ... });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  // ... browser automation to extract data
}
```

**After (Fetch):**
```typescript
async function scrapeFromTurtleWow(itemId: number | null, itemName?: string): Promise<ItemRecord | null> {
  const response = await fetch(`https://database.turtlecraft.gg/?item=${itemId}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TBC-Website/1.0)" },
  });
  const html = await response.text();
  const parsed = parseItemFromHtml(html, itemId);
  // ... regex-based HTML parsing
}
```

### Key Improvements
1. No browser dependencies - works without Playwright/Chromium
2. Faster execution - no browser startup overhead
3. More reliable - fewer moving parts to fail
4. Consistent with bulk script approach

## Verification

### Test Results
Both missing items were successfully scraped and cached:

```
[ItemDB] Scraping by ID (fetch): https://database.turtlecraft.gg/?item=13015
[ItemDB] Scraped and stored: Serathil (ID: 13015, icon: inv_axe_08)
[ItemDB] Self-healed: Updated Serathil with full tooltip data (quality: 3)

[ItemDB] Scraping by ID (fetch): https://database.turtlecraft.gg/?item=15438
[ItemDB] Scraped and stored: Supreme Gloves (ID: 15438, icon: inv_gauntlets_26)
[ItemDB] Self-healed: Updated Supreme Gloves with full tooltip data (quality: 2)
```

### Items Now in Static Cache
```bash
grep -E '"13015"|"15438"' /home/opc/tbc-website/static/item-tooltips.json
  "13015": {
  "15438": {
```

## How Auto-Healing Works (Post-Fix)

### Trigger Points
Auto-healing is triggered when you **load the loot history page**:

1. **Page Load**: `LootTable.tsx` component mounts
2. **Batch Request**: Calls `/api/batch-items?ids=...` with all item IDs from the loot
3. **Detection**: Batch API checks static cache (`item-tooltips.json`)
   - Items found → returned immediately
   - Items missing → returned in `errors` object
4. **Identification**: LootTable detects items with:
   - Missing from cache entirely (`errors` response)
   - Missing/invalid icon (`inv_misc_questionmark`)
   - Incomplete tooltip (no `<table>`, short length, missing effects)
5. **Healing**: For each identified item, calls `lookupItem(name, id, true)`
6. **Scraping**: `lookupItem()` calls `/api/items/lookup?id=...`
7. **Fetch & Parse**: Lookup API fetches HTML from TurtleWoW database, parses with regex
8. **Persist**: Scraped data saved to both KV cache and static JSON

### Flow Diagram
```
Page Load
    ↓
LootTable.tsx
    ↓
/api/batch-items?ids=...
    ↓
Check static cache
    ↓
Missing items detected
    ↓
lookupItem(name, id, true)
    ↓
/api/items/lookup?id=...
    ↓
fetch("https://database.turtlecraft.gg/?item=...")
    ↓
Parse HTML with regex
    ↓
Save to KV + static JSON
    ↓
Item healed!
```

## Files Modified

| Path | Action |
|------|--------|
| `/home/opc/tbc-website/routes/api/items/lookup.ts` | Replaced Playwright scraping with fetch-based approach |
| `/home/opc/tbc-website/routes/api/items/lookup.ts.bak` | Backup of original file |
| `/home/opc/tbc-website/static/item-tooltips.json` | Auto-updated with healed items |

## Testing Auto-Healing

To test that auto-healing works:
1. Load the loot history page for the Onyxia raid (Jan 22)
2. Items that were previously showing question marks should now display correctly
3. Check browser console for: `[LootTable] Auto-healing (not in cache): ...`
4. Check server logs for: `[ItemDB] Scraping by ID (fetch): ...`

## Status
**COMPLETED** - Auto-healing now uses fetch-based scraping. Both test items (13015, 15438) successfully healed.

import json, os

with open("/home/opc/tbc-website/static/architecture-future-enhancements.json") as f:
    data = json.load(f)

data["implementationContext"] = {
    "prompt": "You are implementing the Consumables BI Engine v7.0 for a World of Warcraft guild website. This document contains the complete design specification. Follow the 6 phases in order -- each phase builds on the previous. Before modifying any file, read it fully to understand existing patterns. The core philosophy: ENHANCE existing features, do NOT create parallel systems. Every UI change must match the existing dark WoW theme and color scheme already in the codebase.",

    "techStack": {
        "framework": "Deno Fresh (file-based routing, Preact islands for client-side rendering)",
        "database": "Deno KV (key-value store, accessed via Deno.openKv())",
        "server": "opc@tbcguild.duckdns.org, port 8000 behind nginx reverse proxy",
        "deployment": "SCP files to server, fix CRLF with sed -i 's/\\r$//' if needed, restart with: sudo pkill -f 'deno run' then cd /home/opc/tbc-website && nohup deno run --allow-all --unstable-kv dev.ts > /tmp/deno.log 2>&1 &",
        "noSystemd": "There is NO systemd service for Deno. Use pkill + nohup to restart.",
        "architecturePagePassword": "thralls2024 (cookie: architecture_auth=true)"
    },

    "criticalFiles": {
        "utils/recipes.ts": "1,060 lines. Contains 60+ recipes with Reagent interface (itemId, name, quantity, type: herb|vendor|drop|crafted|other). calculateHerbRequirements() at line ~1011 is herb-only, no recursion. 6 crafted reagents HAVE sub-recipes (Mongoose, Giants, GAE, Dreamshard, Dreamtonic, Swiftness). 6 crafted reagents MISSING sub-recipes (Shadow Oil, Blackmouth Oil, Stonescale Oil, Fire Oil, Solid Blasting Powder, Unstable Trigger). No resolveToRawMaterials() function exists yet -- this is the Phase 1 foundation.",
        "islands/ConsumesShop.tsx": "Shop Buy tab. Has admin mode with global discount (0-50%) and per-item static price toggles. Zero stock awareness. Item interface has no stock fields. Color scheme: card bg #2a2a2a, shop-price green #4a9c2d, AH strikethrough #808080. Price source badges: FIXED (#da70d6 on #4a2d5a), AH (#7fff7f on #2d5a27), WEB (#ffd700 on #5a4a27).",
        "islands/ConsumesAnalytics.tsx": "734 lines. Demand Insights page. Has P&L, order status, buyer/seller leaderboards, reagent demand bars (HIGH/MED/LOW badges sorted by quantity), daily trends. Zero inventory awareness. The reagent demand section is what gets enhanced with stock-aware columns.",
        "islands/MaterialSales.tsx": "1,144 lines. Sell Materials tab. Has existing Most Needed Materials banner with dual demand system: automated analytics (fetchDemandHerbs from /api/consumes/analytics?view=reagents-demand&days=30, priority: pct>=70 CRITICAL, >=40 MED, else LOW relative to max) + admin-pinned materials. Demand badges ONLY in banner, NOT on individual material cards in the grid. Enhance the banner, do not build a separate board.",
        "islands/RecipeBrowser.tsx": "Recipe Browser. Has calculateHerbNeeds() at line ~189 that filters type==='herb' only -- single-level resolution. Crafted reagent pills are orange dead-end links to turtlecraft.gg. These need to become expandable sub-recipe panels.",
        "islands/ConsumesQueue.tsx": "1,887 lines. Crafter Queue. Has getOrderReagents() for order fulfillment, restock panel. Zero guild bank cross-reference for reagents. Needs 'X in bank, Y needed' per reagent.",
        "routes/api/guild-bank/inventory.ts": "PUT handler: validates, timestamp guard, stores to KV [guild-bank, inventory], returns 200. Zero post-upload hooks. The Phase 6 hook inserts AFTER kv.set() but BEFORE the 200 response is sent (non-blocking via queueMicrotask).",
        "routes/api/bank-alts/inventory.ts": "PUT handler: validates, character-level merge, stores to KV [bank-alts, accountName], returns 200. Also needs the same post-upload hook.",
        "routes/api/consumes/prices.ts": "Contains ITEM_CATALOG with 84 items across 8 categories (protection, melee, caster, weaponbuffs, food, concoctions, flasks, tokens). Pricing logic: AH scanner -> wowauctions.net -> reagent cost fallback.",
        "routes/api/consumes/config.ts": "Default config: discountPercent: 10 (NOT 20). Config API currently has zero auth checks -- security gap to be aware of but NOT in scope for v7.0.",
        "utils/herb-data.ts": "HERB_CATALOG with 78 materials across 7 categories (herbs, fish, cooking, reagents, mining, blasted-lands, tokens).",
        "lib/discord-notify.ts": "Existing Discord webhook integration. Has channels for alchemy and materials. Zero stock alert functionality currently."
    },

    "kvKeyPatterns": {
        "existing": [
            "[guild-bank, inventory] -- full vault contents from tray app upload",
            "[bank-alts, accountName] -- per-character bank alt inventory",
            "[consumes, orders] -- active unfulfilled orders",
            "[consumes, orders_archive] -- completed/cancelled orders (30-day history)",
            "[consumes, staticPrices] -- admin per-item price overrides",
            "[consumes, config] -- global discount and shop settings",
            "[materials, sales] -- material sale records",
            "[consumes, pinned_materials] -- admin-pinned demand materials"
        ],
        "new": [
            "[stock, levels] -- current per-item stock count + classification (Phase 2)",
            "[stock, snapshots, date] -- daily per-item stock snapshot for trends (Phase 3)",
            "[stock, config] -- tier thresholds and discount percentages (Phase 2)",
            "[stock, alerts, itemId] -- alert history for throttling (Phase 6)"
        ]
    },

    "missingSubRecipes": {
        "shadowOil": "4x Fadeleaf + 4x Grave Moss (Alchemy 165)",
        "blackmouthOil": "2x Oily Blackmouth (Alchemy 80)",
        "stonescaleOil": "1x Stonescale Eel (Alchemy 250)",
        "fireOil": "2x Firefin Snapper (Alchemy 130)",
        "solidBlastingPowder": "2x Solid Stone (Engineering 175)",
        "unstableTrigger": "1x Mithril Bar + 1x Mageweave Cloth + 1x Solid Blasting Powder (Engineering 200)"
    },

    "userPreferences": [
        "ENHANCE existing features -- do NOT create parallel systems or new pages",
        "Do NOT reinvent the wheel -- if something already exists, build on it",
        "All thresholds and percentages MUST be admin-configurable",
        "UI/UX must be optimized for the end user -- color coding alone is not enough, use triple-layer communication (color + text + count)",
        "Preserve the existing dark WoW theme color scheme exactly",
        "Dynamic pricing tiers should be visually obvious to buyers",
        "Recipe drill-down must go to BASE raw materials (herbs, fish, ore) -- not intermediate crafted items",
        "Concoctions go 3 levels deep (Concoction -> Elixir -> raw herbs) -- the system must handle this",
        "Stock badges reuse existing color tokens from the codebase (CRITICAL/MED/LOW from Material Sales demand banner)",
        "The Material Sales Most Needed Materials banner already has a demand mechanism -- enhance it with inventory awareness, do not build a standalone Herb Demand Board"
    ],

    "consumptionRateFormula": "rate = totalOrdered / 30days (from consumes/orders_archive), daysUntilOOS = currentStock / rate, classification: Surplus (>30 days), Adequate (15-30), Low (7-14), Critical (1-6), OOS (0 stock)",

    "testingApproach": "Use Playwright for end-to-end verification. After each phase, verify the success criteria listed in that phase before moving to the next."
}

# Reorder keys so implementationContext comes first
ordered = {"implementationContext": data.pop("implementationContext")}
ordered.update(data)

with open("/home/opc/tbc-website/static/architecture-future-enhancements.json", "w") as f:
    json.dump(ordered, f, indent=2, ensure_ascii=False)

size = os.path.getsize("/home/opc/tbc-website/static/architecture-future-enhancements.json")
print("DONE. implementationContext added. File size: %d bytes" % size)

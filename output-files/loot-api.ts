// routes/api/loot/index.ts
// API endpoint to serve loot database for SR+ item picker

import { Handlers } from "$fresh/server.ts";

// Import the loot database (should be placed in static/ folder on server)
// For now, we'll embed a subset or load from file
import lootDatabase from "../../../static/loot-database.json" with { type: "json" };

interface LootItem {
  itemId: number;
  name: string;
  quality: string;
  slot: string | null;
  armor: string | null;
  weaponType: string | null;
  classRestriction: string | null;
  dropRate: string | null;
  boss: string;
  bossKey: string;
  raid: string;
  raidId: string;
  icon: string;
  category: string;
}

interface LootDatabase {
  generatedAt: string;
  totalItems: number;
  raids: string[];
  categories: string[];
  items: LootItem[];
}

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const raidId = url.searchParams.get("raid");
    const category = url.searchParams.get("category");
    const boss = url.searchParams.get("boss");
    const search = url.searchParams.get("search")?.toLowerCase();

    let items = (lootDatabase as LootDatabase).items;

    // Filter by raid
    if (raidId && raidId !== "ALL") {
      items = items.filter(item => item.raidId === raidId);
    }

    // Filter by category
    if (category && category !== "ALL") {
      items = items.filter(item => item.category === category);
    }

    // Filter by boss
    if (boss) {
      items = items.filter(item => item.bossKey === boss);
    }

    // Search by name
    if (search) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(search)
      );
    }

    // Sort by boss, then by name
    items.sort((a, b) => {
      if (a.boss !== b.boss) return a.boss.localeCompare(b.boss);
      return a.name.localeCompare(b.name);
    });

    return new Response(JSON.stringify({
      totalItems: items.length,
      raids: (lootDatabase as LootDatabase).raids,
      categories: (lootDatabase as LootDatabase).categories,
      items,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

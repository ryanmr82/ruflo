import { Handlers } from "$fresh/server.ts";

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

let lootDatabase: LootDatabase | null = null;

async function loadLootDatabase(): Promise<LootDatabase> {
  if (lootDatabase) return lootDatabase;

  try {
    const data = await Deno.readTextFile("./static/loot-database.json");
    lootDatabase = JSON.parse(data);
    return lootDatabase as LootDatabase;
  } catch (e) {
    console.error("Failed to load loot database:", e);
    return { generatedAt: "", totalItems: 0, raids: [], categories: [], items: [] };
  }
}

export const handler: Handlers = {
  async GET(req) {
    const db = await loadLootDatabase();
    const url = new URL(req.url);
    const raidId = url.searchParams.get("raid");
    const category = url.searchParams.get("category");
    const boss = url.searchParams.get("boss");
    const search = url.searchParams.get("search")?.toLowerCase();

    let items = db.items;

    if (raidId && raidId !== "ALL") {
      items = items.filter(item => item.raidId === raidId);
    }

    if (category && category !== "ALL") {
      items = items.filter(item => item.category === category);
    }

    if (boss) {
      items = items.filter(item => item.bossKey === boss);
    }

    if (search) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => {
      if (a.boss !== b.boss) return a.boss.localeCompare(b.boss);
      return a.name.localeCompare(b.name);
    });

    return new Response(JSON.stringify({
      totalItems: items.length,
      raids: db.raids,
      categories: db.categories,
      items,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

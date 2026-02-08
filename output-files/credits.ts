import { Handlers } from "$fresh/server.ts";
import { getRaidTypeForItem } from "../../../utils/raid-mapping.ts";

const DB_PATH = "/home/opc/tbc-website/data.db";

export interface SRPlusCredit {
  id: string;
  playerName: string;
  itemId: number;
  itemName: string;
  raidType: string;
  timesSRd: number;
  bonusRP: number;
  createdAt: string;
  updatedAt: string;
  lastSRDate?: string;
}

function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("admin_auth=true");
}

export const handler: Handlers = {
  // GET - List all credits with optional filters (no auth required)
  async GET(req) {
    const url = new URL(req.url);
    const raidType = url.searchParams.get("raidType");
    const search = url.searchParams.get("search")?.toLowerCase();
    const playerName = url.searchParams.get("playerName");

    const kv = await Deno.openKv(DB_PATH);
    const credits: SRPlusCredit[] = [];

    // Get settings for bonus calculation
    const settingsEntry = await kv.get(["sr_plus", "settings"]);
    const bonusPerSR = (settingsEntry.value as any)?.bonusPerSR ?? 20;

    // Build prefix based on filters
    const prefix: string[] = ["sr_plus", "credits"];
    if (raidType) {
      prefix.push(raidType);
      if (playerName) {
        prefix.push(playerName);
      }
    }

    const entries = kv.list({ prefix });
    for await (const entry of entries) {
      const credit = entry.value as SRPlusCredit;

      // Apply search filter
      if (search) {
        const matchesSearch =
          credit.playerName.toLowerCase().includes(search) ||
          credit.itemName.toLowerCase().includes(search);
        if (!matchesSearch) continue;
      }

      // Calculate bonus RP
      credit.bonusRP = credit.timesSRd * bonusPerSR;
      credits.push(credit);
    }

    // Sort by player name, then item name
    credits.sort((a, b) => {
      const playerCompare = a.playerName.localeCompare(b.playerName);
      if (playerCompare !== 0) return playerCompare;
      return a.itemName.localeCompare(b.itemName);
    });

    kv.close();
    return new Response(JSON.stringify({ credits, bonusPerSR }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // POST - Create a new credit (admin only)
  async POST(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { playerName, itemId, itemName, raidType, timesSRd = 1 } = body;

      if (!playerName || !itemId || !itemName) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Auto-detect raid type if not provided
      const detectedRaidType = raidType || getRaidTypeForItem(itemId, itemName) || "OTHER";

      const kv = await Deno.openKv(DB_PATH);
      const now = new Date().toISOString();
      const id = `${playerName}-${itemId}-${Date.now()}`;

      const credit: SRPlusCredit = {
        id,
        playerName,
        itemId,
        itemName,
        raidType: detectedRaidType,
        timesSRd,
        bonusRP: 0, // Calculated on read
        createdAt: now,
        updatedAt: now,
      };

      await kv.set(["sr_plus", "credits", detectedRaidType, playerName, itemId], credit);
      kv.close();

      return new Response(JSON.stringify({ success: true, credit }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // PUT - Update a credit (admin only)
  async PUT(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { playerName, itemId, raidType, timesSRd, increment } = body;

      if (!playerName || !itemId || !raidType) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);
      const key = ["sr_plus", "credits", raidType, playerName, itemId];
      const existing = await kv.get(key);

      if (!existing.value) {
        kv.close();
        return new Response(JSON.stringify({ error: "Credit not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const credit = existing.value as SRPlusCredit;

      if (increment) {
        credit.timesSRd += 1;
        credit.lastSRDate = new Date().toISOString();
      } else if (typeof timesSRd === "number") {
        credit.timesSRd = timesSRd;
      }

      credit.updatedAt = new Date().toISOString();

      await kv.set(key, credit);
      kv.close();

      return new Response(JSON.stringify({ success: true, credit }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // DELETE - Remove a credit (admin only)
  async DELETE(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(req.url);
      const playerName = url.searchParams.get("playerName");
      const itemId = url.searchParams.get("itemId");
      const raidType = url.searchParams.get("raidType");

      if (!playerName || !itemId || !raidType) {
        return new Response(JSON.stringify({ error: "Missing required params" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);
      const key = ["sr_plus", "credits", raidType, playerName, Number(itemId)];

      await kv.delete(key);
      kv.close();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * Get player's current SRs from raidres.top for a specific event
 *
 * Flow:
 * 1. Call /api/sr-plus/raidres to get reservations with raidItemId
 * 2. Look up each raidItemId via /api/items/lookup to get item names
 * 3. Filter to only this player's reservations
 * 4. Return items with names, icons, and quality
 */

interface PlayerSR {
  itemId: number;
  itemName: string;
  icon: string;
  quality: number;
  playerClass: string;
  playerName: string;
}

interface RaidResReservation {
  playerName: string;
  playerClass: string;
  raidItemId: number;
  srPlusFromRaidRes: number;
  isInvalid: boolean;
}

interface RaidResData {
  eventId: string;
  raidId: number;
  startTime: string;
  reservations: RaidResReservation[];
  hardReservedItemIds: number[];
  totalReservations: number;
}

interface ItemLookupResult {
  id: number;
  name: string;
  quality: number;
  icon?: string;
  iconUrl?: string;
}

// Cache for item lookups to avoid repeated calls
const itemCache = new Map<number, ItemLookupResult>();

async function lookupItem(itemId: number): Promise<ItemLookupResult | null> {
  // Check cache first
  if (itemCache.has(itemId)) {
    return itemCache.get(itemId)!;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/items/lookup?id=${itemId}`);
    if (!response.ok) {
      console.error(`[MySRs] Item lookup failed for ID ${itemId}: ${response.status}`);
      return null;
    }

    const item = await response.json();
    const result: ItemLookupResult = {
      id: item.id,
      name: item.name,
      quality: item.quality,
      icon: item.icon || "inv_misc_questionmark",
      iconUrl: item.iconUrl,
    };

    // Cache the result
    itemCache.set(itemId, result);
    return result;
  } catch (error) {
    console.error(`[MySRs] Error looking up item ${itemId}:`, error);
    return null;
  }
}

export const handler: Handlers = {
  async GET(req) {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing eventId parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the player's character names (lowercase for comparison)
    const characterNames = (session.characters || []).map((c: string) => c.toLowerCase());

    if (characterNames.length === 0) {
      return new Response(JSON.stringify({
        error: "No characters linked",
        srs: []
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Fetch from raidres API (returns raidItemId, not itemName)
      const raidResResponse = await fetch(`http://localhost:8000/api/sr-plus/raidres?eventId=${eventId}`);

      if (!raidResResponse.ok) {
        console.error(`[MySRs] RaidRes API error: ${raidResResponse.status}`);
        return new Response(JSON.stringify({
          error: "Failed to fetch from RaidRes",
          srs: []
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const raidResData: RaidResData = await raidResResponse.json();
      const reservations = raidResData.reservations || [];

      // Filter to only this player's reservations
      const playerReservations = reservations.filter(res =>
        characterNames.includes(res.playerName.toLowerCase())
      );

      if (playerReservations.length === 0) {
        return new Response(JSON.stringify({
          eventId,
          srs: [],
          totalReservations: reservations.length,
          message: "No reservations found for your characters"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Look up item names for each reservation
      const playerSRs: PlayerSR[] = [];

      for (const res of playerReservations) {
        const item = await lookupItem(res.raidItemId);

        if (item) {
          playerSRs.push({
            itemId: res.raidItemId,
            itemName: item.name,
            icon: item.icon || "inv_misc_questionmark",
            quality: item.quality,
            playerClass: res.playerClass,
            playerName: res.playerName,
          });
        } else {
          // Item not found - include with placeholder
          playerSRs.push({
            itemId: res.raidItemId,
            itemName: `Unknown Item (ID: ${res.raidItemId})`,
            icon: "inv_misc_questionmark",
            quality: 4, // Assume epic
            playerClass: res.playerClass,
            playerName: res.playerName,
          });
        }
      }

      console.log(`[MySRs] Found ${playerSRs.length} SRs for ${characterNames.join(", ")} in event ${eventId}`);

      return new Response(JSON.stringify({
        eventId,
        srs: playerSRs,
        totalReservations: reservations.length,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[MySRs] Error:", error);
      return new Response(JSON.stringify({
        error: "Failed to fetch SRs",
        srs: []
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

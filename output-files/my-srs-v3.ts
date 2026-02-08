import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * Get player's current SRs from raidres.top for a specific event
 *
 * The raidres.top API returns raidItemId (their internal ID), NOT WoW item IDs.
 * So we must use the Playwright scraper which extracts actual item names from the page.
 *
 * Flow:
 * 1. Check KV cache for scraped data first
 * 2. If not cached, call the scraper endpoint (requires admin)
 * 3. Filter to only this player's reservations
 * 4. Look up item details via /api/items/lookup for icons/quality
 */

interface PlayerSR {
  itemId?: number;
  itemName: string;
  icon: string;
  quality: number;
  playerClass: string;
  playerName: string;
}

interface ScrapedReservation {
  playerName: string;
  playerClass: string;
  itemName: string;
}

interface CachedScrapeData {
  raidName: string;
  reservations: ScrapedReservation[];
  scrapedAt: string;
}

interface ItemLookupResult {
  id: number;
  name: string;
  quality: number;
  icon?: string;
  iconUrl?: string;
}

const DB_PATH = "/home/opc/tbc-website/data.db";

// Cache for item lookups to avoid repeated calls
const itemCache = new Map<string, ItemLookupResult>();

async function lookupItemByName(itemName: string): Promise<ItemLookupResult | null> {
  // Check cache first
  const cacheKey = itemName.toLowerCase();
  if (itemCache.has(cacheKey)) {
    return itemCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/items/lookup?name=${encodeURIComponent(itemName)}`);
    if (!response.ok) {
      console.log(`[MySRs] Item lookup for "${itemName}" returned ${response.status}`);
      return null;
    }

    const item = await response.json();
    if (item.error) {
      return null;
    }

    const result: ItemLookupResult = {
      id: item.id,
      name: item.name,
      quality: item.quality,
      icon: item.icon || "inv_misc_questionmark",
      iconUrl: item.iconUrl,
    };

    // Cache the result
    itemCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[MySRs] Error looking up item "${itemName}":`, error);
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
      // First check KV cache for scraped data
      const kv = await Deno.openKv(DB_PATH);
      const cachedData = await kv.get<CachedScrapeData>(["scrape", "cache", eventId]);

      let reservations: ScrapedReservation[] = [];
      let raidName = "";

      if (cachedData.value && cachedData.value.reservations.length > 0) {
        // Use cached data
        console.log(`[MySRs] Using cached scrape data for event ${eventId}`);
        reservations = cachedData.value.reservations;
        raidName = cachedData.value.raidName;
      } else {
        // Need to scrape - call the scraper endpoint
        console.log(`[MySRs] No cache found, calling scraper for event ${eventId}`);

        try {
          const scrapeResponse = await fetch(`http://localhost:8000/api/sr-plus/scrape`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": "admin_auth=true", // Internal call
            },
            body: JSON.stringify({ eventId }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            reservations = scrapeData.reservations || [];
            raidName = scrapeData.raidName || "";

            console.log(`[MySRs] Scraper returned ${reservations.length} reservations`);
          } else {
            console.error(`[MySRs] Scraper failed: ${scrapeResponse.status}`);
          }
        } catch (scrapeError) {
          console.error("[MySRs] Scraper error:", scrapeError);
        }
      }

      kv.close();

      if (reservations.length === 0) {
        return new Response(JSON.stringify({
          eventId,
          raidName,
          srs: [],
          totalReservations: 0,
          message: "No reservations found for this event"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Filter to only this player's reservations
      const playerReservations = reservations.filter(res =>
        characterNames.includes(res.playerName.toLowerCase())
      );

      if (playerReservations.length === 0) {
        return new Response(JSON.stringify({
          eventId,
          raidName,
          srs: [],
          totalReservations: reservations.length,
          message: "No reservations found for your characters"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Look up item details for icons/quality
      const playerSRs: PlayerSR[] = [];

      for (const res of playerReservations) {
        const item = await lookupItemByName(res.itemName);

        playerSRs.push({
          itemId: item?.id,
          itemName: res.itemName,
          icon: item?.icon || "inv_misc_questionmark",
          quality: item?.quality ?? 4, // Default to Epic
          playerClass: res.playerClass || "Unknown",
          playerName: res.playerName,
        });
      }

      console.log(`[MySRs] Found ${playerSRs.length} SRs for ${characterNames.join(", ")} in event ${eventId}`);

      return new Response(JSON.stringify({
        eventId,
        raidName,
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

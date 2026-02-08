import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * Get player's current SRs from raidres.top for a specific event
 * This fetches what items the player has soft-reserved on raidres.top
 */

interface PlayerSR {
  itemName: string;
  playerClass: string;
  playerName: string;
}

interface RaidResData {
  reservations: Array<{
    playerName: string;
    itemName: string;
    class?: string;
    playerClass?: string;
  }>;
  raidName?: string;
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

    // Get the player's character names
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
      // First try to get from our cached/scraped data
      const raidResResponse = await fetch(`http://localhost:8000/api/sr-plus/raidres?eventId=${eventId}`);

      let data: RaidResData = { reservations: [] };

      if (raidResResponse.ok) {
        data = await raidResResponse.json();
      } else {
        // Try the scraper endpoint as fallback
        const scrapeResponse = await fetch(`http://localhost:8000/api/sr-plus/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": "admin_auth=true", // Internal call
          },
          body: JSON.stringify({ eventId }),
        });

        if (scrapeResponse.ok) {
          data = await scrapeResponse.json();
        }
      }

      const reservations = data.reservations || [];

      // Filter to only this player's reservations
      const playerSRs: PlayerSR[] = [];

      for (const res of reservations) {
        const playerName = res.playerName?.toLowerCase() || "";
        if (characterNames.includes(playerName)) {
          playerSRs.push({
            itemName: res.itemName,
            playerClass: res.playerClass || res.class || "",
            playerName: res.playerName,
          });
        }
      }

      return new Response(JSON.stringify({
        eventId,
        raidName: data.raidName || "",
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

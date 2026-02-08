import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * Get player's current SRs from raidres.top for a specific event
 * This fetches what items the player has soft-reserved on raidres.top
 */

interface PlayerSR {
  itemName: string;
  playerClass: string;
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
    const characterNames = session.characters.map(c => c.toLowerCase());

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
      // Call our scraper to get all reservations for this event
      const scrapeResponse = await fetch(`http://localhost:8000/api/sr-plus/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": "admin_auth=true", // Internal call
        },
        body: JSON.stringify({ eventId }),
      });

      if (!scrapeResponse.ok) {
        // Try the API endpoint instead
        const apiResponse = await fetch(`http://localhost:8000/api/sr-plus/raidres?eventId=${eventId}`);
        if (!apiResponse.ok) {
          return new Response(JSON.stringify({
            error: "Could not fetch raidres data",
            srs: []
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const apiData = await apiResponse.json();
        const playerSRs: PlayerSR[] = [];

        for (const res of apiData.reservations || []) {
          if (characterNames.includes(res.playerName?.toLowerCase())) {
            playerSRs.push({
              itemName: res.itemName,
              playerClass: res.playerClass || res.class || "",
            });
          }
        }

        return new Response(JSON.stringify({
          eventId,
          raidName: apiData.raidName,
          srs: playerSRs,
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const scrapeData = await scrapeResponse.json();
      const reservations = scrapeData.reservations || [];

      // Filter to only this player's reservations
      const playerSRs: PlayerSR[] = [];

      for (const res of reservations) {
        if (characterNames.includes(res.playerName?.toLowerCase())) {
          playerSRs.push({
            itemName: res.itemName,
            playerClass: res.playerClass || "",
          });
        }
      }

      return new Response(JSON.stringify({
        eventId,
        raidName: scrapeData.raidName,
        srs: playerSRs,
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

import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * Get player's current SRs from raidres.top for a specific event
 *
 * Uses the same modular approach as RaidResFetcher.tsx:
 * 1. Call /api/sr-plus/scrape to get fresh data with actual item NAMES
 * 2. Filter to only this player's reservations
 * 3. Return item names (frontend will call /api/items/lookup for icons)
 */

interface ScrapedReservation {
  playerName: string;
  playerClass: string;
  itemName: string;
}

interface PlayerSR {
  itemName: string;
  playerClass: string;
  playerName: string;
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
      // Call the Playwright scraper directly - fresh data every time
      console.log(`[MySRs] Scraping RaidRes event: ${eventId}`);

      const scrapeResponse = await fetch(`http://localhost:8000/api/sr-plus/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": "admin_auth=true", // Internal call
        },
        body: JSON.stringify({ eventId }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        console.error(`[MySRs] Scraper failed: ${errorData.error || scrapeResponse.status}`);
        return new Response(JSON.stringify({
          error: errorData.error || "Failed to fetch from RaidRes",
          srs: []
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const scrapeData = await scrapeResponse.json();
      const reservations: ScrapedReservation[] = scrapeData.reservations || [];

      console.log(`[MySRs] Scraped ${reservations.length} reservations from ${scrapeData.raidName}`);

      if (reservations.length === 0) {
        return new Response(JSON.stringify({
          eventId,
          raidName: scrapeData.raidName || "",
          srs: [],
          totalReservations: 0,
          message: "No reservations found for this event"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Filter to only this player's reservations
      const playerSRs: PlayerSR[] = reservations
        .filter(res => characterNames.includes(res.playerName.toLowerCase()))
        .map(res => ({
          itemName: res.itemName,
          playerClass: res.playerClass || "Unknown",
          playerName: res.playerName,
        }));

      console.log(`[MySRs] Found ${playerSRs.length} SRs for ${characterNames.join(", ")}`);

      return new Response(JSON.stringify({
        eventId,
        raidName: scrapeData.raidName || "",
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

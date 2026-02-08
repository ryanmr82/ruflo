import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * SR+ Picks API - Fetch upcoming raids user is signed up for
 * Uses Raid-Helper API v2 (same as raids.ts)
 */

const DB_PATH = "/home/opc/tbc-website/data.db";
const API_KEY = Deno.env.get("RAID_HELPER_API_KEY") || "84hOyEGqAqFowsToIDusYNBlQvXzXqmc1sWorhMj";
const SERVER_ID = Deno.env.get("RAID_HELPER_SERVER_ID") || "1039762365345976330";

interface SRPick {
  eventId: string;
  eventTitle: string;
  eventDate: number;
  raidType: string;
  itemName: string;
}

interface UpcomingRaid {
  id: string;
  title: string;
  startTime: number;
  description?: string;
  softresId?: string;
}

interface Settings {
  bonusPerSR: number;
  hardReserveThreshold: number;
  lockSRBeforeRaid: number;
}

interface SRPlusCredit {
  playerName: string;
  itemName: string;
  timesSRd: number;
  currentBonus: number;
  isHardReserve: boolean;
}

function extractSoftresId(description: string): string | undefined {
  if (!description) return undefined;
  // Match both raidres.top/event/XXX and raidres.top/res/XXX
  const match = description.match(/raidres\.top\/(event|res)\/([a-zA-Z0-9]+)/);
  return match?.[2];
}

function detectRaidType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("kara 40") || lower.includes("karazhan 40") || lower.includes("upper kara")) return "KARA40";
  if (lower.includes("kara") || lower.includes("karazhan") || lower.includes("lower kara")) return "KARA10";
  if (lower.includes("molten") || lower.includes(" mc")) return "MC";
  if (lower.includes("blackwing") || lower.includes("bwl")) return "BWL";
  if (lower.includes("aq40") || lower.includes("temple")) return "AQ40";
  if (lower.includes("aq20") || lower.includes("ruins")) return "AQ20";
  if (lower.includes("naxx")) return "NAXX";
  if (lower.includes("zg") || lower.includes("gurub")) return "ZG";
  if (lower.includes("ony")) return "ONY";
  if (lower.includes("emerald") || lower.includes("sanctum")) return "EMERALD";
  return "OTHER";
}

// Get settings from KV
async function getSettings(kv: Deno.Kv): Promise<Settings> {
  const settings = await kv.get<Settings>(["sr_plus", "settings"]);
  return settings.value || {
    bonusPerSR: 20,
    hardReserveThreshold: 5,
    lockSRBeforeRaid: 2,
  };
}

// Get player's existing SR picks
async function getPlayerPicks(kv: Deno.Kv, discordId: string): Promise<SRPick[]> {
  const picks: SRPick[] = [];
  const iter = kv.list<SRPick>({ prefix: ["sr_picks", discordId] });

  for await (const entry of iter) {
    picks.push(entry.value);
  }

  return picks;
}

// Get player's SR+ credits
async function getPlayerCredits(kv: Deno.Kv, characterNames: string[]): Promise<SRPlusCredit[]> {
  const credits: SRPlusCredit[] = [];

  for (const charName of characterNames) {
    const iter = kv.list<SRPlusCredit>({ prefix: ["sr_plus", "credits", charName] });
    for await (const entry of iter) {
      credits.push(entry.value);
    }
  }

  return credits;
}

// Fetch event details to check signups
async function fetchEventSignups(eventId: string): Promise<{ signUps: any[], userId?: string }> {
  try {
    const response = await fetch(
      `https://raid-helper.dev/api/v2/events/${eventId}`,
      {
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { signUps: [] };
    }

    const event = await response.json();
    return { signUps: event.signUps || [] };
  } catch {
    return { signUps: [] };
  }
}

// Get upcoming raids user is signed up for
async function getUpcomingRaids(discordId: string): Promise<UpcomingRaid[]> {
  try {
    // Get all events
    const response = await fetch(
      `https://raid-helper.dev/api/v2/servers/${SERVER_ID}/events`,
      {
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("[MySRPicks] Failed to fetch events:", response.status);
      return [];
    }

    const data = await response.json();
    const now = Math.floor(Date.now() / 1000);

    // Filter to upcoming events only
    const upcomingEvents = (data.postedEvents || []).filter(
      (e: { startTime: number }) => e.startTime > now
    );

    // Check each event for user signups (limit to first 15)
    const userRaids: UpcomingRaid[] = [];

    for (const event of upcomingEvents.slice(0, 15)) {
      try {
        const { signUps } = await fetchEventSignups(event.id);

        // Check if user is signed up (match by oderId which is discordId)
        const isSignedUp = signUps.some((s: any) =>
          s.oderId === discordId ||
          s.oderId === discordId.toString() ||
          s.userId === discordId
        );

        if (isSignedUp) {
          userRaids.push({
            id: event.id,
            title: event.title || "Raid",
            startTime: event.startTime,
            description: event.description,
            softresId: extractSoftresId(event.description || ""),
          });
        }
      } catch (e) {
        console.error(`[MySRPicks] Error checking event ${event.id}:`, e);
      }
    }

    // Sort by start time ascending
    userRaids.sort((a, b) => a.startTime - b.startTime);

    return userRaids;
  } catch (error) {
    console.error("[MySRPicks] Error fetching raids:", error);
    return [];
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

    try {
      const kv = await Deno.openKv(DB_PATH);

      const [settings, picks, upcomingRaids, credits] = await Promise.all([
        getSettings(kv),
        getPlayerPicks(kv, session.discordId),
        getUpcomingRaids(session.discordId),
        getPlayerCredits(kv, session.characters || []),
      ]);

      kv.close();

      // Format credits for display
      const formattedCredits = credits.map(c => ({
        playerName: c.playerName,
        itemName: c.itemName,
        raidType: "UNKNOWN", // Would need to determine from item
        timesSRd: c.timesSRd,
        bonusRP: c.currentBonus,
      }));

      return new Response(JSON.stringify({
        picks,
        credits: formattedCredits,
        upcomingRaids,
        settings,
        characters: session.characters || [],
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[MySRPicks] Error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req) {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { eventId, itemName, raidType } = body;

      if (!eventId || !itemName) {
        return new Response(JSON.stringify({ error: "Missing eventId or itemName" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);

      // Store the pick
      const pick: SRPick = {
        eventId,
        eventTitle: "", // Will be filled from event data
        eventDate: Date.now(),
        raidType: raidType || "UNKNOWN",
        itemName,
      };

      await kv.set(["sr_picks", session.discordId, eventId], pick);
      kv.close();

      return new Response(JSON.stringify({ success: true, pick }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[MySRPicks] POST Error:", error);
      return new Response(JSON.stringify({ error: "Failed to save pick" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req) {
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

    try {
      const kv = await Deno.openKv(DB_PATH);
      await kv.delete(["sr_picks", session.discordId, eventId]);
      kv.close();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[MySRPicks] DELETE Error:", error);
      return new Response(JSON.stringify({ error: "Failed to delete pick" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

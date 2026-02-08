import { Handlers } from "$fresh/server.ts";
import { getSession } from "../../auth/me.ts";

const DB_PATH = "/home/opc/tbc-website/data.db";
const RAID_HELPER_API_KEY = "84hOyEGqAqFowsToIDusYNBlQvXzXqmc1sWorhMj";

interface SRPick {
  eventId: string;
  eventTitle: string;
  eventDate: number;
  raidType: string;
  itemName: string;
  itemId?: number;
  turtleWowId?: number;
  iconUrl?: string;
  quality?: number;
  createdAt: number;
  updatedAt: number;
}

// Check if user is signed up for a raid via Raid-Helper
async function isUserSignedUp(discordId: string, eventId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://raid-helper.dev/api/v2/events/${eventId}`,
      {
        headers: {
          "Authorization": RAID_HELPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return false;

    const event = await response.json();
    const signUps = event.signUps || [];

    return signUps.some((s: any) => s.userId === discordId);
  } catch {
    return false;
  }
}

// Get upcoming raids user is signed up for
async function getUserRaids(discordId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://raid-helper.dev/api/v2/servers/1039762365345976330/events`,
      {
        headers: {
          "Authorization": RAID_HELPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const events = data.postedEvents || [];

    // Filter to future events only
    const now = Math.floor(Date.now() / 1000);
    const futureEvents = events.filter((e: any) => e.startTime > now);

    // Check each event for user signup
    const userRaids = [];
    for (const event of futureEvents.slice(0, 10)) {
      const eventDetails = await fetch(
        `https://raid-helper.dev/api/v2/events/${event.id}`,
        {
          headers: {
            "Authorization": RAID_HELPER_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (eventDetails.ok) {
        const details = await eventDetails.json();
        const isSignedUp = (details.signUps || []).some((s: any) => s.userId === discordId);

        if (isSignedUp) {
          userRaids.push({
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            description: event.description,
            softresId: event.softresId,
          });
        }
      }
    }

    return userRaids;
  } catch (error) {
    console.error("Failed to get user raids:", error);
    return [];
  }
}

export const handler: Handlers = {
  // GET - Get user's SR picks and raids they're signed up for
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

      // Get user's SR picks
      const picks: SRPick[] = [];
      const picksIter = kv.list<SRPick>({ prefix: ["sr_picks", session.discordId] });
      for await (const entry of picksIter) {
        picks.push(entry.value);
      }

      // Get settings
      const settingsEntry = await kv.get(["sr_plus", "settings"]);
      const settings = settingsEntry.value as any || { bonusPerSR: 20, hardReserveThreshold: 5 };

      // Get user's existing SR+ credits (by character names)
      const credits: any[] = [];
      for (const charName of session.characters) {
        const creditIter = kv.list({ prefix: ["sr_plus", "credits"] });
        for await (const entry of creditIter) {
          const credit = entry.value as any;
          if (credit.playerName?.toLowerCase() === charName.toLowerCase()) {
            credits.push(credit);
          }
        }
      }

      kv.close();

      // Get raids user is signed up for
      const upcomingRaids = await getUserRaids(session.discordId);

      return new Response(JSON.stringify({
        picks,
        credits,
        upcomingRaids,
        settings,
        characters: session.characters,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // POST - Set SR pick for a raid
  async POST(req) {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.characters.length === 0) {
      return new Response(JSON.stringify({ error: "Please link your character name first" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { eventId, itemName, raidType, characterName } = body;

      if (!eventId || !itemName) {
        return new Response(JSON.stringify({ error: "Missing eventId or itemName" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify character belongs to user
      if (characterName && !session.characters.map(c => c.toLowerCase()).includes(characterName.toLowerCase())) {
        return new Response(JSON.stringify({ error: "Character not linked to your account" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify user is signed up for the raid
      const isSignedUp = await isUserSignedUp(session.discordId, eventId);
      if (!isSignedUp) {
        return new Response(JSON.stringify({ error: "You must be signed up for this raid on Discord" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get event details for title/date
      const eventResponse = await fetch(
        `https://raid-helper.dev/api/v2/events/${eventId}`,
        {
          headers: {
            "Authorization": RAID_HELPER_API_KEY,
          },
        }
      );

      let eventTitle = "Unknown Raid";
      let eventDate = Date.now();

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        eventTitle = eventData.title || eventTitle;
        eventDate = (eventData.startTime || Math.floor(Date.now() / 1000)) * 1000;
      }

      // Check lock time (default 2 hours before raid)
      const kv = await Deno.openKv(DB_PATH);
      const settingsEntry = await kv.get(["sr_plus", "settings"]);
      const settings = settingsEntry.value as any || { lockSRBeforeRaid: 2 };
      const lockTime = eventDate - (settings.lockSRBeforeRaid * 60 * 60 * 1000);

      if (Date.now() > lockTime) {
        kv.close();
        return new Response(JSON.stringify({
          error: `SR picks are locked ${settings.lockSRBeforeRaid} hours before raid`
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const now = Date.now();
      const pick: SRPick = {
        eventId,
        eventTitle,
        eventDate,
        raidType: raidType || "OTHER",
        itemName,
        createdAt: now,
        updatedAt: now,
      };

      // Store the pick
      await kv.set(["sr_picks", session.discordId, eventId], pick);
      kv.close();

      return new Response(JSON.stringify({ success: true, pick }), {
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

  // DELETE - Remove SR pick
  async DELETE(req) {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(req.url);
      const eventId = url.searchParams.get("eventId");

      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);
      await kv.delete(["sr_picks", session.discordId, eventId]);
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

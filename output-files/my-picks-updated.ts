import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * SR+ Picks API - Player selects ONE SR+ item per raid type
 *
 * Data model:
 * - Each player can have ONE active SR+ pick per raid type (MC, BWL, etc.)
 * - Changing SR+ item resets the count for that raid type
 * - Tracks: discordId, raidType, itemName, count, startedAt
 */

const DB_PATH = "/home/opc/tbc-website/data.db";
const RAID_HELPER_TOKEN = Deno.env.get("RAID_HELPER_TOKEN") || "";
const GUILD_ID = "1276358208556437524";

interface SRPlusPick {
  raidType: string;
  itemName: string;
  count: number;
  startedAt: string;
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

// Get settings from KV
async function getSettings(kv: Deno.Kv): Promise<Settings> {
  const settings = await kv.get<Settings>(["sr_plus", "settings"]);
  return settings.value || {
    bonusPerSR: 20,
    hardReserveThreshold: 5,
    lockSRBeforeRaid: 2,
  };
}

// Get player's SR+ picks (one per raid type)
async function getPlayerPicks(kv: Deno.Kv, discordId: string): Promise<SRPlusPick[]> {
  const picks: SRPlusPick[] = [];
  const iter = kv.list<SRPlusPick>({ prefix: ["sr_plus_picks", discordId] });

  for await (const entry of iter) {
    picks.push(entry.value);
  }

  return picks;
}

// Get upcoming raids user is signed up for
async function getUpcomingRaids(discordId: string): Promise<UpcomingRaid[]> {
  if (!RAID_HELPER_TOKEN) {
    console.warn("[MySRPicks] No RAID_HELPER_TOKEN set");
    return [];
  }

  try {
    // Get all upcoming events
    const eventsRes = await fetch(
      `https://raid-helper.dev/api/v3/servers/${GUILD_ID}/events`,
      {
        headers: {
          Authorization: RAID_HELPER_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!eventsRes.ok) {
      console.error("[MySRPicks] Failed to fetch events:", eventsRes.status);
      return [];
    }

    const eventsData = await eventsRes.json();
    const now = Math.floor(Date.now() / 1000);
    const upcomingEvents = (eventsData.postedEvents || []).filter(
      (e: { startTime: number }) => e.startTime > now
    );

    // Check each event for user signups
    const userRaids: UpcomingRaid[] = [];

    for (const event of upcomingEvents.slice(0, 10)) {
      try {
        const signupsRes = await fetch(
          `https://raid-helper.dev/api/v3/events/${event.id}`,
          {
            headers: {
              Authorization: RAID_HELPER_TOKEN,
              "Content-Type": "application/json",
            },
          }
        );

        if (signupsRes.ok) {
          const eventData = await signupsRes.json();
          const signups = eventData.signUps || [];
          const isSignedUp = signups.some(
            (s: { oderId: string; oderId: string }) =>
              s.oderId === discordId || (s as any).userId === discordId
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
        }
      } catch (e) {
        console.error(`[MySRPicks] Error checking event ${event.id}:`, e);
      }
    }

    return userRaids;
  } catch (error) {
    console.error("[MySRPicks] Error fetching raids:", error);
    return [];
  }
}

function extractSoftresId(description: string): string | undefined {
  const match = description.match(/raidres\.top\/event\/([a-zA-Z0-9]+)/);
  return match?.[1];
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

      const [settings, picks, upcomingRaids] = await Promise.all([
        getSettings(kv),
        getPlayerPicks(kv, session.discordId),
        getUpcomingRaids(session.discordId),
      ]);

      kv.close();

      // Convert picks to credits format for display
      const credits = picks.map(pick => ({
        playerName: session.characters?.[0] || session.discordDisplayName,
        itemName: pick.itemName,
        raidType: pick.raidType,
        timesSRd: pick.count,
        bonusRP: pick.count * settings.bonusPerSR,
      }));

      return new Response(JSON.stringify({
        picks: picks.map(p => ({
          raidType: p.raidType,
          itemName: p.itemName,
          count: p.count,
          startedAt: p.startedAt,
        })),
        credits,
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
      const { raidType, itemName, confirmReset } = body;

      if (!raidType || !itemName) {
        return new Response(JSON.stringify({ error: "Missing raidType or itemName" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);

      // Check for existing pick for this raid type
      const existingPick = await kv.get<SRPlusPick>(["sr_plus_picks", session.discordId, raidType]);

      if (existingPick.value && existingPick.value.itemName !== itemName) {
        // Different item selected - check if user confirmed reset
        if (!confirmReset) {
          kv.close();
          return new Response(JSON.stringify({
            requiresConfirmation: true,
            currentItem: existingPick.value.itemName,
            currentCount: existingPick.value.count,
            newItem: itemName,
            message: `You are about to change your SR+ from "${existingPick.value.itemName}" to "${itemName}". This will reset your SR+ progress (currently ${existingPick.value.count} raids). Are you sure?`,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // User confirmed - reset and set new item
        console.log(`[SR+] ${session.discordId} changing ${raidType} SR+ from "${existingPick.value.itemName}" (${existingPick.value.count}) to "${itemName}"`);
      }

      // Set the new SR+ pick (resets count if different item)
      const newPick: SRPlusPick = {
        raidType,
        itemName,
        count: existingPick.value?.itemName === itemName ? existingPick.value.count : 0,
        startedAt: existingPick.value?.itemName === itemName ? existingPick.value.startedAt : new Date().toISOString(),
      };

      await kv.set(["sr_plus_picks", session.discordId, raidType], newPick);
      kv.close();

      return new Response(JSON.stringify({
        success: true,
        pick: newPick,
        wasReset: existingPick.value?.itemName !== itemName && existingPick.value !== null,
      }), {
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
    const raidType = url.searchParams.get("raidType");

    if (!raidType) {
      return new Response(JSON.stringify({ error: "Missing raidType parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const kv = await Deno.openKv(DB_PATH);
      await kv.delete(["sr_plus_picks", session.discordId, raidType]);
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

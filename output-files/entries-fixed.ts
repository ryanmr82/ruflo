import { Handlers } from "$fresh/server.ts";
import { getSession } from "../auth/me.ts";

/**
 * SR+ Entries API v3 - Security hardened
 *
 * Key: ["sr_plus", "entries", raidType, visitorId]
 *
 * Security fixes:
 * - Validates visitorId is not undefined/null before using
 * - Server-side auth check to prevent users seeing other's entries
 * - Only admins can query arbitrary visitorIds
 */

const DB_PATH = "/home/opc/tbc-website/data.db";

export interface SRPlusEntry {
  visitorId: string;           // Discord ID
  playerName: string;          // Character name
  raidType: string;            // MC, BWL, AQ40, etc.
  itemName: string;            // Current SR+ item
  itemId?: number;             // Optional item ID for tooltips
  timesSRd: number;            // Times attended while SR+'ing this item
  currentBonus: number;        // timesSRd * bonusPerSR
  pickedAt: number;            // Timestamp when picked
  lastIncrementedAt?: number;  // Timestamp of last increment
  lastProcessedLogId?: string; // Prevent double-counting from logs
}

export interface SRPlusHistory {
  visitorId: string;
  playerName: string;
  raidType: string;
  itemName: string;
  action: "picked" | "incremented" | "won" | "changed" | "admin_edit";
  previousValue: number;
  newValue: number;
  logId?: string;              // If from log processing
  adminNote?: string;          // If admin edit
  adminId?: string;            // Admin who made the edit
  timestamp: number;
}

export interface SRPlusAdminLog {
  adminId: string;
  adminName?: string;
  action: string;
  targetPlayer: string;
  targetRaidType: string;
  targetItem?: string;
  previousValue: any;
  newValue: any;
  note?: string;
  description: string;         // Human-readable description
  timestamp: number;
}

interface Settings {
  bonusPerSR: number;
  hardReserveThreshold: number;
}

// Format action into human-readable description
function formatAdminLogDescription(
  action: string,
  targetPlayer: string,
  targetRaidType: string,
  targetItem: string | undefined,
  previousValue: any,
  newValue: any,
  adminName?: string
): string {
  const admin = adminName || "Admin";

  switch (action) {
    case "set_player_sr":
      return `${admin} set ${targetPlayer}'s SR+ to "${targetItem}" for ${targetRaidType}`;
    case "changed_player_sr":
      return `${admin} changed ${targetPlayer}'s SR+ from "${previousValue}" to "${targetItem}" for ${targetRaidType}`;
    case "manual_adjustment":
      return `${admin} adjusted ${targetPlayer}'s raid count for "${targetItem}" (${targetRaidType}): ${previousValue} -> ${newValue}`;
    case "removed_entry":
      return `${admin} removed ${targetPlayer}'s SR+ entry for "${targetItem}" (${targetRaidType}) - had ${previousValue} raids`;
    case "cleanup_old_tables":
      return `${admin} cleaned up legacy database tables (${previousValue?.total || 0} records removed)`;
    default:
      return `${admin} performed ${action} on ${targetPlayer} for ${targetRaidType}`;
  }
}

// Get settings from KV
async function getSettings(kv: Deno.Kv): Promise<Settings> {
  const settings = await kv.get<Settings>(["sr_plus", "settings"]);
  return settings.value || {
    bonusPerSR: 20,
    hardReserveThreshold: 5,
  };
}

// Log to history (audit trail)
async function logHistory(kv: Deno.Kv, history: Omit<SRPlusHistory, "timestamp">): Promise<void> {
  const timestamp = Date.now();
  await kv.set(["sr_plus", "history", history.visitorId, timestamp], {
    ...history,
    timestamp,
  });
}

// Log admin action (immutable) with human-readable description
async function logAdminAction(kv: Deno.Kv, log: Omit<SRPlusAdminLog, "timestamp" | "description">): Promise<void> {
  const timestamp = Date.now();
  const description = formatAdminLogDescription(
    log.action,
    log.targetPlayer,
    log.targetRaidType,
    log.targetItem,
    log.previousValue,
    log.newValue,
    log.adminName
  );

  await kv.set(["sr_plus", "admin_log", timestamp], {
    ...log,
    description,
    timestamp,
  });
}

function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("admin_auth=true");
}

export const handler: Handlers = {
  // GET - List all entries or filter by raidType
  async GET(req) {
    const url = new URL(req.url);
    const raidType = url.searchParams.get("raidType");
    const requestedVisitorId = url.searchParams.get("visitorId");
    const includeHistory = url.searchParams.get("includeHistory") === "true";
    const isAdminUser = isAdmin(req);

    // Security: Get the current user's session
    const session = await getSession(req);

    // Determine what visitorId to filter by with security checks
    let visitorId: string | null = null;

    // Check if the requested visitorId is valid (not undefined/null string)
    const isValidVisitorId = requestedVisitorId &&
                             requestedVisitorId !== "undefined" &&
                             requestedVisitorId !== "null" &&
                             requestedVisitorId.length > 0;

    if (isValidVisitorId) {
      // A specific visitorId was requested - validate access
      if (isAdminUser) {
        // Admins can view any user's entries
        visitorId = requestedVisitorId;
      } else if (session && session.discordId === requestedVisitorId) {
        // Users can only view their own entries by visitorId
        visitorId = requestedVisitorId;
      } else if (session) {
        // User trying to access someone else's entries via visitorId - force their own
        console.warn(`[Security] User ${session.discordId} tried to access entries for ${requestedVisitorId}`);
        visitorId = session.discordId;
      } else {
        // Not logged in but requesting specific visitorId - deny (return empty)
        // This prevents unauthenticated access to specific user data
        visitorId = "__none__"; // Will match nothing
      }
    } else if (requestedVisitorId && !isValidVisitorId) {
      // Invalid visitorId was passed (like "undefined" or "null")
      // This is likely a bug on the client side - return empty to be safe
      if (session) {
        // If they have a session, give them their own data
        visitorId = session.discordId;
      } else {
        // No session + invalid visitorId = return empty
        visitorId = "__none__";
      }
    } else if (!raidType && session) {
      // No visitorId and no raidType = personal data request, use session
      visitorId = session.discordId;
    } else if (!raidType && !session) {
      // No visitorId, no raidType, no session = return empty (can't determine what to show)
      visitorId = "__none__";
    }
    // If raidType is set but no valid visitorId, we return all entries for that raid (guild view)

    const kv = await Deno.openKv(DB_PATH);
    const settings = await getSettings(kv);

    try {
      const entries: (SRPlusEntry & { isHardReserve: boolean })[] = [];

      // Build prefix for query
      const prefix: (string)[] = ["sr_plus", "entries"];
      if (raidType) prefix.push(raidType);
      if (visitorId) prefix.push(visitorId);

      const iter = kv.list<SRPlusEntry>({ prefix });
      for await (const entry of iter) {
        const data = entry.value;
        entries.push({
          ...data,
          currentBonus: data.timesSRd * settings.bonusPerSR,
          isHardReserve: data.timesSRd >= settings.hardReserveThreshold,
        });
      }

      // Optionally include history (only for valid visitorId)
      let history: SRPlusHistory[] = [];
      if (includeHistory && visitorId && visitorId !== "__none__") {
        const historyIter = kv.list<SRPlusHistory>({ prefix: ["sr_plus", "history", visitorId] });
        for await (const entry of historyIter) {
          history.push(entry.value);
        }
        history.sort((a, b) => b.timestamp - a.timestamp);
      }

      kv.close();

      return new Response(JSON.stringify({
        entries,
        history: includeHistory ? history : undefined,
        settings: {
          bonusPerSR: settings.bonusPerSR,
          hardReserveThreshold: settings.hardReserveThreshold,
        }
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      kv.close();
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // POST - Create or update an SR+ entry (user picks item)
  async POST(req) {
    const session = await getSession(req);
    const isAdminUser = isAdmin(req);

    // Must be logged in OR be admin
    if (!session && !isAdminUser) {
      return new Response(JSON.stringify({ error: "Unauthorized - must be logged in" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { raidType, itemName, itemId, playerName, visitorId: bodyVisitorId } = body;

      // Validate required fields
      if (!raidType || !itemName) {
        return new Response(JSON.stringify({ error: "raidType and itemName are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Determine visitorId and playerName
      let visitorId: string;
      let finalPlayerName: string;

      if (isAdminUser && bodyVisitorId) {
        // Admin can set entries for any user
        visitorId = bodyVisitorId;
        finalPlayerName = playerName || "Unknown";
      } else if (session) {
        // Regular user - use their session (discordId is the visitorId)
        visitorId = session.discordId;
        finalPlayerName = playerName || session.characters?.[0] || session.discordDisplayName || session.discordUsername || "Unknown";
      } else {
        return new Response(JSON.stringify({ error: "Could not determine user" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);
      const settings = await getSettings(kv);

      // Check if user already has an entry for this raid type
      const existingKey = ["sr_plus", "entries", raidType, visitorId];
      const existing = await kv.get<SRPlusEntry>(existingKey);

      const now = Date.now();
      let action: SRPlusHistory["action"] = "picked";
      let previousValue = 0;

      if (existing.value) {
        // User is changing their SR+ item - reset count
        action = "changed";
        previousValue = existing.value.timesSRd;
      }

      const newEntry: SRPlusEntry = {
        visitorId,
        playerName: finalPlayerName,
        raidType,
        itemName,
        itemId: itemId || undefined,
        timesSRd: 0, // Reset on new pick
        currentBonus: 0,
        pickedAt: now,
        lastIncrementedAt: undefined,
        lastProcessedLogId: undefined,
      };

      // Save entry
      await kv.set(existingKey, newEntry);

      // Log to history
      await logHistory(kv, {
        visitorId,
        playerName: finalPlayerName,
        raidType,
        itemName,
        action,
        previousValue,
        newValue: 0,
        adminNote: isAdminUser && !session ? "Set by admin" : undefined,
        adminId: isAdminUser && !session ? "admin" : undefined,
      });

      // If admin action, also log to admin log
      if (isAdminUser && bodyVisitorId) {
        await logAdminAction(kv, {
          adminId: session?.discordId || "admin",
          adminName: session?.discordDisplayName || session?.discordUsername,
          action: action === "changed" ? "changed_player_sr" : "set_player_sr",
          targetPlayer: finalPlayerName,
          targetRaidType: raidType,
          targetItem: itemName,
          previousValue: existing.value?.itemName || null,
          newValue: itemName,
        });
      }

      kv.close();

      return new Response(JSON.stringify({
        success: true,
        entry: {
          ...newEntry,
          isHardReserve: false,
        }
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

  // PUT - Admin increment/decrement or manual adjustment
  async PUT(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { raidType, visitorId, adjustment, note, setTimesSRd } = body;

      if (!raidType || !visitorId) {
        return new Response(JSON.stringify({ error: "raidType and visitorId are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await Deno.openKv(DB_PATH);
      const settings = await getSettings(kv);

      const key = ["sr_plus", "entries", raidType, visitorId];
      const existing = await kv.get<SRPlusEntry>(key);

      if (!existing.value) {
        kv.close();
        return new Response(JSON.stringify({ error: "Entry not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const entry = existing.value;
      const previousValue = entry.timesSRd;
      let newTimesSRd: number;

      if (typeof setTimesSRd === "number") {
        // Direct set
        newTimesSRd = Math.max(0, setTimesSRd);
      } else if (typeof adjustment === "number") {
        // Relative adjustment
        newTimesSRd = Math.max(0, entry.timesSRd + adjustment);
      } else {
        kv.close();
        return new Response(JSON.stringify({ error: "Either adjustment or setTimesSRd is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updatedEntry: SRPlusEntry = {
        ...entry,
        timesSRd: newTimesSRd,
        currentBonus: newTimesSRd * settings.bonusPerSR,
        lastIncrementedAt: Date.now(),
      };

      await kv.set(key, updatedEntry);

      // Log to history
      await logHistory(kv, {
        visitorId,
        playerName: entry.playerName,
        raidType,
        itemName: entry.itemName,
        action: "admin_edit",
        previousValue,
        newValue: newTimesSRd,
        adminNote: note,
        adminId: "admin",
      });

      // Log to admin log with improved detail
      const session = await getSession(req);
      await logAdminAction(kv, {
        adminId: session?.discordId || "admin",
        adminName: session?.discordDisplayName || session?.discordUsername,
        action: "manual_adjustment",
        targetPlayer: entry.playerName,
        targetRaidType: raidType,
        targetItem: entry.itemName,
        previousValue,
        newValue: newTimesSRd,
        note,
      });

      kv.close();

      return new Response(JSON.stringify({
        success: true,
        entry: {
          ...updatedEntry,
          isHardReserve: newTimesSRd >= settings.hardReserveThreshold,
        }
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

  // DELETE - Remove an SR+ entry (user clears or admin removes)
  async DELETE(req) {
    const session = await getSession(req);
    const isAdminUser = isAdmin(req);

    if (!session && !isAdminUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const raidType = url.searchParams.get("raidType");
    const visitorId = url.searchParams.get("visitorId");
    const reason = url.searchParams.get("reason") || "cleared";

    if (!raidType) {
      return new Response(JSON.stringify({ error: "raidType is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine which user's entry to delete
    let targetVisitorId: string;
    if (isAdminUser && visitorId) {
      targetVisitorId = visitorId;
    } else if (session) {
      // Use discordId as the visitorId
      targetVisitorId = session.discordId;
    } else {
      return new Response(JSON.stringify({ error: "Could not determine user" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await Deno.openKv(DB_PATH);

    try {
      const key = ["sr_plus", "entries", raidType, targetVisitorId];
      const existing = await kv.get<SRPlusEntry>(key);

      if (!existing.value) {
        kv.close();
        return new Response(JSON.stringify({ error: "Entry not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const entry = existing.value;

      // Log to history before deleting
      await logHistory(kv, {
        visitorId: targetVisitorId,
        playerName: entry.playerName,
        raidType,
        itemName: entry.itemName,
        action: reason === "won" ? "won" : "changed",
        previousValue: entry.timesSRd,
        newValue: 0,
        adminNote: isAdminUser && visitorId ? `Removed by admin: ${reason}` : undefined,
        adminId: isAdminUser ? "admin" : undefined,
      });

      // If admin removing another user's entry, log it with good detail
      if (isAdminUser && visitorId) {
        await logAdminAction(kv, {
          adminId: session?.discordId || "admin",
          adminName: session?.discordDisplayName || session?.discordUsername,
          action: "removed_entry",
          targetPlayer: entry.playerName,
          targetRaidType: raidType,
          targetItem: entry.itemName,
          previousValue: entry.timesSRd,
          newValue: null,
          note: reason,
        });
      }

      // Delete the entry
      await kv.delete(key);
      kv.close();

      return new Response(JSON.stringify({
        success: true,
        message: `SR+ entry for ${entry.itemName} in ${raidType} has been removed`
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      kv.close();
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

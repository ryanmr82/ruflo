// /routes/api/guild-bank/inventory.ts
// API endpoint for guild bank inventory data
// Receives JSON payload from AH_and_VaultSyncTray.exe after guild bank scan
// Stores in Deno KV under ["guild-bank", "inventory"]
// TIMESTAMP GUARD: only overwrites if incoming scanTime is newer than stored.

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const INVENTORY_KEY = ["guild-bank", "inventory"];
const HISTORY_KEY = ["guild-bank", "history"];

export const handler: Handlers = {
  // GET: Retrieve current guild bank inventory
  async GET(_req) {
    try {
      const result = await kv.get(INVENTORY_KEY);
      if (!result.value) {
        return new Response(JSON.stringify({
          error: "No guild bank data available",
          message: "Guild bank has not been scanned yet"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(result.value), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // PUT: Upload guild bank inventory from tray app
  async PUT(req) {
    try {
      const body = await req.json();

      // Validate required fields
      if (!body.guildName || !body.scanTime) {
        return new Response(JSON.stringify({
          error: "guildName and scanTime are required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!body.tabs || !Array.isArray(body.tabs)) {
        return new Response(JSON.stringify({
          error: "tabs array is required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // --- Timestamp guard: only overwrite if incoming data is newer ---
      const existingResult = await kv.get(INVENTORY_KEY);
      const existing = existingResult.value as { scanTime?: string } | null;

      if (existing?.scanTime && body.scanTime) {
        if (body.scanTime <= existing.scanTime) {
          return new Response(JSON.stringify({
            success: true,
            skipped: true,
            message: "Existing data is newer or same age — not overwritten",
            existingScanTime: existing.scanTime,
            incomingScanTime: body.scanTime,
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      const uploadedAt = new Date().toISOString();

      // Build the inventory record
      const inventory = {
        exportVersion: body.exportVersion || "1.0",
        scanTime: body.scanTime,
        guildName: body.guildName,
        account: body.account || "unknown",
        totalItems: body.totalItems || 0,
        uniqueItems: body.uniqueItems || 0,
        tabs: body.tabs,
        summary: body.summary || [],
        uploadedAt,
        source: body.source || "AH_and_VaultSync",
      };

      // Store current inventory
      await kv.set(INVENTORY_KEY, inventory);

      // Store in history (keep last scan time as key for dedup)
      const historyKey = [...HISTORY_KEY, body.scanTime];
      await kv.set(historyKey, {
        scanTime: body.scanTime,
        uploadedAt,
        totalItems: body.totalItems || 0,
        uniqueItems: body.uniqueItems || 0,
        tabCount: body.tabs.length,
      });

      return new Response(JSON.stringify({
        success: true,
        uploadedAt,
        totalItems: body.totalItems || 0,
        uniqueItems: body.uniqueItems || 0,
        tabCount: body.tabs.length,
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};

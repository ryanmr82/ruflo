import { Handlers } from "$fresh/server.ts";

const DB_PATH = "/home/opc/tbc-website/data.db";

export interface SRPlusSettings {
  bonusPerSR: number;           // Default: 20
  hardReserveThreshold: number; // Default: 5 (after 5 SRs, considered hard reserve)
  require24hSignup: boolean;    // Require 24h advance signup for eligibility
  allowPlayerSelfService: boolean; // Allow players to manage their own SRs
  lockSRBeforeRaid: number;     // Hours before raid to lock SR changes
}

const DEFAULT_SETTINGS: SRPlusSettings = {
  bonusPerSR: 20,
  hardReserveThreshold: 5,
  require24hSignup: true,
  allowPlayerSelfService: false, // Phase 2+ feature
  lockSRBeforeRaid: 2,
};

function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("admin_auth=true");
}

export const handler: Handlers = {
  // GET - Retrieve current settings (no auth required for read)
  async GET(_req) {
    const kv = await Deno.openKv(DB_PATH);
    const entry = await kv.get(["sr_plus", "settings"]);
    kv.close();

    const settings = entry.value as SRPlusSettings || DEFAULT_SETTINGS;
    return new Response(JSON.stringify(settings), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // PUT - Update settings (admin only)
  async PUT(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const kv = await Deno.openKv(DB_PATH);

      // Get current settings
      const entry = await kv.get(["sr_plus", "settings"]);
      const current = entry.value as SRPlusSettings || DEFAULT_SETTINGS;

      // Merge with updates
      const updated: SRPlusSettings = {
        ...current,
        ...body,
      };

      // Validate
      if (typeof updated.bonusPerSR !== "number" || updated.bonusPerSR < 0) {
        kv.close();
        return new Response(JSON.stringify({ error: "Invalid bonusPerSR value" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await kv.set(["sr_plus", "settings"], updated);
      kv.close();

      return new Response(JSON.stringify({ success: true, settings: updated }), {
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

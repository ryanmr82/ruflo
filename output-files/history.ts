import { Handlers } from "$fresh/server.ts";
import { SRPlusHistory, SRPlusAdminLog } from "./entries.ts";

/**
 * SR+ History API - View audit trails and admin logs
 */

const DB_PATH = "/home/opc/tbc-website/data.db";

function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("admin_auth=true");
}

export const handler: Handlers = {
  // GET - Retrieve history and/or admin logs
  async GET(req) {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "history"; // "history" | "admin_log" | "both"
    const visitorId = url.searchParams.get("visitorId");
    const raidType = url.searchParams.get("raidType");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Admin logs require admin access
    if ((type === "admin_log" || type === "both") && !isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Admin access required for admin logs" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await Deno.openKv(DB_PATH);

    try {
      const result: {
        history?: SRPlusHistory[];
        adminLogs?: SRPlusAdminLog[];
        total?: { history: number; adminLogs: number };
      } = {};

      // Fetch history
      if (type === "history" || type === "both") {
        const history: SRPlusHistory[] = [];

        // Build prefix
        const prefix: string[] = ["sr_plus", "history"];
        if (visitorId) prefix.push(visitorId);

        const iter = kv.list<SRPlusHistory>({ prefix });
        for await (const entry of iter) {
          const data = entry.value;

          // Filter by raidType if specified
          if (raidType && data.raidType !== raidType) continue;

          history.push(data);
        }

        // Sort by timestamp descending (newest first)
        history.sort((a, b) => b.timestamp - a.timestamp);

        result.history = history.slice(offset, offset + limit);
        result.total = { ...result.total, history: history.length } as any;
      }

      // Fetch admin logs (admin only)
      if (type === "admin_log" || type === "both") {
        const adminLogs: SRPlusAdminLog[] = [];

        const iter = kv.list<SRPlusAdminLog>({ prefix: ["sr_plus", "admin_log"] });
        for await (const entry of iter) {
          const data = entry.value;

          // Filter by raidType if specified
          if (raidType && data.targetRaidType !== raidType) continue;

          // Filter by target player (visitorId as playerName match)
          if (visitorId && !data.targetPlayer.toLowerCase().includes(visitorId.toLowerCase())) continue;

          adminLogs.push(data);
        }

        // Sort by timestamp descending
        adminLogs.sort((a, b) => b.timestamp - a.timestamp);

        result.adminLogs = adminLogs.slice(offset, offset + limit);
        result.total = { ...result.total, adminLogs: adminLogs.length } as any;
      }

      kv.close();

      return new Response(JSON.stringify(result), {
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

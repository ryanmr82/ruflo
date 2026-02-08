import { Handlers } from "$fresh/server.ts";

/**
 * SR+ Cleanup API - Admin endpoint to clean up old broken tables
 *
 * Tables to clean:
 * - ["sr_picks", ...] - Old picks format (test data)
 * - ["sr_plus", "credits", ...] - Old broken credits system
 * - ["sr_plus", "runs", ...] - Unused manual runs system
 */

const DB_PATH = "/home/opc/tbc-website/data.db";

function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("admin_auth=true");
}

interface CleanupStats {
  sr_picks: number;
  sr_plus_credits: number;
  sr_plus_runs: number;
  total: number;
}

export const handler: Handlers = {
  // GET - Preview what will be deleted (dry run)
  async GET(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await Deno.openKv(DB_PATH);

    try {
      const stats: CleanupStats = {
        sr_picks: 0,
        sr_plus_credits: 0,
        sr_plus_runs: 0,
        total: 0,
      };

      const samples: {
        sr_picks: any[];
        sr_plus_credits: any[];
        sr_plus_runs: any[];
      } = {
        sr_picks: [],
        sr_plus_credits: [],
        sr_plus_runs: [],
      };

      // Count sr_picks
      const picksIter = kv.list({ prefix: ["sr_picks"] });
      for await (const entry of picksIter) {
        stats.sr_picks++;
        if (samples.sr_picks.length < 3) {
          samples.sr_picks.push({
            key: entry.key,
            value: entry.value,
          });
        }
      }

      // Count sr_plus/credits
      const creditsIter = kv.list({ prefix: ["sr_plus", "credits"] });
      for await (const entry of creditsIter) {
        stats.sr_plus_credits++;
        if (samples.sr_plus_credits.length < 3) {
          samples.sr_plus_credits.push({
            key: entry.key,
            value: entry.value,
          });
        }
      }

      // Count sr_plus/runs
      const runsIter = kv.list({ prefix: ["sr_plus", "runs"] });
      for await (const entry of runsIter) {
        stats.sr_plus_runs++;
        if (samples.sr_plus_runs.length < 3) {
          samples.sr_plus_runs.push({
            key: entry.key,
            value: entry.value,
          });
        }
      }

      stats.total = stats.sr_picks + stats.sr_plus_credits + stats.sr_plus_runs;
      kv.close();

      return new Response(JSON.stringify({
        message: "Dry run - no data deleted",
        stats,
        samples,
        warning: "Use POST to actually delete these records",
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

  // POST - Actually delete the old tables
  async POST(req) {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const confirm = url.searchParams.get("confirm");

    if (confirm !== "yes") {
      return new Response(JSON.stringify({
        error: "Must confirm deletion",
        hint: "Add ?confirm=yes to the URL to proceed",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await Deno.openKv(DB_PATH);

    try {
      const stats: CleanupStats = {
        sr_picks: 0,
        sr_plus_credits: 0,
        sr_plus_runs: 0,
        total: 0,
      };

      // Delete sr_picks
      const picksIter = kv.list({ prefix: ["sr_picks"] });
      for await (const entry of picksIter) {
        await kv.delete(entry.key);
        stats.sr_picks++;
      }

      // Delete sr_plus/credits
      const creditsIter = kv.list({ prefix: ["sr_plus", "credits"] });
      for await (const entry of creditsIter) {
        await kv.delete(entry.key);
        stats.sr_plus_credits++;
      }

      // Delete sr_plus/runs
      const runsIter = kv.list({ prefix: ["sr_plus", "runs"] });
      for await (const entry of runsIter) {
        await kv.delete(entry.key);
        stats.sr_plus_runs++;
      }

      stats.total = stats.sr_picks + stats.sr_plus_credits + stats.sr_plus_runs;

      // Log this cleanup action to admin log
      const timestamp = Date.now();
      await kv.set(["sr_plus", "admin_log", timestamp], {
        adminId: "admin",
        action: "cleanup_old_tables",
        targetPlayer: "N/A",
        targetRaidType: "N/A",
        previousValue: stats,
        newValue: null,
        note: "Cleaned up legacy sr_picks, sr_plus/credits, and sr_plus/runs tables",
        timestamp,
      });

      kv.close();

      return new Response(JSON.stringify({
        success: true,
        message: "Old tables cleaned up successfully",
        stats,
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

import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";
import AttendanceTabs from "../islands/AttendanceTabs.tsx";

interface PlayerStat {
  name: string;
  class?: string;
}

interface CombatLog {
  id: string;
  raidType: string;
  raidName: string;
  uploadedAt: string;
  playerStats: PlayerStat[];
}

interface PlayerStats {
  playerName: string;
  raidsAttended: number;
  raidTypes: string[];
  lastRaid: string;
  lastRaidDate: string;
}

interface RaidSummary {
  id: string;
  raidName: string;
  raidType: string;
  date: string;
  playerCount: number;
  players: string[];
}

interface PageData {
  stats: PlayerStats[];
  raids: RaidSummary[];
  totalRaids: number;
  totalPlayers: number;
  avgRaidSize: number;
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    try {
      const kv = await Deno.openKv("/home/opc/tbc-website/data.db");

      // Get all combat logs (same source as analysis page)
      const logs: CombatLog[] = [];
      for await (const entry of kv.list<CombatLog>({ prefix: ["combat_logs"] })) {
        logs.push(entry.value);
      }

      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      // Build player stats from combat logs
      const playerMap = new Map<string, { raidsAttended: number; raidTypes: Set<string>; lastRaid: string; lastRaidDate: string }>();

      for (const log of logs) {
        const players = log.playerStats || [];
        const logDate = log.uploadedAt ? new Date(log.uploadedAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }) : "Unknown";

        for (const player of players) {
          const name = player.name;
          const existing = playerMap.get(name);
          if (existing) {
            existing.raidsAttended++;
            existing.raidTypes.add(log.raidType || "Unknown");
          } else {
            playerMap.set(name, {
              raidsAttended: 1,
              raidTypes: new Set([log.raidType || "Unknown"]),
              lastRaid: log.raidName,
              lastRaidDate: logDate,
            });
          }
        }
      }

      // Convert to array
      const stats: PlayerStats[] = Array.from(playerMap.entries())
        .map(([name, p]) => ({
          playerName: name,
          raidsAttended: p.raidsAttended,
          raidTypes: Array.from(p.raidTypes),
          lastRaid: p.lastRaid,
          lastRaidDate: p.lastRaidDate,
        }))
        .sort((a, b) => b.raidsAttended - a.raidsAttended);

      // Build raid summaries with player names
      const raids: RaidSummary[] = logs.map(log => ({
        id: log.id,
        raidName: log.raidName,
        raidType: log.raidType || "Unknown",
        date: log.uploadedAt ? new Date(log.uploadedAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }) : "Unknown",
        playerCount: log.playerStats?.length || 0,
        players: (log.playerStats || []).map(p => p.name).sort(),
      }));

      const totalPlayers = stats.length;
      const avgRaidSize = logs.length > 0 ? Math.round(raids.reduce((acc, r) => acc + r.playerCount, 0) / logs.length) : 0;

      kv.close();
      return ctx.render({ stats, raids, totalRaids: logs.length, totalPlayers, avgRaidSize });
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      return ctx.render({ stats: [], raids: [], totalRaids: 0, totalPlayers: 0, avgRaidSize: 0, error: error.message });
    }
  },
};

export default function Attendance({ data }: PageProps<PageData>) {
  const { stats, raids, totalRaids, totalPlayers, avgRaidSize, error } = data;

  return (
    <>
      <Head>
        <title>Attendance - Thralls Book Club</title>
      </Head>
      <Nav active="attendance" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Raid Attendance</h1>
          <p class="page-subtitle">Player attendance from combat logs</p>
        </div>

        {error && (
          <div class="alert alert-error mb-3">Failed to load: {error}</div>
        )}

        <AttendanceTabs
          stats={stats}
          raids={raids}
          totalRaids={totalRaids}
          totalPlayers={totalPlayers}
          avgRaidSize={avgRaidSize}
        />
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

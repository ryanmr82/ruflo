import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";

interface CombatLog {
  id: string;
  raidType: string;
  raidName: string;
  uploadedAt: string;
  playerStats: Array<{ name: string; class?: string }>;
}

interface PlayerStats {
  playerName: string;
  raidsAttended: number;
  raidTypes: Set<string>;
  lastRaid: string;
  lastRaidDate: string;
}

interface RaidRecord {
  id: string;
  raidName: string;
  raidType: string;
  date: string;
  playerCount: number;
}

interface PageData {
  playerStats: Array<{
    playerName: string;
    raidsAttended: number;
    raidTypes: string[];
    lastRaid: string;
    lastRaidDate: string;
  }>;
  raids: RaidRecord[];
  totalRaids: number;
  totalPlayers: number;
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    try {
      const kv = await Deno.openKv();

      // Get all combat logs
      const logs: CombatLog[] = [];
      for await (const entry of kv.list<CombatLog>({ prefix: ["combat_logs"] })) {
        logs.push(entry.value);
      }

      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      // Build player stats from combat logs
      const playerMap = new Map<string, PlayerStats>();

      for (const log of logs) {
        const players = log.playerStats || [];
        const logDate = log.uploadedAt ? new Date(log.uploadedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) : "Unknown";

        for (const player of players) {
          const name = player.name;
          const existing = playerMap.get(name);

          if (existing) {
            existing.raidsAttended++;
            existing.raidTypes.add(log.raidType || "Unknown");
          } else {
            playerMap.set(name, {
              playerName: name,
              raidsAttended: 1,
              raidTypes: new Set([log.raidType || "Unknown"]),
              lastRaid: log.raidName,
              lastRaidDate: logDate,
            });
          }
        }
      }

      // Convert to array and sort by raids attended
      const playerStats = Array.from(playerMap.values())
        .map(p => ({
          ...p,
          raidTypes: Array.from(p.raidTypes),
        }))
        .sort((a, b) => b.raidsAttended - a.raidsAttended);

      // Build raid records
      const raids: RaidRecord[] = logs.map(log => ({
        id: log.id,
        raidName: log.raidName,
        raidType: log.raidType || "Unknown",
        date: log.uploadedAt ? new Date(log.uploadedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) : "Unknown",
        playerCount: log.playerStats?.length || 0,
      }));

      kv.close();

      return ctx.render({
        playerStats,
        raids,
        totalRaids: logs.length,
        totalPlayers: playerStats.length,
      });
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      return ctx.render({
        playerStats: [],
        raids: [],
        totalRaids: 0,
        totalPlayers: 0,
        error: error.message,
      });
    }
  },
};

function getRaidTypeColor(raidType: string): string {
  const colors: Record<string, string> = {
    MC: "#ff7d0a",
    BWL: "#c41e3a",
    AQ40: "#a330c9",
    AQ20: "#a330c9",
    ZG: "#00ff96",
    NAXX: "#0070de",
    ONY: "#c79c6e",
    EMERALD: "#1eff00",
    KARA10: "#f58cba",
    KARA40: "#f58cba",
  };
  return colors[raidType] || "var(--text-secondary)";
}

export default function Attendance({ data }: PageProps<PageData>) {
  const { playerStats, raids, totalRaids, totalPlayers, error } = data;

  return (
    <>
      <Head>
        <title>Attendance - Thralls Book Club</title>
      </Head>
      <Nav active="attendance" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Raid Attendance</h1>
          <p class="page-subtitle">Player attendance from uploaded combat logs</p>
        </div>

        {error && (
          <div class="alert alert-error mb-3">
            Failed to load attendance data: {error}
          </div>
        )}

        {/* Summary Stats */}
        <div class="grid grid-3 mb-3">
          <div class="card stat-card">
            <div class="stat-value">{totalRaids}</div>
            <div class="stat-label">Raids Logged</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">{totalPlayers}</div>
            <div class="stat-label">Unique Raiders</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">
              {totalRaids > 0 ? Math.round(raids.reduce((acc, r) => acc + r.playerCount, 0) / totalRaids) : 0}
            </div>
            <div class="stat-label">Avg Raid Size</div>
          </div>
        </div>

        {/* Raids List */}
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Logged Raids</h2>
            <span class="card-badge badge-blue">{raids.length} raids</span>
          </div>

          {raids.length === 0 ? (
            <div class="text-center" style="padding: 32px; color: var(--text-tertiary);">
              <p>No combat logs uploaded yet.</p>
              <p style="font-size: 14px; margin-top: 8px;">
                <a href="/logs" style="color: var(--apple-blue);">Upload a combat log</a> to start tracking attendance.
              </p>
            </div>
          ) : (
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Raid</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Players</th>
                  </tr>
                </thead>
                <tbody>
                  {raids.map((raid) => (
                    <tr key={raid.id}>
                      <td>
                        <a href={`/analysis?log=${raid.id}`} style="color: var(--text-primary); text-decoration: none; font-weight: 500;">
                          {raid.raidName}
                        </a>
                      </td>
                      <td>
                        <span style={`color: ${getRaidTypeColor(raid.raidType)}; font-weight: 500;`}>
                          {raid.raidType}
                        </span>
                      </td>
                      <td style="color: var(--text-secondary);">{raid.date}</td>
                      <td>{raid.playerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Player Leaderboard */}
        <div class="card mt-3">
          <div class="card-header">
            <h2 class="card-title">Raider Leaderboard</h2>
            <span class="card-badge badge-green">{playerStats.length} players</span>
          </div>

          {playerStats.length === 0 ? (
            <div class="text-center" style="padding: 32px; color: var(--text-tertiary);">
              <p>No attendance records yet.</p>
            </div>
          ) : (
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Raids</th>
                    <th>Raid Types</th>
                    <th>Last Raid</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.slice(0, 100).map((player, idx) => (
                    <tr key={player.playerName}>
                      <td style="color: var(--text-tertiary); width: 40px;">
                        {idx + 1}
                      </td>
                      <td style="font-weight: 500;">
                        {player.playerName}
                      </td>
                      <td>
                        <span style={`color: ${player.raidsAttended >= 10 ? 'var(--apple-green)' : player.raidsAttended >= 5 ? 'var(--apple-blue)' : 'var(--text-primary)'};`}>
                          {player.raidsAttended}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                          {player.raidTypes.map(rt => (
                            <span
                              key={rt}
                              style={`
                                font-size: 11px;
                                padding: 2px 6px;
                                border-radius: 4px;
                                background: ${getRaidTypeColor(rt)}22;
                                color: ${getRaidTypeColor(rt)};
                                font-weight: 500;
                              `}
                            >
                              {rt}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 13px;">
                        {player.lastRaidDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

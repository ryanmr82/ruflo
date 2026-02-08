import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";

interface AttendanceRecord {
  id: string;
  raidId: string;
  raidTitle: string;
  raidDate: number;
  playerName: string;
  playerClass?: string;
  playerSpec?: string;
  signupTime?: number;
  srPlusEligible: boolean;
  attended: boolean;
  savedAt: number;
  savedBy: string;
}

interface PlayerStats {
  playerName: string;
  raidsAttended: number;
  raidsSignedUp: number;
  srPlusCount: number;
  attendanceRate: number;
  srPlusRate: number;
}

interface RaidSummary {
  raidId: string;
  raidTitle: string;
  raidDate: number;
  totalSignups: number;
  srPlusEligible: number;
  savedAt: number;
  savedBy: string;
}

interface PageData {
  stats: PlayerStats[];
  recentRaids: RaidSummary[];
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    try {
      const kv = await Deno.openKv();

      // Get player stats from attendance records
      const playerStats = new Map<string, { attended: number; total: number; srPlus: number; className?: string }>();

      const attendanceIter = kv.list<AttendanceRecord>({ prefix: ["attendance"] });
      for await (const entry of attendanceIter) {
        const record = entry.value;
        const stats = playerStats.get(record.playerName) || { attended: 0, total: 0, srPlus: 0 };
        stats.total++;
        if (record.attended) stats.attended++;
        if (record.srPlusEligible) stats.srPlus++;
        if (record.playerClass) stats.className = record.playerClass;
        playerStats.set(record.playerName, stats);
      }

      const stats: PlayerStats[] = Array.from(playerStats.entries()).map(([name, s]) => ({
        playerName: name,
        raidsAttended: s.attended,
        raidsSignedUp: s.total,
        srPlusCount: s.srPlus,
        attendanceRate: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
        srPlusRate: s.total > 0 ? Math.round((s.srPlus / s.total) * 100) : 0,
      })).sort((a, b) => b.raidsSignedUp - a.raidsSignedUp);

      // Get recent raid summaries
      const recentRaids: RaidSummary[] = [];
      const raidsIter = kv.list<RaidSummary>({ prefix: ["raids-saved"] });
      for await (const entry of raidsIter) {
        recentRaids.push(entry.value);
      }
      recentRaids.sort((a, b) => b.raidDate - a.raidDate);

      return ctx.render({ stats, recentRaids });
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      return ctx.render({ stats: [], recentRaids: [], error: error.message });
    }
  },
};

function getClassColor(className: string | undefined): string {
  if (!className) return "var(--text-primary)";
  const colors: Record<string, string> = {
    warrior: "#C79C6E",
    paladin: "#F58CBA",
    hunter: "#ABD473",
    rogue: "#FFF569",
    priest: "#FFFFFF",
    shaman: "#0070DE",
    mage: "#69CCF0",
    warlock: "#9482C9",
    druid: "#FF7D0A",
  };
  return colors[className.toLowerCase()] || "var(--text-primary)";
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Attendance({ data }: PageProps<PageData>) {
  const { stats, recentRaids, error } = data;

  return (
    <>
      <Head>
        <title>Attendance - Thralls Book Club</title>
      </Head>
      <Nav active="attendance" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Attendance Tracker</h1>
          <p class="page-subtitle">Historical raid attendance and SR+ eligibility</p>
        </div>

        {error && (
          <div class="alert alert-error mb-3">
            Failed to load attendance data: {error}
          </div>
        )}

        {/* Summary Stats */}
        <div class="grid grid-3 mb-3">
          <div class="card stat-card">
            <div class="stat-value">{recentRaids.length}</div>
            <div class="stat-label">Raids Tracked</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">{stats.length}</div>
            <div class="stat-label">Unique Raiders</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">
              {stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + s.srPlusRate, 0) / stats.length) : 0}%
            </div>
            <div class="stat-label">Avg SR+ Rate</div>
          </div>
        </div>

        {/* Recent Raids */}
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Saved Raids</h2>
            <span class="card-badge badge-blue">{recentRaids.length} raids</span>
          </div>

          {recentRaids.length === 0 ? (
            <div class="text-center" style="padding: 32px; color: var(--text-tertiary);">
              <p>No raids have been saved yet.</p>
              <p style="font-size: 14px; margin-top: 8px;">
                Go to a raid detail page and click "Save Attendance" to start tracking.
              </p>
            </div>
          ) : (
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Raid</th>
                    <th>Date</th>
                    <th>Signups</th>
                    <th>SR+ Eligible</th>
                    <th>Saved By</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRaids.map((raid) => (
                    <tr key={raid.raidId}>
                      <td style="font-weight: 500;">{raid.raidTitle}</td>
                      <td style="color: var(--text-secondary);">{formatDate(raid.raidDate)}</td>
                      <td>{raid.totalSignups}</td>
                      <td>
                        <span style="color: var(--apple-green);">{raid.srPlusEligible}</span>
                        <span style="color: var(--text-tertiary);"> ({Math.round((raid.srPlusEligible / raid.totalSignups) * 100)}%)</span>
                      </td>
                      <td style="color: var(--text-tertiary);">{raid.savedBy}</td>
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
            <h2 class="card-title">Raider Stats</h2>
            <span class="card-badge badge-green">{stats.length} players</span>
          </div>

          {stats.length === 0 ? (
            <div class="text-center" style="padding: 32px; color: var(--text-tertiary);">
              <p>No attendance records yet.</p>
            </div>
          ) : (
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Raids</th>
                    <th>Attendance</th>
                    <th>SR+ Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.slice(0, 50).map((player) => (
                    <tr key={player.playerName}>
                      <td>
                        <a
                          href={`/attendance/${encodeURIComponent(player.playerName)}`}
                          style="color: var(--text-primary); text-decoration: none; font-weight: 500;"
                        >
                          {player.playerName}
                        </a>
                      </td>
                      <td>{player.raidsSignedUp}</td>
                      <td>
                        <span style={`color: ${player.attendanceRate >= 80 ? 'var(--apple-green)' : player.attendanceRate >= 50 ? 'var(--apple-orange)' : 'var(--apple-red)'};`}>
                          {player.attendanceRate}%
                        </span>
                      </td>
                      <td>
                        <span style={`color: ${player.srPlusRate >= 80 ? 'var(--apple-green)' : player.srPlusRate >= 50 ? 'var(--apple-orange)' : 'var(--apple-yellow)'};`}>
                          {player.srPlusRate}%
                        </span>
                        <span style="color: var(--text-tertiary); font-size: 12px;"> ({player.srPlusCount}/{player.raidsSignedUp})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div class="card mt-3">
          <div class="card-header">
            <h2 class="card-title">How Attendance Tracking Works</h2>
          </div>
          <ol style="color: var(--text-secondary); padding-left: 20px;">
            <li class="mb-1">Raid leaders go to the raid detail page before the raid starts</li>
            <li class="mb-1">Click "Save Attendance" to snapshot the current signup list</li>
            <li class="mb-1">The system records who signed up and whether they were SR+ eligible (24h+)</li>
            <li>View historical stats here to track attendance patterns over time</li>
          </ol>
        </div>
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

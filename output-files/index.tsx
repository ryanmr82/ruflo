import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";

interface CombatLog {
  id: string;
  raidType: string;
  raidName: string;
  uploadedAt: string;
  playerStats: { name: string }[];
}

interface UpcomingRaid {
  id: string;
  title: string;
  startTime: number;
  signUpsAmount: number;
  leaderName?: string;
}

interface PageData {
  totalRaids: number;
  totalPlayers: number;
  recentRaids: { id: string; raidType: string; raidName: string; date: string; playerCount: number }[];
  raidTypeBreakdown: { type: string; count: number }[];
  upcomingRaids: UpcomingRaid[];
}

// Raid-Helper API credentials
const API_KEY = "84hOyEGqAqFowsToIDusYNBlQvXzXqmc1sWorhMj";
const SERVER_ID = "1039762365345976330";

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    try {
      const kv = await Deno.openKv("/home/opc/tbc-website/data.db");

      const logs: CombatLog[] = [];
      for await (const entry of kv.list<CombatLog>({ prefix: ["combat_logs"] })) {
        logs.push(entry.value);
      }

      logs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      // Get unique players
      const playerSet = new Set<string>();
      for (const log of logs) {
        for (const p of log.playerStats || []) {
          playerSet.add(p.name);
        }
      }

      // Recent raids
      const recentRaids = logs.slice(0, 5).map(log => ({
        id: log.id,
        raidType: log.raidType || "Unknown",
        raidName: log.raidName,
        date: log.uploadedAt ? new Date(log.uploadedAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric"
        }) : "Unknown",
        playerCount: log.playerStats?.length || 0,
      }));

      // Raid type breakdown
      const typeCount: Record<string, number> = {};
      for (const log of logs) {
        const t = log.raidType || "Unknown";
        typeCount[t] = (typeCount[t] || 0) + 1;
      }
      const raidTypeBreakdown = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      kv.close();

      // Fetch upcoming raids from Raid-Helper
      let upcomingRaids: UpcomingRaid[] = [];
      try {
        const response = await fetch(
          `https://raid-helper.dev/api/v2/servers/${SERVER_ID}/events`,
          {
            headers: {
              "Authorization": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const now = Math.floor(Date.now() / 1000);
          upcomingRaids = (data.postedEvents || [])
            .filter((e: any) => e.startTime > now)
            .map((e: any) => ({
              id: e.id,
              title: e.title || "Raid",
              startTime: e.startTime,
              signUpsAmount: e.signUpsAmount || 0,
              leaderName: e.leaderName,
            }))
            .sort((a: UpcomingRaid, b: UpcomingRaid) => a.startTime - b.startTime)
            .slice(0, 4);
        }
      } catch (e) {
        console.error("Failed to fetch upcoming raids:", e);
      }

      return ctx.render({ totalRaids: logs.length, totalPlayers: playerSet.size, recentRaids, raidTypeBreakdown, upcomingRaids });
    } catch (e) {
      console.error("Homepage data error:", e);
      return ctx.render({ totalRaids: 0, totalPlayers: 0, recentRaids: [], raidTypeBreakdown: [], upcomingRaids: [] });
    }
  },
};

function getRaidTypeColor(raidType: string): string {
  const colors: Record<string, string> = {
    MC: "#ff7d0a", BWL: "#c41e3a", AQ40: "#a330c9", AQ20: "#a330c9",
    ZG: "#00ff96", NAXX: "#0070de", ONY: "#c79c6e", EMERALD: "#1eff00",
    KARA10: "#f58cba", KARA40: "#f58cba",
  };
  return colors[raidType] || "var(--text-secondary)";
}

function getRaidIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("molten") || lower.includes("mc")) return "🔥";
  if (lower.includes("onyxia") || lower.includes("ony")) return "🐉";
  if (lower.includes("blackwing") || lower.includes("bwl")) return "🦇";
  if (lower.includes("aq") || lower.includes("temple")) return "🦂";
  if (lower.includes("naxx") || lower.includes("naxxramas")) return "💀";
  if (lower.includes("zg") || lower.includes("gurub")) return "🐯";
  if (lower.includes("kara")) return "🏰";
  if (lower.includes("emerald")) return "🌲";
  return "⚔️";
}

export default function Home({ data }: PageProps<PageData>) {
  const { totalRaids, totalPlayers, recentRaids, raidTypeBreakdown, upcomingRaids } = data;

  return (
    <>
      <Head>
        <title>Thralls Book Club - Turtle WoW Guild</title>
        <style>{`
          .hero {
            text-align: center;
            padding: 48px 20px;
            background: linear-gradient(135deg, rgba(87, 148, 242, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
            border-radius: 16px;
            margin-bottom: 32px;
          }
          .hero-title {
            font-size: 42px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, var(--apple-blue) 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .hero-subtitle {
            color: var(--text-secondary);
            font-size: 18px;
            margin-top: 8px;
          }

          .stats-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }
          @media (max-width: 640px) {
            .stats-bar { grid-template-columns: 1fr; }
          }
          .stat-box {
            background: var(--background-secondary);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: var(--apple-blue);
          }
          .stat-number.green { color: var(--apple-green); }
          .stat-number.purple { color: #06b6d4; }
          .stat-desc {
            font-size: 13px;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }

          .quick-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }
          .action-btn {
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s;
          }
          .action-primary {
            background: var(--apple-blue);
            color: white;
          }
          .action-primary:hover { background: #4a84d4; }
          .action-secondary {
            background: var(--background-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-light);
          }
          .action-secondary:hover {
            border-color: var(--apple-blue);
            background: rgba(87, 148, 242, 0.1);
          }

          .upcoming-raids-tile {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(87, 148, 242, 0.1) 100%);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
          }
          .upcoming-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .upcoming-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .upcoming-title-icon {
            font-size: 20px;
          }
          .upcoming-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          @media (max-width: 900px) {
            .upcoming-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 500px) {
            .upcoming-grid { grid-template-columns: 1fr; }
          }
          .upcoming-card {
            background: var(--background-secondary);
            border: 1px solid var(--border-light);
            border-radius: 10px;
            padding: 14px;
            text-decoration: none;
            transition: all 0.2s;
          }
          .upcoming-card:hover {
            border-color: var(--apple-green);
            transform: translateY(-2px);
          }
          .upcoming-card-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .upcoming-card-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .upcoming-card-time {
            font-size: 12px;
            color: var(--apple-green);
            margin-bottom: 4px;
          }
          .upcoming-card-signups {
            font-size: 11px;
            color: var(--text-tertiary);
          }
          .upcoming-empty {
            text-align: center;
            padding: 20px;
            color: var(--text-tertiary);
          }

          .features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 32px;
          }
          @media (max-width: 900px) {
            .features { grid-template-columns: 1fr; }
          }
          .feature-card {
            background: var(--background-secondary);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 24px;
            text-decoration: none;
            transition: all 0.2s;
          }
          .feature-card:hover {
            border-color: var(--apple-blue);
            transform: translateY(-2px);
          }
          .feature-icon {
            font-size: 28px;
            margin-bottom: 12px;
          }
          .feature-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 8px 0;
          }
          .feature-desc {
            font-size: 14px;
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.5;
          }

          .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          @media (max-width: 800px) {
            .section-grid { grid-template-columns: 1fr; }
          }

          .section-card {
            background: var(--background-secondary);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            overflow: hidden;
          }
          .section-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
          }
          .section-body {
            padding: 16px 20px;
          }

          .raid-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-light);
          }
          .raid-item:last-child { border-bottom: none; }
          .raid-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .raid-type-tag {
            font-size: 12px;
            font-weight: 600;
            min-width: 50px;
          }
          .raid-name {
            color: var(--text-primary);
            font-size: 14px;
          }
          .raid-meta {
            font-size: 13px;
            color: var(--text-tertiary);
          }

          .type-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .type-item {
            background: var(--background-tertiary);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .type-name {
            font-weight: 600;
            font-size: 13px;
          }
          .type-count {
            font-size: 12px;
            color: var(--text-tertiary);
            margin-top: 2px;
          }

          .external-links {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
            padding: 24px;
            background: var(--background-secondary);
            border-radius: 12px;
            border: 1px solid var(--border-light);
          }
          .ext-link {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s;
          }
          .ext-link:hover { color: var(--apple-blue); }
        `}</style>
      </Head>
      <Nav active="home" />

      <main class="container">
        {/* Hero */}
        <div class="hero">
          <h1 class="hero-title">Thralls Book Club</h1>
          <p class="hero-subtitle">Turtle WoW Raiding Guild</p>
        </div>

        {/* Live Stats */}
        <div class="stats-bar">
          <div class="stat-box">
            <div class="stat-number">{totalRaids}</div>
            <div class="stat-desc">Raids Logged</div>
          </div>
          <div class="stat-box">
            <div class="stat-number green">{totalPlayers}</div>
            <div class="stat-desc">Unique Raiders</div>
          </div>
          <div class="stat-box">
            <div class="stat-number purple">{raidTypeBreakdown.length}</div>
            <div class="stat-desc">Raid Types</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="quick-actions">
          <a href="/my-sr" class="action-btn action-primary">Set My SR+ Picks</a>
          <a href="/logs" class="action-btn action-secondary">Upload Combat Log</a>
          <a href="/attendance" class="action-btn action-secondary">View Attendance</a>
          <a href="/analysis" class="action-btn action-secondary">Log Analysis</a>
        </div>

        {/* Upcoming Raids Tile */}
        <div class="upcoming-raids-tile">
          <div class="upcoming-header">
            <h3 class="upcoming-title">
              <span class="upcoming-title-icon">📅</span>
              Upcoming Raids
            </h3>
            <a href="/raids" style="font-size: 13px; color: var(--apple-blue); text-decoration: none;">View Calendar →</a>
          </div>
          {upcomingRaids.length === 0 ? (
            <div class="upcoming-empty">
              <p>No upcoming raids scheduled. Check Discord for announcements!</p>
            </div>
          ) : (
            <div class="upcoming-grid">
              {upcomingRaids.map(raid => (
                <a key={raid.id} href={`/raids/${raid.id}`} class="upcoming-card">
                  <div class="upcoming-card-icon">{getRaidIcon(raid.title)}</div>
                  <div class="upcoming-card-title">{raid.title}</div>
                  <div class="upcoming-card-time">
                    {new Date(raid.startTime * 1000).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {" "}
                    {new Date(raid.startTime * 1000).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div class="upcoming-card-signups">{raid.signUpsAmount} signed up</div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div class="features">
          <a href="/logs" class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Combat Logs</h3>
            <p class="feature-desc">Upload WoWCombatLog files to track boss kills, damage, healing, and attendance automatically.</p>
          </a>
          <a href="/attendance" class="feature-card">
            <div class="feature-icon">👥</div>
            <h3 class="feature-title">Attendance Tracker</h3>
            <p class="feature-desc">See who's been raiding, leaderboards, and detailed rosters for every logged raid.</p>
          </a>
          <a href="/sr-plus" class="feature-card">
            <div class="feature-icon">⭐</div>
            <h3 class="feature-title">SR+ Loot System</h3>
            <p class="feature-desc">Soft Reserve Plus system rewards consistent raiders with priority on their reserved items.</p>
          </a>
        </div>

        {/* Recent Raids + Raid Types */}
        <div class="section-grid">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">Recent Raids</h3>
              <a href="/attendance" style="font-size: 13px; color: var(--apple-blue); text-decoration: none;">View All</a>
            </div>
            <div class="section-body">
              {recentRaids.length === 0 ? (
                <p style="color: var(--text-tertiary); text-align: center; padding: 20px 0;">No raids logged yet</p>
              ) : (
                recentRaids.map(raid => (
                  <div key={raid.id} class="raid-item">
                    <div class="raid-info">
                      <span class="raid-type-tag" style={`color: ${getRaidTypeColor(raid.raidType)};`}>{raid.raidType}</span>
                      <span class="raid-name">{raid.raidName}</span>
                    </div>
                    <span class="raid-meta">{raid.playerCount} players - {raid.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">Raids by Type</h3>
            </div>
            <div class="section-body">
              {raidTypeBreakdown.length === 0 ? (
                <p style="color: var(--text-tertiary); text-align: center; padding: 20px 0;">No data yet</p>
              ) : (
                <div class="type-grid">
                  {raidTypeBreakdown.map(item => (
                    <div key={item.type} class="type-item">
                      <div class="type-name" style={`color: ${getRaidTypeColor(item.type)};`}>{item.type}</div>
                      <div class="type-count">{item.count} raids</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* External Links */}
        <div class="external-links">
          <a href="https://raidres.top" target="_blank" rel="noopener" class="ext-link">Soft Reserve</a>
          <span style="color: var(--border-light);">|</span>
          <a href="https://pbrigade.gitlab.io/gear-planner/" target="_blank" rel="noopener" class="ext-link">Gear Planner</a>
          <span style="color: var(--border-light);">|</span>
          <a href="https://www.turtlogs.com/pve" target="_blank" rel="noopener" class="ext-link">TurtleLogs</a>
          <span style="color: var(--border-light);">|</span>
          <a href="https://turtle-wow.org" target="_blank" rel="noopener" class="ext-link">Turtle WoW</a>
        </div>
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

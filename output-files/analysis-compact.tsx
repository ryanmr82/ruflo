import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";
import PlayerStatsTable from "../islands/PlayerStatsTable.tsx";
import DeleteLogButton from "../islands/DeleteLogButton.tsx";

interface PlayerStats {
  name: string;
  deaths: number;
  totalConsumables: number;
  food: Record<string, number>;
  potions: Record<string, number>;
  elixirs: Record<string, number>;
  flasks: Record<string, number>;
  jujus: Record<string, number>;
  scrolls: Record<string, number>;
  weaponEnhancements: Record<string, number>;
  worldBuffs: Record<string, number>;
  misc: Record<string, number>;
  dispels: Record<string, number>;
  protective: Record<string, number>;
  cc: {
    total: number;
    interrupts: Record<string, number>;
    stuns: Record<string, number>;
    polymorphs: Record<string, number>;
    fears: Record<string, number>;
    roots: Record<string, number>;
    kicks: Record<string, number>;
    other: Record<string, number>;
    byTarget: Record<string, number>;
  };
}

interface StoredLog {
  id: string;
  raidType: string;
  raidName: string;
  bossKilled: string | null;
  startTime: string;
  endTime: string;
  lineCount: number;
  uploadedAt: string;
  fileSize: number;
  playerStats: PlayerStats[];
  summary: {
    totalPlayers: number;
    totalDeaths: number;
    totalConsumables: number;
    totalDispels: number;
    mostDeaths: { player: string; count: number };
    mostConsumables: { player: string; count: number };
    mostDispels: { player: string; count: number };
    totalCC: number;
    mostCC: { player: string; count: number };
  };
}

interface RaidLogInfo {
  id: string;
  raidType: string;
  raidName: string;
  date: string;
  label: string;
  sortTime: number;
  bossKilled: string | null;
}

interface PageData {
  logs: RaidLogInfo[];
  selectedLog: StoredLog | null;
  raidFilter: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const raidFilter = url.searchParams.get("raid") || "";
    const logId = url.searchParams.get("log") || "";

    const logs: RaidLogInfo[] = [];
    let selectedLog: StoredLog | null = null;

    try {
      const kv = await Deno.openKv("/home/opc/tbc-website/data.db");
      const iter = kv.list<StoredLog>({ prefix: ["combat_logs"] });

      for await (const entry of iter) {
        const log = entry.value;

        // Apply raid filter
        if (raidFilter && log.raidType !== raidFilter) continue;

        const sortTime = log.startTime ? new Date(log.startTime).getTime() : 0;
        const date = log.startTime ? new Date(log.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) : "Unknown";

        logs.push({
          id: log.id,
          raidType: log.raidType,
          raidName: log.raidName,
          date,
          label: `${log.raidType} - ${date}${log.bossKilled ? ` (${log.bossKilled})` : ""}`,
          sortTime,
          bossKilled: log.bossKilled,
        });

        // Check if this is the selected log
        if (logId && log.id === logId) {
          selectedLog = log;
        }
      }

      // Sort by date descending
      logs.sort((a, b) => b.sortTime - a.sortTime);

      // If no log selected, select the first one
      if (!selectedLog && logs.length > 0) {
        const firstLogEntry = await kv.get<StoredLog>(["combat_logs", logs[0].id]);
        selectedLog = firstLogEntry.value;
      }

      kv.close();
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }

    return ctx.render({ logs, selectedLog, raidFilter });
  },
};

export default function Analysis({ data }: PageProps<PageData>) {
  const { logs, selectedLog, raidFilter } = data;

  const buildUrl = (params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    if (raidFilter) url.set("raid", raidFilter);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.set(k, v);
      else url.delete(k);
    }
    return `/analysis?${url.toString()}`;
  };

  return (
    <>
      <Head>
        <title>Player Analysis - Thralls Book Club</title>
        <style>{`
          .compact-stats {
            display: flex;
            gap: 24px;
            margin-bottom: 16px;
            font-size: 13px;
          }
          .compact-stat {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .compact-stat-num {
            font-weight: 700;
          }
          .compact-stat-label {
            color: var(--text-tertiary);
          }
          .stat-green { color: var(--apple-green); }
          .stat-blue { color: var(--apple-blue); }
          .stat-red { color: var(--apple-red); }
          .stat-purple { color: var(--apple-purple); }

          .filter-bar {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .filter-bar select {
            padding: 6px 10px;
            border: 1px solid var(--border-light);
            border-radius: 4px;
            background: var(--background-secondary);
            color: var(--text-primary);
            font-size: 13px;
            min-width: 180px;
          }
          .filter-bar .delete-btn {
            margin-left: auto;
          }

          .highlight-panel {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            padding: 16px;
            background: var(--bg-tertiary);
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .highlight-item {
            text-align: center;
          }
          .highlight-label {
            font-size: 11px;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .highlight-value {
            font-weight: 600;
            font-size: 14px;
          }

          .table-wrap {
            max-height: 600px;
            overflow-y: auto;
            border: 1px solid var(--border-light);
            border-radius: 8px;
          }

          @media (max-width: 768px) {
            .filter-bar {
              flex-direction: column;
              align-items: stretch;
            }
            .filter-bar select {
              width: 100%;
            }
            .highlight-panel {
              grid-template-columns: 1fr;
            }
            .compact-stats {
              flex-wrap: wrap;
            }
          }
        `}</style>
      </Head>
      <Nav active="analysis" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Player Analysis</h1>
        </div>

        {selectedLog ? (
          <>
            {/* Compact Stats */}
            <div class="compact-stats">
              <div class="compact-stat stat-green">
                <span class="compact-stat-num">{selectedLog.summary?.totalConsumables || 0}</span>
                <span class="compact-stat-label">consumables</span>
              </div>
              <div class="compact-stat stat-blue">
                <span class="compact-stat-num">{selectedLog.summary?.totalDispels || 0}</span>
                <span class="compact-stat-label">dispels</span>
              </div>
              <div class="compact-stat stat-red">
                <span class="compact-stat-num">{selectedLog.summary?.totalCC || 0}</span>
                <span class="compact-stat-label">CC</span>
              </div>
              <div class="compact-stat stat-purple">
                <span class="compact-stat-num">{selectedLog.summary?.totalDeaths || 0}</span>
                <span class="compact-stat-label">deaths</span>
              </div>
              <div class="compact-stat">
                <span class="compact-stat-num">{selectedLog.playerStats?.length || 0}</span>
                <span class="compact-stat-label">players</span>
              </div>
            </div>

            {/* Filter Bar */}
            <form method="GET" class="filter-bar">
              <select name="raid" onChange="this.form.submit()">
                <option value="">All Raids</option>
                <option value="MC" selected={raidFilter === "MC"}>Molten Core</option>
                <option value="BWL" selected={raidFilter === "BWL"}>Blackwing Lair</option>
                <option value="ONY" selected={raidFilter === "ONY"}>Onyxia</option>
                <option value="ZG" selected={raidFilter === "ZG"}>Zul'Gurub</option>
                <option value="AQ20" selected={raidFilter === "AQ20"}>AQ20</option>
                <option value="AQ40" selected={raidFilter === "AQ40"}>AQ40</option>
                <option value="EMERALD" selected={raidFilter === "EMERALD"}>Emerald</option>
                <option value="NAXX" selected={raidFilter === "NAXX"}>Naxxramas</option>
              </select>
              <select name="log" onChange="this.form.submit()">
                {logs.map((log) => (
                  <option key={log.id} value={log.id} selected={selectedLog?.id === log.id}>
                    {log.label}
                  </option>
                ))}
              </select>
              <div class="delete-btn">
                <DeleteLogButton logId={selectedLog.id} logName={selectedLog.raidName} />
              </div>
            </form>

            {/* Highlight Panel */}
            <div class="highlight-panel">
              <div class="highlight-item">
                <div class="highlight-label">Most Consumables</div>
                <div class="highlight-value stat-green">
                  {selectedLog.summary?.mostConsumables?.player || "—"} ({selectedLog.summary?.mostConsumables?.count || 0})
                </div>
              </div>
              <div class="highlight-item">
                <div class="highlight-label">Most Dispels</div>
                <div class="highlight-value stat-blue">
                  {selectedLog.summary?.mostDispels?.player || "—"} ({selectedLog.summary?.mostDispels?.count || 0})
                </div>
              </div>
              <div class="highlight-item">
                <div class="highlight-label">Most CC</div>
                <div class="highlight-value stat-red">
                  {selectedLog.summary?.mostCC?.player || "—"} ({selectedLog.summary?.mostCC?.count || 0})
                </div>
              </div>
            </div>

            {/* Player Stats Table */}
            <div class="table-wrap">
              <PlayerStatsTable players={selectedLog.playerStats} />
            </div>
          </>
        ) : (
          <div style="text-align: center; padding: 48px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <h3>No Logs Available</h3>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
              Upload combat logs from the Combat Logs page to see player analysis here.
            </p>
            <a href="/logs" class="btn btn-primary">Go to Combat Logs</a>
          </div>
        )}
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

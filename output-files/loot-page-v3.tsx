import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";

interface LootDrop {
  timestamp: string;
  player: string;
  itemId: number;
  itemName: string;
  quality: string;
}

interface StoredLog {
  id: string;
  raidType: string;
  raidName: string;
  startTime: string;
  loot: LootDrop[];
}

interface RaidLogInfo {
  id: string;
  raidType: string;
  date: string;
  label: string;
  sortTime: number;
}

interface AggregatedLoot {
  raidId: string;
  raidType: string;
  raidDate: string;
  timestamp: string;
  player: string;
  itemId: number;
  itemName: string;
  quality: string;
}

interface PageData {
  loot: AggregatedLoot[];
  raidLogs: RaidLogInfo[];
  filters: {
    player?: string;
    logId?: string;
    quality?: string;
  };
  sort: {
    col: string;
    dir: "asc" | "desc";
  };
  stats: {
    total: number;
    epic: number;
    rare: number;
    raids: number;
  };
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 50;

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const player = url.searchParams.get("player") || undefined;
    const logId = url.searchParams.get("log") || undefined;
    const quality = url.searchParams.get("quality") || "epic+";
    const page = parseInt(url.searchParams.get("page") || "1");
    const sortCol = url.searchParams.get("sort") || "date";
    const sortDir = (url.searchParams.get("dir") || "desc") as "asc" | "desc";

    const allLoot: AggregatedLoot[] = [];
    const raidLogs: RaidLogInfo[] = [];

    try {
      const kv = await Deno.openKv("/home/opc/tbc-website/data.db");
      const iter = kv.list<StoredLog>({ prefix: ["combat_logs"] });

      for await (const entry of iter) {
        const log = entry.value;

        const raidDate = log.startTime ? new Date(log.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) : "Unknown";

        if (!log.loot || log.loot.length === 0) continue;

        // Only add logs that have loot data
        const sortTime = log.startTime ? new Date(log.startTime).getTime() : 0;
        raidLogs.push({
          id: log.id,
          raidType: log.raidType,
          date: raidDate,
          label: `${log.raidType} - ${raidDate}`,
          sortTime,
        });

        for (const item of log.loot) {
          allLoot.push({
            raidId: log.id,
            raidType: log.raidType,
            raidDate,
            timestamp: item.timestamp,
            player: item.player,
            itemId: item.itemId,
            itemName: item.itemName,
            quality: item.quality,
          });
        }
      }

      kv.close();
    } catch (error) {
      console.error("Failed to fetch loot:", error);
    }

    // Sort raid logs by date (newest first)
    raidLogs.sort((a, b) => b.sortTime - a.sortTime);

    // Apply filters
    let filteredLoot = allLoot;

    if (player) {
      filteredLoot = filteredLoot.filter((l) =>
        l.player.toLowerCase().includes(player.toLowerCase())
      );
    }

    if (logId) {
      filteredLoot = filteredLoot.filter((l) => l.raidId === logId);
    }

    if (quality) {
      if (quality === "epic+") {
        filteredLoot = filteredLoot.filter((l) =>
          l.quality === "epic" || l.quality === "legendary"
        );
      } else if (quality === "rare+") {
        filteredLoot = filteredLoot.filter((l) =>
          l.quality === "epic" || l.quality === "legendary" || l.quality === "rare"
        );
      } else if (quality !== "all") {
        filteredLoot = filteredLoot.filter((l) => l.quality === quality);
      }
    }

    // Sort by selected column
    const parseTs = (ts: string) => {
      const [date, time] = ts.split(" ");
      const [day, month, year] = date.split(".");
      return new Date(`20${year}-${month}-${day}T${time}`).getTime();
    };

    filteredLoot.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "item":
          cmp = a.itemName.localeCompare(b.itemName);
          break;
        case "player":
          cmp = a.player.localeCompare(b.player);
          break;
        case "raid":
          cmp = a.raidType.localeCompare(b.raidType);
          break;
        case "date":
        default:
          cmp = parseTs(a.timestamp) - parseTs(b.timestamp);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    const stats = {
      total: filteredLoot.length,
      epic: filteredLoot.filter((l) => l.quality === "epic").length,
      rare: filteredLoot.filter((l) => l.quality === "rare").length,
      raids: raidLogs.length,
    };

    const totalPages = Math.ceil(filteredLoot.length / ITEMS_PER_PAGE);
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const paginatedLoot = filteredLoot.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return ctx.render({
      loot: paginatedLoot,
      raidLogs,
      filters: { player, logId, quality },
      sort: { col: sortCol, dir: sortDir },
      stats,
      page,
      totalPages,
    });
  },
};

export default function Loot({ data }: PageProps<PageData>) {
  const { loot, raidLogs, filters, sort, stats, page, totalPages } = data;

  const buildUrl = (params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    const merged = { ...filters, sort: sort.col, dir: sort.dir, ...params };
    for (const [k, v] of Object.entries(merged)) {
      if (v) url.set(k, v);
    }
    return `/loot?${url.toString()}`;
  };

  const sortUrl = (col: string) => {
    const newDir = sort.col === col && sort.dir === "asc" ? "desc" : "asc";
    return buildUrl({ sort: col, dir: newDir, page: "1" });
  };

  const sortIcon = (col: string) => {
    if (sort.col !== col) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  return (
    <>
      <Head>
        <title>Loot History - Thralls Book Club</title>
        <style>{`
          .loot-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .loot-table th {
            background: var(--background-tertiary);
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-light);
            position: sticky;
            top: 0;
          }
          .loot-table th a {
            color: var(--text-secondary);
            text-decoration: none;
            display: block;
            cursor: pointer;
          }
          .loot-table th a:hover {
            color: var(--apple-blue);
          }
          .loot-table th.sorted a {
            color: var(--apple-blue);
          }
          .loot-table td {
            padding: 6px 12px;
            border-bottom: 1px solid var(--border-light);
            vertical-align: middle;
          }
          .loot-table tr:hover td {
            background: var(--background-tertiary);
          }
          .item-link {
            text-decoration: none;
            font-weight: 500;
          }
          .item-link:hover {
            text-decoration: underline;
          }
          .quality-rare { color: #0070dd; }
          .quality-epic { color: #a335ee; }
          .quality-legendary { color: #ff8000; }

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
          .stat-epic { color: #a335ee; }
          .stat-rare { color: #0070dd; }

          .filter-bar {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .filter-bar input, .filter-bar select {
            padding: 6px 10px;
            border: 1px solid var(--border-light);
            border-radius: 4px;
            background: var(--background-secondary);
            color: var(--text-primary);
            font-size: 13px;
          }
          .filter-bar input {
            width: 150px;
          }
          .filter-bar select {
            min-width: 140px;
          }
          .filter-bar button {
            padding: 6px 14px;
            font-size: 13px;
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border-light);
          }
          .pagination a, .pagination span {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            text-decoration: none;
          }
          .pagination a {
            background: var(--background-tertiary);
            color: var(--text-primary);
          }
          .pagination a:hover {
            background: var(--apple-blue);
            color: white;
          }
          .pagination .current {
            background: var(--apple-blue);
            color: white;
          }
          .pagination .disabled {
            opacity: 0.4;
            pointer-events: none;
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
            .filter-bar input, .filter-bar select {
              width: 100%;
            }
            .loot-table {
              font-size: 12px;
            }
            .loot-table th, .loot-table td {
              padding: 4px 8px;
            }
          }
        `}</style>
      </Head>
      <Nav active="loot" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Loot History</h1>
        </div>

        {/* Compact Stats */}
        <div class="compact-stats">
          <div class="compact-stat">
            <span class="compact-stat-num">{stats.total}</span>
            <span class="compact-stat-label">items</span>
          </div>
          <div class="compact-stat stat-epic">
            <span class="compact-stat-num">{stats.epic}</span>
            <span class="compact-stat-label">epic</span>
          </div>
          <div class="compact-stat stat-rare">
            <span class="compact-stat-num">{stats.rare}</span>
            <span class="compact-stat-label">rare</span>
          </div>
          <div class="compact-stat">
            <span class="compact-stat-num">{stats.raids}</span>
            <span class="compact-stat-label">logs</span>
          </div>
        </div>

        {/* Filter Bar */}
        <form method="GET" class="filter-bar">
          <input
            type="text"
            name="player"
            placeholder="Player..."
            value={filters.player || ""}
          />
          <select name="log">
            <option value="">All Raids</option>
            {raidLogs.map((log) => (
              <option key={log.id} value={log.id} selected={filters.logId === log.id}>
                {log.label}
              </option>
            ))}
          </select>
          <select name="quality">
            <option value="epic+" selected={filters.quality === "epic+" || !filters.quality}>Epic+</option>
            <option value="rare+" selected={filters.quality === "rare+"}>Rare+</option>
            <option value="all" selected={filters.quality === "all"}>All Items</option>
          </select>
          <button type="submit" class="btn btn-primary">Filter</button>
        </form>

        {/* Loot Table */}
        <div class="table-wrap">
          <table class="loot-table">
            <thead>
              <tr>
                <th class={sort.col === "item" ? "sorted" : ""}>
                  <a href={sortUrl("item")}>Item{sortIcon("item")}</a>
                </th>
                <th class={sort.col === "player" ? "sorted" : ""}>
                  <a href={sortUrl("player")}>Player{sortIcon("player")}</a>
                </th>
                <th class={sort.col === "raid" ? "sorted" : ""}>
                  <a href={sortUrl("raid")}>Raid{sortIcon("raid")}</a>
                </th>
                <th class={sort.col === "date" ? "sorted" : ""}>
                  <a href={sortUrl("date")}>Date{sortIcon("date")}</a>
                </th>
              </tr>
            </thead>
            <tbody>
              {loot.length === 0 ? (
                <tr>
                  <td colspan={4} style="text-align: center; padding: 32px; color: var(--text-tertiary);">
                    No loot found. Upload combat logs to track loot.
                  </td>
                </tr>
              ) : (
                loot.map((item, idx) => (
                  <tr key={`${item.raidId}-${idx}`}>
                    <td>
                      <a
                        href={`https://database.turtlecraft.gg/?item=${item.itemId}`}
                        target="_blank"
                        rel="noopener"
                        class={`item-link quality-${item.quality}`}
                      >
                        {item.itemName}
                      </a>
                    </td>
                    <td>{item.player}</td>
                    <td>{item.raidType}</td>
                    <td>{item.raidDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div class="pagination">
            <a
              href={buildUrl({ page: "1" })}
              class={page <= 1 ? "disabled" : ""}
            >
              First
            </a>
            <a
              href={buildUrl({ page: String(page - 1) })}
              class={page <= 1 ? "disabled" : ""}
            >
              Prev
            </a>
            <span class="current">
              {page} / {totalPages}
            </span>
            <a
              href={buildUrl({ page: String(page + 1) })}
              class={page >= totalPages ? "disabled" : ""}
            >
              Next
            </a>
            <a
              href={buildUrl({ page: String(totalPages) })}
              class={page >= totalPages ? "disabled" : ""}
            >
              Last
            </a>
          </div>
        )}
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

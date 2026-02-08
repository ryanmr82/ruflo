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
  filters: {
    player?: string;
    raid?: string;
    quality?: string;
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
    const raid = url.searchParams.get("raid") || undefined;
    const quality = url.searchParams.get("quality") || "epic+"; // Default to epic+
    const page = parseInt(url.searchParams.get("page") || "1");

    const allLoot: AggregatedLoot[] = [];
    let raidCount = 0;

    try {
      const kv = await Deno.openKv("/home/opc/tbc-website/data.db");
      const iter = kv.list<StoredLog>({ prefix: ["combat_logs"] });

      for await (const entry of iter) {
        const log = entry.value;
        if (!log.loot || log.loot.length === 0) continue;

        raidCount++;
        const raidDate = log.startTime ? new Date(log.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) : "Unknown";

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

    // Apply filters
    let filteredLoot = allLoot;

    if (player) {
      filteredLoot = filteredLoot.filter((l) =>
        l.player.toLowerCase().includes(player.toLowerCase())
      );
    }

    if (raid) {
      filteredLoot = filteredLoot.filter((l) =>
        l.raidType.toLowerCase() === raid.toLowerCase()
      );
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

    // Sort by timestamp descending (newest first)
    filteredLoot.sort((a, b) => {
      const parseTs = (ts: string) => {
        const [date, time] = ts.split(" ");
        const [day, month, year] = date.split(".");
        return new Date(`20${year}-${month}-${day}T${time}`).getTime();
      };
      return parseTs(b.timestamp) - parseTs(a.timestamp);
    });

    // Calculate stats (before pagination)
    const stats = {
      total: filteredLoot.length,
      epic: filteredLoot.filter((l) => l.quality === "epic").length,
      rare: filteredLoot.filter((l) => l.quality === "rare").length,
      raids: raidCount,
    };

    // Pagination
    const totalPages = Math.ceil(filteredLoot.length / ITEMS_PER_PAGE);
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const paginatedLoot = filteredLoot.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return ctx.render({
      loot: paginatedLoot,
      filters: { player, raid, quality },
      stats,
      page,
      totalPages,
    });
  },
};

export default function Loot({ data }: PageProps<PageData>) {
  const { loot, filters, stats, page, totalPages } = data;

  const buildUrl = (params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    const merged = { ...filters, ...params };
    for (const [k, v] of Object.entries(merged)) {
      if (v) url.set(k, v);
    }
    return `/loot?${url.toString()}`;
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
            min-width: 100px;
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
            <span class="compact-stat-label">raids</span>
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
          <select name="raid">
            <option value="">All Raids</option>
            <option value="MC" selected={filters.raid === "MC"}>MC</option>
            <option value="BWL" selected={filters.raid === "BWL"}>BWL</option>
            <option value="AQ40" selected={filters.raid === "AQ40"}>AQ40</option>
            <option value="AQ20" selected={filters.raid === "AQ20"}>AQ20</option>
            <option value="Naxx" selected={filters.raid === "Naxx"}>Naxx</option>
            <option value="ZG" selected={filters.raid === "ZG"}>ZG</option>
            <option value="Ony" selected={filters.raid === "Ony"}>Ony</option>
          </select>
          <select name="quality">
            <option value="epic+" selected={filters.quality === "epic+" || !filters.quality}>Epic+</option>
            <option value="rare+" selected={filters.quality === "rare+"}>Rare+</option>
            <option value="epic" selected={filters.quality === "epic"}>Epic Only</option>
            <option value="rare" selected={filters.quality === "rare"}>Rare Only</option>
            <option value="all" selected={filters.quality === "all"}>All Items</option>
          </select>
          <button type="submit" class="btn btn-primary">Filter</button>
        </form>

        {/* Loot Table */}
        <div class="table-wrap">
          <table class="loot-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Player</th>
                <th>Raid</th>
                <th>Date</th>
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

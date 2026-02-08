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
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const player = url.searchParams.get("player") || undefined;
    const raid = url.searchParams.get("raid") || undefined;
    const quality = url.searchParams.get("quality") || undefined;

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
      } else {
        filteredLoot = filteredLoot.filter((l) => l.quality === quality);
      }
    }

    // Sort by timestamp descending (newest first)
    filteredLoot.sort((a, b) => {
      // Parse timestamps like "06.12.25 16:12:02"
      const parseTs = (ts: string) => {
        const [date, time] = ts.split(" ");
        const [day, month, year] = date.split(".");
        return new Date(`20${year}-${month}-${day}T${time}`).getTime();
      };
      return parseTs(b.timestamp) - parseTs(a.timestamp);
    });

    // Calculate stats
    const stats = {
      total: filteredLoot.length,
      epic: filteredLoot.filter((l) => l.quality === "epic").length,
      rare: filteredLoot.filter((l) => l.quality === "rare").length,
      raids: raidCount,
    };

    return ctx.render({
      loot: filteredLoot.slice(0, 200), // Limit to 200 for performance
      filters: { player, raid, quality },
      stats,
    });
  },
};

function getQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    poor: "#9d9d9d",
    common: "#ffffff",
    uncommon: "#1eff00",
    rare: "#0070dd",
    epic: "#a335ee",
    legendary: "#ff8000",
  };
  return colors[quality] || "#ffffff";
}

function getQualityEmoji(quality: string): string {
  const emojis: Record<string, string> = {
    poor: "",
    common: "",
    uncommon: "",
    rare: "",
    epic: "",
    legendary: "",
  };
  return emojis[quality] || "";
}

function getRaidIcon(raidType: string): string {
  const icons: Record<string, string> = {
    MC: "",
    BWL: "",
    AQ40: "",
    AQ20: "",
    Naxx: "",
    ZG: "",
    Ony: "",
  };
  return icons[raidType] || "";
}

export default function Loot({ data }: PageProps<PageData>) {
  const { loot, filters, stats } = data;

  return (
    <>
      <Head>
        <title>Loot History - Thralls Book Club</title>
        <style>{`
          .quality-poor { color: #9d9d9d; }
          .quality-common { color: #ffffff; }
          .quality-uncommon { color: #1eff00; }
          .quality-rare { color: #0070dd; }
          .quality-epic { color: #a335ee; }
          .quality-legendary { color: #ff8000; }

          .loot-row {
            display: grid;
            grid-template-columns: 1fr auto auto auto;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-light);
            align-items: center;
          }
          .loot-row:hover {
            background: var(--background-tertiary);
          }
          .loot-row:last-child {
            border-bottom: none;
          }
          .loot-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .loot-item-name {
            font-weight: 600;
            text-decoration: none;
          }
          .loot-item-name:hover {
            text-decoration: underline;
          }
          .loot-meta {
            font-size: 12px;
            color: var(--text-tertiary);
          }
          .loot-player {
            font-weight: 500;
            min-width: 120px;
          }
          .loot-raid {
            font-size: 13px;
            color: var(--text-secondary);
            min-width: 80px;
            text-align: center;
          }
          .loot-date {
            font-size: 12px;
            color: var(--text-tertiary);
            min-width: 60px;
            text-align: right;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: var(--background-tertiary);
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .stat-label {
            font-size: 12px;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stat-epic .stat-number { color: #a335ee; }
          .stat-rare .stat-number { color: #0070dd; }

          .filter-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: 16px;
            align-items: end;
          }
          .filter-form input, .filter-form select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-light);
            border-radius: 6px;
            background: var(--background-secondary);
            color: var(--text-primary);
          }
          .filter-form label {
            display: block;
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 4px;
          }

          @media (max-width: 768px) {
            .loot-row {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .filter-form {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Head>
      <Nav active="loot" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">Loot History</h1>
          <p class="page-subtitle">All items from uploaded combat logs</p>
        </div>

        {/* Stats Cards */}
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{stats.total}</div>
            <div class="stat-label">Total Items</div>
          </div>
          <div class="stat-card stat-epic">
            <div class="stat-number">{stats.epic}</div>
            <div class="stat-label">Epic</div>
          </div>
          <div class="stat-card stat-rare">
            <div class="stat-number">{stats.rare}</div>
            <div class="stat-label">Rare</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{stats.raids}</div>
            <div class="stat-label">Raids</div>
          </div>
        </div>

        {/* Filters */}
        <div class="card">
          <form method="GET" class="filter-form">
            <div>
              <label for="player">Player</label>
              <input
                type="text"
                id="player"
                name="player"
                placeholder="Search player..."
                value={filters.player || ""}
              />
            </div>
            <div>
              <label for="raid">Raid</label>
              <select id="raid" name="raid">
                <option value="">All Raids</option>
                <option value="MC" selected={filters.raid === "MC"}>Molten Core</option>
                <option value="BWL" selected={filters.raid === "BWL"}>BWL</option>
                <option value="AQ40" selected={filters.raid === "AQ40"}>AQ40</option>
                <option value="AQ20" selected={filters.raid === "AQ20"}>AQ20</option>
                <option value="Naxx" selected={filters.raid === "Naxx"}>Naxxramas</option>
                <option value="ZG" selected={filters.raid === "ZG"}>ZG</option>
                <option value="Ony" selected={filters.raid === "Ony"}>Onyxia</option>
              </select>
            </div>
            <div>
              <label for="quality">Quality</label>
              <select id="quality" name="quality">
                <option value="">All Items</option>
                <option value="epic+" selected={filters.quality === "epic+"}>Epic+ Only</option>
                <option value="rare+" selected={filters.quality === "rare+"}>Rare+ Only</option>
                <option value="epic" selected={filters.quality === "epic"}>Epic</option>
                <option value="rare" selected={filters.quality === "rare"}>Rare</option>
                <option value="uncommon" selected={filters.quality === "uncommon"}>Uncommon</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Filter</button>
          </form>
        </div>

        {/* Loot List */}
        <div class="card mt-3">
          <div class="card-header">
            <h2 class="card-title">Loot Drops</h2>
            <span class="card-badge badge-purple">{loot.length} shown</span>
          </div>

          {loot.length === 0 ? (
            <div class="text-center" style="padding: 48px;">
              <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
              <h3>No loot found</h3>
              <p style="color: var(--text-secondary);">
                {filters.player || filters.raid || filters.quality
                  ? "Try adjusting your filters"
                  : "Upload combat logs to track loot"}
              </p>
              <a href="/logs" class="btn btn-primary mt-2">Upload Logs</a>
            </div>
          ) : (
            <div>
              {loot.map((item, idx) => (
                <div class="loot-row" key={`${item.raidId}-${idx}`}>
                  <div class="loot-item">
                    <a
                      href={`https://database.turtlecraft.gg/?item=${item.itemId}`}
                      target="_blank"
                      rel="noopener"
                      class={`loot-item-name quality-${item.quality}`}
                    >
                      {item.itemName}
                    </a>
                    <span class="loot-meta">ID: {item.itemId}</span>
                  </div>
                  <div class="loot-player">{item.player}</div>
                  <div class="loot-raid">{item.raidType}</div>
                  <div class="loot-date">{item.raidDate}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div class="card mt-3">
          <div class="card-header">
            <h2 class="card-title">About Loot Tracking</h2>
          </div>
          <p style="color: var(--text-secondary);">
            Loot is automatically extracted from uploaded combat logs. The system tracks who received
            each item during raids.
          </p>
          <div class="alert alert-info mt-2">
            <strong>Quality Colors:</strong>{" "}
            <span class="quality-poor">Poor</span> |{" "}
            <span class="quality-common">Common</span> |{" "}
            <span class="quality-uncommon">Uncommon</span> |{" "}
            <span class="quality-rare">Rare</span> |{" "}
            <span class="quality-epic">Epic</span> |{" "}
            <span class="quality-legendary">Legendary</span>
          </div>
        </div>
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}

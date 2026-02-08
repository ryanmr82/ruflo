import { useState } from "preact/hooks";

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

interface Props {
  stats: PlayerStats[];
  raids: RaidSummary[];
  totalRaids: number;
  totalPlayers: number;
  avgRaidSize: number;
}

type Tab = "overview" | "leaderboard" | "raids";

function getRaidTypeColor(raidType: string): string {
  const colors: Record<string, string> = {
    MC: "#ff7d0a", BWL: "#c41e3a", AQ40: "#a330c9", AQ20: "#a330c9",
    ZG: "#00ff96", NAXX: "#0070de", ONY: "#c79c6e", EMERALD: "#1eff00",
    KARA10: "#f58cba", KARA40: "#f58cba",
  };
  return colors[raidType] || "var(--text-secondary)";
}

export default function AttendanceTabs({ stats, raids, totalRaids, totalPlayers, avgRaidSize }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedRaid, setSelectedRaid] = useState<string>("");

  const currentRaid = raids.find(r => r.id === selectedRaid);

  return (
    <div>
      {/* Tab Navigation */}
      <div class="tab-nav">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          class={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          class={`tab-btn ${activeTab === "leaderboard" ? "active" : ""}`}
        >
          Leaderboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("raids")}
          class={`tab-btn ${activeTab === "raids" ? "active" : ""}`}
        >
          Raids
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Summary Stats */}
          <div class="stat-grid-3">
            <div class="stat-card">
              <div class="stat-value">{totalRaids}</div>
              <div class="stat-label">Raids Logged</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{totalPlayers}</div>
              <div class="stat-label">Unique Raiders</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{avgRaidSize}</div>
              <div class="stat-label">Avg Raid Size</div>
            </div>
          </div>

          {/* Raid Type Breakdown */}
          <div class="card mt-3">
            <div class="card-header">
              <h3 class="card-title">Raids by Type</h3>
            </div>
            <div class="card-body">
              <div class="raid-type-grid">
                {Object.entries(
                  raids.reduce((acc, r) => {
                    acc[r.raidType] = (acc[r.raidType] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} class="raid-type-card" style={`border-left: 3px solid ${getRaidTypeColor(type)};`}>
                    <div class="raid-type-name" style={`color: ${getRaidTypeColor(type)};`}>{type}</div>
                    <div class="raid-type-count">{count} raids</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Raids */}
          <div class="card mt-3">
            <div class="card-header">
              <h3 class="card-title">Recent Raids</h3>
            </div>
            <div class="card-body">
              <div class="recent-raids-list">
                {raids.slice(0, 5).map(raid => (
                  <div key={raid.id} class="recent-raid-item">
                    <div class="recent-raid-info">
                      <span class="recent-raid-type" style={`color: ${getRaidTypeColor(raid.raidType)};`}>{raid.raidType}</span>
                      <span class="recent-raid-name">{raid.raidName}</span>
                    </div>
                    <div class="recent-raid-meta">
                      <span class="recent-raid-players">{raid.playerCount} players</span>
                      <span class="recent-raid-date">{raid.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Raider Leaderboard</h3>
            <span class="badge badge-green">{stats.length} players</span>
          </div>
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
                {stats.slice(0, 100).map((player, idx) => (
                  <tr key={player.playerName}>
                    <td style="color: var(--text-tertiary); width: 40px;">{idx + 1}</td>
                    <td style="font-weight: 500;">{player.playerName}</td>
                    <td>
                      <span style={`color: ${player.raidsAttended >= 10 ? 'var(--apple-green)' : player.raidsAttended >= 5 ? 'var(--apple-blue)' : 'var(--text-primary)'};`}>
                        {player.raidsAttended}
                      </span>
                    </td>
                    <td>
                      <div class="raid-type-badges">
                        {player.raidTypes.map(rt => (
                          <span
                            key={rt}
                            class="raid-type-badge"
                            style={`background: ${getRaidTypeColor(rt)}22; color: ${getRaidTypeColor(rt)};`}
                          >
                            {rt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 13px;">{player.lastRaidDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raids Tab */}
      {activeTab === "raids" && (
        <div>
          {/* Raid Selector */}
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Select Raid</h3>
            </div>
            <div class="card-body">
              <select
                class="raid-select"
                value={selectedRaid}
                onChange={(e) => setSelectedRaid((e.target as HTMLSelectElement).value)}
              >
                <option value="">-- Select a raid --</option>
                {raids.map(raid => (
                  <option key={raid.id} value={raid.id}>
                    {raid.raidType} - {raid.raidName} - {raid.date} ({raid.playerCount} players)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Raid Roster */}
          {currentRaid && (
            <div class="card mt-3">
              <div class="card-header">
                <h3 class="card-title">
                  <span style={`color: ${getRaidTypeColor(currentRaid.raidType)};`}>{currentRaid.raidType}</span>
                  {" "}- {currentRaid.raidName}
                </h3>
                <span class="badge badge-blue">{currentRaid.playerCount} players</span>
              </div>
              <div class="card-body">
                <div class="raid-date-display">{currentRaid.date}</div>
                <div class="roster-grid">
                  {currentRaid.players.map(player => (
                    <div key={player} class="roster-player">
                      {player}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedRaid && (
            <div class="empty-state">
              <p>Select a raid from the dropdown to view its roster</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }
        .tab-btn {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          font-family: inherit;
        }
        .tab-btn:hover {
          background: var(--background-tertiary);
          color: var(--text-primary);
        }
        .tab-btn.active {
          background: var(--apple-blue);
          border-color: var(--apple-blue);
          color: white;
        }

        .stat-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 640px) {
          .stat-grid-3 { grid-template-columns: 1fr; }
        }
        .stat-card {
          background: var(--background-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: var(--apple-blue);
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .card {
          background: var(--background-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          overflow: hidden;
        }
        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .card-body {
          padding: 20px;
        }
        .mt-3 { margin-top: 20px; }

        .badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 500;
        }
        .badge-green {
          background: rgba(115, 191, 105, 0.15);
          color: var(--apple-green);
        }
        .badge-blue {
          background: rgba(87, 148, 242, 0.15);
          color: var(--apple-blue);
        }

        .raid-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .raid-type-card {
          background: var(--background-tertiary);
          border-radius: 8px;
          padding: 12px 16px;
        }
        .raid-type-name {
          font-weight: 600;
          font-size: 14px;
        }
        .raid-type-count {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .recent-raids-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recent-raid-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--background-tertiary);
          border-radius: 8px;
        }
        .recent-raid-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .recent-raid-type {
          font-weight: 600;
          font-size: 13px;
          min-width: 60px;
        }
        .recent-raid-name {
          color: var(--text-primary);
          font-size: 14px;
        }
        .recent-raid-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--text-tertiary);
          font-size: 13px;
        }
        .recent-raid-players {
          color: var(--text-secondary);
        }

        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-light);
        }
        th {
          background: var(--background-tertiary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        tr:hover td {
          background: var(--background-tertiary);
        }

        .raid-type-badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .raid-type-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .raid-select {
          width: 100%;
          padding: 12px 16px;
          background: var(--background-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }
        .raid-select:focus {
          outline: none;
          border-color: var(--apple-blue);
        }

        .raid-date-display {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .roster-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
        }
        .roster-player {
          padding: 10px 14px;
          background: var(--background-tertiary);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-primary);
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}

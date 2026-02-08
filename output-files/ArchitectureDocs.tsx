import { useState } from "preact/hooks";

type Tab = "current" | "future";

export default function ArchitectureDocs() {
  const [activeTab, setActiveTab] = useState<Tab>("current");

  return (
    <div>
      {/* Tab Navigation */}
      <div class="card mb-3">
        <div style="display: flex; gap: 8px; padding: 8px;">
          <button
            onClick={() => setActiveTab("current")}
            class={`btn ${activeTab === "current" ? "btn-primary" : "btn-secondary"}`}
            style="flex: 1;"
          >
            Current State
          </button>
          <button
            onClick={() => setActiveTab("future")}
            class={`btn ${activeTab === "future" ? "btn-primary" : "btn-secondary"}`}
            style="flex: 1;"
          >
            Future State (SR+ Redesign)
          </button>
        </div>
      </div>

      {/* Current State Tab */}
      {activeTab === "current" && <CurrentStateTab />}

      {/* Future State Tab */}
      {activeTab === "future" && <FutureStateTab />}
    </div>
  );
}

function CurrentStateTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>("database");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div>
      {/* Database Schema */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("database")}
        >
          <h2 class="card-title">Database Schema (Deno KV)</h2>
          <span class="card-badge badge-blue">{expandedSection === "database" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "database" && (
          <div style="padding: 16px;">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
              Single database at: <code>/home/opc/tbc-website/data.db</code>
            </p>
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Key Prefix</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>["attendance", id]</code></td>
                    <td>Individual attendance records</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["raids-saved", raidId]</code></td>
                    <td>Raid summary after attendance saved</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["combat_logs", logId]</code></td>
                    <td>Processed combat log summaries</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["sessions", sessionId]</code></td>
                    <td>User login sessions</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["user_profiles", discordId]</code></td>
                    <td>User profile with linked characters</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["items", "by_id/by_name", ...]</code></td>
                    <td>Item cache (self-healing)</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["sr_picks", discordId, eventId]</code></td>
                    <td>User's SR+ picks per event</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr>
                    <td><code>["sr_plus", "settings"]</code></td>
                    <td>SR+ system settings</td>
                    <td><span class="badge badge-green">Active</span></td>
                  </tr>
                  <tr style="background: rgba(239, 68, 68, 0.1);">
                    <td><code>["sr_plus", "credits", ...]</code></td>
                    <td>SR+ credit tracking</td>
                    <td><span class="badge badge-red">BROKEN</span></td>
                  </tr>
                  <tr style="background: rgba(234, 179, 8, 0.1);">
                    <td><code>["sr_plus", "runs", runId]</code></td>
                    <td>Manual SR+ runs</td>
                    <td><span class="badge badge-yellow">UNUSED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* API Routes */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("api")}
        >
          <h2 class="card-title">API Routes</h2>
          <span class="card-badge badge-blue">{expandedSection === "api" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "api" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Authentication</h3>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table class="data-table">
                <thead>
                  <tr><th>Route</th><th>Method</th><th>Auth</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>/api/auth/me</code></td><td>GET</td><td>Session</td><td>Get current user session</td></tr>
                  <tr><td><code>/api/auth/characters</code></td><td>GET/PUT</td><td>Session</td><td>Manage linked characters</td></tr>
                </tbody>
              </table>
            </div>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">SR+ System</h3>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table class="data-table">
                <thead>
                  <tr><th>Route</th><th>Method</th><th>Auth</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>/api/sr-plus/credits</code></td><td>GET</td><td>None</td><td>List all SR+ credits</td></tr>
                  <tr><td><code>/api/sr-plus/my-picks</code></td><td>GET/POST/DELETE</td><td>Session</td><td>User's SR+ picks</td></tr>
                  <tr><td><code>/api/sr-plus/my-srs</code></td><td>GET</td><td>Session</td><td>User's SRs from RaidRes</td></tr>
                  <tr><td><code>/api/sr-plus/scrape</code></td><td>POST</td><td>Admin</td><td>Playwright scraper</td></tr>
                  <tr><td><code>/api/sr-plus/settings</code></td><td>GET/PUT</td><td>None/Admin</td><td>SR+ settings</td></tr>
                </tbody>
              </table>
            </div>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Items</h3>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table class="data-table">
                <thead>
                  <tr><th>Route</th><th>Method</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>/api/items/lookup</code></td><td>GET</td><td>Self-healing item lookup (static → KV → scrape)</td></tr>
                  <tr><td><code>/api/items/admin</code></td><td>GET/POST</td><td>Item database admin</td></tr>
                </tbody>
              </table>
            </div>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Combat Logs & Attendance</h3>
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead>
                  <tr><th>Route</th><th>Method</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>/api/logs</code></td><td>GET/POST/DELETE</td><td>Combat log management</td></tr>
                  <tr><td><code>/api/raids</code></td><td>GET</td><td>Raids from Raid-Helper Discord</td></tr>
                  <tr><td><code>/api/attendance</code></td><td>GET/POST</td><td>Attendance records</td></tr>
                  <tr><td><code>/api/loot</code></td><td>GET</td><td>Loot database (static JSON)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Data Flow */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("flow")}
        >
          <h2 class="card-title">Data Flow Diagrams</h2>
          <span class="card-badge badge-blue">{expandedSection === "flow" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "flow" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Item Lookup (Self-Healing)</h3>
            <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
{`┌────────────────┐
│  API Request   │
│ /api/items/    │
│  lookup?name=X │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌─────────────────────┐
│ Check Static   │────▶│ item-tooltips.json  │
│ JSON (7k items)│     │ (has icon field?)   │
└───────┬────────┘     └─────────────────────┘
        │
        │ Missing/No Icon?
        ▼
┌────────────────┐     ┌─────────────────────┐
│  Check KV      │────▶│ ["items","by_name"] │
│  Cache         │     │ ["items","by_id"]   │
└───────┬────────┘     └─────────────────────┘
        │
        │ Not Found/No Icon?
        ▼
┌────────────────┐     ┌─────────────────────┐
│  Playwright    │────▶│ database.turtle-wow │
│  Scraper       │     │      .org           │
└───────┬────────┘     └─────────────────────┘
        │
        │ Found Icon
        ▼
┌────────────────┐
│ SELF-HEAL:     │
│ 1. Store in KV │
│ 2. Update JSON │
└────────────────┘`}
            </pre>

            <h3 style="color: var(--text-primary); margin: 24px 0 12px;">User SR+ Pick Flow</h3>
            <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
{`Discord OAuth2 → /api/auth/discord/callback → session stored
                              │
                              ▼
Raid-Helper API → /api/sr-plus/my-picks → shows upcoming raids
                              │
                              ▼
RaidRes.top ──→ /api/sr-plus/scrape → gets player's SRs
  (Playwright)                │
                              ▼
                     MySRPortal.tsx
                   - Shows user's SRs
                   - Pick ONE item per raid type
                   - Stored in sr_picks table`}
            </pre>
          </div>
        )}
      </div>

      {/* Component Map */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("components")}
        >
          <h2 class="card-title">Component Map</h2>
          <span class="card-badge badge-blue">{expandedSection === "components" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "components" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Islands (Interactive Components)</h3>
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead>
                  <tr><th>Island</th><th>API Dependencies</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>MySRPortal.tsx</code></td>
                    <td><code>/api/auth/me</code>, <code>/api/sr-plus/my-*</code></td>
                    <td>User's SR+ management portal</td>
                  </tr>
                  <tr>
                    <td><code>SRPlusSpreadsheet.tsx</code></td>
                    <td><code>/api/sr-plus/credits</code>, <code>/api/items/lookup</code></td>
                    <td>Admin SR+ management</td>
                  </tr>
                  <tr>
                    <td><code>SRPlusPublic.tsx</code></td>
                    <td><code>/api/sr-plus/credits</code></td>
                    <td>Read-only guild SR+ view</td>
                  </tr>
                  <tr>
                    <td><code>RaidResFetcher.tsx</code></td>
                    <td><code>/api/sr-plus/sync</code></td>
                    <td>Sync data from RaidRes</td>
                  </tr>
                  <tr>
                    <td><code>ItemTooltip.tsx</code></td>
                    <td><code>/api/items/lookup</code></td>
                    <td>Shared tooltip component</td>
                  </tr>
                  <tr>
                    <td><code>LogProcessor.tsx</code></td>
                    <td><code>/api/logs</code></td>
                    <td>Combat log upload/processing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Known Issues */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("issues")}
        >
          <h2 class="card-title">Known Issues</h2>
          <span class="card-badge badge-red">{expandedSection === "issues" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "issues" && (
          <div style="padding: 16px;">
            <div style="margin-bottom: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
              <h4 style="color: #ef4444; margin-bottom: 8px;">1. SR+ Credits Table - Broken</h4>
              <p style="color: var(--text-secondary);">
                Key format is inconsistent. Some entries use <code>itemId</code> (number), others use <code>itemName</code> (string).
                Admin page shows garbage data as a result.
              </p>
            </div>

            <div style="margin-bottom: 16px; padding: 12px; background: rgba(234, 179, 8, 0.1); border-radius: 8px; border-left: 4px solid #eab308;">
              <h4 style="color: #eab308; margin-bottom: 8px;">2. SR+ Runs Table - Unused</h4>
              <p style="color: var(--text-secondary);">
                The "Create New Run from Discord" feature doesn't do anything useful. Table exists but is not connected to any workflow.
              </p>
            </div>

            <div style="margin-bottom: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
              <h4 style="color: #ef4444; margin-bottom: 8px;">3. Disconnected Systems</h4>
              <p style="color: var(--text-secondary);">
                Three separate data stores don't connect: <code>sr_picks</code> (user picks), <code>sr_plus/credits</code> (historical tracking), <code>sr_plus/runs</code> (manual runs).
              </p>
            </div>

            <div style="padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 4px solid #22c55e;">
              <h4 style="color: #22c55e; margin-bottom: 8px;">4. Missing Icons - FIXED</h4>
              <p style="color: var(--text-secondary);">
                Self-healing lookup implemented. Items missing icons now fall through to scraper, which writes back to static JSON for future instant lookups.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FutureStateTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div>
      {/* Overview */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("overview")}
        >
          <h2 class="card-title">SR+ System Redesign</h2>
          <span class="card-badge badge-purple">{expandedSection === "overview" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "overview" && (
          <div style="padding: 16px;">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
              SR+ is a loyalty reward system where players who repeatedly soft-reserve the same item across multiple raids earn bonus roll priority.
            </p>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">User Flow</h3>
            <ol style="color: var(--text-secondary); padding-left: 20px; margin-bottom: 16px;">
              <li>User signs up for raid (via Raid-Helper Discord bot)</li>
              <li>User creates soft reserves on raidres.top</li>
              <li>User visits MySRPortal on website</li>
              <li>User sees raids they're signed up for</li>
              <li>User picks <strong>ONE item per raid type</strong> to mark as SR+ (from their raidres.top SRs)</li>
              <li>Pick is stored in database</li>
              <li>User attends raid:
                <ul style="padding-left: 20px; margin-top: 8px;">
                  <li><strong>Wins item</strong> → SR+ entry cleared, pick new item next time</li>
                  <li><strong>Doesn't win</strong> → SR+ tally increases by 1</li>
                </ul>
              </li>
            </ol>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Business Rules</h3>
            <ul style="color: var(--text-secondary); padding-left: 20px;">
              <li><strong>One SR+ per raid type</strong> - Player can have SR+ in MC AND BWL, but only one item per raid</li>
              <li><strong>Reset on new pick</strong> - When player picks new item (win or change), timesSRd resets to 0</li>
              <li><strong>Hard Reserve</strong> - At 5+ times SR+'d, item becomes "Hard Reserve" status</li>
              <li><strong>Conflict Resolution</strong> - Two players with HR on same item = roll off in-game</li>
              <li><strong>Visibility</strong> - All players can see everyone's SR+ status (read-only)</li>
              <li><strong>No decay</strong> - SR+ count doesn't decrease over time</li>
            </ul>
          </div>
        )}
      </div>

      {/* New Data Model */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("datamodel")}
        >
          <h2 class="card-title">New Data Model</h2>
          <span class="card-badge badge-purple">{expandedSection === "datamodel" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "datamodel" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">sr_plus_entries</h3>
            <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-bottom: 16px;">
{`Key: ["sr_plus", "entries", raidType, visitorId]
Value: {
  visitorId: string,           // Discord ID
  playerName: string,          // Character name
  raidType: string,            // MC, BWL, AQ40, etc.
  itemName: string,            // Current SR+ item
  timesSRd: number,            // Times attended while SR+'ing this item
  currentBonus: number,        // timesSRd * bonusPerSR
  pickedAt: timestamp,
  lastIncrementedAt: timestamp,
  lastProcessedLogId: string,  // Prevent double-counting
}`}
            </pre>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">sr_plus_history</h3>
            <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-bottom: 16px;">
{`Key: ["sr_plus", "history", visitorId, timestamp]
Value: {
  visitorId: string,
  playerName: string,
  raidType: string,
  itemName: string,
  action: "picked" | "incremented" | "won" | "changed" | "admin_edit",
  previousValue: number,
  newValue: number,
  logId: string,               // If from log processing
  adminNote: string,           // If admin edit
  timestamp: timestamp,
}`}
            </pre>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">sr_plus_admin_log (Immutable)</h3>
            <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
{`Key: ["sr_plus", "admin_log", timestamp]
Value: {
  adminId: string,
  action: string,
  targetPlayer: string,
  targetRaidType: string,
  previousValue: any,
  newValue: any,
  timestamp: timestamp,
}`}
            </pre>
          </div>
        )}
      </div>

      {/* Automation */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("automation")}
        >
          <h2 class="card-title">Automation (Cron Job)</h2>
          <span class="card-badge badge-purple">{expandedSection === "automation" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "automation" && (
          <div style="padding: 16px;">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
              Every 5 minutes, a cron job processes new combat logs:
            </p>
            <ol style="color: var(--text-secondary); padding-left: 20px;">
              <li>Check for new combat logs uploaded</li>
              <li>For each unprocessed log:
                <ul style="padding-left: 20px; margin-top: 8px;">
                  <li>Extract raid type and date</li>
                  <li>Check against reset schedule to determine if continuation or new lockout</li>
                  <li>Get player attendance (name in playerStats = present)</li>
                  <li>For each present player with SR+ pick for that raid type: increment their "Times SR+'d" by 1</li>
                  <li>Scan loot array for SR+ item matches</li>
                  <li>For each player who won their SR+ item: clear their SR+ entry, log to history</li>
                  <li>Mark log as processed</li>
                </ul>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Reset Schedule */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("resets")}
        >
          <h2 class="card-title">Reset Schedule (Tel'Abim Server)</h2>
          <span class="card-badge badge-purple">{expandedSection === "resets" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "resets" && (
          <div style="padding: 16px; overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Raids</th>
                  <th>Reset Frequency</th>
                  <th>Reset Day/Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>RAID 40</td>
                  <td>MC, BWL, ES, AQ40, Naxx</td>
                  <td>Weekly</td>
                  <td>Thursday 16:29 ST</td>
                </tr>
                <tr>
                  <td>KARA 40</td>
                  <td>Tower of Karazhan</td>
                  <td>Weekly</td>
                  <td>Wednesday 16:29 ST</td>
                </tr>
                <tr>
                  <td>ONYXIA</td>
                  <td>Onyxia</td>
                  <td>Every 5 days</td>
                  <td>Rolling</td>
                </tr>
                <tr>
                  <td>KARA 10</td>
                  <td>Lower Karazhan</td>
                  <td>Every 5 days</td>
                  <td>Rolling</td>
                </tr>
                <tr>
                  <td>RAID 20</td>
                  <td>ZG, AQ20</td>
                  <td>Every 3 days</td>
                  <td>Rolling</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UI Changes */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("ui")}
        >
          <h2 class="card-title">UI Components</h2>
          <span class="card-badge badge-purple">{expandedSection === "ui" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "ui" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">MySRPortal (Two Tabs)</h3>
            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
              <p style="color: var(--text-secondary);">
                <strong>1. "My SR+" Tab</strong> - User's own picks per raid type. Select raid → see their raidres.top SRs → pick one for SR+. In-app notification when tally increases.
              </p>
              <p style="color: var(--text-secondary); margin-top: 8px;">
                <strong>2. "Guild SR+" Tab</strong> - Read-only view of all players' SR+ status. Filter by raid type. Shows: Player, Item, Times SR+'d, Bonus, Status (HR if ≥ 5).
              </p>
            </div>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Admin SR+ Manager</h3>
            <ul style="color: var(--text-secondary); padding-left: 20px;">
              <li>Raid type tabs (MC, BWL, AQ40, etc.)</li>
              <li>Table: Player | Item | Times SR+'d | Bonus | Status | Edit</li>
              <li>Edit button allows manual adjustment</li>
              <li>All edits logged immutably</li>
              <li>Export CSV button</li>
              <li>Settings panel (bonus per SR, HR threshold)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Cleanup */}
      <div class="card mb-3">
        <div
          class="card-header"
          style="cursor: pointer;"
          onClick={() => toggleSection("cleanup")}
        >
          <h2 class="card-title">Items to Delete</h2>
          <span class="card-badge badge-red">{expandedSection === "cleanup" ? "▼" : "▶"}</span>
        </div>
        {expandedSection === "cleanup" && (
          <div style="padding: 16px;">
            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Database Tables to Remove</h3>
            <ul style="color: var(--text-secondary); padding-left: 20px; margin-bottom: 16px;">
              <li><code>["sr_plus", "credits", ...]</code> - Old broken system</li>
              <li><code>["sr_plus", "runs", ...]</code> - Unused manual run system</li>
              <li><code>["sr_picks", ...]</code> - Old picks format (migrate data first if needed)</li>
            </ul>

            <h3 style="color: var(--text-primary); margin-bottom: 12px;">Admin Page Elements to Remove</h3>
            <ul style="color: var(--text-secondary); padding-left: 20px;">
              <li>"Create New Run from Discord" section</li>
              <li>"Progression Run (requires consumables)" checkbox</li>
              <li>"Recent Runs" table</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

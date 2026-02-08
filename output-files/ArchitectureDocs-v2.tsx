import { useState } from "preact/hooks";

/**
 * Architecture Documentation - Visual System Overview
 * Shows ERD, component relationships, shared modules, and data flows
 */

type Section = "overview" | "erd" | "components" | "api" | "automation";

export default function ArchitectureDocs() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  return (
    <div>
      {/* Section Navigation */}
      <div class="arch-nav">
        <button
          onClick={() => setActiveSection("overview")}
          class={`arch-nav-btn ${activeSection === "overview" ? "active" : ""}`}
        >
          <span class="arch-nav-icon">🏗️</span>
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveSection("erd")}
          class={`arch-nav-btn ${activeSection === "erd" ? "active" : ""}`}
        >
          <span class="arch-nav-icon">🗄️</span>
          <span>Database ERD</span>
        </button>
        <button
          onClick={() => setActiveSection("components")}
          class={`arch-nav-btn ${activeSection === "components" ? "active" : ""}`}
        >
          <span class="arch-nav-icon">🧩</span>
          <span>Components</span>
        </button>
        <button
          onClick={() => setActiveSection("api")}
          class={`arch-nav-btn ${activeSection === "api" ? "active" : ""}`}
        >
          <span class="arch-nav-icon">🔌</span>
          <span>API Routes</span>
        </button>
        <button
          onClick={() => setActiveSection("automation")}
          class={`arch-nav-btn ${activeSection === "automation" ? "active" : ""}`}
        >
          <span class="arch-nav-icon">⚙️</span>
          <span>Automation</span>
        </button>
      </div>

      {activeSection === "overview" && <OverviewSection />}
      {activeSection === "erd" && <ERDSection />}
      {activeSection === "components" && <ComponentsSection />}
      {activeSection === "api" && <APISection />}
      {activeSection === "automation" && <AutomationSection />}

      <style>{`
        .arch-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .arch-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--background-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }
        .arch-nav-btn:hover {
          background: var(--background-secondary);
          color: var(--text-primary);
        }
        .arch-nav-btn.active {
          background: var(--apple-blue);
          border-color: var(--apple-blue);
          color: white;
        }
        .arch-nav-icon {
          font-size: 18px;
        }

        .arch-card {
          background: var(--background-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .arch-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .arch-card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .arch-card-body {
          padding: 20px;
        }

        .erd-container {
          background: var(--background-tertiary);
          border-radius: 8px;
          padding: 24px;
          overflow-x: auto;
        }
        .erd-diagram {
          display: flex;
          flex-direction: column;
          gap: 32px;
          min-width: 800px;
        }
        .erd-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .erd-table {
          background: var(--background-secondary);
          border: 2px solid var(--border-light);
          border-radius: 8px;
          min-width: 220px;
          max-width: 280px;
        }
        .erd-table-header {
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          border-radius: 6px 6px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .erd-table-header.blue { background: rgba(87, 148, 242, 0.2); color: var(--apple-blue); border-bottom: 2px solid var(--apple-blue); }
        .erd-table-header.green { background: rgba(115, 191, 105, 0.2); color: var(--apple-green); border-bottom: 2px solid var(--apple-green); }
        .erd-table-header.purple { background: rgba(184, 119, 217, 0.2); color: var(--apple-purple); border-bottom: 2px solid var(--apple-purple); }
        .erd-table-header.orange { background: rgba(255, 152, 48, 0.2); color: var(--apple-orange); border-bottom: 2px solid var(--apple-orange); }
        .erd-table-header.red { background: rgba(242, 73, 92, 0.2); color: var(--apple-red); border-bottom: 2px solid var(--apple-red); }
        .erd-fields {
          padding: 8px 0;
        }
        .erd-field {
          padding: 6px 16px;
          font-size: 12px;
          font-family: monospace;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .erd-field.pk { color: var(--apple-yellow); font-weight: 600; }
        .erd-field.fk { color: var(--apple-blue); }
        .erd-field-type {
          color: var(--text-tertiary);
          font-size: 11px;
        }

        .erd-connections {
          display: flex;
          justify-content: center;
          padding: 16px 0;
        }
        .erd-arrow {
          color: var(--text-tertiary);
          font-size: 24px;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .component-card {
          background: var(--background-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
        }
        .component-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .component-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .component-icon.island { background: rgba(87, 148, 242, 0.2); }
        .component-icon.shared { background: rgba(115, 191, 105, 0.2); }
        .component-icon.route { background: rgba(184, 119, 217, 0.2); }
        .component-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 14px;
        }
        .component-type {
          font-size: 11px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .component-desc {
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: 12px;
        }
        .component-deps {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .component-dep {
          font-size: 11px;
          padding: 4px 8px;
          background: var(--background-secondary);
          border-radius: 4px;
          color: var(--text-tertiary);
          font-family: monospace;
        }

        .shared-modules {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .shared-module {
          background: linear-gradient(135deg, rgba(115, 191, 105, 0.1) 0%, rgba(115, 191, 105, 0.05) 100%);
          border: 1px solid var(--apple-green);
          border-radius: 8px;
          padding: 16px;
        }
        .shared-module-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .shared-module-icon {
          font-size: 20px;
        }
        .shared-module-name {
          font-weight: 600;
          color: var(--apple-green);
          font-size: 14px;
        }
        .shared-module-desc {
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: 10px;
        }
        .shared-module-used {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .shared-module-used strong {
          color: var(--text-secondary);
        }

        .api-group {
          margin-bottom: 24px;
        }
        .api-group-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .api-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .api-table th {
          text-align: left;
          padding: 10px 12px;
          background: var(--background-tertiary);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .api-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-light);
          color: var(--text-primary);
        }
        .api-table tr:hover td {
          background: var(--background-tertiary);
        }
        .api-method {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .api-method.get { background: rgba(115, 191, 105, 0.2); color: var(--apple-green); }
        .api-method.post { background: rgba(87, 148, 242, 0.2); color: var(--apple-blue); }
        .api-method.put { background: rgba(255, 152, 48, 0.2); color: var(--apple-orange); }
        .api-method.delete { background: rgba(242, 73, 92, 0.2); color: var(--apple-red); }
        .api-route {
          font-family: monospace;
          font-size: 12px;
          color: var(--apple-purple);
        }

        .flow-diagram {
          background: var(--background-tertiary);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .flow-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 16px;
          text-align: center;
        }
        .flow-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto;
        }
        .flow-step {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .flow-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .flow-step-content {
          flex: 1;
          padding: 12px 16px;
          background: var(--background-secondary);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .flow-step-content code {
          background: var(--background-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          color: var(--apple-purple);
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-item {
          background: var(--background-tertiary);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 32px;
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

        @media (max-width: 768px) {
          .arch-nav {
            flex-direction: column;
          }
          .arch-nav-btn {
            justify-content: center;
          }
          .erd-diagram {
            min-width: auto;
          }
          .erd-row {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

function OverviewSection() {
  return (
    <div>
      {/* Stats */}
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">10</div>
          <div class="stat-label">Pages</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">12</div>
          <div class="stat-label">Islands</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">15</div>
          <div class="stat-label">API Routes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">8</div>
          <div class="stat-label">DB Tables</div>
        </div>
      </div>

      {/* Tech Stack */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🛠️</span>
          <h3 class="arch-card-title">Technology Stack</h3>
        </div>
        <div class="arch-card-body">
          <div class="component-grid">
            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">🦕</div>
                <div>
                  <div class="component-name">Deno + Fresh</div>
                  <div class="component-type">Runtime & Framework</div>
                </div>
              </div>
              <div class="component-desc">
                Server-side rendering with islands architecture. TypeScript-first with built-in tooling.
              </div>
            </div>
            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon shared">🗄️</div>
                <div>
                  <div class="component-name">Deno KV</div>
                  <div class="component-type">Database</div>
                </div>
              </div>
              <div class="component-desc">
                Key-value store at <code>/home/opc/tbc-website/data.db</code>. Zero config, built into Deno.
              </div>
            </div>
            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon route">⚛️</div>
                <div>
                  <div class="component-name">Preact</div>
                  <div class="component-type">UI Library</div>
                </div>
              </div>
              <div class="component-desc">
                Lightweight React alternative (3KB). Used for interactive islands only - most pages are static.
              </div>
            </div>
            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">🎭</div>
                <div>
                  <div class="component-name">Playwright</div>
                  <div class="component-type">Scraping</div>
                </div>
              </div>
              <div class="component-desc">
                Browser automation for scraping RaidRes.top and Turtle WoW database for item data.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Level Architecture */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🏛️</span>
          <h3 class="arch-card-title">System Architecture</h3>
        </div>
        <div class="arch-card-body">
          <div class="flow-diagram">
            <pre style="font-family: monospace; font-size: 12px; color: var(--text-secondary); line-height: 1.6; overflow-x: auto;">{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                               │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│  Discord OAuth  │  Raid-Helper    │   RaidRes.top   │  Turtle WoW DB        │
│  (Auth)         │  (Raids API)    │   (Soft Res)    │  (Item Data)          │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         ▼                 ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DENO FRESH SERVER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Routes    │  │   Islands   │  │    API      │  │   Cron Jobs         │ │
│  │  (Pages)    │  │ (Interactive│  │  Handlers   │  │  - SR+ Processor    │ │
│  │             │  │  Components)│  │             │  │  (every 5 min)      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
│         └────────────────┴────────────────┴────────────────────┘            │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         SHARED MODULES                                  ││
│  │  ItemTooltip.tsx  │  Nav.tsx  │  Auth Utils  │  KV Helpers             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DENO KV DATABASE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Sessions   │  │  SR+ System  │  │ Combat Logs  │  │   Item Cache     │ │
│  │  & Profiles  │  │  & History   │  │ & Attendance │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function ERDSection() {
  return (
    <div>
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🗄️</span>
          <h3 class="arch-card-title">Entity Relationship Diagram</h3>
        </div>
        <div class="arch-card-body">
          <div class="erd-container">
            <div class="erd-diagram">
              {/* Row 1: User-related */}
              <div class="erd-row">
                <div class="erd-table">
                  <div class="erd-table-header blue">
                    <span>👤</span> sessions
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 sessionId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">visitorId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">discordId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">discordUsername <span class="erd-field-type">string</span></div>
                    <div class="erd-field">displayName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">expiresAt <span class="erd-field-type">timestamp</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header blue">
                    <span>📋</span> user_profiles
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 discordId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">characters[] <span class="erd-field-type">string[]</span></div>
                    <div class="erd-field">mainCharacter <span class="erd-field-type">string</span></div>
                    <div class="erd-field">isAdmin <span class="erd-field-type">boolean</span></div>
                    <div class="erd-field">createdAt <span class="erd-field-type">timestamp</span></div>
                  </div>
                </div>
              </div>

              <div class="erd-connections">
                <span class="erd-arrow">↓ discordId ↓</span>
              </div>

              {/* Row 2: SR+ System */}
              <div class="erd-row">
                <div class="erd-table">
                  <div class="erd-table-header green">
                    <span>⭐</span> sr_plus/entries
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 [raidType, visitorId] <span class="erd-field-type">composite</span></div>
                    <div class="erd-field fk">visitorId <span class="erd-field-type">→ sessions</span></div>
                    <div class="erd-field">playerName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">raidType <span class="erd-field-type">string</span></div>
                    <div class="erd-field">itemName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">timesSRd <span class="erd-field-type">number</span></div>
                    <div class="erd-field">currentBonus <span class="erd-field-type">number</span></div>
                    <div class="erd-field">lastProcessedLogId <span class="erd-field-type">string</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header green">
                    <span>📜</span> sr_plus/history
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 [visitorId, timestamp] <span class="erd-field-type">composite</span></div>
                    <div class="erd-field fk">visitorId <span class="erd-field-type">→ sessions</span></div>
                    <div class="erd-field">action <span class="erd-field-type">enum</span></div>
                    <div class="erd-field">itemName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">previousValue <span class="erd-field-type">number</span></div>
                    <div class="erd-field">newValue <span class="erd-field-type">number</span></div>
                    <div class="erd-field fk">logId <span class="erd-field-type">→ combat_logs</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header green">
                    <span>⚙️</span> sr_plus/settings
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 "settings" <span class="erd-field-type">singleton</span></div>
                    <div class="erd-field">bonusPerSR <span class="erd-field-type">number (18)</span></div>
                    <div class="erd-field">hardReserveThreshold <span class="erd-field-type">number (5)</span></div>
                  </div>
                </div>
              </div>

              <div class="erd-connections">
                <span class="erd-arrow">↓ logId / playerName ↓</span>
              </div>

              {/* Row 3: Combat & Raids */}
              <div class="erd-row">
                <div class="erd-table">
                  <div class="erd-table-header purple">
                    <span>⚔️</span> combat_logs
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 logId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">raidType <span class="erd-field-type">string</span></div>
                    <div class="erd-field">raidName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">playerStats[] <span class="erd-field-type">PlayerStats[]</span></div>
                    <div class="erd-field">loot[] <span class="erd-field-type">LootDrop[]</span></div>
                    <div class="erd-field">summary <span class="erd-field-type">object</span></div>
                    <div class="erd-field">srPlusProcessed <span class="erd-field-type">boolean</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header purple">
                    <span>📅</span> attendance
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 attendanceId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">raidId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">raidName <span class="erd-field-type">string</span></div>
                    <div class="erd-field">date <span class="erd-field-type">string</span></div>
                    <div class="erd-field">players[] <span class="erd-field-type">string[]</span></div>
                    <div class="erd-field">signups <span class="erd-field-type">number</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header purple">
                    <span>💾</span> raids-saved
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 raidId <span class="erd-field-type">string</span></div>
                    <div class="erd-field">title <span class="erd-field-type">string</span></div>
                    <div class="erd-field">savedAt <span class="erd-field-type">timestamp</span></div>
                    <div class="erd-field">attendanceCount <span class="erd-field-type">number</span></div>
                  </div>
                </div>
              </div>

              <div class="erd-connections">
                <span class="erd-arrow">↓ itemId / itemName ↓</span>
              </div>

              {/* Row 4: Items */}
              <div class="erd-row">
                <div class="erd-table">
                  <div class="erd-table-header orange">
                    <span>🎁</span> items/by_id
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 itemId <span class="erd-field-type">number</span></div>
                    <div class="erd-field">name <span class="erd-field-type">string</span></div>
                    <div class="erd-field">icon <span class="erd-field-type">string</span></div>
                    <div class="erd-field">quality <span class="erd-field-type">number</span></div>
                    <div class="erd-field">tooltipHtml <span class="erd-field-type">string</span></div>
                  </div>
                </div>

                <div class="erd-table">
                  <div class="erd-table-header orange">
                    <span>🔤</span> items/by_name
                  </div>
                  <div class="erd-fields">
                    <div class="erd-field pk">🔑 itemName <span class="erd-field-type">string</span></div>
                    <div class="erd-field fk">itemId <span class="erd-field-type">→ items/by_id</span></div>
                    <div class="erd-field">icon <span class="erd-field-type">string</span></div>
                    <div class="erd-field">quality <span class="erd-field-type">number</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Relationships */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔗</span>
          <h3 class="arch-card-title">Key Relationships</h3>
        </div>
        <div class="arch-card-body">
          <div class="component-grid">
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-blue);">sessions → sr_plus/entries</strong><br/>
                User's Discord ID (visitorId) links their session to their SR+ picks. One entry per raid type per user.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-green);">combat_logs → sr_plus/history</strong><br/>
                When logs are processed, increments/wins are logged with the logId reference.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-purple);">combat_logs.loot → items</strong><br/>
                Loot drops reference items by name. Self-healing lookup finds/caches item data.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-orange);">sr_plus/entries.lastProcessedLogId</strong><br/>
                Prevents double-counting when same log is processed multiple times.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentsSection() {
  return (
    <div>
      {/* Shared Modules */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔄</span>
          <h3 class="arch-card-title">Shared Modules (Used Across Site)</h3>
        </div>
        <div class="arch-card-body">
          <div class="shared-modules">
            <div class="shared-module">
              <div class="shared-module-header">
                <span class="shared-module-icon">🎁</span>
                <span class="shared-module-name">ItemTooltip.tsx</span>
              </div>
              <div class="shared-module-desc">
                WoW-style item tooltips with icons. Self-healing lookup: static JSON → KV cache → Playwright scrape.
              </div>
              <div class="shared-module-used">
                <strong>Used by:</strong> MySRPortal, SRPlusSpreadsheet, SRPlusPublic, Loot, Analysis
              </div>
            </div>

            <div class="shared-module">
              <div class="shared-module-header">
                <span class="shared-module-icon">🧭</span>
                <span class="shared-module-name">Nav.tsx</span>
              </div>
              <div class="shared-module-desc">
                Top navigation bar with responsive mobile menu. Highlights active page.
              </div>
              <div class="shared-module-used">
                <strong>Used by:</strong> All 10 pages
              </div>
            </div>

            <div class="shared-module">
              <div class="shared-module-header">
                <span class="shared-module-icon">🔐</span>
                <span class="shared-module-name">Auth Utilities</span>
              </div>
              <div class="shared-module-desc">
                Session management, Discord OAuth flow, cookie handling.
              </div>
              <div class="shared-module-used">
                <strong>Used by:</strong> MySRPortal, Admin, My SR, API routes
              </div>
            </div>

            <div class="shared-module">
              <div class="shared-module-header">
                <span class="shared-module-icon">🎨</span>
                <span class="shared-module-name">styles.css</span>
              </div>
              <div class="shared-module-desc">
                Global CSS with design tokens, WoW class colors, item quality colors, dark theme.
              </div>
              <div class="shared-module-used">
                <strong>Used by:</strong> All pages and components
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Islands */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🏝️</span>
          <h3 class="arch-card-title">Interactive Islands</h3>
        </div>
        <div class="arch-card-body">
          <div class="component-grid">
            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">⭐</div>
                <div>
                  <div class="component-name">MySRPortal.tsx</div>
                  <div class="component-type">Island</div>
                </div>
              </div>
              <div class="component-desc">
                User's SR+ management. Two tabs: "My SR+" (pick items) and "Guild SR+" (view all).
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/auth/me</span>
                <span class="component-dep">/api/sr-plus/my-picks</span>
                <span class="component-dep">/api/sr-plus/entries</span>
                <span class="component-dep">ItemTooltip</span>
              </div>
            </div>

            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">📊</div>
                <div>
                  <div class="component-name">SRPlusSpreadsheet.tsx</div>
                  <div class="component-type">Island (Admin)</div>
                </div>
              </div>
              <div class="component-desc">
                Admin SR+ manager. Edit entries, view logs, adjust settings, export CSV.
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/sr-plus/entries</span>
                <span class="component-dep">/api/sr-plus/settings</span>
                <span class="component-dep">ItemTooltip</span>
              </div>
            </div>

            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">👥</div>
                <div>
                  <div class="component-name">SRPlusPublic.tsx</div>
                  <div class="component-type">Island</div>
                </div>
              </div>
              <div class="component-desc">
                Public read-only view of all SR+ entries. Filter by raid type.
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/sr-plus/entries</span>
                <span class="component-dep">ItemTooltip</span>
              </div>
            </div>

            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">📝</div>
                <div>
                  <div class="component-name">LogProcessor.tsx</div>
                  <div class="component-type">Island</div>
                </div>
              </div>
              <div class="component-desc">
                Combat log upload. Parses TurtleWoW logs, extracts player stats and loot.
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/logs</span>
              </div>
            </div>

            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">📅</div>
                <div>
                  <div class="component-name">RaidCalendar.tsx</div>
                  <div class="component-type">Island</div>
                </div>
              </div>
              <div class="component-desc">
                Calendar view of upcoming raids from Raid-Helper Discord bot.
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/raids</span>
              </div>
            </div>

            <div class="component-card">
              <div class="component-card-header">
                <div class="component-icon island">📈</div>
                <div>
                  <div class="component-name">AnalysisViewer.tsx</div>
                  <div class="component-type">Island</div>
                </div>
              </div>
              <div class="component-desc">
                Combat log analysis. Deaths, consumables, dispels, CC by player.
              </div>
              <div class="component-deps">
                <span class="component-dep">/api/logs</span>
                <span class="component-dep">ItemTooltip</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Map */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🗺️</span>
          <h3 class="arch-card-title">Page Structure</h3>
        </div>
        <div class="arch-card-body">
          <div class="flow-diagram">
            <pre style="font-family: monospace; font-size: 12px; color: var(--text-secondary); line-height: 1.8; overflow-x: auto;">{`
routes/
├── index.tsx ────────────── Home (RaidCalendar)
├── raids.tsx ────────────── Raid List
├── attendance.tsx ───────── Attendance Tracking
├── loot.tsx ─────────────── Loot Browser (ItemTooltip)
├── logs.tsx ─────────────── Combat Logs (LogProcessor)
├── analysis.tsx ─────────── Log Analysis (AnalysisViewer)
├── sr-plus.tsx ──────────── SR+ Dashboard (SRPlusPublic)
├── my-sr.tsx ────────────── My SR Portal (MySRPortal) [Auth Required]
├── architecture.tsx ─────── This Page (ArchitectureDocs)
└── admin.tsx ────────────── Admin Panel
    └── admin/sr-plus.tsx ── SR+ Manager (SRPlusSpreadsheet) [Admin Only]
            `}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function APISection() {
  return (
    <div>
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔌</span>
          <h3 class="arch-card-title">API Routes</h3>
        </div>
        <div class="arch-card-body">
          {/* Auth */}
          <div class="api-group">
            <div class="api-group-title">
              <span>🔐</span> Authentication
            </div>
            <table class="api-table">
              <thead>
                <tr><th>Method</th><th>Route</th><th>Auth</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/auth/me</td>
                  <td>Session</td>
                  <td>Get current user session</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/auth/discord</td>
                  <td>None</td>
                  <td>Start Discord OAuth flow</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/auth/discord/callback</td>
                  <td>None</td>
                  <td>Discord OAuth callback</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/auth/characters</td>
                  <td>Session</td>
                  <td>Get linked characters</td>
                </tr>
                <tr>
                  <td><span class="api-method put">PUT</span></td>
                  <td class="api-route">/api/auth/characters</td>
                  <td>Session</td>
                  <td>Update linked characters</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SR+ */}
          <div class="api-group">
            <div class="api-group-title">
              <span>⭐</span> SR+ System
            </div>
            <table class="api-table">
              <thead>
                <tr><th>Method</th><th>Route</th><th>Auth</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/sr-plus/entries</td>
                  <td>None</td>
                  <td>List all SR+ entries</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/sr-plus/my-picks</td>
                  <td>Session</td>
                  <td>Get user's SR+ picks</td>
                </tr>
                <tr>
                  <td><span class="api-method post">POST</span></td>
                  <td class="api-route">/api/sr-plus/my-picks</td>
                  <td>Session</td>
                  <td>Set SR+ pick for raid type</td>
                </tr>
                <tr>
                  <td><span class="api-method delete">DEL</span></td>
                  <td class="api-route">/api/sr-plus/my-picks</td>
                  <td>Session</td>
                  <td>Remove SR+ pick</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/sr-plus/settings</td>
                  <td>None</td>
                  <td>Get SR+ settings</td>
                </tr>
                <tr>
                  <td><span class="api-method put">PUT</span></td>
                  <td class="api-route">/api/sr-plus/settings</td>
                  <td>Admin</td>
                  <td>Update SR+ settings</td>
                </tr>
                <tr>
                  <td><span class="api-method post">POST</span></td>
                  <td class="api-route">/api/sr-plus/scrape</td>
                  <td>Session</td>
                  <td>Scrape RaidRes.top for user's SRs</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items */}
          <div class="api-group">
            <div class="api-group-title">
              <span>🎁</span> Items
            </div>
            <table class="api-table">
              <thead>
                <tr><th>Method</th><th>Route</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/items/lookup?name=X</td>
                  <td>Self-healing lookup (static → KV → scrape)</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/items/[id]</td>
                  <td>Get item by ID</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Combat Logs */}
          <div class="api-group">
            <div class="api-group-title">
              <span>⚔️</span> Combat Logs
            </div>
            <table class="api-table">
              <thead>
                <tr><th>Method</th><th>Route</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/logs</td>
                  <td>List all combat logs</td>
                </tr>
                <tr>
                  <td><span class="api-method post">POST</span></td>
                  <td class="api-route">/api/logs</td>
                  <td>Upload and process combat log</td>
                </tr>
                <tr>
                  <td><span class="api-method delete">DEL</span></td>
                  <td class="api-route">/api/logs/[id]</td>
                  <td>Delete combat log</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Raids */}
          <div class="api-group">
            <div class="api-group-title">
              <span>📅</span> Raids & Attendance
            </div>
            <table class="api-table">
              <thead>
                <tr><th>Method</th><th>Route</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/raids</td>
                  <td>Get raids from Raid-Helper</td>
                </tr>
                <tr>
                  <td><span class="api-method get">GET</span></td>
                  <td class="api-route">/api/attendance</td>
                  <td>Get attendance records</td>
                </tr>
                <tr>
                  <td><span class="api-method post">POST</span></td>
                  <td class="api-route">/api/attendance</td>
                  <td>Save attendance for raid</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationSection() {
  return (
    <div>
      {/* SR+ Processor */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">⚙️</span>
          <h3 class="arch-card-title">SR+ Automatic Processor</h3>
        </div>
        <div class="arch-card-body">
          <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Cron job runs every 5 minutes: <code>sr-plus-processor.ts</code>
          </p>

          <div class="flow-diagram">
            <div class="flow-title">Processing Flow</div>
            <div class="flow-steps">
              <div class="flow-step">
                <div class="flow-step-num">1</div>
                <div class="flow-step-content">
                  Fetch all combat logs where <code>srPlusProcessed = false</code>
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">2</div>
                <div class="flow-step-content">
                  Extract raid type from log name (MC, BWL, AQ40, etc.)
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">3</div>
                <div class="flow-step-content">
                  Get attendees from <code>playerStats[]</code> array
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">4</div>
                <div class="flow-step-content">
                  For each SR+ entry matching raid type: check if player attended
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">5</div>
                <div class="flow-step-content">
                  Check <code>loot[]</code> array - did player win their SR+ item?
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">6</div>
                <div class="flow-step-content">
                  <strong>If won:</strong> Delete SR+ entry, log to history with <code>action: "won"</code>
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">7</div>
                <div class="flow-step-content">
                  <strong>If attended but didn't win:</strong> Increment <code>timesSRd++</code>, update <code>currentBonus</code>
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">8</div>
                <div class="flow-step-content">
                  Mark log as <code>srPlusProcessed = true</code> with timestamp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Self-Healing */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔧</span>
          <h3 class="arch-card-title">Item Lookup Self-Healing</h3>
        </div>
        <div class="arch-card-body">
          <div class="flow-diagram">
            <div class="flow-title">Lookup Cascade</div>
            <div class="flow-steps">
              <div class="flow-step">
                <div class="flow-step-num">1</div>
                <div class="flow-step-content">
                  Check <code>item-tooltips.json</code> (7k+ items, static file)
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">2</div>
                <div class="flow-step-content">
                  If missing or no icon → Check <code>["items", "by_name"]</code> in KV
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">3</div>
                <div class="flow-step-content">
                  If still missing → Playwright scrapes <code>database.turtlecraft.gg</code>
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-step-num">4</div>
                <div class="flow-step-content">
                  <strong>Self-heal:</strong> Store result in KV cache AND update static JSON
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Schedule */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔄</span>
          <h3 class="arch-card-title">Raid Reset Schedule (Tel'Abim Server)</h3>
        </div>
        <div class="arch-card-body">
          <table class="api-table">
            <thead>
              <tr><th>Category</th><th>Raids</th><th>Reset</th><th>Time</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="api-method get">40-MAN</span></td>
                <td>MC, BWL, ES, AQ40, Naxx</td>
                <td>Weekly</td>
                <td>Thursday 16:29 ST</td>
              </tr>
              <tr>
                <td><span class="api-method post">KARA 40</span></td>
                <td>Tower of Karazhan</td>
                <td>Weekly</td>
                <td>Wednesday 16:29 ST</td>
              </tr>
              <tr>
                <td><span class="api-method put">ONYXIA</span></td>
                <td>Onyxia's Lair</td>
                <td>5 days</td>
                <td>Rolling</td>
              </tr>
              <tr>
                <td><span class="api-method put">KARA 10</span></td>
                <td>Lower Karazhan</td>
                <td>5 days</td>
                <td>Rolling</td>
              </tr>
              <tr>
                <td><span class="api-method delete">20-MAN</span></td>
                <td>ZG, AQ20</td>
                <td>3 days</td>
                <td>Rolling</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Rules */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">📋</span>
          <h3 class="arch-card-title">SR+ Business Rules</h3>
        </div>
        <div class="arch-card-body">
          <div class="component-grid">
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-blue);">One SR+ Per Raid Type</strong><br/>
                Player can have SR+ in MC AND BWL simultaneously, but only ONE item per raid type.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-green);">Hard Reserve at 5+</strong><br/>
                When <code>timesSRd >= 5</code>, item becomes Hard Reserve status with priority.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-orange);">Reset on Win</strong><br/>
                When player wins their SR+ item, entry is deleted. They pick a new item next raid.
              </div>
            </div>
            <div class="component-card">
              <div class="component-desc" style="margin-bottom: 0;">
                <strong style="color: var(--apple-purple);">Bonus Calculation</strong><br/>
                <code>currentBonus = timesSRd × bonusPerSR</code> (default 18 per raid)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

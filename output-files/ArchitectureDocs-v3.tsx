import { useState } from "preact/hooks";

type Section = "overview" | "erd" | "components" | "api" | "automation";

export default function ArchitectureDocs() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  const handleClick = (section: Section) => {
    console.log("Switching to:", section);
    setActiveSection(section);
  };

  return (
    <div class="arch-container">
      {/* Section Navigation */}
      <div class="arch-nav">
        {[
          { id: "overview", icon: "🏗️", label: "Overview" },
          { id: "erd", icon: "🗄️", label: "Database" },
          { id: "components", icon: "🧩", label: "Components" },
          { id: "api", icon: "🔌", label: "API Routes" },
          { id: "automation", icon: "⚙️", label: "Automation" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleClick(tab.id as Section)}
            class={`arch-nav-btn ${activeSection === tab.id ? "active" : ""}`}
          >
            <span class="arch-nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div class="arch-content">
        {activeSection === "overview" && <OverviewSection />}
        {activeSection === "erd" && <ERDSection />}
        {activeSection === "components" && <ComponentsSection />}
        {activeSection === "api" && <APISection />}
        {activeSection === "automation" && <AutomationSection />}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .arch-container {
    max-width: 1200px;
    margin: 0 auto;
  }
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
    font-family: inherit;
  }
  .arch-nav-btn:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
    transform: translateY(-1px);
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
    background: var(--background-tertiary);
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

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 768px) {
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .stat-item {
    background: linear-gradient(135deg, var(--background-tertiary) 0%, var(--background-secondary) 100%);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  }
  .stat-value {
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--apple-blue), var(--apple-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .stat-label {
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  .tech-card {
    background: var(--background-tertiary);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
  }
  .tech-card:hover {
    border-color: var(--apple-blue);
    transform: translateY(-2px);
  }
  .tech-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .tech-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .tech-icon.blue { background: rgba(87, 148, 242, 0.15); }
  .tech-icon.green { background: rgba(115, 191, 105, 0.15); }
  .tech-icon.purple { background: rgba(184, 119, 217, 0.15); }
  .tech-icon.orange { background: rgba(255, 152, 48, 0.15); }
  .tech-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 16px;
  }
  .tech-type {
    font-size: 11px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tech-desc {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .tech-desc code {
    background: var(--background-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--apple-purple);
  }

  /* Visual Flow Diagram */
  .visual-flow {
    background: var(--background-tertiary);
    border-radius: 12px;
    padding: 32px;
    position: relative;
    overflow: hidden;
  }
  .flow-layer {
    background: var(--background-secondary);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }
  .flow-layer:last-child { margin-bottom: 0; }
  .flow-layer-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-tertiary);
    margin-bottom: 16px;
    font-weight: 600;
  }
  .flow-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }
  .flow-item {
    background: var(--background-tertiary);
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .flow-item.external { border-color: var(--apple-orange); }
  .flow-item.server { border-color: var(--apple-blue); }
  .flow-item.module { border-color: var(--apple-green); }
  .flow-item.db { border-color: var(--apple-purple); }
  .flow-arrow {
    text-align: center;
    padding: 8px 0;
    color: var(--text-tertiary);
    font-size: 20px;
  }

  /* ERD Styles */
  .erd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
  }
  .erd-table {
    background: var(--background-tertiary);
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid var(--border-light);
  }
  .erd-header {
    padding: 14px 16px;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .erd-header.blue { background: linear-gradient(135deg, rgba(87, 148, 242, 0.2) 0%, rgba(87, 148, 242, 0.1) 100%); color: var(--apple-blue); border-bottom: 2px solid var(--apple-blue); }
  .erd-header.green { background: linear-gradient(135deg, rgba(115, 191, 105, 0.2) 0%, rgba(115, 191, 105, 0.1) 100%); color: var(--apple-green); border-bottom: 2px solid var(--apple-green); }
  .erd-header.purple { background: linear-gradient(135deg, rgba(184, 119, 217, 0.2) 0%, rgba(184, 119, 217, 0.1) 100%); color: var(--apple-purple); border-bottom: 2px solid var(--apple-purple); }
  .erd-header.orange { background: linear-gradient(135deg, rgba(255, 152, 48, 0.2) 0%, rgba(255, 152, 48, 0.1) 100%); color: var(--apple-orange); border-bottom: 2px solid var(--apple-orange); }
  .erd-fields {
    padding: 12px 0;
  }
  .erd-field {
    padding: 8px 16px;
    font-size: 12px;
    font-family: ui-monospace, monospace;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .erd-field:hover {
    background: var(--background-secondary);
  }
  .erd-field.pk { color: var(--apple-yellow); font-weight: 600; }
  .erd-field.fk { color: var(--apple-blue); }
  .erd-type {
    font-size: 10px;
    color: var(--text-tertiary);
    background: var(--background-secondary);
    padding: 2px 6px;
    border-radius: 4px;
  }

  /* Shared Modules */
  .module-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .module-card {
    background: linear-gradient(135deg, rgba(115, 191, 105, 0.08) 0%, rgba(115, 191, 105, 0.02) 100%);
    border: 1px solid var(--apple-green);
    border-radius: 12px;
    padding: 20px;
  }
  .module-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .module-icon {
    font-size: 24px;
  }
  .module-name {
    font-weight: 600;
    color: var(--apple-green);
    font-size: 15px;
  }
  .module-desc {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .module-used {
    font-size: 11px;
    color: var(--text-tertiary);
    padding-top: 12px;
    border-top: 1px solid rgba(115, 191, 105, 0.2);
  }
  .module-used strong { color: var(--text-secondary); }

  /* Island Grid */
  .island-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
  .island-card {
    background: var(--background-tertiary);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 20px;
  }
  .island-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .island-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: rgba(87, 148, 242, 0.15);
  }
  .island-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
  }
  .island-type {
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .island-desc {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 14px;
  }
  .island-deps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .island-dep {
    font-size: 10px;
    padding: 4px 8px;
    background: var(--background-secondary);
    border-radius: 4px;
    color: var(--apple-purple);
    font-family: ui-monospace, monospace;
  }

  /* API Table */
  .api-section {
    margin-bottom: 28px;
  }
  .api-section:last-child { margin-bottom: 0; }
  .api-section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .api-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
  }
  .api-table th {
    text-align: left;
    padding: 12px 14px;
    background: var(--background-tertiary);
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-light);
  }
  .api-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-light);
    color: var(--text-primary);
  }
  .api-table tr:hover td {
    background: var(--background-tertiary);
  }
  .method {
    font-size: 10px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .method.get { background: rgba(115, 191, 105, 0.15); color: var(--apple-green); }
  .method.post { background: rgba(87, 148, 242, 0.15); color: var(--apple-blue); }
  .method.put { background: rgba(255, 152, 48, 0.15); color: var(--apple-orange); }
  .method.del { background: rgba(242, 73, 92, 0.15); color: var(--apple-red); }
  .route {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: var(--apple-purple);
  }

  /* Flow Steps */
  .flow-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 700px;
    margin: 0 auto;
  }
  .flow-step {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  .flow-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--apple-blue), var(--apple-purple));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .flow-content {
    flex: 1;
    padding: 14px 18px;
    background: var(--background-secondary);
    border: 1px solid var(--border-light);
    border-radius: 10px;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .flow-content code {
    background: var(--background-tertiary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--apple-purple);
  }
  .flow-content strong {
    color: var(--text-primary);
  }

  /* Rules Grid */
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .rule-card {
    background: var(--background-tertiary);
    border-left: 3px solid var(--apple-blue);
    border-radius: 0 8px 8px 0;
    padding: 16px 20px;
  }
  .rule-card.green { border-left-color: var(--apple-green); }
  .rule-card.orange { border-left-color: var(--apple-orange); }
  .rule-card.purple { border-left-color: var(--apple-purple); }
  .rule-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
    margin-bottom: 6px;
  }
  .rule-desc {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .rule-desc code {
    background: var(--background-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--apple-purple);
  }

  @media (max-width: 768px) {
    .arch-nav { flex-direction: column; }
    .arch-nav-btn { justify-content: center; }
    .erd-grid, .module-grid, .island-grid, .rules-grid { grid-template-columns: 1fr; }
  }
`;

function OverviewSection() {
  return (
    <>
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
          <div class="tech-grid">
            <div class="tech-card">
              <div class="tech-header">
                <div class="tech-icon blue">🦕</div>
                <div>
                  <div class="tech-name">Deno + Fresh</div>
                  <div class="tech-type">Runtime & Framework</div>
                </div>
              </div>
              <div class="tech-desc">
                Server-side rendering with islands architecture. TypeScript-first with built-in tooling.
              </div>
            </div>
            <div class="tech-card">
              <div class="tech-header">
                <div class="tech-icon green">🗄️</div>
                <div>
                  <div class="tech-name">Deno KV</div>
                  <div class="tech-type">Database</div>
                </div>
              </div>
              <div class="tech-desc">
                Key-value store at <code>./data.db</code>. Zero config, built into Deno runtime.
              </div>
            </div>
            <div class="tech-card">
              <div class="tech-header">
                <div class="tech-icon purple">⚛️</div>
                <div>
                  <div class="tech-name">Preact</div>
                  <div class="tech-type">UI Library</div>
                </div>
              </div>
              <div class="tech-desc">
                Lightweight React alternative (3KB). Used for interactive islands only.
              </div>
            </div>
            <div class="tech-card">
              <div class="tech-header">
                <div class="tech-icon orange">🎭</div>
                <div>
                  <div class="tech-name">Playwright</div>
                  <div class="tech-type">Scraping</div>
                </div>
              </div>
              <div class="tech-desc">
                Browser automation for scraping RaidRes.top and Turtle WoW database.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Architecture Flow */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🏛️</span>
          <h3 class="arch-card-title">System Architecture</h3>
        </div>
        <div class="arch-card-body">
          <div class="visual-flow">
            <div class="flow-layer">
              <div class="flow-layer-title">External Services</div>
              <div class="flow-items">
                <div class="flow-item external">🔐 Discord OAuth</div>
                <div class="flow-item external">📅 Raid-Helper API</div>
                <div class="flow-item external">🎯 RaidRes.top</div>
                <div class="flow-item external">🐢 Turtle WoW DB</div>
              </div>
            </div>

            <div class="flow-arrow">↓</div>

            <div class="flow-layer">
              <div class="flow-layer-title">Deno Fresh Server</div>
              <div class="flow-items">
                <div class="flow-item server">📄 Routes (Pages)</div>
                <div class="flow-item server">🏝️ Islands (Interactive)</div>
                <div class="flow-item server">🔌 API Handlers</div>
                <div class="flow-item server">⏰ Cron Jobs</div>
              </div>
            </div>

            <div class="flow-arrow">↓</div>

            <div class="flow-layer">
              <div class="flow-layer-title">Shared Modules</div>
              <div class="flow-items">
                <div class="flow-item module">🎁 ItemTooltip</div>
                <div class="flow-item module">🧭 Nav</div>
                <div class="flow-item module">🔐 Auth Utils</div>
                <div class="flow-item module">🎨 styles.css</div>
              </div>
            </div>

            <div class="flow-arrow">↓</div>

            <div class="flow-layer">
              <div class="flow-layer-title">Deno KV Database</div>
              <div class="flow-items">
                <div class="flow-item db">👤 Sessions</div>
                <div class="flow-item db">⭐ SR+ System</div>
                <div class="flow-item db">⚔️ Combat Logs</div>
                <div class="flow-item db">🎁 Item Cache</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ERDSection() {
  return (
    <>
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🗄️</span>
          <h3 class="arch-card-title">Database Tables</h3>
        </div>
        <div class="arch-card-body">
          <div class="erd-grid">
            {/* Sessions */}
            <div class="erd-table">
              <div class="erd-header blue">
                <span>👤</span> sessions
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 sessionId <span class="erd-type">string</span></div>
                <div class="erd-field">visitorId <span class="erd-type">string</span></div>
                <div class="erd-field">discordId <span class="erd-type">string</span></div>
                <div class="erd-field">discordUsername <span class="erd-type">string</span></div>
                <div class="erd-field">displayName <span class="erd-type">string</span></div>
                <div class="erd-field">expiresAt <span class="erd-type">timestamp</span></div>
              </div>
            </div>

            {/* User Profiles */}
            <div class="erd-table">
              <div class="erd-header blue">
                <span>📋</span> user_profiles
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 discordId <span class="erd-type">string</span></div>
                <div class="erd-field">characters[] <span class="erd-type">string[]</span></div>
                <div class="erd-field">mainCharacter <span class="erd-type">string</span></div>
                <div class="erd-field">isAdmin <span class="erd-type">boolean</span></div>
                <div class="erd-field">createdAt <span class="erd-type">timestamp</span></div>
              </div>
            </div>

            {/* SR+ Entries */}
            <div class="erd-table">
              <div class="erd-header green">
                <span>⭐</span> sr_plus/entries
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 [raidType, visitorId] <span class="erd-type">composite</span></div>
                <div class="erd-field fk">visitorId <span class="erd-type">→ sessions</span></div>
                <div class="erd-field">playerName <span class="erd-type">string</span></div>
                <div class="erd-field">itemName <span class="erd-type">string</span></div>
                <div class="erd-field">timesSRd <span class="erd-type">number</span></div>
                <div class="erd-field">currentBonus <span class="erd-type">number</span></div>
              </div>
            </div>

            {/* SR+ History */}
            <div class="erd-table">
              <div class="erd-header green">
                <span>📜</span> sr_plus/history
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 [visitorId, timestamp] <span class="erd-type">composite</span></div>
                <div class="erd-field">action <span class="erd-type">enum</span></div>
                <div class="erd-field">itemName <span class="erd-type">string</span></div>
                <div class="erd-field">previousValue <span class="erd-type">number</span></div>
                <div class="erd-field">newValue <span class="erd-type">number</span></div>
                <div class="erd-field fk">logId <span class="erd-type">→ combat_logs</span></div>
              </div>
            </div>

            {/* Combat Logs */}
            <div class="erd-table">
              <div class="erd-header purple">
                <span>⚔️</span> combat_logs
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 logId <span class="erd-type">string</span></div>
                <div class="erd-field">raidType <span class="erd-type">string</span></div>
                <div class="erd-field">raidName <span class="erd-type">string</span></div>
                <div class="erd-field">playerStats[] <span class="erd-type">array</span></div>
                <div class="erd-field">loot[] <span class="erd-type">array</span></div>
                <div class="erd-field">srPlusProcessed <span class="erd-type">boolean</span></div>
              </div>
            </div>

            {/* Attendance */}
            <div class="erd-table">
              <div class="erd-header purple">
                <span>📅</span> attendance
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 attendanceId <span class="erd-type">string</span></div>
                <div class="erd-field">raidId <span class="erd-type">string</span></div>
                <div class="erd-field">raidName <span class="erd-type">string</span></div>
                <div class="erd-field">date <span class="erd-type">string</span></div>
                <div class="erd-field">players[] <span class="erd-type">string[]</span></div>
              </div>
            </div>

            {/* Items by ID */}
            <div class="erd-table">
              <div class="erd-header orange">
                <span>🎁</span> items/by_id
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 itemId <span class="erd-type">number</span></div>
                <div class="erd-field">name <span class="erd-type">string</span></div>
                <div class="erd-field">icon <span class="erd-type">string</span></div>
                <div class="erd-field">quality <span class="erd-type">number</span></div>
                <div class="erd-field">tooltipHtml <span class="erd-type">string</span></div>
              </div>
            </div>

            {/* Items by Name */}
            <div class="erd-table">
              <div class="erd-header orange">
                <span>🔤</span> items/by_name
              </div>
              <div class="erd-fields">
                <div class="erd-field pk">🔑 itemName <span class="erd-type">string</span></div>
                <div class="erd-field fk">itemId <span class="erd-type">→ items/by_id</span></div>
                <div class="erd-field">icon <span class="erd-type">string</span></div>
                <div class="erd-field">quality <span class="erd-type">number</span></div>
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
          <div class="rules-grid">
            <div class="rule-card">
              <div class="rule-title">sessions → sr_plus/entries</div>
              <div class="rule-desc">User's Discord ID (visitorId) links their session to SR+ picks. One entry per raid type.</div>
            </div>
            <div class="rule-card green">
              <div class="rule-title">combat_logs → sr_plus/history</div>
              <div class="rule-desc">When logs are processed, increments/wins are logged with the logId reference.</div>
            </div>
            <div class="rule-card orange">
              <div class="rule-title">combat_logs.loot → items</div>
              <div class="rule-desc">Loot drops reference items by name. Self-healing lookup finds/caches item data.</div>
            </div>
            <div class="rule-card purple">
              <div class="rule-title">lastProcessedLogId</div>
              <div class="rule-desc">Prevents double-counting when same log is processed multiple times.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ComponentsSection() {
  return (
    <>
      {/* Shared Modules */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔄</span>
          <h3 class="arch-card-title">Shared Modules (Used Across Site)</h3>
        </div>
        <div class="arch-card-body">
          <div class="module-grid">
            <div class="module-card">
              <div class="module-header">
                <span class="module-icon">🎁</span>
                <span class="module-name">ItemTooltip.tsx</span>
              </div>
              <div class="module-desc">
                WoW-style item tooltips with icons. Self-healing lookup: static JSON → KV cache → Playwright scrape.
              </div>
              <div class="module-used">
                <strong>Used by:</strong> MySRPortal, SRPlusSpreadsheet, SRPlusPublic, Loot, Analysis
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <span class="module-icon">🧭</span>
                <span class="module-name">Nav.tsx</span>
              </div>
              <div class="module-desc">
                Top navigation bar with responsive mobile menu. Highlights active page.
              </div>
              <div class="module-used">
                <strong>Used by:</strong> All 10 pages
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <span class="module-icon">🔐</span>
                <span class="module-name">Auth Utilities</span>
              </div>
              <div class="module-desc">
                Session management, Discord OAuth flow, cookie handling.
              </div>
              <div class="module-used">
                <strong>Used by:</strong> MySRPortal, Admin, My SR, API routes
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <span class="module-icon">🎨</span>
                <span class="module-name">styles.css</span>
              </div>
              <div class="module-desc">
                Global CSS with design tokens, WoW class colors, item quality colors, dark theme.
              </div>
              <div class="module-used">
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
          <div class="island-grid">
            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">⭐</div>
                <div>
                  <div class="island-name">MySRPortal.tsx</div>
                  <div class="island-type">Island</div>
                </div>
              </div>
              <div class="island-desc">
                User's SR+ management. Two tabs: "My SR+" (pick items) and "Guild SR+" (view all).
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/auth/me</span>
                <span class="island-dep">/api/sr-plus/my-picks</span>
                <span class="island-dep">ItemTooltip</span>
              </div>
            </div>

            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">📊</div>
                <div>
                  <div class="island-name">SRPlusSpreadsheet.tsx</div>
                  <div class="island-type">Island (Admin)</div>
                </div>
              </div>
              <div class="island-desc">
                Admin SR+ manager. Edit entries, view logs, adjust settings, export CSV.
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/sr-plus/entries</span>
                <span class="island-dep">/api/sr-plus/settings</span>
              </div>
            </div>

            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">📝</div>
                <div>
                  <div class="island-name">LogProcessor.tsx</div>
                  <div class="island-type">Island</div>
                </div>
              </div>
              <div class="island-desc">
                Combat log upload. Parses TurtleWoW logs, extracts player stats and loot.
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/logs</span>
              </div>
            </div>

            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">📅</div>
                <div>
                  <div class="island-name">RaidCalendar.tsx</div>
                  <div class="island-type">Island</div>
                </div>
              </div>
              <div class="island-desc">
                Calendar view of upcoming raids from Raid-Helper Discord bot.
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/raids</span>
              </div>
            </div>

            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">📈</div>
                <div>
                  <div class="island-name">AnalysisViewer.tsx</div>
                  <div class="island-type">Island</div>
                </div>
              </div>
              <div class="island-desc">
                Combat log analysis. Deaths, consumables, dispels, CC by player.
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/logs</span>
                <span class="island-dep">ItemTooltip</span>
              </div>
            </div>

            <div class="island-card">
              <div class="island-header">
                <div class="island-icon">👥</div>
                <div>
                  <div class="island-name">SRPlusPublic.tsx</div>
                  <div class="island-type">Island</div>
                </div>
              </div>
              <div class="island-desc">
                Public read-only view of all SR+ entries. Filter by raid type.
              </div>
              <div class="island-deps">
                <span class="island-dep">/api/sr-plus/entries</span>
                <span class="island-dep">ItemTooltip</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function APISection() {
  return (
    <div class="arch-card">
      <div class="arch-card-header">
        <span style="font-size: 20px;">🔌</span>
        <h3 class="arch-card-title">API Routes</h3>
      </div>
      <div class="arch-card-body">
        {/* Auth */}
        <div class="api-section">
          <div class="api-section-title">
            <span>🔐</span> Authentication
          </div>
          <table class="api-table">
            <thead>
              <tr><th>Method</th><th>Route</th><th>Auth</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/auth/me</td>
                <td>Session</td>
                <td>Get current user session</td>
              </tr>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/auth/discord</td>
                <td>None</td>
                <td>Start Discord OAuth flow</td>
              </tr>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/auth/discord/callback</td>
                <td>None</td>
                <td>Discord OAuth callback</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SR+ */}
        <div class="api-section">
          <div class="api-section-title">
            <span>⭐</span> SR+ System
          </div>
          <table class="api-table">
            <thead>
              <tr><th>Method</th><th>Route</th><th>Auth</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/sr-plus/entries</td>
                <td>None</td>
                <td>List all SR+ entries</td>
              </tr>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/sr-plus/my-picks</td>
                <td>Session</td>
                <td>Get user's SR+ picks</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="route">/api/sr-plus/my-picks</td>
                <td>Session</td>
                <td>Set SR+ pick for raid type</td>
              </tr>
              <tr>
                <td><span class="method del">DEL</span></td>
                <td class="route">/api/sr-plus/my-picks</td>
                <td>Session</td>
                <td>Remove SR+ pick</td>
              </tr>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/sr-plus/settings</td>
                <td>None</td>
                <td>Get SR+ settings</td>
              </tr>
              <tr>
                <td><span class="method put">PUT</span></td>
                <td class="route">/api/sr-plus/settings</td>
                <td>Admin</td>
                <td>Update SR+ settings</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items */}
        <div class="api-section">
          <div class="api-section-title">
            <span>🎁</span> Items
          </div>
          <table class="api-table">
            <thead>
              <tr><th>Method</th><th>Route</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/items/lookup?name=X</td>
                <td>Self-healing lookup (static → KV → scrape)</td>
              </tr>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/items/[id]</td>
                <td>Get item by ID</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Logs */}
        <div class="api-section">
          <div class="api-section-title">
            <span>⚔️</span> Combat Logs
          </div>
          <table class="api-table">
            <thead>
              <tr><th>Method</th><th>Route</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="route">/api/logs</td>
                <td>List all combat logs</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="route">/api/logs</td>
                <td>Upload and process combat log</td>
              </tr>
              <tr>
                <td><span class="method del">DEL</span></td>
                <td class="route">/api/logs/[id]</td>
                <td>Delete combat log</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AutomationSection() {
  return (
    <>
      {/* SR+ Processor */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">⚙️</span>
          <h3 class="arch-card-title">SR+ Automatic Processor</h3>
        </div>
        <div class="arch-card-body">
          <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Cron job runs every <strong>5 minutes</strong>: <code style="background: var(--background-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px; color: var(--apple-purple);">sr-plus-processor.ts</code>
          </p>

          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-num">1</div>
              <div class="flow-content">
                Fetch all combat logs where <code>srPlusProcessed = false</code>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">2</div>
              <div class="flow-content">
                Extract raid type from log name (MC, BWL, AQ40, ZG, etc.)
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">3</div>
              <div class="flow-content">
                Get attendees from <code>playerStats[]</code> array
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">4</div>
              <div class="flow-content">
                For each SR+ entry matching raid type: check if player attended
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">5</div>
              <div class="flow-content">
                Check <code>loot[]</code> array - did player win their SR+ item?
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">6</div>
              <div class="flow-content">
                <strong>If won:</strong> Delete SR+ entry, log to history with <code>action: "won"</code>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">7</div>
              <div class="flow-content">
                <strong>If attended but didn't win:</strong> Increment <code>timesSRd++</code> and update <code>currentBonus</code>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">8</div>
              <div class="flow-content">
                Mark log as <code>srPlusProcessed = true</code> with timestamp
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
          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-num">1</div>
              <div class="flow-content">
                Check <code>item-tooltips.json</code> (7k+ items, static file)
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">2</div>
              <div class="flow-content">
                If missing or no icon → Check <code>["items", "by_name"]</code> in KV cache
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">3</div>
              <div class="flow-content">
                If still missing → Playwright scrapes <code>database.turtlecraft.gg</code>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-num">4</div>
              <div class="flow-content">
                <strong>Self-heal:</strong> Store result in KV cache AND update static JSON
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Rules */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">📋</span>
          <h3 class="arch-card-title">SR+ Business Rules</h3>
        </div>
        <div class="arch-card-body">
          <div class="rules-grid">
            <div class="rule-card">
              <div class="rule-title">One SR+ Per Raid Type</div>
              <div class="rule-desc">Player can have SR+ in MC AND BWL simultaneously, but only ONE item per raid type.</div>
            </div>
            <div class="rule-card green">
              <div class="rule-title">Hard Reserve at 5+</div>
              <div class="rule-desc">When <code>timesSRd {">="} 5</code>, item becomes Hard Reserve status with priority.</div>
            </div>
            <div class="rule-card orange">
              <div class="rule-title">Reset on Win</div>
              <div class="rule-desc">When player wins their SR+ item, entry is deleted. They pick a new item next raid.</div>
            </div>
            <div class="rule-card purple">
              <div class="rule-title">Bonus Calculation</div>
              <div class="rule-desc"><code>currentBonus = timesSRd × bonusPerSR</code> (default 18 per raid)</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

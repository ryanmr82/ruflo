import { useState } from "preact/hooks";
import LogReconciliation from "./LogReconciliation.tsx";

type Section = "overview" | "changelog" | "sitemap" | "erd" | "components" | "api" | "automation" | "integrations" | "dataflows" | "future" | "reconcile";

interface ChangelogEntry {
  date: string;
  title: string;
  type: string;
  items: string[];
}

interface ArchitectureDocsProps {
  data: {
    overview: any;
    changelog: any;
    sitemap: any;
    database: any;
    components: any;
    apiRoutes: any;
    integrations: any;
    dataflows: any;
    automation: any;
    futureEnhancements: any;
  };
}

export default function ArchitectureDocs({ data }: ArchitectureDocsProps) {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  // Format ISO timestamp to readable format
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleClick = (section: Section) => {
    console.log("Switching to:", section);
    setActiveSection(section);
  };

  // Get timestamp for active section
  const getLastUpdated = (): string => {
    const sectionDataMap: Record<Section, any> = {
      "overview": data.overview,
      "sitemap": data.sitemap,
      "erd": data.database,
      "components": data.components,
      "api": data.apiRoutes,
      "integrations": data.integrations,
      "dataflows": data.dataflows,
      "automation": data.automation,
      "changelog": data.changelog,
      "future": data.futureEnhancements
    };

    const sectionData = sectionDataMap[activeSection];
    if (sectionData?.lastUpdated) {
      return formatTimestamp(sectionData.lastUpdated);
    }
    return "";
  };

  return (
    <div class="arch-container">
      {/* Section Navigation */}
      <div class="arch-nav">
        {[
          { id: "overview", icon: "🏗️", label: "Overview" },
          { id: "changelog", icon: "📝", label: "Recent Updates" },
          { id: "sitemap", icon: "🗺️", label: "Site Map" },
          { id: "erd", icon: "🗄️", label: "Database" },
          { id: "components", icon: "🧩", label: "Components" },
          { id: "api", icon: "🔌", label: "API Routes" },
          { id: "integrations", icon: "🔗", label: "Integrations" },
          { id: "dataflows", icon: "🔄", label: "Data Flows" },
          { id: "automation", icon: "⚙️", label: "Automation" },
          { id: "reconcile", icon: "🔧", label: "Log Reconciliation" },
          { id: "future", icon: "🚀", label: "Future Enhancements" },
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

      {getLastUpdated() && (
        <div class="last-updated">
          Last Updated: {getLastUpdated()}
        </div>
      )}

      <div class="arch-content">
        {activeSection === "overview" && <OverviewSection data={data.overview} />}
        {activeSection === "changelog" && <ChangelogSection data={data.changelog} />}
        {activeSection === "sitemap" && <SiteMapSection data={data.sitemap} />}
        {activeSection === "erd" && <ERDSection data={data.database} />}
        {activeSection === "components" && <ComponentsSection data={data.components} />}
        {activeSection === "api" && <APISection data={data.apiRoutes} />}
        {activeSection === "integrations" && <IntegrationsSection data={data.integrations} />}
        {activeSection === "dataflows" && <DataFlowsSection data={data.dataflows} />}
        {activeSection === "automation" && <AutomationSection data={data.automation} />}
        {activeSection === "reconcile" && <LogReconciliation />}
        {activeSection === "future" && <FutureEnhancementsSection data={data.futureEnhancements} />}
      </div>

    </div>
  );
}


function OverviewSection({ data }: { data: any }) {
  if (!data || !data.stats) {
    return <div style="padding: 20px;">No overview data available</div>;
  }

  const overviewData = data;

  return (
    <>
      {/* Stats */}
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.pages}</div>
          <div class="stat-label">Pages</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.islands}</div>
          <div class="stat-label">Islands</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.apiRoutes}</div>
          <div class="stat-label">API Routes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.components}</div>
          <div class="stat-label">Components</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.utilities}</div>
          <div class="stat-label">Utilities</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{overviewData.stats.databaseKeys}</div>
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
            {overviewData.techStack.map((tech: any) => (
              <div key={tech.name} class="tech-card">
                <div class="tech-header">
                  <div class={`tech-icon ${tech.color}`}>{tech.icon}</div>
                  <div>
                    <div class="tech-name">{tech.name}</div>
                    <div class="tech-type">{tech.type}</div>
                  </div>
                </div>
                <div class="tech-desc" dangerouslySetInnerHTML={{ __html: tech.description }} />
              </div>
            ))}
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
              <div class="flow-layer-title">Shared Modules & Utilities</div>
              <div class="flow-items">
                <div class="flow-item module">🎁 ItemTooltip</div>
                <div class="flow-item module">🧭 Nav</div>
                <div class="flow-item module">🔐 Auth Utils</div>
                <div class="flow-item module">📦 utils/</div>
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

function ChangelogSection({ data }: { data: any }) {
  // Handle new structure with "entries" field or legacy array format
  const changelog = data.entries || data || [];

  // Helper function to get badge type from string
  const getBadgeType = (type: string): string => {
    const typeMap: Record<string, string> = {
      "Bug Fix": "Bug Fix",
      "UX Enhancement": "New Feature",
      "DevOps": "New Feature",
      "Critical": "Critical",
      "Feature": "New Feature",
      "Performance": "Performance",
      "Refactor": "Code Quality"
    };
    return typeMap[type] || "New Feature";
  };

  return (
    <>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        {changelog.map((entry, index) => (
          <div
            key={index}
            style="padding: 16px; background: var(--background-tertiary); border-radius: 8px; border-left: 3px solid var(--apple-blue);"
          >
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background: var(--apple-blue); color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                {getBadgeType(entry.type)}
              </span>
              {(entry as any).source && (
                <span style={`background: ${(entry as any).source === 'manual' ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;`}>
                  {(entry as any).source === 'manual' ? '✓ Manual' : '🤖 AI Generated'}
                </span>
              )}
              <span style="font-weight: 600; color: var(--text-primary);">
                {entry.date} - {entry.title}
              </span>
            </div>
            <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
              {entry.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function ERDSection({ data }: { data: any }) {
  if (!data || !data.tables) {
    return <div style="padding: 20px;">No database schema available</div>;
  }

  const databaseData = data;

  return (
    <>
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🗄️</span>
          <h3 class="arch-card-title">Database Tables</h3>
        </div>
        <div class="arch-card-body">
          <div class="erd-grid">
            {databaseData.tables.map((table: any) => (
              <div key={table.name} class="erd-table">
                <div class={`erd-header ${table.color}`}>
                  <span>{table.icon}</span> {table.name}
                </div>
                <div class="erd-fields">
                  {table.fields.map((field: any) => (
                    <div
                      key={field.name}
                      class={`erd-field ${field.isPrimaryKey ? 'pk' : ''} ${field.isForeignKey ? 'fk' : ''}`}
                    >
                      {field.isPrimaryKey && '🔑 '}{field.name} <span class="erd-type">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

function ComponentsSection({ data }: { data: any }) {
  if (!data || !data.sections) {
    return <div style="padding: 20px;">No components data available</div>;
  }

  const componentsData = data;

  return (
    <>
      {componentsData.sections.map((section: any, idx: number) => {
        if (section.type === 'modules') {
          return (
            <div key={idx} class="arch-card">
              <div class="arch-card-header">
                <span style="font-size: 20px;">{section.icon}</span>
                <h3 class="arch-card-title">{section.title}</h3>
              </div>
              <div class="arch-card-body">
                <div class="module-grid">
                  {section.modules.map((mod: any, midx: number) => (
                    <div key={midx} class="module-card">
                      <div class="module-header">
                        <span class="module-icon">{mod.icon}</span>
                        <span class="module-name">{mod.name}</span>
                      </div>
                      <div class="module-desc" dangerouslySetInnerHTML={{ __html: mod.description }}></div>
                      <div class="module-used">
                        <strong>Used by:</strong> {mod.usedBy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        } else if (section.type === 'performance') {
          return (
            <div key={idx} class="arch-card">
              <div class="arch-card-header">
                <span style="font-size: 20px;">{section.icon}</span>
                <h3 class="arch-card-title">{section.title}</h3>
              </div>
              <div class="arch-card-body">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                  {section.description}
                </p>
                <div class="module-grid">
                  {section.optimizations.map((opt: any, oidx: number) => (
                    <div key={oidx} class="module-card" style={`border-left: 3px solid ${opt.color};`}>
                      <div class="module-header">
                        <span class="module-icon">{opt.icon}</span>
                        <span class="module-name">{opt.name}</span>
                      </div>
                      <div class="module-desc" style="margin-bottom: 8px;" dangerouslySetInnerHTML={{ __html: opt.description }}></div>
                      <div style={`background: rgba(${opt.color === '#10b981' ? '16, 185, 129' : opt.color === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.1); padding: 8px; border-radius: 4px; font-size: 12px; color: ${opt.color};`}>
                        {opt.statusText}
                      </div>
                    </div>
                  ))}
                </div>
                {section.summary && (
                  <div style="margin-top: 24px; padding: 16px; background: rgba(6, 182, 212, 0.1); border-left: 3px solid #06b6d4; border-radius: 4px;">
                    <h4 style="color: #06b6d4; margin: 0 0 8px 0; font-size: 14px;">{section.summary.title}</h4>
                    <div style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
                      {section.summary.metrics.map((metric: string, midx: number) => (
                        <span key={midx} dangerouslySetInnerHTML={{ __html: metric + (midx < section.summary.metrics.length - 1 ? '<br/>' : '') }}></span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        } else if (section.type === 'islands') {
          return (
            <div key={idx} class="arch-card">
              <div class="arch-card-header">
                <span style="font-size: 20px;">{section.icon}</span>
                <h3 class="arch-card-title">{section.title}</h3>
              </div>
              <div class="arch-card-body">
                <div class="island-grid">
                  {section.islands.map((island: any, iidx: number) => (
                    <div key={iidx} class="island-card">
                      <div class="island-header">
                        <div class="island-icon">{island.icon}</div>
                        <div>
                          <div class="island-name">{island.name}</div>
                          <div class="island-type">{island.type}</div>
                        </div>
                      </div>
                      <div class="island-desc">{island.description}</div>
                      {island.dependencies && island.dependencies.length > 0 && (
                        <div class="island-deps">
                          {island.dependencies.map((dep: string, didx: number) => (
                            <span key={didx} class="island-dep">{dep}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

function APISection({ data }: { data: any }) {
  if (!data || !data.categories) {
    return <div style="padding: 20px;">No API routes data available</div>;
  }

  const apiData = data;

  const totalRoutes = apiData.categories.reduce((sum: number, cat: any) => sum + cat.routes.length, 0);

  return (
    <div class="arch-card">
      <div class="arch-card-header">
        <span style="font-size: 20px;">🔌</span>
        <h3 class="arch-card-title">API Routes ({totalRoutes} Total)</h3>
      </div>
      <div class="arch-card-body">
        {apiData.categories.map((category: any, idx: number) => (
          <div key={idx} class="api-section">
            <div class="api-section-title">
              <span>{category.icon}</span> {category.title}
            </div>
            <table class="api-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Route</th>
                  {category.routes.some((r: any) => r.auth) && <th>Auth</th>}
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {category.routes.map((route: any, ridx: number) => (
                  <tr key={ridx}>
                    <td><span class={`method ${route.method.toLowerCase()}`}>{route.method}</span></td>
                    <td class="route">{route.route}</td>
                    {category.routes.some((r: any) => r.auth) && <td>{route.auth || ''}</td>}
                    <td>{route.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteMapSection({ data }: { data: any }) {
  if (!data || !data.pages || !data.islands) {
    return <div style="padding: 20px;">No sitemap data available</div>;
  }

  const sitemapData = data;

  // Filter out internal pages (_app, _404, etc.)
  const publicPages = sitemapData.pages.filter((page: any) =>
    !page.route.startsWith('/_') &&
    page.route !== '/_404' &&
    page.description
  );

  return (
    <>
      {/* Public Pages */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">📄</span>
          <h3 class="arch-card-title">Public Pages ({publicPages.length} Total)</h3>
        </div>
        <div class="arch-card-body">
          <div class="rules-grid">
            {publicPages.map((page: any, idx: number) => (
              <div key={idx} class={`rule-card ${page.color || ''}`}>
                <div class="rule-title">{page.route}</div>
                <div class="rule-desc">{page.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Islands */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🏝️</span>
          <h3 class="arch-card-title">Interactive Islands ({sitemapData.islands.length} Total)</h3>
        </div>
        <div class="arch-card-body">
          <div class="island-grid">
            {sitemapData.islands.map((island: any, idx: number) => (
              <div key={idx} class="island-card">
                <div class="island-header">
                  <div class="island-icon">{island.icon}</div>
                  <div>
                    <div class="island-name">{island.name}</div>
                    <div class="island-type">{island.type}</div>
                  </div>
                </div>
                <div class="island-desc">{island.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
function IntegrationsSection({ data }: { data: any }) {
  if (!data || !data.services) {
    return <div style="padding: 20px;">No integrations data available</div>;
  }

  const integrationsData = data;

  return (
    <>
      {/* External Services */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🌐</span>
          <h3 class="arch-card-title">External Service Integrations</h3>
        </div>
        <div class="arch-card-body">
          <div class="module-grid">
            {integrationsData.services.map((service: any) => (
              <div key={service.name} class="module-card">
                <div class="module-header">
                  <span class="module-icon">{service.icon}</span>
                  <span class="module-name">{service.name}</span>
                </div>
                <div class="module-desc" style="margin-bottom: 12px;">
                  <strong>Type:</strong> {service.type}<br/>
                  <strong>Description:</strong> {service.description}<br/>
                  {service.endpoints && service.endpoints.length > 0 && (
                    <>
                      <strong>Endpoints:</strong> {service.endpoints.join(', ')}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Flow */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🔄</span>
          <h3 class="arch-card-title">Integration Data Flows</h3>
        </div>
        <div class="arch-card-body">
          <div class="rules-grid">
            <div class="rule-card">
              <div class="rule-title">Discord → Sessions</div>
              <div class="rule-desc">User logs in via Discord OAuth → Session created in KV → Cookie set → User profile stored</div>
            </div>
            <div class="rule-card green">
              <div class="rule-title">Raid-Helper → Calendar</div>
              <div class="rule-desc">API fetches upcoming events → Filtered by date → Displayed in calendar/homepage</div>
            </div>
            <div class="rule-card orange">
              <div class="rule-title">RaidRes → SR+ System</div>
              <div class="rule-desc">Scrape event → Parse player/item pairs → Map item IDs → Sync with SR+ entries</div>
            </div>
            <div class="rule-card purple">
              <div class="rule-title">TurtleCraft → Item Tooltips</div>
              <div class="rule-desc">Item lookup → Check static JSON → Check KV → Scrape if missing → Cache result</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DataFlowsSection({ data }: { data: any }) {
  if (!data || !data.flows) {
    return <div style="padding: 20px;">No data flows available</div>;
  }

  const dataflowsData = data;

  return (
    <>
      {dataflowsData.flows.map((flow: any) => (
        <div key={flow.name} class="arch-card">
          <div class="arch-card-header">
            <h3 class="arch-card-title">{flow.name}</h3>
          </div>
          <div class="arch-card-body">
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
              {flow.description}
            </p>
            <div class="flow-steps">
              {flow.steps.map((step: any, idx: number) => (
                <div key={idx} class="flow-step">
                  <div class="flow-num">{step.icon}</div>
                  <div class="flow-content">
                    <strong>{step.layer}:</strong> {step.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function AutomationSection({ data }: { data: any }) {
  if (!data || !data.sections) {
    return <div style="padding: 20px;">No automation data available</div>;
  }

  const automationData = data;

  return (
    <>
      {automationData.sections.map((section: any, idx: number) => (
        <div key={idx} class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">{section.icon}</span>
            <h3 class="arch-card-title">{section.title}</h3>
          </div>
          <div class="arch-card-body">
            {section.description && (
              <p
                style="color: var(--text-secondary); margin-bottom: 20px;"
                dangerouslySetInnerHTML={{ __html: section.description }}
              />
            )}

            {section.type === 'flow' && section.steps && (
              <div class="flow-steps">
                {section.steps.map((step: any, stepIdx: number) => (
                  <div key={stepIdx} class="flow-step">
                    <div class="flow-num">{step.num}</div>
                    <div
                      class="flow-content"
                      dangerouslySetInnerHTML={{ __html: step.content }}
                    />
                  </div>
                ))}
              </div>
            )}

            {section.type === 'rules' && section.rules && (
              <div class="rules-grid">
                {section.rules.map((rule: any, ruleIdx: number) => (
                  <div key={ruleIdx} class={`rule-card ${rule.color || ''}`}>
                    <div class="rule-title">{rule.title}</div>
                    <div
                      class="rule-desc"
                      dangerouslySetInnerHTML={{ __html: rule.desc }}
                    />
                  </div>
                ))}
              </div>
            )}

            {section.type === 'roadmap' && section.items && (
              <>
                <div class="rules-grid">
                  {section.items.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} class={`rule-card ${item.color || ''}`}>
                      <div class="rule-title">{item.title}</div>
                      <div
                        class="rule-desc"
                        dangerouslySetInnerHTML={{ __html: item.desc }}
                      />
                    </div>
                  ))}
                </div>

                {section.timeline && (
                  <div style="margin-top: 20px; padding: 16px; background: var(--background-tertiary); border-radius: 8px; border-left: 3px solid var(--apple-blue);">
                    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                      <strong style="color: var(--text-primary);">{section.timeline.title}</strong>
                    </div>
                    <div style="font-size: 12px; color: var(--text-tertiary); line-height: 1.6;">
                      {section.timeline.items.map((item: string, tlIdx: number) => (
                        <span key={tlIdx}>
                          <span dangerouslySetInnerHTML={{ __html: item }} />
                          {tlIdx < section.timeline.items.length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function FutureEnhancementsSection({ data }: { data: any }) {
  if (!data) {
    return <div style="padding: 20px;">No future enhancements data available</div>;
  }

  const statusColors: Record<string, string> = {
    "Pending": "orange",
    "In Progress": "blue",
    "Not Started": "purple",
    "Completed": "green"
  };

  return (
    <>
      {/* Project Header */}
      <div class="arch-card">
        <div class="arch-card-header">
          <span style="font-size: 20px;">🚀</span>
          <h3 class="arch-card-title">{data.title}</h3>
        </div>
        <div class="arch-card-body">
          <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
            {data.description}
          </p>
        </div>
      </div>

      {/* URL Structure Diagram (ASCII) */}
      {data.urlStructure && data.urlStructure.diagram && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">🔗</span>
            <h3 class="arch-card-title">{data.urlStructure.title || "URL Structure"}</h3>
          </div>
          <div class="arch-card-body">
            {data.urlStructure.description && (
              <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">{data.urlStructure.description}</p>
            )}
            <pre style="background: var(--background-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4; color: var(--text-primary); white-space: pre; margin: 0;">
              {data.urlStructure.diagram.join('\n')}
            </pre>
          </div>
        </div>
      )}

      {/* Navigation Flow Diagram (ASCII) */}
      {data.navigationFlow && data.navigationFlow.diagram && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">🧭</span>
            <h3 class="arch-card-title">{data.navigationFlow.title || "Navigation Flow"}</h3>
          </div>
          <div class="arch-card-body">
            <pre style="background: var(--background-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4; color: var(--text-primary); white-space: pre; margin: 0;">
              {data.navigationFlow.diagram.join('\n')}
            </pre>
          </div>
        </div>
      )}

      {/* Page Mockups (ASCII) */}
      {data.pageMockups && Object.entries(data.pageMockups).map(([key, mockup]: [string, any]) => (
        <div key={key} class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">🖼️</span>
            <h3 class="arch-card-title">{mockup.title || key}</h3>
          </div>
          <div class="arch-card-body">
            {mockup.description && (
              <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">{mockup.description}</p>
            )}
            <pre style="background: #1a1a2e; padding: 20px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 10px; line-height: 1.3; color: #e0e0e0; white-space: pre; margin: 0; border: 1px solid #333;">
              {mockup.mockup.join('\n')}
            </pre>
          </div>
        </div>
      ))}

      {/* Data Flow Diagrams (ASCII) */}
      {data.dataFlowDiagrams && Object.entries(data.dataFlowDiagrams).map(([key, flow]: [string, any]) => (
        <div key={key} class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">📈</span>
            <h3 class="arch-card-title">{flow.title || key}</h3>
          </div>
          <div class="arch-card-body">
            {flow.description && (
              <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">{flow.description}</p>
            )}
            <pre style="background: var(--background-tertiary); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 10px; line-height: 1.3; color: var(--text-primary); white-space: pre; margin: 0;">
              {flow.diagram.join('\n')}
            </pre>
          </div>
        </div>
      ))}

      {/* Visual Diagrams */}
      {data.visualDiagrams && data.visualDiagrams.map((diagram: any, idx: number) => (
        <div key={idx} class="arch-card">
          <div class="arch-card-header">
            <h3 class="arch-card-title">📊 {diagram.name}</h3>
          </div>
          <div class="arch-card-body">
            {diagram.type === 'architecture' && (
              <div class="visual-diagram architecture-diagram">
                {diagram.diagram.layers.map((layer: any, layerIdx: number) => (
                  <div key={layerIdx}>
                    <div class="diagram-layer-title">{layer.name}</div>
                    <div class="diagram-layer">
                      {layer.items.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} class={`diagram-box status-${item.status}`}>
                          <div class="diagram-box-label">{item.label}</div>
                          <div class="diagram-box-count">{item.count}</div>
                        </div>
                      ))}
                    </div>
                    {layerIdx < diagram.diagram.layers.length - 1 && (
                      <div class="diagram-arrow-down">↓</div>
                    )}
                  </div>
                ))}
                <div class="diagram-connections-note" style="margin-top: 24px; padding: 12px; background: var(--background-tertiary); border-radius: 6px; font-size: 12px;">
                  <strong>Data Flow Arrows:</strong>
                  {diagram.diagram.connections.map((conn: any, connIdx: number) => (
                    <div key={connIdx} style="margin-top: 4px;">
                      <span style={`color: ${conn.type === 'broken' ? 'var(--apple-red)' : conn.type === 'warning' ? 'var(--apple-orange)' : 'var(--apple-blue)'}`}>
                        {conn.from} → {conn.to}
                      </span>
                      : {conn.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagram.type === 'flowchart' && (
              <div class="visual-diagram flowchart-diagram">
                <svg viewBox={`0 0 600 ${diagram.diagram.nodes.length * 80}`} style="width: 100%; max-width: 600px; margin: 0 auto; display: block;">
                  {/* Draw connections first (so they appear behind boxes) */}
                  {diagram.diagram.connections.map((conn: any, connIdx: number) => {
                    const fromNode = diagram.diagram.nodes.find((n: any) => n.id === conn.from);
                    const toNode = diagram.diagram.nodes.find((n: any) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;

                    const fromY = fromNode.layer * 80 - 40;
                    const toY = toNode.layer * 80 - 40;
                    const midY = (fromY + toY) / 2;

                    return (
                      <g key={connIdx}>
                        <path
                          d={`M 300 ${fromY + 25} L 300 ${toY - 25}`}
                          stroke="var(--apple-blue)"
                          stroke-width="2"
                          fill="none"
                          marker-end="url(#arrowhead)"
                        />
                        <text x="310" y={midY} fill="var(--text-tertiary)" font-size="11">
                          {conn.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Define arrow marker */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="var(--apple-blue)" />
                    </marker>
                  </defs>

                  {/* Draw nodes */}
                  {diagram.diagram.nodes.map((node: any, nodeIdx: number) => {
                    const y = node.layer * 80 - 40;
                    const isOval = node.shape === 'oval';
                    const isDiamond = node.shape === 'diamond';

                    return (
                      <g key={nodeIdx}>
                        {isOval ? (
                          <ellipse
                            cx="300"
                            cy={y}
                            rx="80"
                            ry="25"
                            fill="var(--background-tertiary)"
                            stroke="var(--apple-green)"
                            stroke-width="2"
                          />
                        ) : isDiamond ? (
                          <polygon
                            points={`300,${y - 30} 380,${y} 300,${y + 30} 220,${y}`}
                            fill="var(--background-tertiary)"
                            stroke="var(--apple-orange)"
                            stroke-width="2"
                          />
                        ) : (
                          <rect
                            x="220"
                            y={y - 25}
                            width="160"
                            height="50"
                            rx="6"
                            fill="var(--background-tertiary)"
                            stroke="var(--apple-blue)"
                            stroke-width="2"
                          />
                        )}
                        {node.label.split('\n').map((line: string, lineIdx: number) => (
                          <text
                            key={lineIdx}
                            x="300"
                            y={y + (lineIdx - node.label.split('\n').length / 2 + 1) * 14}
                            text-anchor="middle"
                            fill="var(--text-primary)"
                            font-size="12"
                            font-weight="500"
                          >
                            {line}
                          </text>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {diagram.type === 'filesystem' && (
              <div class="visual-diagram filesystem-diagram">
                <svg viewBox="0 0 800 500" style="width: 100%; max-width: 800px; margin: 0 auto; display: block;">
                  {/* Draw connections */}
                  {diagram.diagram.connections.map((conn: any, connIdx: number) => {
                    const fromNode = diagram.diagram.nodes.find((n: any) => n.id === conn.from);
                    const toNode = diagram.diagram.nodes.find((n: any) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;

                    // Calculate positions based on layers
                    const fromX = 100 + (fromNode.layer - 1) * 200;
                    const fromY = 50 + diagram.diagram.nodes.filter((n: any) => n.layer === fromNode.layer && n.id <= fromNode.id).length * 60;
                    const toX = 100 + (toNode.layer - 1) * 200;
                    const toY = 50 + diagram.diagram.nodes.filter((n: any) => n.layer === toNode.layer && n.id <= toNode.id).length * 60;

                    const isStructure = conn.type === 'structure';
                    const strokeColor = isStructure ? 'var(--border-light)' :
                                      conn.type === 'write' ? 'var(--apple-green)' :
                                      conn.type === 'read' ? 'var(--apple-blue)' : 'var(--apple-orange)';

                    return (
                      <g key={connIdx}>
                        <line
                          x1={fromX + 120}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke={strokeColor}
                          stroke-width={isStructure ? "1" : "2"}
                          stroke-dasharray={isStructure ? "4" : "0"}
                          marker-end={isStructure ? "" : "url(#arrowhead2)"}
                        />
                        {!isStructure && (
                          <text
                            x={(fromX + toX) / 2 + 60}
                            y={(fromY + toY) / 2 - 5}
                            fill="var(--text-tertiary)"
                            font-size="10"
                          >
                            {conn.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  <defs>
                    <marker id="arrowhead2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                      <polygon points="0 0, 8 4, 0 8" fill="var(--apple-blue)" />
                    </marker>
                  </defs>

                  {/* Draw nodes */}
                  {diagram.diagram.nodes.map((node: any, nodeIdx: number) => {
                    const x = 100 + (node.layer - 1) * 200;
                    const y = 50 + diagram.diagram.nodes.filter((n: any) => n.layer === node.layer && n.id <= node.id).length * 60;

                    return (
                      <g key={nodeIdx}>
                        <rect
                          x={x}
                          y={y - 15}
                          width="120"
                          height="30"
                          rx="4"
                          fill="var(--background-tertiary)"
                          stroke="var(--border-light)"
                          stroke-width="1.5"
                        />
                        <text
                          x={x + 60}
                          y={y + 5}
                          text-anchor="middle"
                          fill="var(--text-primary)"
                          font-size="11"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Phase Roadmap */}
      {data.phases && data.phases.map((phase: any) => (
        <div key={phase.phase} class="arch-card">
          <div class="arch-card-header">
            <h3 class="arch-card-title">
              Phase {phase.phase}: {phase.name}
              <span class={`rule-card ${statusColors[phase.status] || ''}`} style="display: inline-block; margin-left: 12px; padding: 4px 12px; font-size: 11px; border-radius: 4px;">
                {phase.status}
              </span>
            </h3>
          </div>
          <div class="arch-card-body">
            <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">
              <strong>Description:</strong> {phase.description}<br/>
              <strong>Estimated Time:</strong> {phase.estimatedTime}
            </p>

            {/* Files to Create */}
            {phase.files?.create && phase.files.create.length > 0 && (
              <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 12px;">📝 Files to Create:</h4>
                <div class="rules-grid">
                  {phase.files.create.map((file: any, idx: number) => (
                    <div key={idx} class="rule-card green">
                      <div class="rule-title" style="font-family: ui-monospace, monospace; font-size: 11px;">
                        {file.path}
                      </div>
                      <div class="rule-desc">{file.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files to Refactor */}
            {phase.files?.refactor && phase.files.refactor.length > 0 && (
              <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 12px;">🔧 Files to Refactor:</h4>
                <div class="rules-grid">
                  {phase.files.refactor.map((file: any, idx: number) => (
                    <div key={idx} class="rule-card orange">
                      <div class="rule-title" style="font-family: ui-monospace, monospace; font-size: 11px;">
                        {file.path}
                      </div>
                      <div class="rule-desc">{file.changes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files to Modify */}
            {phase.files?.modify && phase.files.modify.length > 0 && (
              <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 12px;">✏️ Files to Modify:</h4>
                <div class="rules-grid">
                  {phase.files.modify.map((file: any, idx: number) => (
                    <div key={idx} class="rule-card">
                      <div class="rule-title" style="font-family: ui-monospace, monospace; font-size: 11px;">
                        {file.path}
                      </div>
                      <div class="rule-desc">{file.changes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Endpoints */}
            {phase.apiEndpoints && phase.apiEndpoints.length > 0 && (
              <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 12px;">🔌 API Endpoints:</h4>
                <table class="api-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.apiEndpoints.map((endpoint: any, idx: number) => (
                      <tr key={idx}>
                        <td><span class={`method ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span></td>
                        <td><code class="route">{endpoint.path}</code></td>
                        <td style="font-size: 12px;">
                          {endpoint.params && `Params: ${endpoint.params}`}
                          {endpoint.body && `Body: ${endpoint.body}`}
                          {endpoint.returns && <><br/>Returns: {endpoint.returns}</>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Features */}
            {phase.features && phase.features.length > 0 && (
              <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 12px;">✨ Features:</h4>
                <ul style="color: var(--text-secondary); font-size: 13px; line-height: 1.8; margin-left: 20px;">
                  {phase.features.map((feature: string, idx: number) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Criteria */}
            {phase.successCriteria && phase.successCriteria.length > 0 && (
              <div style="padding: 14px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--apple-green); border-radius: 4px;">
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600; margin-bottom: 8px;">
                  ✅ SUCCESS CRITERIA:
                </div>
                <ul style="color: var(--text-secondary); font-size: 12px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  {phase.successCriteria.map((criteria: string, idx: number) => (
                    <li key={idx}>{criteria}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* UAT Checklist */}
      {data.uatChecklist && data.uatChecklist.length > 0 && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">🧪</span>
            <h3 class="arch-card-title">User Acceptance Testing Checklist</h3>
          </div>
          <div class="arch-card-body">
            {data.uatChecklist.map((test: any) => (
              <div key={test.test} style="margin-bottom: 24px; padding: 16px; background: var(--background-tertiary); border-radius: 8px;">
                <h4 style="color: var(--text-primary); font-size: 14px; margin-bottom: 8px;">
                  Test {test.test}: {test.name}
                </h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                  <strong>Page:</strong> <code style="background: var(--background-secondary); padding: 2px 6px; border-radius: 3px;">{test.page || test.pages}</code>
                </div>
                <ul style="color: var(--text-secondary); font-size: 12px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  {test.actions.map((action: string, idx: number) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UI Design Decisions */}
      {data.uiDesignDecisions && data.uiDesignDecisions.length > 0 && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">🎨</span>
            <h3 class="arch-card-title">UI Design Decisions</h3>
          </div>
          <div class="arch-card-body">
            <table class="api-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>User Choice</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {data.uiDesignDecisions.map((decision: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>{decision.feature}</strong></td>
                    <td><span style="color: var(--apple-blue);">{decision.userChoice}</span></td>
                    <td style="font-size: 12px; color: var(--text-secondary);">{decision.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Management */}
      {data.costManagement && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">💰</span>
            <h3 class="arch-card-title">Cost Management</h3>
          </div>
          <div class="arch-card-body">
            <div class="rules-grid">
              <div class="rule-card green">
                <div class="rule-title">Pricing Model</div>
                <div class="rule-desc">
                  <strong>{data.costManagement.pricing.model}</strong><br/>
                  Input: {data.costManagement.pricing.inputCost}<br/>
                  Output: {data.costManagement.pricing.outputCost}
                </div>
              </div>
              <div class="rule-card">
                <div class="rule-title">Session Cost</div>
                <div class="rule-desc">
                  {data.costManagement.estimatedSessionCost.combatLog}<br/>
                  {data.costManagement.estimatedSessionCost.userMessages}<br/>
                  {data.costManagement.estimatedSessionCost.claudeResponses}<br/>
                  <strong>{data.costManagement.estimatedSessionCost.totalPerSession}</strong>
                </div>
              </div>
              <div class="rule-card orange">
                <div class="rule-title">Monthly Budget</div>
                <div class="rule-desc">
                  {data.costManagement.monthlyBudget.defaultCap}<br/>
                  {data.costManagement.monthlyBudget.warningAt80}<br/>
                  {data.costManagement.monthlyBudget.warningAt95}<br/>
                  {data.costManagement.monthlyBudget.blockAt100}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive System */}
      {data.archiveSystem && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">📦</span>
            <h3 class="arch-card-title">Archive & Deletion System</h3>
          </div>
          <div class="arch-card-body">
            <div class="flow-steps">
              <div class="flow-step">
                <div class="flow-num">1</div>
                <div class="flow-content">
                  <strong>Soft Delete:</strong> {data.archiveSystem.softDelete.process}<br/>
                  File naming: {data.archiveSystem.softDelete.fileNaming}
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-num">2</div>
                <div class="flow-content">
                  <strong>Restore:</strong> {data.archiveSystem.restore.process}
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-num">3</div>
                <div class="flow-content">
                  <strong>Auto-Purge:</strong> {data.archiveSystem.autoPurge.process}<br/>
                  Schedule: {data.archiveSystem.autoPurge.schedule}, Retention: {data.archiveSystem.autoPurge.retention}
                </div>
              </div>
              <div class="flow-step">
                <div class="flow-num">4</div>
                <div class="flow-content">
                  <strong>Permanent Delete:</strong> {data.archiveSystem.permanentDelete.process}<br/>
                  Confirmation: {data.archiveSystem.permanentDelete.confirmation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Features Summary */}
      {data.keyFeatures && (
        <div class="arch-card">
          <div class="arch-card-header">
            <span style="font-size: 20px;">⭐</span>
            <h3 class="arch-card-title">Key Features Summary</h3>
          </div>
          <div class="arch-card-body">
            <ul style="color: var(--text-secondary); font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
              {Object.entries(data.keyFeatures).map(([key, value]: [string, any]) => (
                <li key={key}>
                  <strong style="color: var(--text-primary);">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

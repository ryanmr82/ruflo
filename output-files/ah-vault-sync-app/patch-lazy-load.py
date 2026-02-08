import re

# ===== PATCH 1: Simplify routes/architecture.tsx =====
route_path = "/home/opc/tbc-website/routes/architecture.tsx"
with open(route_path, "r") as f:
    route_content = f.read()

# Replace the entire GET handler to not read JSON files
old_get = '''  async GET(req, ctx) {
    const cookies = req.headers.get("cookie") || "";
    const isAuthenticated = cookies.includes("architecture_auth=true");

    if (!isAuthenticated) {
      return ctx.render({
        overview: {},
        changelog: { entries: [] },
        sitemap: { pages: [], islands: [] },
        database: { tables: [] },
        components: { sections: [] },
        apiRoutes: { categories: [] },
        integrations: { services: [] },
        dataflows: { flows: [] },
        automation: { sections: [] },
        futureEnhancements: {},
        isAuthenticated: false,
      });
    }

    try {
      // Read all architecture JSON files from static directory
      const staticPath = "/home/opc/tbc-website/static";

      const [
        overview,
        changelog,
        sitemap,
        database,
        components,
        apiRoutes,
        integrations,
        dataflows,
        automation,
        futureEnhancements,
      ] = await Promise.all([
        Deno.readTextFile(`${staticPath}/architecture-overview.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/changelog.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-sitemap.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-database.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-components.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-api-routes.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-integrations.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-dataflows.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-automation.json`).then(JSON.parse),
        Deno.readTextFile(`${staticPath}/architecture-future-enhancements.json`).then(JSON.parse),
      ]);

      return ctx.render({
        overview,
        changelog,
        sitemap,
        database,
        components,
        apiRoutes,
        integrations,
        dataflows,
        automation,
        futureEnhancements,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Error loading architecture data:", error);
      // Return empty data on error to prevent page crash
      return ctx.render({
        overview: {},
        changelog: { entries: [] },
        sitemap: { pages: [], islands: [] },
        database: { tables: [] },
        components: { sections: [] },
        apiRoutes: { categories: [] },
        integrations: { services: [] },
        dataflows: { flows: [] },
        automation: { sections: [] },
        futureEnhancements: {},
        isAuthenticated: true,
      });
    }
  },'''

new_get = '''  async GET(req, ctx) {
    const cookies = req.headers.get("cookie") || "";
    const isAuthenticated = cookies.includes("architecture_auth=true");

    // Lazy-load: don't read JSON files server-side anymore.
    // The island fetches each tab's JSON client-side on demand.
    return ctx.render({
      isAuthenticated,
    });
  },'''

route_content = route_content.replace(old_get, new_get)

# Simplify the error render in POST handler too
old_post_render = '''      return ctx.render({
          overview: {},
          changelog: { entries: [] },
          sitemap: { pages: [], islands: [] },
          database: { tables: [] },
          components: { sections: [] },
          apiRoutes: { categories: [] },
          integrations: { services: [] },
          dataflows: { flows: [] },
          automation: { sections: [] },
          futureEnhancements: {},
          isAuthenticated: false,
          error: "Invalid password",
        });'''
new_post_render = '''      return ctx.render({
          isAuthenticated: false,
          error: "Invalid password",
        });'''
route_content = route_content.replace(old_post_render, new_post_render)

# Simplify the other POST renders
old_post_bottom = '''    return ctx.render({
      overview: {},
      changelog: { entries: [] },
      sitemap: { pages: [], islands: [] },
      database: { tables: [] },
      components: { sections: [] },
      apiRoutes: { categories: [] },
      integrations: { services: [] },
      dataflows: { flows: [] },
      automation: { sections: [] },
      futureEnhancements: {},
      isAuthenticated: false,
    });'''
new_post_bottom = '''    return ctx.render({
      isAuthenticated: false,
    });'''
route_content = route_content.replace(old_post_bottom, new_post_bottom)

# Simplify the ArchitectureData interface
old_interface = '''interface ArchitectureData {
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
  isAuthenticated?: boolean;
  error?: string;
}'''
new_interface = '''interface ArchitectureData {
  isAuthenticated?: boolean;
  error?: string;
}'''
route_content = route_content.replace(old_interface, new_interface)

with open(route_path, "w") as f:
    f.write(route_content)
print("Route patched: %d bytes" % len(route_content))


# ===== PATCH 2: Add lazy-loading to ArchitectureDocs.tsx =====
island_path = "/home/opc/tbc-website/islands/ArchitectureDocs.tsx"
with open(island_path, "r") as f:
    island_content = f.read()

# Replace the props interface and add lazy-load state
old_props = '''interface ArchitectureDocsProps {
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

export default function ArchitectureDocs({ data }: ArchitectureDocsProps) {'''

new_props = '''// Map section IDs to their JSON file paths
const SECTION_FILES: Record<string, string> = {
  overview: "/architecture-overview.json",
  changelog: "/changelog.json",
  sitemap: "/architecture-sitemap.json",
  erd: "/architecture-database.json",
  components: "/architecture-components.json",
  api: "/architecture-api-routes.json",
  integrations: "/architecture-integrations.json",
  dataflows: "/architecture-dataflows.json",
  automation: "/architecture-automation.json",
  future: "/architecture-future-enhancements.json",
};

interface ArchitectureDocsProps {
  data: {
    isAuthenticated?: boolean;
  };
}

export default function ArchitectureDocs({ data }: ArchitectureDocsProps) {
  // Cache for fetched tab data
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);'''

island_content = island_content.replace(old_props, new_props)

# Add the fetch function after the syncHash useEffect
# Find the end of the hashchange useEffect
old_after_hash = '''  }, []);

  // Get timestamp for active section'''

new_after_hash = '''  }, []);

  // Lazy-load: fetch tab JSON when section changes
  useEffect(() => {
    const section = activeSection;
    if (section === "reconcile") return; // LogReconciliation is a standalone island
    if (tabData[section]) return; // Already cached

    const filePath = SECTION_FILES[section];
    if (!filePath) return;

    setLoading(section);
    setFetchError(null);

    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${filePath}: ${res.status}`);
        return res.json();
      })
      .then(json => {
        setTabData(prev => ({ ...prev, [section]: json }));
        setLoading(null);
      })
      .catch(err => {
        console.error("Lazy-load error:", err);
        setFetchError(err.message);
        setLoading(null);
      });
  }, [activeSection]);

  // Get timestamp for active section'''

island_content = island_content.replace(old_after_hash, new_after_hash)

# Update getLastUpdated to use tabData instead of data
old_last_updated = '''  // Get timestamp for active section
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
  };'''

new_last_updated = '''  // Get timestamp for active section (now from lazy-loaded cache)
  const getLastUpdated = (): string => {
    const sectionData = tabData[activeSection];
    if (sectionData?.lastUpdated) {
      return formatTimestamp(sectionData.lastUpdated);
    }
    return "";
  };'''

island_content = island_content.replace(old_last_updated, new_last_updated)

# Replace the section rendering to use tabData + loading state
old_rendering = '''        {activeSection === "overview" && <OverviewSection data={data.overview} />}
        {activeSection === "changelog" && <ChangelogSection data={data.changelog} />}
        {activeSection === "sitemap" && <SiteMapSection data={data.sitemap} />}
        {activeSection === "erd" && <ERDSection data={data.database} />}
        {activeSection === "components" && <ComponentsSection data={data.components} />}
        {activeSection === "api" && <APISection data={data.apiRoutes} />}
        {activeSection === "integrations" && <IntegrationsSection data={data.integrations} />}
        {activeSection === "dataflows" && <DataFlowsSection data={data.dataflows} />}
        {activeSection === "automation" && <AutomationSection data={data.automation} />}
        {activeSection === "reconcile" && <LogReconciliation />}
        {activeSection === "future" && <FutureEnhancementsSection data={data.futureEnhancements} />}'''

new_rendering = '''        {/* Loading indicator */}
        {loading === activeSection && (
          <div class="arch-card">
            <div class="arch-card-body" style="text-align: center; padding: 40px;">
              <div style="font-size: 24px; margin-bottom: 12px;">Loading...</div>
              <div style="color: var(--text-secondary); font-size: 13px;">Fetching tab data</div>
            </div>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && loading === null && !tabData[activeSection] && activeSection !== "reconcile" && (
          <div class="arch-card">
            <div class="arch-card-body" style="text-align: center; padding: 40px; color: var(--apple-red);">
              <div style="font-size: 16px; margin-bottom: 8px;">Failed to load tab data</div>
              <div style="font-size: 12px;">{fetchError}</div>
            </div>
          </div>
        )}

        {/* Tab content — rendered from lazy-loaded cache */}
        {activeSection === "overview" && tabData.overview && <OverviewSection data={tabData.overview} />}
        {activeSection === "changelog" && tabData.changelog && <ChangelogSection data={tabData.changelog} />}
        {activeSection === "sitemap" && tabData.sitemap && <SiteMapSection data={tabData.sitemap} />}
        {activeSection === "erd" && tabData.erd && <ERDSection data={tabData.erd} />}
        {activeSection === "components" && tabData.components && <ComponentsSection data={tabData.components} />}
        {activeSection === "api" && tabData.api && <APISection data={tabData.api} />}
        {activeSection === "integrations" && tabData.integrations && <IntegrationsSection data={tabData.integrations} />}
        {activeSection === "dataflows" && tabData.dataflows && <DataFlowsSection data={tabData.dataflows} />}
        {activeSection === "automation" && tabData.automation && <AutomationSection data={tabData.automation} />}
        {activeSection === "reconcile" && <LogReconciliation />}
        {activeSection === "future" && tabData.future && <FutureEnhancementsSection data={tabData.future} />}'''

island_content = island_content.replace(old_rendering, new_rendering)

with open(island_path, "w") as f:
    f.write(island_content)
print("Island patched: %d bytes" % len(island_content))

# Verify
with open(island_path, "r") as f:
    text = f.read()
checks = [
    ("SECTION_FILES map", "SECTION_FILES" in text),
    ("tabData state", "tabData" in text),
    ("loading state", "setLoading" in text),
    ("fetch(filePath)", "fetch(filePath)" in text),
    ("Loading indicator", "Loading..." in text),
    ("tabData.future", "tabData.future" in text),
    ("tabData.overview", "tabData.overview" in text),
]
for label, ok in checks:
    print("%s: %s" % (label, "OK" if ok else "MISSING"))

import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

/**
 * SR+ Public Dashboard - v2
 *
 * Fix: Now fetches from /api/sr-plus/entries instead of /api/sr-plus/credits
 * The entries endpoint is where user SR+ picks are stored via the My SR page.
 */

interface SRPlusEntry {
  visitorId: string;
  playerName: string;
  itemId?: number;
  itemName: string;
  raidType: string;
  timesSRd: number;
  currentBonus: number;
  isHardReserve: boolean;
  pickedAt: number;
  lastIncrementedAt?: number;
  // Item lookup fields (populated client-side)
  iconUrl?: string;
  quality?: number;
  tooltipHtml?: string;
  turtleWowId?: number;
}

interface SRPlusSettings {
  bonusPerSR: number;
  hardReserveThreshold: number;
}

const QUALITY_COLORS: Record<number, string> = {
  0: "#9d9d9d", // Poor
  1: "#ffffff", // Common
  2: "#1eff00", // Uncommon
  3: "#0070dd", // Rare
  4: "#a335ee", // Epic
  5: "#ff8000", // Legendary
};

const RAID_TYPES = [
  { id: "ALL", name: "All Raids", color: "#9ca3af" },
  { id: "MC", name: "Molten Core", color: "#ef4444" },
  { id: "BWL", name: "Blackwing Lair", color: "#8b5cf6" },
  { id: "AQ40", name: "AQ40", color: "#eab308" },
  { id: "AQ20", name: "AQ20", color: "#84cc16" },
  { id: "ZG", name: "Zul'Gurub", color: "#22c55e" },
  { id: "NAXX", name: "Naxxramas", color: "#06b6d4" },
  { id: "ONY", name: "Onyxia", color: "#f97316" },
  { id: "EMERALD", name: "Emerald", color: "#10b981" },
  { id: "KARA10", name: "Kara 10", color: "#9c27b0" },
  { id: "KARA40", name: "Kara 40", color: "#e91e63" },
  { id: "WORLD", name: "World", color: "#a855f7" },
  { id: "OTHER", name: "Other", color: "#6b7280" },
];

const RAID_COLORS: Record<string, string> = {
  MC: "#ef4444",
  BWL: "#8b5cf6",
  AQ40: "#eab308",
  AQ20: "#84cc16",
  ZG: "#22c55e",
  NAXX: "#06b6d4",
  ONY: "#f97316",
  EMERALD: "#10b981",
  KARA10: "#9c27b0",
  KARA40: "#e91e63",
  WORLD: "#a855f7",
  OTHER: "#6b7280",
};

export default function SRPlusPublic() {
  const [entries, setEntries] = useState<SRPlusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<SRPlusSettings>({ bonusPerSR: 20, hardReserveThreshold: 5 });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    html: string;
    itemName: string;
    iconUrl: string;
    quality: number;
  }>({ visible: false, x: 0, y: 0, html: "", itemName: "", iconUrl: "", quality: 0 });
  const [itemCache, setItemCache] = useState<Map<string, { iconUrl: string; quality: number; tooltipHtml: string; turtleWowId: number }>>(new Map());

  const [showRules, setShowRules] = useState(false);
  useEffect(() => {
    if (IS_BROWSER) {
      fetchEntries();
    }
  }, [activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // Fetch entries from the correct endpoint
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("raidType", activeTab);

      const res = await fetch(`/api/sr-plus/entries?${params}`);
      const data = await res.json();

      // Update settings from response
      if (data.settings) {
        setSettings(data.settings);
      }

      const entriesList: SRPlusEntry[] = data.entries || [];

      // Fetch item details for entries
      for (const entry of entriesList) {
        if (entry.itemName && entry.itemName !== "Nothing reserved") {
          const cacheKey = entry.itemName.toLowerCase();
          if (!itemCache.has(cacheKey)) {
            fetchItemDetails(entry.itemName);
          }
        }
      }

      // Sort by bonus descending, hard reserves first
      entriesList.sort((a: SRPlusEntry, b: SRPlusEntry) => {
        if (a.isHardReserve && !b.isHardReserve) return -1;
        if (!a.isHardReserve && b.isHardReserve) return 1;
        return b.currentBonus - a.currentBonus;
      });

      setEntries(entriesList);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    }
    setLoading(false);
  };

  const fetchItemDetails = async (itemName: string) => {
    try {
      const res = await fetch(`/api/items/lookup?name=${encodeURIComponent(itemName)}`);
      if (res.ok) {
        const item = await res.json();
        setItemCache(prev => new Map(prev).set(itemName.toLowerCase(), {
          iconUrl: item.iconUrl,
          quality: item.quality,
          tooltipHtml: item.tooltipHtml,
          turtleWowId: item.id,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch item:", itemName, err);
    }
  };

  const getItemIcon = (entry: SRPlusEntry) => {
    const cached = itemCache.get(entry.itemName.toLowerCase());
    return cached?.iconUrl || entry.iconUrl || "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg";
  };

  const getItemQuality = (entry: SRPlusEntry) => {
    const cached = itemCache.get(entry.itemName.toLowerCase());
    return cached?.quality ?? entry.quality ?? 4;
  };

  const getTurtleWowId = (entry: SRPlusEntry) => {
    const cached = itemCache.get(entry.itemName.toLowerCase());
    return cached?.turtleWowId || entry.turtleWowId;
  };

  const getTooltipHtml = (entry: SRPlusEntry) => {
    const cached = itemCache.get(entry.itemName.toLowerCase());
    return cached?.tooltipHtml || entry.tooltipHtml;
  };

  const showTooltip = (e: MouseEvent, entry: SRPlusEntry) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const html = getTooltipHtml(entry) || "";
    if (!html) return;

    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.bottom + 5,
      html,
      itemName: entry.itemName,
      iconUrl: getItemIcon(entry),
      quality: getItemQuality(entry),
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const filteredEntries = search
    ? entries.filter(e => e.playerName.toLowerCase().includes(search.toLowerCase()) || e.itemName.toLowerCase().includes(search.toLowerCase()))
    : entries;

  // Group by player for summary
  const playerSummary = entries.reduce((acc, e) => {
    if (!acc[e.playerName]) {
      acc[e.playerName] = { totalBonus: 0, hardReserves: 0, items: 0 };
    }
    acc[e.playerName].totalBonus += e.currentBonus;
    acc[e.playerName].items += 1;
    if (e.isHardReserve) {
      acc[e.playerName].hardReserves += 1;
    }
    return acc;
  }, {} as Record<string, { totalBonus: number; hardReserves: number; items: number }>);

  const hardReserveCount = entries.filter(e => e.isHardReserve).length;

  return (
    <div>
      {/* Raid Type Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap", background: "#1f2937", padding: "6px", borderRadius: "8px" }}>
        {RAID_TYPES.map(raid => (
          <button
            key={raid.id}
            onClick={() => setActiveTab(raid.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === raid.id ? "600" : "400",
              background: activeTab === raid.id ? raid.color : "transparent",
              color: activeTab === raid.id ? "#fff" : "#9ca3af",
              transition: "all 0.15s ease",
            }}
          >
            {raid.name}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#60a5fa" }}>{entries.length}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active SRs</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#34d399" }}>{Object.keys(playerSummary).length}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Players</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #4c1d95 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#ffd700" }}>{hardReserveCount}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hard Reserves</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #065f46 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>+{settings.bonusPerSR}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Per SR</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search player or item..."
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          style={{
            padding: "10px 14px",
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "8px",
            color: "#fff",
            width: "100%",
            maxWidth: "300px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Entries Table */}
      <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎲</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#e5e7eb" }}>No SR+ Data Yet</h3>
            <p style={{ margin: 0 }}>SR+ picks will appear here once players set their SR+ items on the My SR page.</p>
            <p style={{ marginTop: "16px", fontSize: "13px" }}>
              <strong>How SR+ Works:</strong> +{settings.bonusPerSR} bonus per consecutive SR on the same item.<br/>
              After {settings.hardReserveThreshold} raids = Hard Reserve. Win = credits reset. Lose = keep building.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111827" }}>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Player</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Item</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Raid</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Times SR'd</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Bonus</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => {
                  const turtleId = getTurtleWowId(entry);
                  const quality = getItemQuality(entry);

                  return (
                    <tr
                      key={`${entry.visitorId}-${entry.raidType}-${idx}`}
                      style={{
                        background: entry.isHardReserve ? "rgba(255, 215, 0, 0.08)" : "transparent",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: "500" }}>{entry.playerName}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: `2px solid ${QUALITY_COLORS[quality] || "#a335ee"}`,
                              backgroundImage: `url(${getItemIcon(entry)})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => showTooltip(e as unknown as MouseEvent, entry)}
                            onMouseLeave={hideTooltip}
                          />
                          <a
                            href={turtleId ? `https://database.turtlecraft.gg/?item=${turtleId}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: QUALITY_COLORS[quality] || "#a335ee",
                              textDecoration: "none",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) => showTooltip(e as unknown as MouseEvent, entry)}
                            onMouseLeave={hideTooltip}
                          >
                            {entry.itemName}
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {entry.raidType && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              background: `${RAID_COLORS[entry.raidType] || "#6b7280"}22`,
                              color: RAID_COLORS[entry.raidType] || "#6b7280",
                            }}
                          >
                            {entry.raidType}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{entry.timesSRd}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: entry.isHardReserve ? "#ffd700" : "#34d399", fontWeight: "600" }}>
                        {entry.isHardReserve ? "HR" : `+${entry.currentBonus}`}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {entry.isHardReserve ? (
                          <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "11px" }}>{entry.timesSRd}/{settings.hardReserveThreshold} to HR</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How SR+ Works */}
      {filteredEntries.length > 0 && (
        <div style={{ marginTop: "24px", padding: "16px", background: "#1f2937", borderRadius: "10px", fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#e5e7eb" }}>How SR+ Works:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            <li>Each time you SR the same item, you gain +{settings.bonusPerSR} bonus to your roll</li>
            <li>After {settings.hardReserveThreshold} consecutive SRs on the same item, it becomes your Hard Reserve</li>
            <li>If you win the item, your SR+ credits reset. If you lose, you keep building!</li>
          </ul>
        </div>
      )}

      {/* Item Tooltip - WoW Style */}
      {tooltip.visible && tooltip.html && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltip.x, (typeof window !== "undefined" ? window.innerWidth : 1920) - 360),
            top: Math.min(tooltip.y, (typeof window !== "undefined" ? window.innerHeight : 1080) - 400),
            background: "linear-gradient(to bottom, #1a1a2e 0%, #0d0d1a 100%)",
            border: "1px solid #3d3d5c",
            borderRadius: "4px",
            padding: "0",
            maxWidth: "340px",
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.7)",
            pointerEvents: "none",
          }}
        >
          {/* Tooltip Header with Icon and Name */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderBottom: "1px solid #3d3d5c",
            background: "rgba(0,0,0,0.3)",
          }}>
            <img
              src={tooltip.iconUrl}
              alt=""
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "4px",
                border: `2px solid ${QUALITY_COLORS[tooltip.quality] || "#a335ee"}`,
              }}
            />
            <span style={{
              color: QUALITY_COLORS[tooltip.quality] || "#a335ee",
              fontWeight: "600",
              fontSize: "14px",
            }}>
              {tooltip.itemName}
            </span>
          </div>
          {/* Tooltip Content */}
          <div
            className="tw-tooltip-content"
            style={{ padding: "10px 12px" }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
          {/* WoW Tooltip Styles */}
          <style dangerouslySetInnerHTML={{ __html: `
            .tw-tooltip-content {
              font-size: 13px;
              line-height: 1.5;
              color: #ffd100;
            }
            .tw-tooltip-content table { border-collapse: collapse; width: 100%; }
            .tw-tooltip-content td { padding: 1px 0; vertical-align: top; }
            .tw-tooltip-content br { display: block; margin: 2px 0; }
            .tw-tooltip-content .q0 { color: #9d9d9d; }
            .tw-tooltip-content .q1 { color: #ffffff; }
            .tw-tooltip-content .q2 { color: #1eff00; }
            .tw-tooltip-content .q3 { color: #0070dd; }
            .tw-tooltip-content .q4 { color: #a335ee; }
            .tw-tooltip-content .q5 { color: #ff8000; }
            .tw-tooltip-content .q { color: #ffd100; }
            .tw-tooltip-content .moneygold { color: #ffd700; }
            .tw-tooltip-content .moneysilver { color: #c0c0c0; }
            .tw-tooltip-content .moneycopper { color: #cd7f32; }
            .tw-tooltip-content .whtt-sellprice { color: #ffd100; margin-top: 6px; }
            .tw-tooltip-content .whtt-extra { color: #00ff00; font-style: italic; }
            .tw-tooltip-content span[style*="color: white"] { color: #ffffff !important; }
            .tw-tooltip-content span[style*="color: #ffd100"] { color: #ffd100 !important; }
          `}} />
        </div>
      )}
    </div>
  );
}

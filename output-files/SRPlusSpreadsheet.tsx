import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface SRPlusCredit {
  id?: string;
  playerName: string;
  itemId?: number;
  itemName: string;
  raidType: string;
  timesSRd: number;
  bonusRP?: number;
  currentBonus?: number;
  isHardReserve?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
  firstSRDate?: string;
  // Turtle WoW DB fields
  turtleWowId?: number;
  iconUrl?: string;
  quality?: number;
  tooltipHtml?: string;
}

interface SRPlusSettings {
  bonusPerSR: number;
  hardReserveThreshold: number;
  require24hSignup: boolean;
  allowPlayerSelfService: boolean;
  lockSRBeforeRaid: number;
}

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

const QUALITY_COLORS: Record<number, string> = {
  0: "#9d9d9d", // Poor
  1: "#ffffff", // Common
  2: "#1eff00", // Uncommon
  3: "#0070dd", // Rare
  4: "#a335ee", // Epic
  5: "#ff8000", // Legendary
};

export default function SRPlusSpreadsheet() {
  const [credits, setCredits] = useState<SRPlusCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<SRPlusSettings>({
    bonusPerSR: 20,
    hardReserveThreshold: 5,
    require24hSignup: true,
    allowPlayerSelfService: false,
    lockSRBeforeRaid: 2,
  });
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newCredit, setNewCredit] = useState({ playerName: "", itemId: "", itemName: "", raidType: "MC", timesSRd: 1 });
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

  useEffect(() => {
    if (IS_BROWSER) {
      fetchCredits();
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/sr-plus/settings");
      const data = await res.json();
      if (!data.error) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("raidType", activeTab);
      if (search) params.set("search", search);

      const res = await fetch(`/api/sr-plus/credits?${params}`);
      const data = await res.json();
      const creditsList = data.credits || [];

      // Fetch item details for credits that don't have them
      for (const credit of creditsList) {
        if (!credit.iconUrl && credit.itemName && credit.itemName !== "Nothing reserved") {
          const cacheKey = credit.itemName.toLowerCase();
          if (!itemCache.has(cacheKey)) {
            fetchItemDetails(credit.itemName);
          }
        }
      }

      setCredits(creditsList);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
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

  const handleSearch = (e: Event) => {
    e.preventDefault();
    fetchCredits();
  };

  const getCreditKey = (credit: SRPlusCredit) => {
    return `${credit.raidType}-${credit.playerName}-${credit.itemName}`;
  };

  const startEditing = (credit: SRPlusCredit, currentValue: number) => {
    setEditingCell(getCreditKey(credit));
    setEditValue(String(currentValue));
  };

  const saveEdit = async (credit: SRPlusCredit) => {
    const newTimesSRd = parseInt(editValue, 10);
    if (isNaN(newTimesSRd) || newTimesSRd < 0) {
      setEditingCell(null);
      return;
    }

    try {
      await fetch("/api/sr-plus/credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: credit.playerName,
          itemId: credit.itemId || credit.itemName,
          raidType: credit.raidType,
          timesSRd: newTimesSRd,
        }),
      });

      setCredits(credits.map(c =>
        getCreditKey(c) === getCreditKey(credit)
          ? { ...c, timesSRd: newTimesSRd, bonusRP: newTimesSRd * settings.bonusPerSR }
          : c
      ));
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: KeyboardEvent, credit: SRPlusCredit) => {
    if (e.key === "Enter") saveEdit(credit);
    if (e.key === "Escape") setEditingCell(null);
  };

  const toggleRowSelection = (credit: SRPlusCredit) => {
    const key = getCreditKey(credit);
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  };

  const selectAll = () => {
    if (selectedRows.size === credits.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(credits.map(getCreditKey)));
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedRows.size} selected credit(s)?`)) return;

    for (const key of selectedRows) {
      const credit = credits.find(c => getCreditKey(c) === key);
      if (credit) {
        await fetch(`/api/sr-plus/credits?playerName=${encodeURIComponent(credit.playerName)}&itemId=${credit.itemId || credit.itemName}&raidType=${credit.raidType}`, {
          method: "DELETE",
        });
      }
    }

    setSelectedRows(new Set());
    fetchCredits();
  };

  const exportCSV = () => {
    const rows = [["Player", "Item", "Turtle WoW ID", "Raid", "Times SR'd", "Bonus RP", "Hard Reserve", "Last Updated"]];
    const dataToExport = selectedRows.size > 0
      ? credits.filter(c => selectedRows.has(getCreditKey(c)))
      : credits;

    dataToExport.forEach(c => {
      const cached = itemCache.get(c.itemName.toLowerCase());
      rows.push([
        c.playerName,
        c.itemName,
        String(cached?.turtleWowId || c.turtleWowId || ""),
        c.raidType,
        String(c.timesSRd),
        String(c.bonusRP || c.currentBonus || c.timesSRd * settings.bonusPerSR),
        c.timesSRd >= settings.hardReserveThreshold ? "Yes" : "No",
        c.lastUpdated || c.updatedAt || "",
      ]);
    });

    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sr-plus-credits-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const addCredit = async () => {
    if (!newCredit.playerName || !newCredit.itemName) {
      alert("Please fill in Player Name and Item Name");
      return;
    }

    try {
      await fetch("/api/sr-plus/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCredit,
          itemId: newCredit.itemId ? parseInt(newCredit.itemId, 10) : newCredit.itemName,
        }),
      });

      setShowAddModal(false);
      setNewCredit({ playerName: "", itemId: "", itemName: "", raidType: "MC", timesSRd: 1 });
      fetchCredits();
    } catch (err) {
      console.error("Failed to add credit:", err);
    }
  };

  const saveSettings = async () => {
    try {
      await fetch("/api/sr-plus/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setShowSettingsModal(false);
      fetchCredits(); // Recalculate bonuses
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const getRaidColor = (raidType: string) => {
    return RAID_TYPES.find(r => r.id === raidType)?.color || "#6b7280";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "-";
    }
  };

  const getItemIcon = (credit: SRPlusCredit) => {
    const cached = itemCache.get(credit.itemName.toLowerCase());
    return cached?.iconUrl || credit.iconUrl || "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg";
  };

  const getItemQuality = (credit: SRPlusCredit) => {
    const cached = itemCache.get(credit.itemName.toLowerCase());
    return cached?.quality ?? credit.quality ?? 4;
  };

  const getTurtleWowId = (credit: SRPlusCredit) => {
    const cached = itemCache.get(credit.itemName.toLowerCase());
    return cached?.turtleWowId || credit.turtleWowId;
  };

  const getTooltipHtml = (credit: SRPlusCredit) => {
    const cached = itemCache.get(credit.itemName.toLowerCase());
    return cached?.tooltipHtml || credit.tooltipHtml;
  };

  const showTooltip = (e: MouseEvent, credit: SRPlusCredit) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const html = getTooltipHtml(credit) || "";
    if (!html) return;

    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.bottom + 5,
      html,
      itemName: credit.itemName,
      iconUrl: getItemIcon(credit),
      quality: getItemQuality(credit),
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Group credits by player for summary view
  const playerSummary = credits.reduce((acc, c) => {
    if (!acc[c.playerName]) {
      acc[c.playerName] = { totalCredits: 0, totalBonus: 0, items: 0 };
    }
    acc[c.playerName].totalCredits += c.timesSRd;
    acc[c.playerName].totalBonus += c.bonusRP || c.currentBonus || c.timesSRd * settings.bonusPerSR;
    acc[c.playerName].items += 1;
    return acc;
  }, {} as Record<string, { totalCredits: number; totalBonus: number; items: number }>);

  const totalSRCount = credits.reduce((sum, c) => sum + c.timesSRd, 0);
  const hardReserveCount = credits.filter(c => c.timesSRd >= settings.hardReserveThreshold).length;

  return (
    <div>
      {/* Raid Type Tabs - Cleaner Design */}
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

      {/* Stats Bar - Horizontal Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#60a5fa" }}>{credits.length}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Items</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#34d399" }}>{Object.keys(playerSummary).length}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Players</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#fbbf24" }}>{totalSRCount}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total SRs</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #4c1d95 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#ffd700" }}>{hardReserveCount}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hard Reserves</div>
        </div>
        <div
          style={{ background: "linear-gradient(135deg, #065f46 0%, #1f2937 100%)", padding: "16px", borderRadius: "10px", textAlign: "center", cursor: "pointer" }}
          onClick={() => setShowSettingsModal(true)}
          title="Click to edit settings"
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#10b981" }}>+{settings.bonusPerSR}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Per SR (click to edit)</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "12px 16px", background: "#1f2937", borderRadius: "8px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Search player or item..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            style={{ padding: "8px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", width: "200px", fontSize: "13px" }}
          />
          <button type="submit" style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{ padding: "8px 14px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px" }}
          >
            Settings
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "8px 14px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px" }}
          >
            + Add Credit
          </button>
          <button
            onClick={exportCSV}
            style={{ padding: "8px 14px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px" }}
          >
            Export CSV
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={deleteSelected}
              style={{ padding: "8px 14px", background: "#dc2626", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px" }}
            >
              Delete ({selectedRows.size})
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111827" }}>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === credits.length && credits.length > 0}
                    onChange={selectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Player</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Item</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Raid</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Times SR'd</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Bonus</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "right", borderBottom: "1px solid #374151", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    Loading...
                  </td>
                </tr>
              ) : credits.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    No credits found. Add some or import from RaidRes.
                  </td>
                </tr>
              ) : (
                credits.map(credit => {
                  const isHR = credit.isHardReserve || credit.timesSRd >= settings.hardReserveThreshold;
                  const bonus = credit.bonusRP || credit.currentBonus || credit.timesSRd * settings.bonusPerSR;
                  const key = getCreditKey(credit);
                  const turtleId = getTurtleWowId(credit);

                  return (
                    <tr
                      key={key}
                      style={{
                        background: isHR ? "rgba(255, 215, 0, 0.08)" : "transparent",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(key)}
                          onChange={() => toggleRowSelection(credit)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: "500" }}>{credit.playerName}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: `2px solid ${QUALITY_COLORS[getItemQuality(credit)] || "#a335ee"}`,
                              backgroundImage: `url(${getItemIcon(credit)})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => showTooltip(e as unknown as MouseEvent, credit)}
                            onMouseLeave={hideTooltip}
                          />
                          <a
                            href={turtleId ? `https://database.turtlecraft.gg/?item=${turtleId}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: QUALITY_COLORS[getItemQuality(credit)] || "#a335ee",
                              textDecoration: "none",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) => showTooltip(e as unknown as MouseEvent, credit)}
                            onMouseLeave={hideTooltip}
                          >
                            {credit.itemName}
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: `${getRaidColor(credit.raidType)}22`,
                            color: getRaidColor(credit.raidType),
                          }}
                        >
                          {credit.raidType}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {editingCell === key ? (
                          <input
                            type="number"
                            value={editValue}
                            onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
                            onBlur={() => saveEdit(credit)}
                            onKeyDown={(e) => handleKeyDown(e, credit)}
                            style={{ width: "50px", padding: "4px 8px", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#fff", textAlign: "center" }}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => startEditing(credit, credit.timesSRd)}
                            style={{ cursor: "pointer", padding: "4px 12px", borderRadius: "4px", background: "#374151" }}
                            title="Click to edit"
                          >
                            {credit.timesSRd}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399", fontWeight: "600" }}>
                        +{bonus}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {isHR ? (
                          <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                        ) : credit.timesSRd >= settings.hardReserveThreshold - 1 ? (
                          <span style={{ color: "#f97316", fontSize: "11px" }}>1 more = HR</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "11px" }}>Building...</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#9ca3af", fontSize: "12px" }}>
                        {formatDate(credit.lastUpdated || credit.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Add Credit Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}>Add SR+ Credit</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Player Name *</label>
                <input
                  type="text"
                  value={newCredit.playerName}
                  onInput={(e) => setNewCredit({ ...newCredit, playerName: (e.target as HTMLInputElement).value })}
                  style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                  placeholder="e.g., Tjimmyy"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Item Name *</label>
                <input
                  type="text"
                  value={newCredit.itemName}
                  onInput={(e) => setNewCredit({ ...newCredit, itemName: (e.target as HTMLInputElement).value })}
                  style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                  placeholder="e.g., Thunderfury, Blessed Blade..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Raid Type</label>
                  <select
                    value={newCredit.raidType}
                    onChange={(e) => setNewCredit({ ...newCredit, raidType: (e.target as HTMLSelectElement).value })}
                    style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                  >
                    {RAID_TYPES.filter(r => r.id !== "ALL").map(raid => (
                      <option key={raid.id} value={raid.id}>{raid.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Times SR'd</label>
                  <input
                    type="number"
                    min="1"
                    value={newCredit.timesSRd}
                    onInput={(e) => setNewCredit({ ...newCredit, timesSRd: parseInt((e.target as HTMLInputElement).value, 10) || 1 })}
                    style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: "10px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={addCredit}
                style={{ flex: 1, padding: "10px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
              >
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}>SR+ Settings</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Bonus Per SR</label>
                <input
                  type="number"
                  min="0"
                  value={settings.bonusPerSR}
                  onInput={(e) => setSettings({ ...settings, bonusPerSR: parseInt((e.target as HTMLInputElement).value, 10) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                />
                <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#6b7280" }}>RP bonus added for each time an item is SR'd</p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Hard Reserve Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={settings.hardReserveThreshold}
                  onInput={(e) => setSettings({ ...settings, hardReserveThreshold: parseInt((e.target as HTMLInputElement).value, 10) || 5 })}
                  style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                />
                <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#6b7280" }}>Number of SRs needed for Hard Reserve status</p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Lock SR Before Raid (hours)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.lockSRBeforeRaid}
                  onInput={(e) => setSettings({ ...settings, lockSRBeforeRaid: parseInt((e.target as HTMLInputElement).value, 10) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
                />
                <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#6b7280" }}>Hours before raid when SR changes are locked (Phase 3)</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={settings.require24hSignup}
                  onChange={(e) => setSettings({ ...settings, require24hSignup: (e.target as HTMLInputElement).checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <label style={{ fontSize: "13px", color: "#e5e7eb" }}>Require 24h signup for SR+ eligibility</label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ flex: 1, padding: "10px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                style={{ flex: 1, padding: "10px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

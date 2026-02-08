import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import ItemTooltip, { useItemTooltip, QUALITY_COLORS, lookupItem, prefetchItems, getIconUrl } from "./ItemTooltip.tsx";

/**
 * SRPlusAdmin v2 - Admin SR+ Management Page
 *
 * Fixed issues:
 * - Added item icons to entries table
 * - Added tooltip hover functionality
 */

interface ItemInfo {
  id?: number;
  name: string;
  icon?: string;
  iconUrl?: string;
  quality?: number;
  tooltipHtml?: string;
}

interface SRPlusEntry {
  visitorId: string;
  playerName: string;
  raidType: string;
  itemName: string;
  itemId?: number;
  timesSRd: number;
  currentBonus: number;
  pickedAt: number;
  lastIncrementedAt?: number;
  isHardReserve: boolean;
  itemInfo?: ItemInfo;
}

interface SRPlusAdminLog {
  adminId: string;
  adminName?: string;
  action: string;
  targetPlayer: string;
  targetRaidType: string;
  targetItem?: string;
  previousValue: any;
  newValue: any;
  note?: string;
  timestamp: number;
}

interface Settings {
  bonusPerSR: number;
  hardReserveThreshold: number;
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
  { id: "EMERALD", name: "Emerald Sanctum", color: "#10b981" },
  { id: "KARA10", name: "Kara 10", color: "#9c27b0" },
  { id: "KARA40", name: "Kara 40", color: "#e91e63" },
];

const RAID_COLORS: Record<string, string> = Object.fromEntries(
  RAID_TYPES.map(r => [r.id, r.color])
);

type TabType = "entries" | "history" | "settings";

export default function SRPlusAdmin() {
  const [activeTab, setActiveTab] = useState<TabType>("entries");
  const [raidFilter, setRaidFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Entries state
  const [entries, setEntries] = useState<SRPlusEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // History state
  const [adminLogs, setAdminLogs] = useState<SRPlusAdminLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Settings>({ bonusPerSR: 20, hardReserveThreshold: 5 });
  const [settingsForm, setSettingsForm] = useState<Settings>({ bonusPerSR: 20, hardReserveThreshold: 5 });
  const [savingSettings, setSavingSettings] = useState(false);

  // Add entry modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ playerName: "", visitorId: "", raidType: "MC", itemName: "", timesSRd: 0 });

  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Tooltip
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();

  useEffect(() => {
    if (IS_BROWSER) {
      fetchEntries();
      fetchSettings();
    }
  }, [raidFilter]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Load item info for entries
  const loadItemInfoForEntries = async (entries: SRPlusEntry[]): Promise<SRPlusEntry[]> => {
    const itemNames = entries.map(e => e.itemName);
    prefetchItems(itemNames);

    const entriesWithInfo = await Promise.all(
      entries.map(async (entry) => {
        const itemInfo = await lookupItem(entry.itemName);
        return { ...entry, itemInfo: itemInfo || undefined };
      })
    );
    return entriesWithInfo;
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (raidFilter !== "ALL") params.set("raidType", raidFilter);

      const res = await fetch(`/api/sr-plus/entries?${params}`);
      const data = await res.json();

      const entries = data.entries || [];
      const entriesWithInfo = await loadItemInfoForEntries(entries);
      setEntries(entriesWithInfo);
      setSettings(data.settings || settings);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setErrorMessage("Failed to fetch entries");
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/sr-plus/settings");
      const data = await res.json();
      setSettings(data);
      setSettingsForm(data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/sr-plus/history?type=admin_log&limit=100");
      const data = await res.json();
      setAdminLogs(data.adminLogs || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
    setHistoryLoading(false);
  };

  const getEntryKey = (entry: SRPlusEntry) => `${entry.raidType}-${entry.visitorId}`;

  const startEditing = (entry: SRPlusEntry) => {
    setEditingEntry(getEntryKey(entry));
    setEditValue(String(entry.timesSRd));
  };

  const saveEdit = async (entry: SRPlusEntry) => {
    const newTimesSRd = parseInt(editValue, 10);
    if (isNaN(newTimesSRd) || newTimesSRd < 0) {
      setEditingEntry(null);
      return;
    }

    try {
      const res = await fetch("/api/sr-plus/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidType: entry.raidType,
          visitorId: entry.visitorId,
          setTimesSRd: newTimesSRd,
          note: "Manual adjustment by admin",
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Updated ${entry.playerName}'s count to ${newTimesSRd}`);
        fetchEntries();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to update");
      }
    } catch (err) {
      setErrorMessage("Failed to save");
    }
    setEditingEntry(null);
  };

  const deleteEntry = async (entry: SRPlusEntry) => {
    if (!confirm(`Delete ${entry.playerName}'s SR+ for ${entry.itemName}?`)) return;

    try {
      const res = await fetch(`/api/sr-plus/entries?raidType=${entry.raidType}&visitorId=${entry.visitorId}&reason=admin_removed`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage(`Deleted ${entry.playerName}'s SR+ entry`);
        fetchEntries();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to delete");
      }
    } catch (err) {
      setErrorMessage("Failed to delete");
    }
  };

  const addEntry = async () => {
    if (!newEntry.playerName || !newEntry.itemName || !newEntry.visitorId) {
      setErrorMessage("Player name, Discord ID, and item name are required");
      return;
    }

    try {
      const createRes = await fetch("/api/sr-plus/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidType: newEntry.raidType,
          itemName: newEntry.itemName,
          playerName: newEntry.playerName,
          visitorId: newEntry.visitorId,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        setErrorMessage(data.error || "Failed to create entry");
        return;
      }

      if (newEntry.timesSRd > 0) {
        await fetch("/api/sr-plus/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raidType: newEntry.raidType,
            visitorId: newEntry.visitorId,
            setTimesSRd: newEntry.timesSRd,
            note: "Initial count set by admin",
          }),
        });
      }

      setSuccessMessage(`Added SR+ entry for ${newEntry.playerName}`);
      setShowAddModal(false);
      setNewEntry({ playerName: "", visitorId: "", raidType: "MC", itemName: "", timesSRd: 0 });
      fetchEntries();
    } catch (err) {
      setErrorMessage("Failed to add entry");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/sr-plus/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      if (res.ok) {
        setSuccessMessage("Settings saved");
        setSettings(settingsForm);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to save settings");
      }
    } catch (err) {
      setErrorMessage("Failed to save settings");
    }
    setSavingSettings(false);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const exportCSV = () => {
    const headers = ["Player", "Item", "Raid Type", "Count", "Bonus", "Status", "Picked At"];
    const rows = entries.map(e => [
      e.playerName,
      e.itemName,
      e.raidType,
      e.timesSRd,
      e.currentBonus,
      e.isHardReserve ? "Hard Reserve" : "Building",
      new Date(e.pickedAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sr-plus-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Render item with icon and tooltip
  const renderItemWithIcon = (itemName: string, itemInfo?: ItemInfo) => {
    const quality = itemInfo?.quality ?? 4;
    const color = QUALITY_COLORS[quality] || "#a335ee";
    const iconUrl = itemInfo?.iconUrl || getIconUrl(itemInfo?.icon || "inv_misc_questionmark");

    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        onMouseEnter={(e) => showTooltip(e as unknown as MouseEvent, itemName, itemInfo?.icon, quality)}
        onMouseLeave={hideTooltip}
      >
        <img
          src={iconUrl}
          alt=""
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            border: `2px solid ${color}`,
            background: "#000",
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg";
            }
          }}
        />
        <span style={{ color, fontWeight: "500" }}>{itemName}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Messages */}
      {successMessage && (
        <div style={{ padding: "12px 16px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", marginBottom: "16px", color: "#22c55e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: "16px" }}>x</button>
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", marginBottom: "16px", color: "#ef4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>x</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#1f2937", padding: "4px", borderRadius: "8px" }}>
        <button onClick={() => setActiveTab("entries")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "entries" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", color: activeTab === "entries" ? "#fff" : "#9ca3af", cursor: "pointer", fontWeight: "600", transition: "background 0.2s, color 0.2s" }}>
          Entries ({entries.length})
        </button>
        <button onClick={() => setActiveTab("history")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "history" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", color: activeTab === "history" ? "#fff" : "#9ca3af", cursor: "pointer", fontWeight: "600", transition: "background 0.2s, color 0.2s" }}>
          Admin Log
        </button>
        <button onClick={() => setActiveTab("settings")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "settings" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", color: activeTab === "settings" ? "#fff" : "#9ca3af", cursor: "pointer", fontWeight: "600", transition: "background 0.2s, color 0.2s" }}>
          Settings
        </button>
      </div>

      {/* Entries Tab */}
      {activeTab === "entries" && (
        <div>
          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {RAID_TYPES.map(rt => (
                <button key={rt.id} onClick={() => setRaidFilter(rt.id)} style={{ padding: "6px 12px", background: raidFilter === rt.id ? `${rt.color}33` : "#374151", border: raidFilter === rt.id ? `1px solid ${rt.color}` : "1px solid transparent", borderRadius: "6px", color: raidFilter === rt.id ? rt.color : "#9ca3af", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>{rt.name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAddModal(true)} style={{ padding: "8px 16px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>+ Add Entry</button>
              <button onClick={exportCSV} style={{ padding: "8px 16px", background: "#374151", border: "none", borderRadius: "6px", color: "#e5e7eb", cursor: "pointer" }}>Export CSV</button>
            </div>
          </div>

          {/* Entries Table */}
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>No entries found{raidFilter !== "ALL" ? ` for ${raidFilter}` : ""}.</div>
          ) : (
            <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111827" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Player</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Item</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Raid</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Count</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Bonus</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => {
                    const key = getEntryKey(entry);
                    const isEditing = editingEntry === key;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #374151" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ color: "#e5e7eb", fontWeight: "500" }}>{entry.playerName}</div>
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>{entry.visitorId}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {renderItemWithIcon(entry.itemName, entry.itemInfo)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: `${RAID_COLORS[entry.raidType] || "#6b7280"}22`, color: RAID_COLORS[entry.raidType] || "#6b7280" }}>{entry.raidType}</span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {isEditing ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(entry); if (e.key === "Escape") setEditingEntry(null); }} autoFocus style={{ width: "60px", padding: "4px 8px", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#e5e7eb", textAlign: "center" }} />
                          ) : (
                            <span style={{ color: "#e5e7eb", cursor: "pointer" }} onClick={() => startEditing(entry)} title="Click to edit">{entry.timesSRd}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399" }}>+{entry.currentBonus}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {entry.isHardReserve ? (
                            <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "11px" }}>{entry.timesSRd}/{settings.hardReserveThreshold}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                              <button onClick={() => saveEdit(entry)} style={{ padding: "4px 8px", background: "#059669", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>Save</button>
                              <button onClick={() => setEditingEntry(null)} style={{ padding: "4px 8px", background: "#374151", border: "none", borderRadius: "4px", color: "#9ca3af", cursor: "pointer", fontSize: "11px" }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                              <button onClick={() => startEditing(entry)} style={{ padding: "4px 8px", background: "#374151", border: "none", borderRadius: "4px", color: "#e5e7eb", cursor: "pointer", fontSize: "11px" }}>Edit</button>
                              <button onClick={() => deleteEntry(entry)} style={{ padding: "4px 8px", background: "#dc2626", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>Delete</button>
                            </div>
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
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", color: "#e5e7eb" }}>Admin Action Log</h3>
          {historyLoading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : adminLogs.length === 0 ? (
            <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>No admin actions recorded yet.</div>
          ) : (
            <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111827" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Time</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Action</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Target</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Raid</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #374151" }}>
                      <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: "12px" }}>{formatTimestamp(log.timestamp)}</td>
                      <td style={{ padding: "10px 12px", color: "#e5e7eb" }}>{log.action.replace(/_/g, " ")}</td>
                      <td style={{ padding: "10px 12px", color: "#e5e7eb" }}>{log.targetPlayer}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: `${RAID_COLORS[log.targetRaidType] || "#6b7280"}22`, color: RAID_COLORS[log.targetRaidType] || "#6b7280" }}>{log.targetRaidType}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: "12px" }}>
                        {log.previousValue !== null && log.previousValue !== undefined && (
                          <span>{JSON.stringify(log.previousValue)} -{">"} {JSON.stringify(log.newValue)}</span>
                        )}
                        {log.note && <span style={{ marginLeft: "8px", fontStyle: "italic" }}>({log.note})</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div style={{ maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#e5e7eb" }}>SR+ Settings</h3>
          <div style={{ background: "#1f2937", borderRadius: "10px", padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Bonus Per SR (roll points per raid attended)</label>
              <input type="number" value={settingsForm.bonusPerSR} onChange={(e) => setSettingsForm({ ...settingsForm, bonusPerSR: parseInt((e.target as HTMLInputElement).value) || 0 })} style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Hard Reserve Threshold (raids needed for HR status)</label>
              <input type="number" value={settingsForm.hardReserveThreshold} onChange={(e) => setSettingsForm({ ...settingsForm, hardReserveThreshold: parseInt((e.target as HTMLInputElement).value) || 0 })} style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>
            <button onClick={saveSettings} disabled={savingSettings} style={{ width: "100%", padding: "12px", background: savingSettings ? "#4b5563" : "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: savingSettings ? "not-allowed" : "pointer", fontWeight: "600" }}>{savingSettings ? "Saving..." : "Save Settings"}</button>
          </div>

          <div style={{ marginTop: "24px", padding: "16px", background: "#1f2937", borderRadius: "10px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#e5e7eb" }}>Current Values</h4>
            <p style={{ margin: "0 0 8px 0", color: "#9ca3af", fontSize: "13px" }}>+{settings.bonusPerSR} bonus per raid attended</p>
            <p style={{ margin: "0", color: "#9ca3af", fontSize: "13px" }}>Hard Reserve at {settings.hardReserveThreshold}+ raids</p>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "24px", maxWidth: "450px", width: "90%" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb" }}>Add SR+ Entry</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Player Name *</label>
              <input type="text" value={newEntry.playerName} onChange={(e) => setNewEntry({ ...newEntry, playerName: (e.target as HTMLInputElement).value })} placeholder="Character name" style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Discord ID *</label>
              <input type="text" value={newEntry.visitorId} onChange={(e) => setNewEntry({ ...newEntry, visitorId: (e.target as HTMLInputElement).value })} placeholder="Discord user ID" style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Raid Type *</label>
              <select value={newEntry.raidType} onChange={(e) => setNewEntry({ ...newEntry, raidType: (e.target as HTMLSelectElement).value })} style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }}>
                {RAID_TYPES.filter(r => r.id !== "ALL").map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Item Name *</label>
              <input type="text" value={newEntry.itemName} onChange={(e) => setNewEntry({ ...newEntry, itemName: (e.target as HTMLInputElement).value })} placeholder="Item name" style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "#9ca3af", fontSize: "13px" }}>Initial Count</label>
              <input type="number" value={newEntry.timesSRd} onChange={(e) => setNewEntry({ ...newEntry, timesSRd: parseInt((e.target as HTMLInputElement).value) || 0 })} min="0" style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", background: "#374151", border: "none", borderRadius: "6px", color: "#e5e7eb", cursor: "pointer" }}>Cancel</button>
              <button onClick={addEntry} style={{ flex: 1, padding: "12px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Add Entry</button>
            </div>
          </div>
        </div>
      )}

      <ItemTooltip tooltip={tooltip} />
    </div>
  );
}

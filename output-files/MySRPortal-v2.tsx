import { useEffect, useState, useRef } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import ItemTooltip, { useItemTooltip, QUALITY_COLORS } from "./ItemTooltip.tsx";

/**
 * MySRPortal v2 - Player's SR+ management page
 *
 * Uses new /api/sr-plus/entries API
 * Two tabs: "My SR+" (personal picks) and "Guild SR+" (all players read-only)
 */

interface UserSession {
  visitorId: string;
  discordId: string;
  discordUsername: string;
  displayName: string;
  discordAvatar: string | null;
  characters: string[];
  isAdmin?: boolean;
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
}

interface UpcomingRaid {
  id: string;
  title: string;
  startTime: number;
  description?: string;
  softresId?: string;
}

interface Settings {
  bonusPerSR: number;
  hardReserveThreshold: number;
}

interface PlayerSR {
  itemName: string;
  playerClass: string;
  playerName: string;
}

interface ItemInfo {
  id: number;
  name: string;
  icon: string;
  iconUrl: string;
  quality: number;
  tooltipHtml?: string;
}

interface PlayerSRWithInfo extends PlayerSR {
  itemInfo?: ItemInfo;
}

type TabType = "my-sr" | "guild-sr";

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

export default function MySRPortal() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("my-sr");

  // My SR+ state
  const [myEntries, setMyEntries] = useState<SRPlusEntry[]>([]);
  const [upcomingRaids, setUpcomingRaids] = useState<UpcomingRaid[]>([]);
  const [settings, setSettings] = useState<Settings>({ bonusPerSR: 20, hardReserveThreshold: 5 });
  const [characters, setCharacters] = useState<string[]>([]);

  // Guild SR+ state
  const [guildEntries, setGuildEntries] = useState<SRPlusEntry[]>([]);
  const [guildRaidFilter, setGuildRaidFilter] = useState("ALL");
  const [guildLoading, setGuildLoading] = useState(false);

  // Pick flow state
  const [selectedRaid, setSelectedRaid] = useState<UpcomingRaid | null>(null);
  const [playerSRs, setPlayerSRs] = useState<PlayerSRWithInfo[]>([]);
  const [loadingSRs, setLoadingSRs] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Character modal
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [newCharacter, setNewCharacter] = useState("");

  // Confirmation modal
  const [confirmation, setConfirmation] = useState<{
    show: boolean;
    currentItem: string;
    currentCount: number;
    newItem: string;
    raidType: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();

  useEffect(() => {
    if (IS_BROWSER) {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (selectedRaid?.softresId) {
      fetchPlayerSRs(selectedRaid.softresId);
    } else {
      setPlayerSRs([]);
    }
  }, [selectedRaid]);

  useEffect(() => {
    if (activeTab === "guild-sr") {
      fetchGuildEntries();
    }
  }, [activeTab, guildRaidFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated) {
        setUser({
          visitorId: data.user.visitorId || data.user.discordId,
          discordId: data.user.discordId,
          discordUsername: data.user.discordUsername,
          displayName: data.user.discordDisplayName || data.user.discordUsername,
          discordAvatar: data.user.discordAvatar,
          characters: data.user.characters || [],
          isAdmin: data.user.isAdmin,
        });
        setCharacters(data.user.characters || []);
        fetchMyData(data.user.visitorId || data.user.discordId);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
    setLoading(false);
  };

  const fetchMyData = async (visitorId: string) => {
    try {
      const entriesRes = await fetch(`/api/sr-plus/entries?visitorId=${visitorId}`);
      const entriesData = await entriesRes.json();
      setMyEntries(entriesData.entries || []);
      setSettings(entriesData.settings || settings);

      const raidsRes = await fetch("/api/sr-plus/my-picks");
      if (raidsRes.ok) {
        const raidsData = await raidsRes.json();
        setUpcomingRaids(raidsData.upcomingRaids || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const fetchGuildEntries = async () => {
    setGuildLoading(true);
    try {
      const params = new URLSearchParams();
      if (guildRaidFilter !== "ALL") {
        params.set("raidType", guildRaidFilter);
      }

      const res = await fetch(`/api/sr-plus/entries?${params}`);
      const data = await res.json();
      setGuildEntries(data.entries || []);
      setSettings(data.settings || settings);
    } catch (err) {
      console.error("Failed to fetch guild entries:", err);
    }
    setGuildLoading(false);
  };

  const lookupItem = async (itemName: string): Promise<ItemInfo | null> => {
    try {
      const response = await fetch(`/api/items/lookup?name=${encodeURIComponent(itemName)}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const fetchPlayerSRs = async (eventId: string) => {
    setLoadingSRs(true);
    setPlayerSRs([]);

    try {
      const res = await fetch(`/api/sr-plus/my-srs?eventId=${eventId}`);
      if (!res.ok) {
        setPlayerSRs([]);
        setLoadingSRs(false);
        return;
      }

      const data = await res.json();
      const srs: PlayerSR[] = data.srs || [];

      if (srs.length === 0) {
        setPlayerSRs([]);
        setLoadingSRs(false);
        return;
      }

      const srsWithInfo = await Promise.all(
        srs.map(async (sr) => {
          const itemInfo = await lookupItem(sr.itemName);
          return { ...sr, itemInfo };
        })
      );

      setPlayerSRs(srsWithInfo);
    } catch (err) {
      console.error("Failed to fetch player SRs:", err);
      setPlayerSRs([]);
    }

    setLoadingSRs(false);
  };

  const submitPick = async () => {
    if (!selectedRaid || !selectedItem.trim() || !user) return;

    const raidType = detectRaidType(selectedRaid.title);
    const existingEntry = myEntries.find(e => e.raidType === raidType);

    if (existingEntry && existingEntry.itemName !== selectedItem && existingEntry.timesSRd > 0) {
      setConfirmation({
        show: true,
        currentItem: existingEntry.itemName,
        currentCount: existingEntry.timesSRd,
        newItem: selectedItem,
        raidType,
      });
      return;
    }

    await doSubmitPick(raidType);
  };

  const doSubmitPick = async (raidType: string) => {
    setSubmitting(true);
    setError("");

    try {
      const playerName = characters[0] || user?.displayName || "Unknown";

      const res = await fetch("/api/sr-plus/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidType,
          itemName: selectedItem.trim(),
          playerName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(`SR+ set to "${selectedItem}" for ${raidType}!`);
        setSelectedItem("");
        setSelectedRaid(null);
        setPlayerSRs([]);
        setConfirmation(null);
        if (user) fetchMyData(user.visitorId);
      } else {
        setError(data.error || "Failed to submit pick");
      }
    } catch (err) {
      setError("Failed to submit pick");
    }

    setSubmitting(false);
  };

  const deletePick = async (raidType: string) => {
    if (!confirm("Remove this SR+ pick? Your progress will be reset.")) return;

    try {
      const res = await fetch(`/api/sr-plus/entries?raidType=${raidType}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage(`SR+ pick for ${raidType} removed`);
        if (user) fetchMyData(user.visitorId);
      }
    } catch (err) {
      console.error("Failed to delete pick:", err);
    }
  };

  const saveCharacters = async () => {
    try {
      const res = await fetch("/api/auth/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characters }),
      });

      if (res.ok) {
        setShowCharacterModal(false);
        if (user) fetchMyData(user.visitorId);
      }
    } catch (err) {
      console.error("Failed to save characters:", err);
    }
  };

  const detectRaidType = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes("kara 40") || lower.includes("karazhan 40") || lower.includes("upper kara")) return "KARA40";
    if (lower.includes("kara") || lower.includes("karazhan") || lower.includes("lower kara")) return "KARA10";
    if (lower.includes("molten") || lower.includes(" mc")) return "MC";
    if (lower.includes("blackwing") || lower.includes("bwl")) return "BWL";
    if (lower.includes("aq40") || lower.includes("temple")) return "AQ40";
    if (lower.includes("aq20") || lower.includes("ruins")) return "AQ20";
    if (lower.includes("naxx")) return "NAXX";
    if (lower.includes("zg") || lower.includes("gurub")) return "ZG";
    if (lower.includes("ony")) return "ONY";
    if (lower.includes("emerald") || lower.includes("sanctum")) return "EMERALD";
    return "OTHER";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getAvatarUrl = (user: UserSession) => {
    if (user.discordAvatar) {
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`;
  };

  if (loading) {
    return <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>=</div>
        <h2 style={{ margin: "0 0 16px 0", color: "#e5e7eb" }}>Login Required</h2>
        <p style={{ color: "#9ca3af", marginBottom: "24px" }}>Sign in with Discord to manage your SR+ picks</p>
        <a href="/api/auth/discord/login" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 24px", background: "#5865F2", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
          Login with Discord
        </a>
      </div>
    );
  }

  return (
    <div>
      {successMessage && (
        <div style={{ padding: "12px 16px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", marginBottom: "16px", color: "#22c55e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span> {successMessage}</span>
          <button onClick={() => setSuccessMessage("")} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer" }}></button>
        </div>
      )}

      {/* User Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#1f2937", borderRadius: "10px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={getAvatarUrl(user)} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
          <div>
            <div style={{ fontWeight: "600", color: "#e5e7eb" }}>{user.displayName}</div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>{characters.length > 0 ? characters.join(", ") : "No characters linked"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowCharacterModal(true)} style={{ padding: "8px 14px", background: "#374151", border: "none", borderRadius: "6px", color: "#e5e7eb", cursor: "pointer", fontSize: "13px" }}>
            {characters.length > 0 ? "Edit Characters" : "Link Character"}
          </button>
          <a href="/api/auth/discord/logout" style={{ padding: "8px 14px", background: "#4b5563", borderRadius: "6px", color: "#e5e7eb", textDecoration: "none", fontSize: "13px" }}>Logout</a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#1f2937", padding: "4px", borderRadius: "8px" }}>
        <button onClick={() => setActiveTab("my-sr")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "my-sr" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", color: activeTab === "my-sr" ? "#fff" : "#9ca3af", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
          My SR+
        </button>
        <button onClick={() => setActiveTab("guild-sr")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "guild-sr" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", color: activeTab === "guild-sr" ? "#fff" : "#9ca3af", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
          Guild SR+
        </button>
      </div>

      {/* My SR+ Tab */}
      {activeTab === "my-sr" && (
        <div>
          {characters.length === 0 && (
            <div style={{ padding: "20px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
              <p style={{ margin: "0 0 12px 0", color: "#fbbf24" }}>Please link your in-game character name to manage SR+ picks</p>
              <button onClick={() => setShowCharacterModal(true)} style={{ padding: "10px 20px", background: "#f59e0b", border: "none", borderRadius: "6px", color: "#000", cursor: "pointer", fontWeight: "600" }}>Link Character</button>
            </div>
          )}

          {myEntries.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#e5e7eb" }}>My SR+ Progress</h3>
              <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111827" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Item</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Raid</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Count</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Bonus</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEntries.map((entry, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #374151" }}>
                        <td style={{ padding: "10px 12px", color: "#a335ee" }}>{entry.itemName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: `${RAID_COLORS[entry.raidType] || "#6b7280"}22`, color: RAID_COLORS[entry.raidType] || "#6b7280" }}>{entry.raidType}</span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#e5e7eb" }}>{entry.timesSRd}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399" }}>+{entry.currentBonus}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {entry.isHardReserve ? (
                            <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "11px" }}>{entry.timesSRd}/{settings.hardReserveThreshold} to HR</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <button onClick={() => deletePick(entry.raidType)} style={{ padding: "4px 10px", background: "#dc2626", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#e5e7eb" }}>Set SR+ for Upcoming Raids</h3>
            {upcomingRaids.length === 0 ? (
              <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>
                <p>No upcoming raids found. Sign up for raids on Discord first.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {upcomingRaids.map(raid => {
                  const raidType = detectRaidType(raid.title);
                  const existingEntry = myEntries.find(e => e.raidType === raidType);
                  const isSelected = selectedRaid?.id === raid.id;

                  return (
                    <div key={raid.id} style={{ background: "#1f2937", borderRadius: "10px", padding: "16px", borderLeft: `4px solid ${RAID_COLORS[raidType] || "#6b7280"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontWeight: "600", color: "#e5e7eb", marginBottom: "4px" }}>{raid.title}</div>
                          <div style={{ fontSize: "13px", color: "#9ca3af" }}>{formatDate(raid.startTime)}</div>
                          {!raid.softresId && <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>  No raidres.top link found</div>}
                        </div>
                        <span style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: `${RAID_COLORS[raidType]}22`, color: RAID_COLORS[raidType] }}>{raidType}</span>
                      </div>

                      {existingEntry && (
                        <div style={{ padding: "10px 12px", background: "#374151", borderRadius: "6px", marginBottom: "10px" }}>
                          <span style={{ color: "#9ca3af", fontSize: "12px" }}>Current SR+: </span>
                          <span style={{ color: "#a335ee", fontWeight: "600" }}>{existingEntry.itemName}</span>
                          <span style={{ color: "#6b7280", fontSize: "11px", marginLeft: "8px" }}>({existingEntry.timesSRd} raids, +{existingEntry.currentBonus} bonus)</span>
                        </div>
                      )}

                      {!isSelected ? (
                        <button onClick={() => setSelectedRaid(raid)} disabled={!raid.softresId} style={{ width: "100%", padding: "10px", background: raid.softresId ? "#374151" : "#1f2937", border: raid.softresId ? "1px solid #4b5563" : "1px dashed #4b5563", borderRadius: "6px", color: raid.softresId ? "#e5e7eb" : "#6b7280", cursor: raid.softresId ? "pointer" : "not-allowed", fontSize: "13px" }}>
                          {existingEntry ? "Change SR+ Pick" : "Select SR+ Item"}
                        </button>
                      ) : (
                        <div ref={dropdownRef}>
                          {loadingSRs ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>Fetching your SRs from raidres.top...</div>
                          ) : playerSRs.length === 0 ? (
                            <div style={{ padding: "16px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "6px", textAlign: "center", color: "#f59e0b" }}>No soft reservations found for your character on raidres.top</div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: "10px", fontSize: "12px", color: "#9ca3af" }}>Select from your {playerSRs.length} SR'd items:</div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <div style={{ flex: 1, position: "relative" }}>
                                  <div onClick={() => setShowDropdown(!showDropdown)} style={{ width: "100%", padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: selectedItem ? "#a335ee" : "#9ca3af", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>{selectedItem || "Click to select..."}</span>
                                    <span style={{ color: "#6b7280" }}>¼</span>
                                  </div>
                                  {showDropdown && (
                                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", background: "#1f2937", border: "1px solid #4b5563", borderRadius: "6px", marginTop: "4px", zIndex: 100, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                                      {playerSRs.map((sr, idx) => {
                                        const itemInfo = sr.itemInfo;
                                        const itemColor = itemInfo ? QUALITY_COLORS[itemInfo.quality] || "#a335ee" : "#a335ee";
                                        return (
                                          <div key={idx} onClick={() => { setSelectedItem(sr.itemName); setShowDropdown(false); }} style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: idx < playerSRs.length - 1 ? "1px solid #374151" : "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                            {itemInfo?.iconUrl && <img src={itemInfo.iconUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", border: `2px solid ${itemColor}` }} />}
                                            <span style={{ color: itemColor, fontWeight: "500" }}>{sr.itemName}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <button onClick={submitPick} disabled={submitting || !selectedItem} style={{ padding: "10px 16px", background: submitting || !selectedItem ? "#4b5563" : "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: submitting || !selectedItem ? "not-allowed" : "pointer", fontWeight: "600", whiteSpace: "nowrap" }}>{submitting ? "..." : "Set SR+"}</button>
                                <button onClick={() => { setSelectedRaid(null); setSelectedItem(""); setPlayerSRs([]); }} style={{ padding: "10px 12px", background: "#374151", border: "none", borderRadius: "6px", color: "#9ca3af", cursor: "pointer" }}></button>
                              </div>
                              {error && <div style={{ marginTop: "8px", color: "#ef4444", fontSize: "12px" }}>{error}</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guild SR+ Tab */}
      {activeTab === "guild-sr" && (
        <div>
          <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {RAID_TYPES.map(rt => (
              <button key={rt.id} onClick={() => setGuildRaidFilter(rt.id)} style={{ padding: "6px 12px", background: guildRaidFilter === rt.id ? `${rt.color}33` : "#374151", border: guildRaidFilter === rt.id ? `1px solid ${rt.color}` : "1px solid transparent", borderRadius: "6px", color: guildRaidFilter === rt.id ? rt.color : "#9ca3af", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>{rt.name}</button>
            ))}
          </div>

          {guildLoading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : guildEntries.length === 0 ? (
            <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>No SR+ entries found{guildRaidFilter !== "ALL" ? ` for ${guildRaidFilter}` : ""}.</div>
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
                  </tr>
                </thead>
                <tbody>
                  {guildEntries.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #374151" }}>
                      <td style={{ padding: "10px 12px", color: "#e5e7eb", fontWeight: "500" }}>{entry.playerName}</td>
                      <td style={{ padding: "10px 12px", color: "#a335ee" }}>{entry.itemName}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: `${RAID_COLORS[entry.raidType] || "#6b7280"}22`, color: RAID_COLORS[entry.raidType] || "#6b7280" }}>{entry.raidType}</span></td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#e5e7eb" }}>{entry.timesSRd}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399" }}>+{entry.currentBonus}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{entry.isHardReserve ? <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span> : <span style={{ color: "#9ca3af", fontSize: "11px" }}>Building</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: "16px", padding: "12px", background: "#1f2937", borderRadius: "8px", fontSize: "12px", color: "#9ca3af" }}>
            <strong>How SR+ Works:</strong> Players earn +{settings.bonusPerSR} bonus per raid attended while SR+'ing an item. After {settings.hardReserveThreshold} raids, the item becomes a Hard Reserve.
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmation?.show && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>  Change SR+ Item?</h3>
            <p style={{ color: "#9ca3af", marginBottom: "16px" }}>You currently have <strong style={{ color: "#a335ee" }}>{confirmation.currentItem}</strong> with <strong style={{ color: "#e5e7eb" }}>{confirmation.currentCount}</strong> raids of progress.</p>
            <p style={{ color: "#9ca3af", marginBottom: "24px" }}>Changing to <strong style={{ color: "#a335ee" }}>{confirmation.newItem}</strong> will reset your count to 0.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setConfirmation(null); setSelectedItem(""); }} style={{ flex: 1, padding: "10px", background: "#374151", border: "none", borderRadius: "6px", color: "#e5e7eb", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => doSubmitPick(confirmation.raidType)} style={{ flex: 1, padding: "10px", background: "#dc2626", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Yes, Change It</button>
            </div>
          </div>
        </div>
      )}

      {/* Character Modal */}
      {showCharacterModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#e5e7eb" }}>Link Characters</h3>
            <div style={{ marginBottom: "16px" }}>
              {characters.map(char => (
                <div key={char} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#374151", borderRadius: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "#e5e7eb" }}>{char}</span>
                  <button onClick={() => setCharacters(characters.filter(c => c !== char))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}></button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input type="text" value={newCharacter} onChange={(e) => setNewCharacter((e.target as HTMLInputElement).value)} placeholder="Character name" style={{ flex: 1, padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#e5e7eb" }} onKeyDown={(e) => { if (e.key === "Enter" && newCharacter.trim() && !characters.includes(newCharacter.trim())) { setCharacters([...characters, newCharacter.trim()]); setNewCharacter(""); }}} />
              <button onClick={() => { if (newCharacter.trim() && !characters.includes(newCharacter.trim())) { setCharacters([...characters, newCharacter.trim()]); setNewCharacter(""); }}} style={{ padding: "10px 16px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Add</button>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCharacterModal(false)} style={{ flex: 1, padding: "10px", background: "#374151", border: "none", borderRadius: "6px", color: "#e5e7eb", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCharacters} style={{ flex: 1, padding: "10px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <ItemTooltip {...tooltip} />
    </div>
  );
}

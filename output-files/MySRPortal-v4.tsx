import { useEffect, useState, useRef } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import ItemTooltip, { useItemTooltip, prefetchItems, getIconUrl, QUALITY_COLORS } from "./ItemTooltip.tsx";

/**
 * MySRPortal - Player's SR+ management page
 *
 * Uses the same modular approach as RaidResFetcher.tsx:
 * - Fetches player's SRs from /api/sr-plus/my-srs (which calls Playwright scraper)
 * - Looks up each item via /api/items/lookup?name=X for icons/quality
 * - Displays icons using itemInfo.iconUrl with quality-colored borders
 */

interface UserSession {
  discordId: string;
  discordUsername: string;
  discordDisplayName: string;
  discordAvatar: string | null;
  characters: string[];
  isAdmin?: boolean;
}

interface SRPlusPick {
  raidType: string;
  itemName: string;
  count: number;
  startedAt: string;
}

interface SRCredit {
  playerName: string;
  itemName: string;
  raidType: string;
  timesSRd: number;
  bonusRP?: number;
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
  lockSRBeforeRaid: number;
}

// Player's SR from raidres.top (item name only - we look up details separately)
interface PlayerSR {
  itemName: string;
  playerClass: string;
  playerName: string;
}

// Item info from /api/items/lookup (same as RaidResFetcher uses)
interface ItemInfo {
  id: number;
  name: string;
  icon: string;
  iconUrl: string;
  quality: number;
  link: string;
  tooltipHtml?: string;
}

// SR with looked-up item info
interface PlayerSRWithInfo extends PlayerSR {
  itemInfo?: ItemInfo;
}

// Confirmation modal data
interface ConfirmationData {
  show: boolean;
  currentItem: string;
  currentCount: number;
  newItem: string;
  raidType: string;
}

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

export default function MySRPortal() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<SRPlusPick[]>([]);
  const [credits, setCredits] = useState<SRCredit[]>([]);
  const [upcomingRaids, setUpcomingRaids] = useState<UpcomingRaid[]>([]);
  const [settings, setSettings] = useState<Settings>({ bonusPerSR: 20, hardReserveThreshold: 5, lockSRBeforeRaid: 2 });
  const [characters, setCharacters] = useState<string[]>([]);
  const [newCharacter, setNewCharacter] = useState("");
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<UpcomingRaid | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Player's SRs from raidres.top (with item info looked up)
  const [playerSRs, setPlayerSRs] = useState<PlayerSRWithInfo[]>([]);
  const [loadingSRs, setLoadingSRs] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Confirmation modal for SR+ changes
  const [confirmation, setConfirmation] = useState<ConfirmationData>({
    show: false,
    currentItem: "",
    currentCount: 0,
    newItem: "",
    raidType: "",
  });

  // Use shared tooltip hook
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();

  useEffect(() => {
    if (IS_BROWSER) {
      checkAuth();
    }
  }, []);

  // Fetch player's SRs when a raid is selected
  useEffect(() => {
    if (selectedRaid?.softresId) {
      fetchPlayerSRs(selectedRaid.softresId);
    } else if (selectedRaid) {
      setPlayerSRs([]);
      setLoadingSRs(false);
    }
  }, [selectedRaid]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Look up item info - same as RaidResFetcher.tsx
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
      // Get player's SRs from the scraper
      const res = await fetch(`/api/sr-plus/my-srs?eventId=${eventId}`);
      if (!res.ok) {
        console.error("Failed to fetch SRs:", res.status);
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

      // Look up item info for each SR (in parallel) - same as RaidResFetcher.tsx
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

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        setCharacters(data.user.characters || []);
        fetchMyData();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
    setLoading(false);
  };

  const fetchMyData = async () => {
    try {
      const res = await fetch("/api/sr-plus/my-picks");
      if (res.ok) {
        const data = await res.json();
        setPicks(data.picks || []);
        setCredits(data.credits || []);
        setUpcomingRaids(data.upcomingRaids || []);
        setSettings(data.settings || settings);
        setCharacters(data.characters || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
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
        fetchMyData();
      }
    } catch (err) {
      console.error("Failed to save characters:", err);
    }
  };

  const addCharacter = () => {
    if (newCharacter.trim() && !characters.includes(newCharacter.trim())) {
      setCharacters([...characters, newCharacter.trim()]);
      setNewCharacter("");
    }
  };

  const removeCharacter = (char: string) => {
    setCharacters(characters.filter(c => c !== char));
  };

  const selectItem = (itemName: string) => {
    setSelectedItem(itemName);
    setShowDropdown(false);
    hideTooltip();
  };

  const submitPick = async (confirmReset = false) => {
    if (!selectedRaid || !selectedItem.trim()) return;

    const raidType = detectRaidType(selectedRaid.title);
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/sr-plus/my-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidType,
          itemName: selectedItem.trim(),
          confirmReset,
        }),
      });

      const data = await res.json();

      if (data.requiresConfirmation) {
        setConfirmation({
          show: true,
          currentItem: data.currentItem,
          currentCount: data.currentCount,
          newItem: data.newItem,
          raidType,
        });
        setSubmitting(false);
        return;
      }

      if (res.ok && data.success) {
        setSelectedItem("");
        setSelectedRaid(null);
        setPlayerSRs([]);
        fetchMyData();
      } else {
        setError(data.error || "Failed to submit pick");
      }
    } catch (err) {
      setError("Failed to submit pick");
    }

    setSubmitting(false);
  };

  const confirmSRChange = async () => {
    setConfirmation({ ...confirmation, show: false });
    await submitPick(true);
  };

  const cancelSRChange = () => {
    setConfirmation({
      show: false,
      currentItem: "",
      currentCount: 0,
      newItem: "",
      raidType: "",
    });
    setSelectedItem("");
  };

  const deletePick = async (raidType: string) => {
    if (!confirm("Remove this SR+ pick? Your progress will be lost.")) return;

    try {
      await fetch(`/api/sr-plus/my-picks?raidType=${raidType}`, {
        method: "DELETE",
      });
      fetchMyData();
    } catch (err) {
      console.error("Failed to delete pick:", err);
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

  const getExistingPick = (raidType: string): SRPlusPick | undefined => {
    return picks.find(p => p.raidType === raidType);
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
        <h2 style={{ margin: "0 0 16px 0", color: "#e5e7eb" }}>Login Required</h2>
        <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
          Sign in with Discord to manage your SR+ picks
        </p>
        <a
          href="/api/auth/discord/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 24px",
            background: "#5865F2",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Login with Discord
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* User Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        background: "#1f2937",
        borderRadius: "10px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={getAvatarUrl(user)}
            alt=""
            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
          />
          <div>
            <div style={{ fontWeight: "600", color: "#e5e7eb" }}>{user.discordDisplayName}</div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              {characters.length > 0 ? characters.join(", ") : "No characters linked"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowCharacterModal(true)}
            style={{
              padding: "8px 14px",
              background: "#374151",
              border: "none",
              borderRadius: "6px",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {characters.length > 0 ? "Edit Characters" : "Link Character"}
          </button>
          <a
            href="/api/auth/discord/logout"
            style={{
              padding: "8px 14px",
              background: "#4b5563",
              borderRadius: "6px",
              color: "#e5e7eb",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            Logout
          </a>
        </div>
      </div>

      {/* Character Setup Prompt */}
      {characters.length === 0 && (
        <div style={{
          padding: "20px",
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid #f59e0b",
          borderRadius: "10px",
          marginBottom: "20px",
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 12px 0", color: "#fbbf24" }}>
            Please link your in-game character name to manage SR+ picks
          </p>
          <button
            onClick={() => setShowCharacterModal(true)}
            style={{
              padding: "10px 20px",
              background: "#f59e0b",
              border: "none",
              borderRadius: "6px",
              color: "#000",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Link Character
          </button>
        </div>
      )}

      {/* My SR+ Credits */}
      {credits.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#e5e7eb" }}>
            My SR+ Progress
          </h3>
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
                {credits.map((credit, idx) => {
                  const isHR = credit.timesSRd >= settings.hardReserveThreshold;
                  const bonus = credit.bonusRP || credit.timesSRd * settings.bonusPerSR;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #374151" }}>
                      <td style={{ padding: "10px 12px", color: "#a335ee" }}>{credit.itemName}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: `${RAID_COLORS[credit.raidType] || "#6b7280"}22`,
                          color: RAID_COLORS[credit.raidType] || "#6b7280",
                        }}>
                          {credit.raidType}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{credit.timesSRd}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399" }}>+{bonus}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {isHR ? (
                          <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "11px" }}>Building...</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <button
                          onClick={() => deletePick(credit.raidType)}
                          style={{
                            padding: "4px 10px",
                            background: "#dc2626",
                            border: "none",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Raids */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#e5e7eb" }}>
          Set SR+ for Upcoming Raids
        </h3>

        {upcomingRaids.length === 0 ? (
          <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>
            <p>No upcoming raids found. Sign up for raids on Discord.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {upcomingRaids.map(raid => {
              const raidType = detectRaidType(raid.title);
              const existingPick = getExistingPick(raidType);

              return (
                <div
                  key={raid.id}
                  style={{
                    background: "#1f2937",
                    borderRadius: "10px",
                    padding: "16px",
                    borderLeft: `4px solid ${RAID_COLORS[raidType] || "#6b7280"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#e5e7eb", marginBottom: "4px" }}>{raid.title}</div>
                      <div style={{ fontSize: "13px", color: "#9ca3af" }}>{formatDate(raid.startTime)}</div>
                      {!raid.softresId && (
                        <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                          No raidres.top link found
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: `${RAID_COLORS[raidType]}22`,
                      color: RAID_COLORS[raidType],
                    }}>
                      {raidType}
                    </span>
                  </div>

                  {existingPick && (
                    <div style={{
                      padding: "10px 12px",
                      background: "#374151",
                      borderRadius: "6px",
                      marginBottom: "10px",
                    }}>
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>Current SR+: </span>
                      <span style={{ color: "#a335ee", fontWeight: "600" }}>{existingPick.itemName}</span>
                      <span style={{ color: "#6b7280", fontSize: "11px", marginLeft: "8px" }}>({existingPick.count} raids)</span>
                    </div>
                  )}

                  {selectedRaid?.id === raid.id ? (
                    <div>
                      {loadingSRs ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                          Fetching your SRs from raidres.top...
                        </div>
                      ) : playerSRs.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", borderRadius: "6px" }}>
                          {raid.softresId
                            ? "No soft reservations found for your character on raidres.top"
                            : "This event doesn't have a raidres.top link"}
                        </div>
                      ) : (
                        <div style={{ position: "relative" }} ref={dropdownRef}>
                          <div style={{ marginBottom: "10px", fontSize: "12px", color: "#9ca3af" }}>
                            Select from your {playerSRs.length} SR'd items:
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <div style={{ flex: 1, position: "relative" }}>
                              <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  background: "#374151",
                                  border: "1px solid #4b5563",
                                  borderRadius: "6px",
                                  color: selectedItem ? "#a335ee" : "#9ca3af",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>{selectedItem || "Click to select..."}</span>
                                <span style={{ color: "#6b7280" }}>▼</span>
                              </div>

                              {showDropdown && (
                                <div style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  maxHeight: "300px",
                                  overflowY: "auto",
                                  background: "#1f2937",
                                  border: "1px solid #4b5563",
                                  borderRadius: "6px",
                                  marginTop: "4px",
                                  zIndex: 100,
                                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                                }}>
                                  {playerSRs.map((sr, idx) => {
                                    const itemInfo = sr.itemInfo;
                                    const itemColor = itemInfo ? QUALITY_COLORS[itemInfo.quality] || "#a335ee" : "#a335ee";

                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => selectItem(sr.itemName)}
                                        onMouseEnter={(e) => {
                                          setHighlightedIndex(idx);
                                          if (itemInfo) {
                                            showTooltip(e as unknown as MouseEvent, sr.itemName, itemInfo.tooltipHtml, itemInfo.quality);
                                          }
                                        }}
                                        onMouseLeave={hideTooltip}
                                        style={{
                                          padding: "10px 12px",
                                          cursor: "pointer",
                                          background: idx === highlightedIndex ? "#374151" : "transparent",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          borderBottom: idx < playerSRs.length - 1 ? "1px solid #374151" : "none",
                                        }}
                                      >
                                        {/* Item icon - same as RaidResFetcher */}
                                        {itemInfo && (
                                          <img
                                            src={itemInfo.iconUrl}
                                            alt={sr.itemName}
                                            style={{
                                              width: "28px",
                                              height: "28px",
                                              borderRadius: "4px",
                                              border: `2px solid ${itemColor}`,
                                            }}
                                          />
                                        )}
                                        {!itemInfo && (
                                          <div style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "4px",
                                            border: "2px solid #a335ee",
                                            background: "#374151",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#6b7280",
                                            fontSize: "14px",
                                          }}>
                                            ?
                                          </div>
                                        )}
                                        <span style={{
                                          color: itemColor,
                                          fontWeight: "500",
                                          flex: 1,
                                        }}>
                                          {sr.itemName}
                                        </span>
                                        {sr.playerName && (
                                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                            ({sr.playerName})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => submitPick(false)}
                              disabled={submitting || !selectedItem.trim()}
                              style={{
                                padding: "10px 16px",
                                background: submitting || !selectedItem.trim() ? "#4b5563" : "#059669",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: submitting || !selectedItem.trim() ? "not-allowed" : "pointer",
                                fontSize: "14px",
                              }}
                            >
                              {submitting ? "..." : "Set SR+"}
                            </button>
                            <button
                              onClick={() => { setSelectedRaid(null); setSelectedItem(""); setPlayerSRs([]); }}
                              style={{
                                padding: "10px 12px",
                                background: "#4b5563",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRaid(raid)}
                      disabled={characters.length === 0}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: characters.length === 0 ? "#374151" : existingPick ? "#f59e0b" : "#3b82f6",
                        border: "none",
                        borderRadius: "6px",
                        color: characters.length === 0 ? "#6b7280" : "#fff",
                        cursor: characters.length === 0 ? "not-allowed" : "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {characters.length === 0
                        ? "Link character first"
                        : existingPick
                          ? `Change SR+`
                          : "Set SR+ Pick"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(220, 38, 38, 0.1)",
          border: "1px solid #dc2626",
          borderRadius: "8px",
          color: "#f87171",
          marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {/* Item Tooltip */}
      <ItemTooltip tooltip={tooltip} />

      {/* Confirmation Modal */}
      {confirmation.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "450px",
            border: "2px solid #f59e0b",
          }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", textAlign: "center", color: "#fbbf24" }}>
              Change SR+ Item?
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#e5e7eb", textAlign: "center" }}>
              Changing from <span style={{ color: "#a335ee" }}>"{confirmation.currentItem}"</span> to <span style={{ color: "#a335ee" }}>"{confirmation.newItem}"</span>
            </p>
            <div style={{
              padding: "12px",
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid #dc2626",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, color: "#f87171", fontSize: "14px" }}>
                This will reset progress from {confirmation.currentCount} to 0
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={cancelSRChange}
                style={{ flex: 1, padding: "12px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSRChange}
                style={{ flex: 1, padding: "12px", background: "#dc2626", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Modal */}
      {showCharacterModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Link Characters</h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#9ca3af" }}>
              Enter character name(s) exactly as on raidres.top
            </p>

            <div style={{ marginBottom: "16px" }}>
              {characters.map(char => (
                <div key={char} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#374151",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}>
                  <span>{char}</span>
                  <button onClick={() => removeCharacter(char)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Character name..."
                value={newCharacter}
                onInput={(e) => setNewCharacter((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === "Enter" && addCharacter()}
                style={{ flex: 1, padding: "10px 12px", background: "#374151", border: "1px solid #4b5563", borderRadius: "6px", color: "#fff", fontSize: "14px" }}
              />
              <button onClick={addCharacter} style={{ padding: "10px 16px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Add</button>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCharacterModal(false)} style={{ flex: 1, padding: "10px", background: "#4b5563", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCharacters} style={{ flex: 1, padding: "10px", background: "#059669", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

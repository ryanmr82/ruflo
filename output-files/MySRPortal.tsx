import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface UserSession {
  discordId: string;
  discordUsername: string;
  discordDisplayName: string;
  discordAvatar: string | null;
  characters: string[];
  isAdmin?: boolean;
}

interface SRPick {
  eventId: string;
  eventTitle: string;
  eventDate: number;
  raidType: string;
  itemName: string;
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
  const [picks, setPicks] = useState<SRPick[]>([]);
  const [credits, setCredits] = useState<SRCredit[]>([]);
  const [upcomingRaids, setUpcomingRaids] = useState<UpcomingRaid[]>([]);
  const [settings, setSettings] = useState<Settings>({ bonusPerSR: 20, hardReserveThreshold: 5, lockSRBeforeRaid: 2 });
  const [characters, setCharacters] = useState<string[]>([]);
  const [newCharacter, setNewCharacter] = useState("");
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<UpcomingRaid | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (IS_BROWSER) {
      checkAuth();
    }
  }, []);

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

  const submitPick = async () => {
    if (!selectedRaid || !newItemName.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/sr-plus/my-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedRaid.id,
          itemName: newItemName.trim(),
          raidType: detectRaidType(selectedRaid.title),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewItemName("");
        setSelectedRaid(null);
        fetchMyData();
      } else {
        setError(data.error || "Failed to submit pick");
      }
    } catch (err) {
      setError("Failed to submit pick");
    }

    setSubmitting(false);
  };

  const deletePick = async (eventId: string) => {
    if (!confirm("Remove this SR pick?")) return;

    try {
      await fetch(`/api/sr-plus/my-picks?eventId=${eventId}`, {
        method: "DELETE",
      });
      fetchMyData();
    } catch (err) {
      console.error("Failed to delete pick:", err);
    }
  };

  const detectRaidType = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes("kara 40") || lower.includes("karazhan 40")) return "KARA40";
    if (lower.includes("kara") || lower.includes("karazhan")) return "KARA10";
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
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
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#e5e7eb" }}>My SR+ Credits</h3>
          <div style={{ background: "#1f2937", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111827" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Item</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Raid</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Times SR'd</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Bonus</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit, idx) => {
                  const isHR = credit.timesSRd >= settings.hardReserveThreshold;
                  const bonus = credit.bonusRP || credit.timesSRd * settings.bonusPerSR;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #374151", background: isHR ? "rgba(255, 215, 0, 0.08)" : "transparent" }}>
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
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#34d399", fontWeight: "600" }}>+{bonus}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {isHR ? (
                          <span style={{ color: "#ffd700", fontWeight: "700", fontSize: "11px" }}>HARD RESERVE</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "11px" }}>Building...</span>
                        )}
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
          My Upcoming Raids
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "400", marginLeft: "8px" }}>
            (raids you've signed up for on Discord)
          </span>
        </h3>

        {upcomingRaids.length === 0 ? (
          <div style={{ padding: "32px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>
            <p>No upcoming raids found. Sign up for raids on Discord to set your SR picks here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {upcomingRaids.map(raid => {
              const existingPick = picks.find(p => p.eventId === raid.id);
              const raidType = detectRaidType(raid.title);

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

                  {existingPick ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#374151",
                      borderRadius: "6px",
                    }}>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Your SR: </span>
                        <span style={{ color: "#a335ee", fontWeight: "600" }}>{existingPick.itemName}</span>
                      </div>
                      <button
                        onClick={() => deletePick(raid.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#dc2626",
                          border: "none",
                          borderRadius: "4px",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : selectedRaid?.id === raid.id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Enter item name..."
                        value={newItemName}
                        onInput={(e) => setNewItemName((e.target as HTMLInputElement).value)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          background: "#374151",
                          border: "1px solid #4b5563",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        onClick={submitPick}
                        disabled={submitting || !newItemName.trim()}
                        style={{
                          padding: "10px 16px",
                          background: submitting ? "#4b5563" : "#059669",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                          cursor: submitting ? "not-allowed" : "pointer",
                          fontSize: "14px",
                        }}
                      >
                        {submitting ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setSelectedRaid(null); setNewItemName(""); }}
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
                  ) : (
                    <button
                      onClick={() => setSelectedRaid(raid)}
                      disabled={characters.length === 0}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: characters.length === 0 ? "#374151" : "#3b82f6",
                        border: "none",
                        borderRadius: "6px",
                        color: characters.length === 0 ? "#6b7280" : "#fff",
                        cursor: characters.length === 0 ? "not-allowed" : "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {characters.length === 0 ? "Link character to set SR" : "Set SR Pick"}
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
              Enter your in-game character name(s) to link them to your Discord account.
            </p>

            <div style={{ marginBottom: "16px" }}>
              {characters.map(char => (
                <div
                  key={char}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#374151",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <span>{char}</span>
                  <button
                    onClick={() => removeCharacter(char)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    ×
                  </button>
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
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={addCharacter}
                style={{
                  padding: "10px 16px",
                  background: "#3b82f6",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCharacterModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#4b5563",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveCharacters}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#059669",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

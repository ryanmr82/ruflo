// GuildStorageTabs.tsx — Unified guild storage browser with tabs for Guild Vault, Bank Alts, Combined View
// Used on /guild-bank route - Phase 4 of AH & Vault Sync v5.0

import { useEffect, useState } from "preact/hooks";

// ============== Shared Interfaces ==============
interface GBankItem {
  name: string;
  count: number;
  quality: number;
  qualityName: string;
  itemId: string;
  slot: number;
}

interface GBankTab {
  tabIndex: number;
  tabName: string;
  items: GBankItem[];
}

interface GBankSummaryItem {
  name: string;
  count: number;
  quality: number;
  qualityName: string;
  itemId: string;
}

interface GBankInventory {
  exportVersion: string;
  scanTime: string;
  guildName: string;
  account: string;
  totalItems: number;
  uniqueItems: number;
  tabs: GBankTab[];
  summary: GBankSummaryItem[];
  uploadedAt: string;
}

interface BankAltCharacter {
  name: string;
  class: string;
  level: number;
  bags: BankAltItem[];
  bank: BankAltItem[];
  totalItems: number;
}

interface BankAltItem {
  location: string;
  bagId: number;
  slot: number;
  name: string;
  count: number;
  quality: number;
  itemId: string;
}

interface BankAltAccount {
  account: string;
  scanTime: string;
  characters: BankAltCharacter[];
  totalItems: number;
  uploadedAt: string;
}

interface CombinedItem {
  name: string;
  totalCount: number;
  quality: number;
  qualityName: string;
  itemId: string;
  locations: Record<string, number>; // e.g., {"Guild Vault": 5, "Nerdsbank (Bags)": 10}
}

interface CombinedData {
  combined: {
    items: CombinedItem[];
    uniqueItems: number;
    totalItems: number;
    guildBankItems: number;
    bankAltItems: number;
  };
  sources: {
    guildBank: { available: boolean; scanTime?: string; totalItems?: number };
    bankAlts: { accounts: string[]; totalItems?: number };
  };
  generatedAt: string;
}

const QUALITY_COLORS: Record<number, string> = {
  0: "#9d9d9d", // Poor
  1: "#ffffff", // Common
  2: "#1eff00", // Uncommon
  3: "#0070dd", // Rare
  4: "#a335ee", // Epic
  5: "#ff8000", // Legendary
};

const QUALITY_NAMES: Record<number, string> = {
  0: "Poor",
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
};

const STICKY_TH = "position: sticky; top: 0; z-index: 10; background: var(--background-secondary);";

// ============== Main Component ==============
export default function GuildStorageTabs() {
  const [mainTab, setMainTab] = useState<"vault" | "alts" | "combined">("vault");

  return (
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      {/* Main Tab Selector */}
      <div style="display: flex; gap: 0; margin-bottom: 20px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <button
          onClick={() => setMainTab("vault")}
          style={{
            flex: 1,
            padding: "14px 20px",
            border: "none",
            background: mainTab === "vault" ? "rgba(87, 148, 242, 0.15)" : "transparent",
            color: mainTab === "vault" ? "var(--apple-blue)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            borderBottom: mainTab === "vault" ? "2px solid var(--apple-blue)" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          🏦 Guild Vault
        </button>
        <button
          onClick={() => setMainTab("alts")}
          style={{
            flex: 1,
            padding: "14px 20px",
            border: "none",
            borderLeft: "1px solid var(--border-light)",
            background: mainTab === "alts" ? "rgba(87, 148, 242, 0.15)" : "transparent",
            color: mainTab === "alts" ? "var(--apple-blue)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            borderBottom: mainTab === "alts" ? "2px solid var(--apple-blue)" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          👤 Bank Alts
        </button>
        <button
          onClick={() => setMainTab("combined")}
          style={{
            flex: 1,
            padding: "14px 20px",
            border: "none",
            borderLeft: "1px solid var(--border-light)",
            background: mainTab === "combined" ? "rgba(87, 148, 242, 0.15)" : "transparent",
            color: mainTab === "combined" ? "var(--apple-blue)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            borderBottom: mainTab === "combined" ? "2px solid var(--apple-blue)" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          📊 Combined View
        </button>
      </div>

      {/* Tab Content */}
      {mainTab === "vault" && <GuildVaultTab />}
      {mainTab === "alts" && <BankAltsTab />}
      {mainTab === "combined" && <CombinedViewTab />}
    </div>
  );
}

// ============== Guild Vault Tab ==============
function GuildVaultTab() {
  const [data, setData] = useState<GBankInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(-1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/guild-bank/inventory")
      .then((res) => {
        if (!res.ok) throw new Error("No guild bank data available");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="color: var(--text-secondary); font-size: 16px;">Loading guild bank data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 12px;">Guild Vault</div>
        <div style="color: var(--text-secondary);">
          {error || "No guild bank data available. Open the guild bank in-game to scan."}
        </div>
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  let displayItems: (GBankItem | GBankSummaryItem)[] = [];
  if (activeTab === -1) {
    displayItems = data.summary || [];
  } else {
    const tab = data.tabs.find((t) => t.tabIndex === activeTab);
    const rawItems = tab ? tab.items : [];
    const merged = new Map<string, GBankItem>();
    for (const item of rawItems) {
      const existing = merged.get(item.name);
      if (existing) {
        existing.count += item.count;
      } else {
        merged.set(item.name, { ...item });
      }
    }
    displayItems = Array.from(merged.values());
  }

  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }
  displayItems = [...displayItems].sort((a, b) => a.name.localeCompare(b.name));

  const timeAgo = getTimeAgo(data.scanTime);

  return (
    <>
      <Header
        title="Guild Vault"
        subtitle={data.guildName}
        stats={[
          { label: "unique items", value: data.uniqueItems, color: "var(--apple-green)" },
          { label: "total", value: data.totalItems },
        ]}
        scanTime={data.scanTime}
        timeAgo={timeAgo}
      />
      <SearchBar value={search} onChange={setSearch} />
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <TabButton active={activeTab === -1} onClick={() => setActiveTab(-1)} label={`All Items (${data.uniqueItems})`} />
        {data.tabs.map((tab) => (
          <TabButton key={tab.tabIndex} active={activeTab === tab.tabIndex} onClick={() => setActiveTab(tab.tabIndex)} label={`${tab.tabName} (${tab.items.length})`} />
        ))}
      </div>
      <ItemTable items={displayItems} search={search} />
      <Footer count={displayItems.length} filtered={!!search} version="v5.0" />
    </>
  );
}

// ============== Bank Alts Tab ==============
function BankAltsTab() {
  const [accounts, setAccounts] = useState<BankAltAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/bank-alts/inventory")
      .then((res) => {
        if (!res.ok) throw new Error("No bank alt data available");
        return res.json();
      })
      .then((d) => {
        // API returns accounts as object {name: data}, convert to array
        const accountsObj = d.accounts || {};
        const accts = Array.isArray(accountsObj)
          ? accountsObj
          : Object.entries(accountsObj).map(([name, data]) => ({ account: name, ...(data as Record<string, unknown>) }));
        setAccounts(accts as BankAltAccount[]);
        if (accts.length > 0) {
          setSelectedAccount((accts[0] as BankAltAccount).account);
          const firstAcct = accts[0] as BankAltAccount;
          if (firstAcct.characters?.length > 0) {
            setSelectedChar(firstAcct.characters[0].name);
          }
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="color: var(--text-secondary); font-size: 16px;">Loading bank alt data...</div>
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 12px;">Bank Alts</div>
        <div style="color: var(--text-secondary);">
          {error || "No bank alt data available. Enable bank alt sync in the tray app settings."}
        </div>
        <div style="color: var(--text-tertiary); font-size: 13px; margin-top: 12px;">
          Bank alts store consumables and materials outside the guild vault.
        </div>
      </div>
    );
  }

  const currentAccount = accounts.find((a) => a.account === selectedAccount);
  const currentChar = currentAccount?.characters?.find((c) => c.name === selectedChar);
  const totalItems = accounts.reduce((sum, a) => sum + (a.totalItems || 0), 0);
  const totalChars = accounts.reduce((sum, a) => sum + (a.characters?.length || 0), 0);

  let displayItems: BankAltItem[] = [];
  if (currentChar) {
    displayItems = [...(currentChar.bags || []), ...(currentChar.bank || [])];
  }

  const searchLower = search.toLowerCase();
  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }

  // Aggregate by name
  const merged = new Map<string, { name: string; count: number; quality: number; itemId: string; locations: string[] }>();
  for (const item of displayItems) {
    const existing = merged.get(item.name);
    if (existing) {
      existing.count += item.count;
      if (!existing.locations.includes(item.location)) {
        existing.locations.push(item.location);
      }
    } else {
      merged.set(item.name, {
        name: item.name,
        count: item.count,
        quality: item.quality,
        itemId: item.itemId,
        locations: [item.location],
      });
    }
  }
  const aggregatedItems = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));

  const timeAgo = currentAccount ? getTimeAgo(currentAccount.scanTime) : "";

  return (
    <>
      <Header
        title="Bank Alts"
        subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""}, ${totalChars} character${totalChars !== 1 ? "s" : ""}`}
        stats={[{ label: "total items", value: totalItems, color: "var(--apple-green)" }]}
        scanTime={currentAccount?.scanTime || ""}
        timeAgo={timeAgo}
      />
      <SearchBar value={search} onChange={setSearch} />

      {/* Account / Character Selector */}
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; color: var(--text-tertiary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Account</label>
          <select
            value={selectedAccount || ""}
            onChange={(e) => {
              const acct = (e.target as HTMLSelectElement).value;
              setSelectedAccount(acct);
              const a = accounts.find((x) => x.account === acct);
              if (a?.characters?.length) {
                setSelectedChar(a.characters[0].name);
              } else {
                setSelectedChar(null);
              }
            }}
            style="width: 100%; padding: 10px 12px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px;"
          >
            {accounts.map((a) => (
              <option key={a.account} value={a.account}>
                {a.account} ({a.characters?.length || 0} chars)
              </option>
            ))}
          </select>
        </div>
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; color: var(--text-tertiary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Character</label>
          <select
            value={selectedChar || ""}
            onChange={(e) => setSelectedChar((e.target as HTMLSelectElement).value)}
            style="width: 100%; padding: 10px 12px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px;"
          >
            {currentAccount?.characters?.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} (Lvl {c.level} {c.class}) - {c.totalItems} items
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table — sticky header + scrollable */}
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <div style="max-height: 70vh; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style={`border-bottom: 1px solid var(--border-light); ${STICKY_TH}`}>
                <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Quantity</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Location</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                    {search ? `No items matching '${search}'` : "No items on this character"}
                  </td>
                </tr>
              ) : (
                aggregatedItems.map((item, idx) => {
                  const qColor = QUALITY_COLORS[item.quality] || "#ffffff";
                  return (
                    <tr key={idx} style={{ borderBottom: idx < aggregatedItems.length - 1 ? "1px solid var(--border-lighter)" : "none" }}>
                      <td style="padding: 10px 16px;">
                        <span style={{ color: qColor, fontWeight: item.quality >= 3 ? 500 : 400 }}>{item.name}</span>
                      </td>
                      <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">
                        x{item.count}
                      </td>
                      <td style="text-align: right; padding: 10px 16px;">
                        <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                          {item.locations.join(", ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer count={aggregatedItems.length} filtered={!!search} version="v5.0" />
    </>
  );
}

// ============== Combined View Tab ==============
function CombinedViewTab() {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/guild-storage/combined")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load combined data");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="color: var(--text-secondary); font-size: 16px;">Loading combined storage data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 12px;">Combined View</div>
        <div style="color: var(--text-secondary);">
          {error || "No storage data available. Sync guild bank and bank alts first."}
        </div>
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  let displayItems = data.combined.items || [];
  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }
  displayItems = [...displayItems].sort((a, b) => a.name.localeCompare(b.name));

  const timeAgo = getTimeAgo(data.generatedAt);

  return (
    <>
      {/* Header */}
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0;">Combined Storage</h1>
            <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">
              All items from guild vault and bank alts
            </div>
          </div>
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="text-align: center; padding: 8px 16px; background: rgba(30, 255, 0, 0.1); border-radius: 8px;">
              <div style="color: var(--apple-green); font-size: 18px; font-weight: 600;">{data.combined.guildBankItems}</div>
              <div style="color: var(--text-tertiary); font-size: 11px;">Guild Vault</div>
            </div>
            <div style="color: var(--text-tertiary); font-size: 20px;">+</div>
            <div style="text-align: center; padding: 8px 16px; background: rgba(87, 148, 242, 0.1); border-radius: 8px;">
              <div style="color: var(--apple-blue); font-size: 18px; font-weight: 600;">{data.combined.bankAltItems}</div>
              <div style="color: var(--text-tertiary); font-size: 11px;">Bank Alts</div>
            </div>
            <div style="color: var(--text-tertiary); font-size: 20px;">=</div>
            <div style="text-align: center; padding: 8px 16px; background: rgba(163, 53, 238, 0.1); border-radius: 8px;">
              <div style="color: #a335ee; font-size: 18px; font-weight: 600;">{data.combined.totalItems}</div>
              <div style="color: var(--text-tertiary); font-size: 11px;">Total</div>
            </div>
          </div>
        </div>
        {/* Sources info */}
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="color: var(--text-tertiary); font-size: 12px;">
            <strong>Guild Vault:</strong> {data.sources.guildBank?.scanTime ? "Available" : "Not synced"}
          </div>
          <div style="color: var(--text-tertiary); font-size: 12px;">
            <strong>Bank Alts:</strong> {data.sources.bankAlts?.accounts?.length > 0 ? `${data.sources.bankAlts.accounts.join(", ")}` : "None synced"}
          </div>
          <div style="color: var(--text-tertiary); font-size: 12px; margin-left: auto;">
            Generated {timeAgo}
          </div>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {/* Items Table — always shows Source column, sticky header */}
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <div style="max-height: 70vh; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style={`border-bottom: 1px solid var(--border-light); ${STICKY_TH}`}>
                <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">Total</th>
                <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 280px;">Source</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Quality</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                    {search ? `No items matching '${search}'` : "No items in storage"}
                  </td>
                </tr>
              ) : (
                displayItems.map((item, idx) => {
                  const qColor = QUALITY_COLORS[item.quality] || "#ffffff";
                  const bgAlpha = item.quality === 4 ? "163,53,238"
                    : item.quality === 3 ? "0,112,221"
                    : item.quality === 2 ? "30,255,0"
                    : item.quality === 5 ? "255,128,0"
                    : "255,255,255";
                  return (
                    <tr key={idx} style={{ borderBottom: idx < displayItems.length - 1 ? "1px solid var(--border-lighter)" : "none" }}>
                      <td style="padding: 10px 16px;">
                        <span style={{ color: qColor, fontWeight: item.quality >= 3 ? 500 : 400 }}>{item.name}</span>
                      </td>
                      <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums; font-weight: 500;">
                        x{item.totalCount}
                      </td>
                      <td style="padding: 10px 16px;">
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          {Object.entries(item.locations || {}).map(([source, count], i) => {
                            const isVault = source === "guildVault" || source === "Guild Vault";
                            return (
                              <span key={i} style={{
                                fontSize: "11px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                background: isVault ? "rgba(30, 255, 0, 0.1)" : "rgba(87, 148, 242, 0.1)",
                                color: isVault ? "var(--apple-green)" : "var(--apple-blue)",
                                whiteSpace: "nowrap",
                              }}>
                                {isVault ? "Guild Vault" : source}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td style="text-align: right; padding: 10px 16px;">
                        <span style={{
                          color: qColor,
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: `rgba(${bgAlpha},0.1)`,
                        }}>
                          {item.qualityName || QUALITY_NAMES[item.quality] || "Common"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer count={displayItems.length} filtered={!!search} version="v5.0" />
    </>
  );
}

// ============== Shared Components ==============
function Header({ title, subtitle, stats, scanTime, timeAgo }: {
  title: string;
  subtitle: string;
  stats: { label: string; value: number; color?: string }[];
  scanTime: string;
  timeAgo: string;
}) {
  return (
    <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; margin: 0;">{title}</h1>
          <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">{subtitle}</div>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
          {stats.map((stat, i) => (
            <div key={i} style="text-align: right;">
              <div style={{ color: stat.color || "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
                {stat.value} {stat.label}
              </div>
            </div>
          ))}
          {scanTime && (
            <div style="text-align: right;">
              <div style="color: var(--text-secondary); font-size: 13px;">Scanned {timeAgo}</div>
              <div style="color: var(--text-tertiary); font-size: 12px;">{scanTime}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style="margin-bottom: 16px;">
      <input
        type="text"
        placeholder="Search items..."
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        style="width: 100%; padding: 10px 16px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none;"
      />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: active ? "1px solid var(--apple-blue)" : "1px solid var(--border-light)",
        background: active ? "rgba(87, 148, 242, 0.15)" : "var(--background-secondary)",
        color: active ? "var(--apple-blue)" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

function ItemTable({ items, search }: { items: { name: string; count: number; quality: number; qualityName?: string }[]; search: string }) {
  return (
    <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
      <div style="max-height: 70vh; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style={`border-bottom: 1px solid var(--border-light); ${STICKY_TH}`}>
              <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
              <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Quantity</th>
              <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Quality</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                  {search ? `No items matching '${search}'` : "No items"}
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const qColor = QUALITY_COLORS[item.quality] || "#ffffff";
                const bgAlpha = item.quality === 4 ? "163,53,238"
                  : item.quality === 3 ? "0,112,221"
                  : item.quality === 2 ? "30,255,0"
                  : item.quality === 5 ? "255,128,0"
                  : "255,255,255";
                const qualityName = item.qualityName || QUALITY_NAMES[item.quality] || "Common";
                return (
                  <tr key={idx} style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--border-lighter)" : "none" }}>
                    <td style="padding: 10px 16px;">
                      <span style={{ color: qColor, fontWeight: item.quality >= 3 ? 500 : 400 }}>{item.name}</span>
                    </td>
                    <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">
                      x{item.count}
                    </td>
                    <td style="text-align: right; padding: 10px 16px;">
                      <span style={{
                        color: qColor,
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: `rgba(${bgAlpha},0.1)`,
                      }}>
                        {qualityName}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Footer({ count, filtered, version }: { count: number; filtered: boolean; version: string }) {
  return (
    <div style="text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 16px 0; margin-top: 8px;">
      {count} item{count !== 1 ? "s" : ""} shown{filtered && " (filtered)"} | Data synced by AH & Vault Sync {version}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const scanDate = new Date(dateStr.replace(" ", "T"));
  const now = new Date();
  const diffMs = now.getTime() - scanDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return diffDays + "d ago";
  if (diffHours > 0) return diffHours + "h ago";
  if (diffMins > 0) return diffMins + "m ago";
  return "just now";
}

// GuildStorageTabs.tsx — Unified guild storage browser with tabs for Combined View, Guild Vault, Bank Alts
// Used on /guild-bank route - Phase 4 of AH & Vault Sync v5.0

import { useEffect, useRef, useState } from "preact/hooks";
import ItemTooltip, { useItemTooltip, lookupItem, getQualityFallbackIcon } from "./ItemTooltip.tsx";
import { useAuth } from "../hooks/useAuth.ts";
// Items to hide from all views
const HIDDEN_ITEMS = new Set(["Hearthstone"]);


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
  locations: Record<string, number>;
}

interface CombinedSourceAccount {
  account: string;
  scanTime: string;
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
    bankAlts: { available: boolean; accounts?: CombinedSourceAccount[]; totalItems?: number };
  };
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

// ============== Item Cell with Icon + Tooltip ==============
function ItemCell({ name, itemId, quality, showTooltip, hideTooltip }: {
  name: string;
  itemId?: string;
  quality: number;
  showTooltip: (e: MouseEvent, name: string, icon?: string, quality?: number) => void;
  hideTooltip: () => void;
}) {
  const [iconUrl, setIconUrl] = useState<string>("");
  const qColor = QUALITY_COLORS[quality] || "#ffffff";

  useEffect(() => {
    let cancelled = false;
    const id = itemId && itemId !== "0" ? parseInt(itemId) : undefined;
    lookupItem(name, id).then(info => {
      if (!cancelled && info?.iconUrl) setIconUrl(info.iconUrl);
    });
    return () => { cancelled = true; };
  }, [name, itemId]);

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
      onMouseEnter={(e: any) => showTooltip(e, name, undefined, quality)}
      onMouseLeave={hideTooltip}
    >
      <img
        src={iconUrl || getQualityFallbackIcon(quality, "small")}
        alt=""
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "3px",
          border: `1px solid ${qColor}`,
          background: "#000",
          flexShrink: 0,
        }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          if (!img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = getQualityFallbackIcon(quality, "small");
          }
        }}
      />
      <span style={{ color: qColor, fontWeight: quality >= 3 ? 500 : 400 }}>{name}</span>
    </span>
  );
}

// ============== Main Component ==============
export default function GuildStorageTabs() {
  const [mainTab, setMainTab] = useState<"combined" | "vault" | "alts">("combined");
  const { hasAdminCookie: authAdminCookie } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [hasAdminCookie, setHasAdminCookie] = useState(false);

  useEffect(() => {
    if (authAdminCookie) setHasAdminCookie(true);
  }, [authAdminCookie]);

  function handleAdminClick() {
    if (isAdmin) {
      setIsAdmin(false);
    } else if (hasAdminCookie) {
      setIsAdmin(true);
    } else {
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError(false);
    }
  }

  async function handlePasswordSubmit() {
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passwordInput }) });
      if (response.ok) {
        setHasAdminCookie(true);
        setIsAdmin(true);
        setShowPasswordModal(false);
        setPasswordInput("");
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch { setPasswordError(true); }
  }

  return (
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      {/* Admin toggle */}
      <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
        <button
          onClick={handleAdminClick}
          style={{
            padding: "6px 14px",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            background: isAdmin ? "rgba(52, 199, 89, 0.15)" : "transparent",
            color: isAdmin ? "#34c759" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
        >
          {isAdmin ? "🔓 Exit Admin" : "🔒 Admin"}
        </button>
      </div>

      {/* Download section - admin only */}
      {isAdmin && (
        <div style="margin-bottom: 16px; padding: 14px 18px; background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.25); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">AH & Vault Sync Desktop App</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">v6.0.0 — Auto-syncs AH prices, guild vault, and bank alt inventories</div>
          </div>
          <a
            href="/api/download/tray-app"
            style="padding: 8px 18px; background: #34c759; color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; white-space: nowrap;"
          >
            Download Installer (.zip)
          </a>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center;" onClick={() => setShowPasswordModal(false)}>
          <div style="background: var(--background-primary); border: 1px solid var(--border-light); border-radius: 12px; padding: 24px; width: 340px; max-width: 90vw;" onClick={(e: Event) => e.stopPropagation()}>
            <h3 style="margin: 0 0 16px; font-size: 16px;">Admin Login</h3>
            <input
              type="password"
              value={passwordInput}
              onInput={(e: Event) => { setPasswordInput((e.target as HTMLInputElement).value); setPasswordError(false); }}
              onKeyPress={(e: KeyboardEvent) => { if (e.key === "Enter") handlePasswordSubmit(); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                border: passwordError ? "1px solid #ff3b30" : "1px solid var(--border-light)",
                borderRadius: "8px",
                background: "var(--background-secondary)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {passwordError && <div style="color: #ff3b30; font-size: 12px; margin-top: 6px;">Incorrect password</div>}
            <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;">
              <button onClick={() => setShowPasswordModal(false)} style="padding: 8px 16px; border: 1px solid var(--border-light); border-radius: 8px; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 13px;">Cancel</button>
              <button onClick={handlePasswordSubmit} style="padding: 8px 16px; border: none; border-radius: 8px; background: var(--apple-blue); color: #fff; cursor: pointer; font-size: 13px; font-weight: 600;">Login</button>
            </div>
          </div>
        </div>
      )}
      {/* Main Tab Selector — Combined first (default), Guild Vault middle, Bank Alts right */}
      <div style="display: flex; gap: 0; margin-bottom: 20px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <button
          onClick={() => setMainTab("combined")}
          style={{
            flex: 1,
            padding: "14px 20px",
            border: "none",
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
        <button
          onClick={() => setMainTab("vault")}
          style={{
            flex: 1,
            padding: "14px 20px",
            border: "none",
            borderLeft: "1px solid var(--border-light)",
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
      </div>

      {/* Tab Content */}
      {mainTab === "combined" && <CombinedViewTab />}
      {mainTab === "vault" && <GuildVaultTab />}
      {mainTab === "alts" && <BankAltsTab />}
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
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();
  const { sortKey, sortDir, handleSort } = useSort("name");
  const qualityOptions = Object.entries(QUALITY_NAMES).map(([k, v]) => ({ value: k, label: v, color: QUALITY_COLORS[parseInt(k)] }));
  const qualityFilter = useCheckboxFilter(Object.keys(QUALITY_NAMES));

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

  displayItems = displayItems.filter((item) => !HIDDEN_ITEMS.has(item.name));
  displayItems = displayItems.filter((item) => qualityFilter.selected.has(String(item.quality)));
  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }
  displayItems = sortItems(displayItems, sortKey, sortDir, (item, key) => {
    if (key === "name") return item.name.toLowerCase();
    if (key === "count") return item.count;
    if (key === "quality") return item.quality;
    return item.name.toLowerCase();
  });

  const isFiltered = !!search || qualityFilter.selected.size < qualityOptions.length;
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

      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <div style="max-height: 70vh; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style={`border-bottom: 1px solid var(--border-light); ${STICKY_TH}`}>
                <SortTh label="Item" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
                <SortTh label="Quantity" sortKey="count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="100px" />
                <SortTh label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="140px">
                  <FilterDropdown options={qualityOptions} selected={qualityFilter.selected} onToggle={qualityFilter.toggle} isOpen={qualityFilter.isOpen} onToggleOpen={qualityFilter.toggleOpen} />
                </SortTh>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr><td colSpan={3} style="padding: 24px; text-align: center; color: var(--text-tertiary);">{search ? `No items matching '${search}'` : "No items"}</td></tr>
              ) : (
                displayItems.map((item, idx) => {
                  const qColor = QUALITY_COLORS[item.quality] || "#ffffff";
                  const bgAlpha = item.quality === 4 ? "163,53,238" : item.quality === 3 ? "0,112,221" : item.quality === 2 ? "30,255,0" : item.quality === 5 ? "255,128,0" : "255,255,255";
                  const qualityName = item.qualityName || QUALITY_NAMES[item.quality] || "Common";
                  return (
                    <tr key={idx} style={{ borderBottom: idx < displayItems.length - 1 ? "1px solid var(--border-lighter)" : "none" }}>
                      <td style="padding: 10px 16px;"><ItemCell name={item.name} itemId={item.itemId} quality={item.quality} showTooltip={showTooltip} hideTooltip={hideTooltip} /></td>
                      <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">x{item.count}</td>
                      <td style="text-align: right; padding: 10px 16px;">
                        <span style={{ color: qColor, fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: `rgba(${bgAlpha},0.1)` }}>{qualityName}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer count={displayItems.length} filtered={isFiltered} version="v5.0" />
      <ItemTooltip tooltip={tooltip} />
    </>
  );
}

// ============== Bank Alts Tab ==============
function BankAltsTab() {
  const [accounts, setAccounts] = useState<BankAltAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("__ALL__");
  const [selectedChar, setSelectedChar] = useState<string>("__ALL__");
  const [search, setSearch] = useState("");
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();
  const { sortKey, sortDir, handleSort } = useSort("name");
  const qualityOptions = Object.entries(QUALITY_NAMES).map(([k, v]) => ({ value: k, label: v, color: QUALITY_COLORS[parseInt(k)] }));
  const qualityFilter = useCheckboxFilter(Object.keys(QUALITY_NAMES));

  useEffect(() => {
    fetch("/api/bank-alts/inventory")
      .then((res) => {
        if (!res.ok) throw new Error("No bank alt data available");
        return res.json();
      })
      .then((d) => {
        const accountsObj = d.accounts || {};
        const accts = Array.isArray(accountsObj)
          ? accountsObj
          : Object.entries(accountsObj).map(([name, data]) => ({ account: name, ...(data as Record<string, unknown>) }));
        setAccounts(accts as BankAltAccount[]);
        // Default to All Accounts / All Characters
        setSelectedAccount("__ALL__");
        setSelectedChar("__ALL__");
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

  const totalItems = accounts.reduce((sum, a) => sum + (a.totalItems || 0), 0);
  const totalChars = accounts.reduce((sum, a) => sum + (a.characters?.length || 0), 0);

  // Build the list of characters visible in the character dropdown
  const isAllAccounts = selectedAccount === "__ALL__";
  const currentAccount = isAllAccounts ? null : accounts.find((a) => a.account === selectedAccount);
  const availableChars: Array<{ name: string; class?: string; level?: number; totalItems?: number; account: string; bags?: BankAltItem[]; bank?: BankAltItem[] }> = [];
  if (isAllAccounts) {
    for (const acct of accounts) {
      for (const c of acct.characters || []) {
        availableChars.push({ ...c, account: acct.account });
      }
    }
  } else if (currentAccount) {
    for (const c of currentAccount.characters || []) {
      availableChars.push({ ...c, account: currentAccount.account });
    }
  }

  // Determine what items to display
  let displayItems: BankAltItem[] = [];
  if (selectedChar === "__ALL__") {
    for (const c of availableChars) {
      displayItems.push(...(c.bags || []), ...(c.bank || []));
    }
  } else {
    const charData = availableChars.find((c) => c.name === selectedChar);
    if (charData) {
      displayItems = [...(charData.bags || []), ...(charData.bank || [])];
    }
  }

  displayItems = displayItems.filter((item) => !HIDDEN_ITEMS.has(item.name));
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
  let aggregatedItems = Array.from(merged.values());
  aggregatedItems = aggregatedItems.filter((item) => qualityFilter.selected.has(String(item.quality)));
  aggregatedItems = sortItems(aggregatedItems, sortKey, sortDir, (item, key) => {
    if (key === "name") return item.name.toLowerCase();
    if (key === "count") return item.count;
    if (key === "quality") return item.quality;
    if (key === "location") return item.locations.join(", ").toLowerCase();
    return item.name.toLowerCase();
  });

  // Scan time: use most recent across selected scope
  let latestScanTime = "";
  if (isAllAccounts) {
    for (const a of accounts) {
      if (a.scanTime && a.scanTime > latestScanTime) latestScanTime = a.scanTime;
    }
  } else if (currentAccount) {
    latestScanTime = currentAccount.scanTime || "";
  }
  const timeAgo = latestScanTime ? getTimeAgo(latestScanTime) : "";

  return (
    <>
      <Header
        title="Bank Alts"
        subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""}, ${totalChars} character${totalChars !== 1 ? "s" : ""}`}
        stats={[{ label: "total items", value: totalItems, color: "var(--apple-green)" }]}
        scanTime={latestScanTime}
        timeAgo={timeAgo}
      />
      <SearchBar value={search} onChange={setSearch} />

      {/* Account / Character Selector */}
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; color: var(--text-tertiary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => {
              const acct = (e.target as HTMLSelectElement).value;
              setSelectedAccount(acct);
              setSelectedChar("__ALL__");
            }}
            style="width: 100%; padding: 10px 12px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px;"
          >
            <option value="__ALL__">All Accounts ({totalChars} chars)</option>
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
            value={selectedChar}
            onChange={(e) => setSelectedChar((e.target as HTMLSelectElement).value)}
            style="width: 100%; padding: 10px 12px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px;"
          >
            <option value="__ALL__">All Characters ({availableChars.length})</option>
            {availableChars.map((c) => (
              <option key={`${c.account}-${c.name}`} value={c.name}>
                {c.name} (Lvl {c.level} {c.class || ""}) - {c.totalItems || 0} items
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
                <SortTh label="Item" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
                <SortTh label="Quantity" sortKey="count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="100px" />
                <SortTh label="Location" sortKey="location" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="120px" />
                <SortTh label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="140px">
                  <FilterDropdown options={qualityOptions} selected={qualityFilter.selected} onToggle={qualityFilter.toggle} isOpen={qualityFilter.isOpen} onToggleOpen={qualityFilter.toggleOpen} />
                </SortTh>
              </tr>
            </thead>
            <tbody>
              {aggregatedItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                    {search ? `No items matching '${search}'` : "No items found"}
                  </td>
                </tr>
              ) : (
                aggregatedItems.map((item, idx) => {
                  const qColor = QUALITY_COLORS[item.quality] || "#ffffff";
                  const bgAlpha = item.quality === 4 ? "163,53,238" : item.quality === 3 ? "0,112,221" : item.quality === 2 ? "30,255,0" : item.quality === 5 ? "255,128,0" : "255,255,255";
                  return (
                    <tr key={idx} style={{ borderBottom: idx < aggregatedItems.length - 1 ? "1px solid var(--border-lighter)" : "none" }}>
                      <td style="padding: 10px 16px;">
                        <ItemCell name={item.name} itemId={item.itemId} quality={item.quality} showTooltip={showTooltip} hideTooltip={hideTooltip} />
                      </td>
                      <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">
                        x{item.count}
                      </td>
                      <td style="text-align: right; padding: 10px 16px;">
                        <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                          {item.locations.join(", ")}
                        </span>
                      </td>
                      <td style="text-align: right; padding: 10px 16px;">
                        <span style={{ color: qColor, fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: `rgba(${bgAlpha},0.1)` }}>
                          {QUALITY_NAMES[item.quality] || "Common"}
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
      <Footer count={aggregatedItems.length} filtered={!!search || qualityFilter.selected.size < qualityOptions.length} version="v5.0" />
      <ItemTooltip tooltip={tooltip} />
    </>
  );
}

// ============== Combined View Tab ==============
function CombinedViewTab() {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();
  const { sortKey, sortDir, handleSort } = useSort("name");
  const qualityOptions = Object.entries(QUALITY_NAMES).map(([k, v]) => ({ value: k, label: v, color: QUALITY_COLORS[parseInt(k)] }));
  const qualityFilter = useCheckboxFilter(Object.keys(QUALITY_NAMES));
  const [sourceOptions, setSourceOptions] = useState<{ value: string; label: string; color?: string }[]>([]);
  const sourceFilter = useCheckboxFilter(sourceOptions.map((o) => o.value));

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

  // Discover all source keys for filter options
  const allItems = (data.combined.items || []).filter((item) => !HIDDEN_ITEMS.has(item.name));
  const allSources = new Set<string>();
  for (const item of allItems) {
    for (const src of Object.keys(item.locations || {})) {
      allSources.add(src);
    }
  }
  const currentSourceOpts = Array.from(allSources).sort().map((s) => ({
    value: s,
    label: s,
    color: s.startsWith("Tab ") ? "#1eff00" : "#5794f2",
  }));
  // Update source options when data changes
  useEffect(() => {
    setSourceOptions(currentSourceOpts);
  }, [currentSourceOpts.map((o) => o.value).join(",")]);

  const searchLower = search.toLowerCase();
  let displayItems = allItems;
  displayItems = displayItems.filter((item) => qualityFilter.selected.has(String(item.quality)));
  if (sourceFilter.selected.size < allSources.size) {
    displayItems = displayItems.filter((item) =>
      Object.keys(item.locations || {}).some((src) => sourceFilter.selected.has(src))
    );
  }
  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }
  displayItems = sortItems(displayItems, sortKey, sortDir, (item, key) => {
    if (key === "name") return item.name.toLowerCase();
    if (key === "totalCount") return item.totalCount;
    if (key === "quality") return item.quality;
    if (key === "source") return Object.keys(item.locations || {}).join(", ").toLowerCase();
    return item.name.toLowerCase();
  });

  const isFiltered = !!search || qualityFilter.selected.size < qualityOptions.length || sourceFilter.selected.size < allSources.size;

  // Compute scan times from sources
  const guildVaultTimeAgo = data.sources.guildBank?.scanTime
    ? getTimeAgo(data.sources.guildBank.scanTime)
    : null;
  const bankAltAccounts = data.sources.bankAlts?.accounts || [];
  // Find the most recent bank alt scan time
  let mostRecentBankAltScan: string | null = null;
  if (Array.isArray(bankAltAccounts) && bankAltAccounts.length > 0) {
    for (const acct of bankAltAccounts) {
      if (acct.scanTime) {
        if (!mostRecentBankAltScan || acct.scanTime > mostRecentBankAltScan) {
          mostRecentBankAltScan = acct.scanTime;
        }
      }
    }
  }
  const bankAltsTimeAgo = mostRecentBankAltScan ? getTimeAgo(mostRecentBankAltScan) : null;
  const bankAltAccountNames = Array.isArray(bankAltAccounts)
    ? bankAltAccounts.map((a: CombinedSourceAccount) => a.account)
    : [];

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
        {/* Sources info with actual scan times */}
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="color: var(--text-tertiary); font-size: 12px;">
            <strong>Guild Vault:</strong>{" "}
            {guildVaultTimeAgo
              ? `Scanned ${guildVaultTimeAgo}`
              : "Not synced"}
          </div>
          <div style="color: var(--text-tertiary); font-size: 12px;">
            <strong>Bank Alts:</strong>{" "}
            {bankAltsTimeAgo
              ? `Scanned ${bankAltsTimeAgo} (${bankAltAccountNames.join(", ")})`
              : "Not synced"}
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
                <SortTh label="Item" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
                <SortTh label="Total" sortKey="totalCount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="80px" />
                <SortTh label="Source" sortKey="source" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" width="300px">
                  <FilterDropdown options={currentSourceOpts} selected={sourceFilter.selected} onToggle={sourceFilter.toggle} isOpen={sourceFilter.isOpen} onToggleOpen={sourceFilter.toggleOpen} />
                </SortTh>
                <SortTh label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" width="140px">
                  <FilterDropdown options={qualityOptions} selected={qualityFilter.selected} onToggle={qualityFilter.toggle} isOpen={qualityFilter.isOpen} onToggleOpen={qualityFilter.toggleOpen} />
                </SortTh>
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
                        <ItemCell name={item.name} itemId={item.itemId} quality={item.quality} showTooltip={showTooltip} hideTooltip={hideTooltip} />
                      </td>
                      <td style="text-align: right; padding: 10px 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums; font-weight: 500;">
                        x{item.totalCount}
                      </td>
                      <td style="padding: 10px 16px;">
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          {Object.entries(item.locations || {}).map(([source, count], i) => {
                            const isVault = source.startsWith("Tab ");
                            return (
                              <span key={i} style={{
                                fontSize: "11px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                background: isVault ? "rgba(30, 255, 0, 0.1)" : "rgba(87, 148, 242, 0.1)",
                                color: isVault ? "var(--apple-green)" : "var(--apple-blue)",
                                whiteSpace: "nowrap",
                              }}>
                                {source}: x{count}
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
      <Footer count={displayItems.length} filtered={isFiltered} version="v5.0" />
      <ItemTooltip tooltip={tooltip} />
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

// ============== Sort & Filter Components ==============
const TH_BASE = "padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;";

function SortTh({ label, sortKey, currentSort, currentDir, onSort, align = "left", width, children }: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "right";
  width?: string;
  children?: any;
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      style={{
        textAlign: align,
        width: width || "auto",
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        padding: "12px 16px",
        color: isActive ? "var(--apple-blue)" : "var(--text-tertiary)",
        fontSize: "12px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: "var(--background-secondary)",
      }}
    >
      <span onClick={() => onSort(sortKey)} style="cursor: pointer;">
        {label}{isActive ? (currentDir === "asc" ? " \u25B2" : " \u25BC") : ""}
      </span>
      {children}
    </th>
  );
}

function FilterDropdown({ options, selected, onToggle, isOpen, onToggleOpen }: {
  options: { value: string; label: string; color?: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggleOpen();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <span ref={ref} style="position: relative; display: inline-block; margin-left: 4px;">
      <span
        onClick={(e: Event) => { e.stopPropagation(); onToggleOpen(); }}
        style={{
          cursor: "pointer",
          fontSize: "10px",
          opacity: selected.size < options.length ? 1 : 0.5,
          color: selected.size < options.length ? "var(--apple-blue)" : "var(--text-tertiary)",
        }}
      >
        {selected.size < options.length ? "\u25BC" : "\u25BD"}
      </span>
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          zIndex: 100,
          background: "var(--background-primary)",
          border: "1px solid var(--border-light)",
          borderRadius: "8px",
          padding: "8px 0",
          minWidth: "160px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          {options.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(opt.value)}
                onChange={() => onToggle(opt.value)}
                style="accent-color: var(--apple-blue);"
              />
              <span style={{ color: opt.color || "var(--text-primary)" }}>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </span>
  );
}

function useSort(defaultKey: string, defaultDir: "asc" | "desc" = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultDir);
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };
  return { sortKey, sortDir, handleSort };
}

function useCheckboxFilter(allValues: string[]): { selected: Set<string>; toggle: (v: string) => void; isOpen: boolean; toggleOpen: () => void } {
  const [selected, setSelected] = useState<Set<string>>(new Set(allValues));
  const [isOpen, setIsOpen] = useState(false);

  // Sync selected set when allValues changes (new data loaded)
  useEffect(() => {
    setSelected(new Set(allValues));
  }, [allValues.join(",")]);

  const toggle = (v: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  };
  return { selected, toggle, isOpen, toggleOpen: () => setIsOpen(!isOpen) };
}

function sortItems<T>(items: T[], sortKey: string, sortDir: "asc" | "desc", getValue: (item: T, key: string) => string | number): T[] {
  return [...items].sort((a, b) => {
    const aVal = getValue(a, sortKey);
    const bVal = getValue(b, sortKey);
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });
}

function ItemTable({ items, search, showTooltip, hideTooltip }: {
  items: { name: string; count: number; quality: number; qualityName?: string; itemId?: string }[];
  search: string;
  showTooltip: (e: MouseEvent, name: string, icon?: string, quality?: number) => void;
  hideTooltip: () => void;
}) {
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
                      <ItemCell name={item.name} itemId={item.itemId} quality={item.quality} showTooltip={showTooltip} hideTooltip={hideTooltip} />
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

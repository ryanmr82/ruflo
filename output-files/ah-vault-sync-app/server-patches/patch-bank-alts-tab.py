#!/usr/bin/env python3
"""Patch GuildStorageTabs.tsx: Replace BankAltsTab function with All Accounts support."""
import re

FILE = "/home/opc/tbc-website/islands/GuildStorageTabs.tsx"

with open(FILE, "r") as f:
    content = f.read()

OLD = """// ============== Bank Alts Tab ==============
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
}"""

NEW = """// ============== Bank Alts Tab ==============
function BankAltsTab() {
  const [accounts, setAccounts] = useState<BankAltAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("__ALL__");
  const [selectedChar, setSelectedChar] = useState<string>("__ALL__");
  const [search, setSearch] = useState("");

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
                <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Quantity</th>
                <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Location</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                    {search ? `No items matching '${search}'` : "No items found"}
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
}"""

if OLD not in content:
    print("ERROR: Could not find OLD block in file")
    import sys
    sys.exit(1)

content = content.replace(OLD, NEW)

with open(FILE, "w") as f:
    f.write(content)

print("Patched successfully")

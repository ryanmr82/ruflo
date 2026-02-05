// GuildBankBrowser.tsx — Interactive guild bank inventory browser
// Fetches from /api/guild-bank/inventory and displays with tab view, search, quality colors

import { useEffect, useState } from "preact/hooks";

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

const QUALITY_COLORS: Record<number, string> = {
  0: "#9d9d9d", // Poor
  1: "#ffffff", // Common
  2: "#1eff00", // Uncommon
  3: "#0070dd", // Rare
  4: "#a335ee", // Epic
  5: "#ff8000", // Legendary
};

export default function GuildBankBrowser() {
  const [data, setData] = useState<GBankInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(-1); // -1 = summary view
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
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
          <div style="color: var(--text-secondary); font-size: 16px;">Loading guild bank data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 40px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 12px;">Guild Bank</div>
          <div style="color: var(--text-secondary);">
            {error || "No guild bank data available. Open the guild bank in-game to scan."}
          </div>
        </div>
      </div>
    );
  }

  const searchLower = search.toLowerCase();

  // Get items for current view, aggregating duplicates by name
  let displayItems: (GBankItem | GBankSummaryItem)[] = [];
  if (activeTab === -1) {
    displayItems = data.summary || [];
  } else {
    const tab = data.tabs.find((t) => t.tabIndex === activeTab);
    const rawItems = tab ? tab.items : [];
    // Aggregate items with the same name
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

  // Filter by search
  if (search) {
    displayItems = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }

  // Sort alphabetically
  displayItems = [...displayItems].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Calculate time since scan
  const scanDate = new Date(data.scanTime.replace(" ", "T"));
  const now = new Date();
  const diffMs = now.getTime() - scanDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  let timeAgo = "";
  if (diffDays > 0) timeAgo = diffDays + "d ago";
  else if (diffHours > 0) timeAgo = diffHours + "h ago";
  else if (diffMins > 0) timeAgo = diffMins + "m ago";
  else timeAgo = "just now";

  return (
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      {/* Header */}
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0;">
              Guild Bank
            </h1>
            <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">
              {data.guildName}
            </div>
          </div>
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="text-align: right;">
              <div style="color: var(--apple-green); font-size: 14px; font-weight: 500;">
                {data.uniqueItems} unique items
              </div>
              <div style="color: var(--text-tertiary); font-size: 12px;">
                {data.totalItems} total
              </div>
            </div>
            <div style="text-align: right;">
              <div style="color: var(--text-secondary); font-size: 13px;">
                Scanned {timeAgo}
              </div>
              <div style="color: var(--text-tertiary); font-size: 12px;">
                {data.scanTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style="margin-bottom: 16px;">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          style="width: 100%; padding: 10px 16px; background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none;"
        />
      </div>

      {/* Tab Buttons */}
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button
          onClick={() => setActiveTab(-1)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeTab === -1 ? "1px solid var(--apple-blue)" : "1px solid var(--border-light)",
            background: activeTab === -1 ? "rgba(87, 148, 242, 0.15)" : "var(--background-secondary)",
            color: activeTab === -1 ? "var(--apple-blue)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          All Items ({data.uniqueItems})
        </button>
        {data.tabs.map((tab) => (
          <button
            key={tab.tabIndex}
            onClick={() => setActiveTab(tab.tabIndex)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === tab.tabIndex ? "1px solid var(--apple-blue)" : "1px solid var(--border-light)",
              background: activeTab === tab.tabIndex ? "rgba(87, 148, 242, 0.15)" : "var(--background-secondary)",
              color: activeTab === tab.tabIndex ? "var(--apple-blue)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {tab.tabName} ({tab.items.length})
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div style="background: var(--background-secondary); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-light);">
              <th style="text-align: left; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
              <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Quantity</th>
              <th style="text-align: right; padding: 12px 16px; color: var(--text-tertiary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Quality</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={3} style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                  {search ? `No items matching '${search}'` : "No items in this tab"}
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
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx < displayItems.length - 1 ? "1px solid var(--border-lighter)" : "none",
                    }}
                    class="guild-bank-row"
                  >
                    <td style="padding: 10px 16px;">
                      <span style={{ color: qColor, fontWeight: item.quality >= 3 ? 500 : 400 }}>
                        {item.name}
                      </span>
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
                        {item.qualityName}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style="text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 16px 0; margin-top: 8px;">
        {displayItems.length} item{displayItems.length !== 1 ? "s" : ""} shown
        {search && " (filtered)"}
        {" | Data synced by AH & Vault Sync v4.0"}
      </div>
    </div>
  );
}

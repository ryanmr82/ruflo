import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import ItemTooltip, { useItemTooltip, getIconUrl, QUALITY_COLORS } from "./ItemTooltip.tsx";

interface LootItem {
  raidId: string;
  raidType: string;
  raidDate: string;
  timestamp: string;
  player: string;
  itemId: number;
  itemName: string;
  quality: string;
}

interface Props {
  loot: LootItem[];
}

const QUALITY_MAP: Record<string, number> = {
  poor: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

export default function LootTable({ loot }: Props) {
  const { tooltip, showTooltip, hideTooltip } = useItemTooltip();
  const [itemCache, setItemCache] = useState<Map<string, { iconUrl: string; quality: number; tooltipHtml: string; turtleWowId: number }>>(new Map());
  const [loadingCount, setLoadingCount] = useState(0);

  // Same pattern as SRPlusPublic - fetch item details client-side with Map state
  const fetchItemDetails = async (itemName: string) => {
    try {
      const res = await fetch(`/api/items/lookup?name=${encodeURIComponent(itemName)}`);
      if (res.ok) {
        const item = await res.json();
        setItemCache(prev => new Map(prev).set(itemName.toLowerCase(), {
          iconUrl: item.iconUrl || getIconUrl(item.icon || "inv_misc_questionmark"),
          quality: item.quality,
          tooltipHtml: item.tooltipHtml,
          turtleWowId: item.id,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch item:", itemName, err);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    if (!IS_BROWSER) return;

    // Collect unique items that need fetching
    const itemsToFetch: string[] = [];
    for (const item of loot) {
      if (item.itemName && !itemCache.has(item.itemName.toLowerCase())) {
        if (!itemsToFetch.includes(item.itemName)) {
          itemsToFetch.push(item.itemName);
        }
      }
    }

    if (itemsToFetch.length === 0) return;

    setLoadingCount(itemsToFetch.length);

    // Fetch items with staggered requests (same pattern as SRPlusPublic)
    itemsToFetch.forEach((itemName, i) => {
      setTimeout(() => {
        fetchItemDetails(itemName);
      }, i * 50); // 50ms between requests
    });
  }, [loot]);

  const getQualityNum = (quality: string): number => QUALITY_MAP[quality] ?? 4;

  const getItemIcon = (item: LootItem) => {
    const cached = itemCache.get(item.itemName.toLowerCase());
    return cached?.iconUrl || getIconUrl("inv_misc_questionmark");
  };

  const getItemQuality = (item: LootItem) => {
    const cached = itemCache.get(item.itemName.toLowerCase());
    return cached?.quality ?? getQualityNum(item.quality);
  };

  const handleMouseEnter = (e: MouseEvent, item: LootItem) => {
    const cached = itemCache.get(item.itemName.toLowerCase());
    showTooltip(
      e,
      item.itemName,
      undefined,
      cached?.quality ?? getQualityNum(item.quality)
    );
  };

  return (
    <div>
      {loadingCount > 0 && (
        <div style="padding: 4px 12px; font-size: 11px; color: var(--text-tertiary); background: var(--background-tertiary); border-radius: 4px; margin-bottom: 8px; display: inline-block;">
          Loading icons... ({loadingCount} remaining)
        </div>
      )}
      <table class="loot-table">
        <thead>
          <tr>
            <th style="width: 50%;">Item</th>
            <th>Player</th>
            <th>Raid</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {loot.length === 0 ? (
            <tr>
              <td colSpan={4} style="text-align: center; padding: 32px; color: var(--text-tertiary);">
                No loot found. Upload combat logs to track loot.
              </td>
            </tr>
          ) : (
            loot.map((item, idx) => {
              const qualityNum = getItemQuality(item);
              const qualityColor = QUALITY_COLORS[qualityNum] || "#a335ee";
              const iconUrl = getItemIcon(item);

              return (
                <tr key={`${item.raidId}-${idx}`}>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "3px",
                          border: `2px solid ${qualityColor}`,
                          backgroundImage: `url(${iconUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e as unknown as MouseEvent, item)}
                        onMouseLeave={hideTooltip}
                      />
                      <a
                        href={`https://database.turtlecraft.gg/?item=${item.itemId}`}
                        target="_blank"
                        rel="noopener"
                        style={{
                          color: qualityColor,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e as unknown as MouseEvent, item)}
                        onMouseLeave={hideTooltip}
                      >
                        {item.itemName}
                      </a>
                    </div>
                  </td>
                  <td>{item.player}</td>
                  <td>{item.raidType}</td>
                  <td>{item.raidDate}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <ItemTooltip tooltip={tooltip} />

      <style dangerouslySetInnerHTML={{ __html: `
        .loot-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .loot-table th {
          background: var(--background-tertiary);
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          border-bottom: 2px solid var(--border-light);
          position: sticky;
          top: 0;
        }
        .loot-table td {
          padding: 6px 12px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }
        .loot-table tr:hover td {
          background: var(--background-tertiary);
        }
      `}} />
    </div>
  );
}

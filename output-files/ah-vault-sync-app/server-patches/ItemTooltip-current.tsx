import { useState, useRef } from "preact/hooks";
import { QUALITY_COLORS } from "@/utils/quality.ts";
import {
  getIconUrl,
  getIconFallbacks,
  getQualityFallbackIcon,
  type ItemInfo,
  type IconSize
} from "@/utils/items.ts";

export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  html: string;
  itemName: string;
  iconUrl: string;
  quality: number;
  loading?: boolean;
  // Basic info for instant display
  slot?: string;
  armor?: string;
  weaponType?: string;
  classRestriction?: string;
  dropRate?: string;
  boss?: string;
}

// Re-export for backwards compatibility
export { QUALITY_COLORS } from "@/utils/quality.ts";
export { getIconUrl, getIconFallbacks, getQualityFallbackIcon, type ItemInfo, type IconSize } from "@/utils/items.ts";

// LRU cache for full tooltip data - shared across all components (max 100 entries)
const TOOLTIP_CACHE_MAX = 100;
const tooltipCache = new Map<string, ItemInfo>();

function cacheGet(key: string): ItemInfo | undefined {
  const val = tooltipCache.get(key);
  if (val !== undefined) {
    // Move to end (most recently used)
    tooltipCache.delete(key);
    tooltipCache.set(key, val);
  }
  return val;
}

function cacheSet(key: string, val: ItemInfo): void {
  if (tooltipCache.has(key)) tooltipCache.delete(key);
  tooltipCache.set(key, val);
  // Evict oldest if over limit
  if (tooltipCache.size > TOOLTIP_CACHE_MAX) {
    const oldest = tooltipCache.keys().next().value;
    if (oldest !== undefined) tooltipCache.delete(oldest);
  }
}

// Pending fetch promises to avoid duplicate requests
const pendingFetches: Record<string, Promise<ItemInfo | null>> = {};

// Lookup item and cache result
// If itemId is provided, use it for accurate lookup (avoids wrong item with same name)
// If forceRefresh is true, bypass cache (used for healing incomplete items)
export const lookupItem = async (itemName: string, itemId?: number, forceRefresh: boolean = false): Promise<ItemInfo | null> => {
  const cacheKey = itemId ? `id:${itemId}` : itemName;

  // Check cache first (unless forcing refresh for healing)
  const cached = cacheGet(cacheKey);
  if (!forceRefresh && cached) {
    return cached;
  }

  // Check if already fetching
  if (cacheKey in pendingFetches) {
    return pendingFetches[cacheKey];
  }

  // Start fetch - use ID if available (more accurate), otherwise fall back to name
  const fetchPromise = (async () => {
    try {
      const param = itemId ? `id=${itemId}` : `name=${encodeURIComponent(itemName)}`;
      const response = await fetch(`/api/items/lookup?${param}`);
      if (!response.ok) return null;

      const data = await response.json();

      // ALWAYS reconstruct iconUrl from icon field (ignore API's iconUrl which may be stale in cache)
      const reconstructedIconUrl = data.icon ? getIconUrl(data.icon) : data.iconUrl;

      const itemInfo: ItemInfo = {
        id: data.id,
        name: data.name || itemName,
        icon: data.icon,
        iconUrl: reconstructedIconUrl,
        quality: data.quality ?? 4,
        tooltipHtml: data.tooltipHtml || "",
      };
      console.log(`[ItemTooltip] Fetched ${itemName}: icon=${data.icon}, url=${reconstructedIconUrl}`);

      // Cache it (LRU evicts oldest when over limit)
      cacheSet(cacheKey, itemInfo);
      return itemInfo;
    } catch {
      return null;
    } finally {
      delete pendingFetches[cacheKey];
    }
  })();

  pendingFetches[cacheKey] = fetchPromise;
  return fetchPromise;
};

// Pre-fetch multiple items in parallel (fire and forget)
export const prefetchItems = (itemNames: string[]): void => {
  const uncached = itemNames.filter(name => !tooltipCache.has(name) && !pendingFetches[name]);
  if (uncached.length === 0) return;

  // Fetch in batches of 5 with staggered starts to avoid overwhelming
  uncached.slice(0, 15).forEach((name, i) => {
    setTimeout(() => lookupItem(name), i * 100);
  });
};

// Check if item is cached
export const isItemCached = (itemName: string): boolean => {
  return tooltipCache.has(itemName);
};

// Get cached item
export const getCachedItem = (itemName: string): ItemInfo | null => {
  return cacheGet(itemName) ?? null;
};

interface ItemTooltipProps {
  tooltip: TooltipData;
}

export default function ItemTooltip({ tooltip }: ItemTooltipProps) {
  if (!tooltip.visible) return null;

  const qualityColor = QUALITY_COLORS[tooltip.quality] || QUALITY_COLORS[4];

  // Build basic info lines from available data
  const infoLines: string[] = [];
  if (tooltip.slot) infoLines.push(tooltip.slot);
  if (tooltip.armor) infoLines.push(tooltip.armor);
  if (tooltip.weaponType) infoLines.push(tooltip.weaponType);

  // Center the tooltip in the browser window
  const EDGE_PADDING = 20; // Padding from screen edges

  const positionStyle: Record<string, string> = {
    position: "fixed",
    zIndex: "9999",
    maxWidth: "400px",
    minWidth: "200px",
    // Center horizontally
    left: "50%",
    transform: "translateX(-50%)",
    // Center vertically
    top: "50%",
    marginTop: "-200px", // Approximate half of typical tooltip height to center it
    // Constrain height to viewport with padding and make scrollable
    maxHeight: `${window.innerHeight - (EDGE_PADDING * 2)}px`,
    overflowY: "auto",
    overflowX: "hidden",
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .tw-tooltip-content {
          font-size: 12px;
          line-height: 1.5;
          color: #e5e7eb;
        }
        .tw-tooltip-content b {
          font-weight: 600;
        }
        /* Quality colors - WoW standard with !important for specificity */
        .tw-tooltip-content .q0,
        .tw-tooltip-content b.q0,
        .tw-tooltip-content span.q0,
        .tw-tooltip-content a.q0 { color: #9d9d9d !important; } /* Poor - gray */

        .tw-tooltip-content .q1,
        .tw-tooltip-content b.q1,
        .tw-tooltip-content span.q1,
        .tw-tooltip-content a.q1 { color: #ffffff !important; } /* Common - white */

        .tw-tooltip-content .q2,
        .tw-tooltip-content b.q2,
        .tw-tooltip-content span.q2,
        .tw-tooltip-content a.q2 { color: #1eff00 !important; } /* Uncommon - green (Equip effects!) */

        .tw-tooltip-content .q3,
        .tw-tooltip-content b.q3,
        .tw-tooltip-content span.q3,
        .tw-tooltip-content a.q3 { color: #0070dd !important; } /* Rare - blue */

        .tw-tooltip-content .q4,
        .tw-tooltip-content b.q4,
        .tw-tooltip-content span.q4,
        .tw-tooltip-content a.q4 { color: #a335ee !important; } /* Epic - purple */

        .tw-tooltip-content .q5,
        .tw-tooltip-content b.q5,
        .tw-tooltip-content span.q5,
        .tw-tooltip-content a.q5 { color: #ff8000 !important; } /* Legendary - orange */

        /* Set bonuses use .q class (no number) - gold/tan color */
        .tw-tooltip-content .q,
        .tw-tooltip-content span.q,
        .tw-tooltip-content a.q { color: #ffd100 !important; }

        /* Moneysilver and moneygold classes */
        .tw-tooltip-content .moneysilver { color: #c7c7cf !important; }
        .tw-tooltip-content .moneygold { color: #ffd100 !important; }
        .tw-tooltip-content .moneycopper { color: #f0a050 !important; }

        /* Red text for requirements not met */
        .tw-tooltip-content .q10,
        .tw-tooltip-content .r { color: #ff4040 !important; }

        .tw-tooltip-content table {
          border-collapse: collapse;
          width: 100%;
        }
        .tw-tooltip-content td, .tw-tooltip-content th {
          padding: 1px 0;
          text-align: left;
        }
        .tw-tooltip-content th {
          text-align: right;
        }
        .tw-tooltip-content a {
          color: inherit;
          text-decoration: none;
          pointer-events: none;
        }
        .tw-tooltip-content br {
          display: block;
          margin: 1px 0;
        }
        /* Indent for set bonus descriptions */
        .tw-tooltip-content .indent {
          padding-left: 10px;
        }
        /* Small text styling */
        .tw-tooltip-content small {
          font-size: 11px;
          color: #9ca3af;
        }
        /* Scrollbar styling for overflow content */
        .item-tooltip-container::-webkit-scrollbar {
          width: 8px;
        }
        .item-tooltip-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .item-tooltip-container::-webkit-scrollbar-thumb {
          background: rgba(163, 53, 238, 0.5);
          border-radius: 4px;
        }
        .item-tooltip-container::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 53, 238, 0.8);
        }
      `}} />
      <div
        className="item-tooltip-container"
        style={{
          ...positionStyle,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: `2px solid ${qualityColor}`,
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <img
            src={tooltip.iconUrl || getIconUrl("")}
            alt=""
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "4px",
              border: `2px solid ${qualityColor}`,
              background: "#000",
              flexShrink: 0,
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = getQualityFallbackIcon(tooltip.quality);
                console.log(`[ItemTooltip] Icon 404 for ${tooltip.itemName} - using quality ${tooltip.quality} fallback`);
              }
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: qualityColor,
              fontWeight: "600",
              fontSize: "14px",
              marginBottom: "2px",
            }}>
              {tooltip.itemName}
            </div>

            {/* Show basic info immediately if no full HTML yet */}
            {!tooltip.html && infoLines.length > 0 && (
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                {infoLines.join(" - ")}
              </div>
            )}

            {tooltip.classRestriction && !tooltip.html && (
              <div style={{ fontSize: "11px", color: "#fbbf24", marginTop: "2px" }}>
                Classes: {tooltip.classRestriction}
              </div>
            )}

            {tooltip.boss && !tooltip.html && (
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                Drops from: {tooltip.boss}
              </div>
            )}

            {tooltip.dropRate && !tooltip.html && (
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Drop rate: {tooltip.dropRate}
              </div>
            )}

            {tooltip.loading && (
              <div style={{ fontSize: "10px", color: "#4b5563", marginTop: "4px" }}>
                Loading details...
              </div>
            )}
          </div>
        </div>

        {/* Full tooltip HTML from database */}
        {tooltip.html && (
          <div
            className="tw-tooltip-content"
            style={{ marginTop: "8px", borderTop: "1px solid #374151", paddingTop: "8px" }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}
      </div>
    </>
  );
}

// Helper hook for tooltip state management
export function useItemTooltip() {
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    html: "",
    itemName: "",
    iconUrl: "",
    quality: 4,
    loading: false,
  });

  const fetchTimeoutRef = useRef<number | null>(null);

  const showTooltip = (
    e: MouseEvent,
    itemName: string,
    icon?: string,
    quality?: number,
    extraInfo?: {
      slot?: string;
      armor?: string;
      weaponType?: string;
      classRestriction?: string;
      dropRate?: string;
      boss?: string;
      tooltipHtml?: string;
      iconUrl?: string;
    }
  ) => {
    // Store cursor position - positioning logic is in the component
    const x = e.clientX;
    const y = e.clientY;

    const iconUrl = extraInfo?.iconUrl || (icon ? getIconUrl(icon) : "");
    const itemQuality = quality ?? 4;

    // If tooltip HTML was passed directly (from LootTable cache), use it immediately
    if (extraInfo?.tooltipHtml) {
      setTooltip({
        visible: true,
        x,
        y,
        html: extraInfo.tooltipHtml,
        itemName,
        iconUrl,
        quality: itemQuality,
        loading: false,
        ...extraInfo,
      });
      return;
    }

    // Check cache first for full tooltip
    const cached = getCachedItem(itemName);
    if (cached) {
      setTooltip({
        visible: true,
        x,
        y,
        html: cached.tooltipHtml || "",
        itemName: cached.name,
        iconUrl: cached.iconUrl || iconUrl,
        quality: cached.quality ?? itemQuality,
        loading: false,
        ...extraInfo,
      });
      return;
    }

    // Show immediately with basic info (no API call yet)
    setTooltip({
      visible: true,
      x,
      y,
      html: "",
      itemName,
      iconUrl,
      quality: itemQuality,
      loading: false, // Don't show loading initially
      ...extraInfo,
    });

    // Start fetching full tooltip after a short delay (only if still hovering)
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(async () => {
      // Mark as loading
      setTooltip(prev => prev.visible && prev.itemName === itemName ? { ...prev, loading: true } : prev);

      const itemInfo = await lookupItem(itemName);
      if (itemInfo) {
        setTooltip(prev => {
          // Only update if still showing same item
          if (prev.visible && prev.itemName === itemName) {
            return {
              ...prev,
              html: itemInfo.tooltipHtml || "",
              quality: itemInfo.quality ?? itemQuality,
              iconUrl: itemInfo.iconUrl || iconUrl,
              loading: false,
            };
          }
          return prev;
        });
      } else {
        setTooltip(prev => prev.visible && prev.itemName === itemName ? { ...prev, loading: false } : prev);
      }
    }, 300) as unknown as number; // 300ms delay before fetching
  };

  const hideTooltip = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return { tooltip, showTooltip, hideTooltip };
}

import { useState, useRef, useEffect } from "preact/hooks";

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
  // Positioning hints
  flipVertical?: boolean;
  flipHorizontal?: boolean;
}

export interface ItemInfo {
  id?: number;
  name: string;
  icon?: string;
  iconUrl?: string;
  quality?: number;
  tooltipHtml?: string;
}

export const QUALITY_COLORS: Record<number, string> = {
  0: "#9d9d9d", // Poor
  1: "#ffffff", // Common
  2: "#1eff00", // Uncommon
  3: "#0070dd", // Rare
  4: "#a335ee", // Epic
  5: "#ff8000", // Legendary
};

// Global cache for full tooltip data - shared across all components
const tooltipCache: Record<string, ItemInfo> = {};

// Pending fetch promises to avoid duplicate requests
const pendingFetches: Record<string, Promise<ItemInfo | null>> = {};

// Get icon URL from icon name with multiple fallback attempts
export const getIconUrl = (icon: string, size: "small" | "medium" | "large" = "medium"): string => {
  if (!icon) return "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg";

  // Normalize icon name - remove path, lowercase, handle various formats
  let normalized = icon.toLowerCase();

  // Remove any file extension
  normalized = normalized.replace(/\.(jpg|jpeg|png|gif|blp)$/i, "");

  // Remove common prefixes if present
  normalized = normalized.replace(/^interface\/icons\//i, "");

  return `https://wow.zamimg.com/images/wow/icons/${size}/${normalized}.jpg`;
};

// Alternative icon URLs to try
export const getIconFallbacks = (icon: string): string[] => {
  if (!icon) return [];

  const normalized = icon.toLowerCase().replace(/\.(jpg|jpeg|png|gif|blp)$/i, "");

  return [
    `https://wow.zamimg.com/images/wow/icons/medium/${normalized}.jpg`,
    `https://wow.zamimg.com/images/wow/icons/large/${normalized}.jpg`,
    // Try with underscores replaced by dashes and vice versa
    `https://wow.zamimg.com/images/wow/icons/medium/${normalized.replace(/_/g, "-")}.jpg`,
    `https://wow.zamimg.com/images/wow/icons/medium/${normalized.replace(/-/g, "_")}.jpg`,
  ];
};

// Lookup item and cache result
export const lookupItem = async (itemName: string): Promise<ItemInfo | null> => {
  // Check cache first
  if (tooltipCache[itemName]) {
    return tooltipCache[itemName];
  }

  // Check if already fetching
  if (pendingFetches[itemName]) {
    return pendingFetches[itemName];
  }

  // Start fetch
  const fetchPromise = (async () => {
    try {
      const response = await fetch(`/api/items/lookup?name=${encodeURIComponent(itemName)}`);
      if (!response.ok) return null;

      const data = await response.json();
      const itemInfo: ItemInfo = {
        id: data.id,
        name: data.name || itemName,
        icon: data.icon,
        iconUrl: data.iconUrl,
        quality: data.quality ?? 4,
        tooltipHtml: data.tooltipHtml || "",
      };

      // Cache it
      tooltipCache[itemName] = itemInfo;
      return itemInfo;
    } catch {
      return null;
    } finally {
      delete pendingFetches[itemName];
    }
  })();

  pendingFetches[itemName] = fetchPromise;
  return fetchPromise;
};

// Pre-fetch multiple items in parallel (fire and forget)
export const prefetchItems = (itemNames: string[]): void => {
  const uncached = itemNames.filter(name => !tooltipCache[name] && !pendingFetches[name]);
  if (uncached.length === 0) return;

  // Fetch in batches of 5 with staggered starts to avoid overwhelming
  uncached.slice(0, 15).forEach((name, i) => {
    setTimeout(() => lookupItem(name), i * 100);
  });
};

// Check if item is cached
export const isItemCached = (itemName: string): boolean => {
  return !!tooltipCache[itemName];
};

// Get cached item
export const getCachedItem = (itemName: string): ItemInfo | null => {
  return tooltipCache[itemName] || null;
};

interface ItemTooltipProps {
  tooltip: TooltipData;
}

export default function ItemTooltip({ tooltip }: ItemTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });

  // Adjust position after render to prevent cutoff
  useEffect(() => {
    if (!tooltip.visible || !tooltipRef.current) {
      return;
    }

    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const padding = 10;

    let newX = tooltip.x;
    let newY = tooltip.y;

    // Check right edge - flip to left of cursor
    if (newX + rect.width + padding > window.innerWidth) {
      newX = tooltip.x - rect.width - 30; // 30 = offset from cursor (15) * 2
    }

    // Check bottom edge - flip above cursor
    if (newY + rect.height + padding > window.innerHeight) {
      newY = tooltip.y - rect.height - 20; // Flip above cursor
    }

    // Check left edge
    if (newX < padding) {
      newX = padding;
    }

    // Check top edge
    if (newY < padding) {
      newY = padding;
    }

    setAdjustedPos({ x: newX, y: newY });
  }, [tooltip.visible, tooltip.x, tooltip.y, tooltip.html]);

  if (!tooltip.visible) return null;

  const qualityColor = QUALITY_COLORS[tooltip.quality] || QUALITY_COLORS[4];

  // Build basic info lines from available data
  const infoLines: string[] = [];
  if (tooltip.slot) infoLines.push(tooltip.slot);
  if (tooltip.armor) infoLines.push(tooltip.armor);
  if (tooltip.weaponType) infoLines.push(tooltip.weaponType);

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
      `}} />
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          left: `${adjustedPos.x || tooltip.x}px`,
          top: `${adjustedPos.y || tooltip.y}px`,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: `2px solid ${qualityColor}`,
          borderRadius: "8px",
          padding: "12px",
          zIndex: 9999,
          maxWidth: "320px",
          minWidth: "200px",
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
                img.src = "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg";
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

  let fetchTimeout: number | null = null;

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
    }
  ) => {
    // Position near cursor - initial position, will be adjusted after render
    const x = e.clientX + 15;
    const y = e.clientY + 10;

    const iconUrl = icon ? getIconUrl(icon) : "";
    const itemQuality = quality ?? 4;

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
    if (fetchTimeout) clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
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
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
      fetchTimeout = null;
    }
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return { tooltip, showTooltip, hideTooltip };
}

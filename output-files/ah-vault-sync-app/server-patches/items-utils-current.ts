/**
 * Item Utilities
 * Icon URLs, item fetching, caching, and display helpers
 */

export interface ItemInfo {
  id?: number;
  name: string;
  icon?: string;
  iconUrl?: string;
  quality?: number;
  tooltipHtml?: string;
  link?: string; // Optional for external links
  turtleWowId?: number; // Alias for id
}

// Icon size options
export type IconSize = "small" | "medium" | "large";

// Base URL for Turtle WoW icons (proxied through local caching route)
const ICON_BASE_URL = "/icons";

/**
 * Get full icon URL from icon name
 */
export function getIconUrl(icon: string, size: IconSize = "medium"): string {
  if (!icon) {
    return `${ICON_BASE_URL}/medium/inv_misc_questionmark.png`;
  }

  // Normalize icon name
  let normalized = icon.toLowerCase();
  normalized = normalized.replace(/\.(jpg|jpeg|png|gif|blp)$/i, "");
  normalized = normalized.replace(/^interface\/icons\//i, "");

  return `${ICON_BASE_URL}/${size}/${normalized}.png`;
}

/**
 * Get fallback icon URLs to try
 */
export function getIconFallbacks(icon: string): string[] {
  if (!icon) return [];

  const normalized = icon.toLowerCase().replace(/\.(jpg|jpeg|png|gif|blp)$/i, "");

  return [
    `${ICON_BASE_URL}/medium/${normalized}.png`,
    `${ICON_BASE_URL}/large/${normalized}.png`,
    `${ICON_BASE_URL}/medium/${normalized.replace(/_/g, "-")}.png`,
    `${ICON_BASE_URL}/medium/${normalized.replace(/-/g, "_")}.png`,
  ];
}

/**
 * Get quality-appropriate fallback icon
 */
export function getQualityFallbackIcon(quality: number, size: IconSize = "medium"): string {
  const fallbackIcons: Record<number, string> = {
    0: "inv_misc_gem_bloodstone_01",
    1: "inv_misc_gem_pearl_01",
    2: "inv_misc_gem_emerald_02",
    3: "inv_misc_gem_sapphire_02",
    4: "inv_misc_gem_amethyst_02",
    5: "inv_misc_gem_flamespessarite_02",
  };

  const icon = fallbackIcons[quality] || fallbackIcons[4];
  return `${ICON_BASE_URL}/${size}/${icon}.png`;
}

/**
 * Fetch item from API by ID or name
 */
export async function fetchItem(
  idOrName: number | string
): Promise<ItemInfo | null> {
  try {
    const param = typeof idOrName === "number" ? `id=${idOrName}` : `name=${encodeURIComponent(idOrName)}`;
    const response = await fetch(`/api/items/lookup?${param}`);

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch item:", idOrName, error);
    return null;
  }
}

/**
 * Global item cache (shared across components)
 */
const itemCache: Record<string, ItemInfo> = {};

/**
 * Get cached item
 */
export function getCachedItem(nameOrId: string | number): ItemInfo | null {
  const key = String(nameOrId).toLowerCase();
  return itemCache[key] || null;
}

/**
 * Cache item
 */
export function cacheItem(item: ItemInfo): void {
  if (item.id) itemCache[String(item.id)] = item;
  if (item.name) itemCache[item.name.toLowerCase()] = item;
}

/**
 * Prefetch multiple items
 */
export function prefetchItems(items: Array<number | string>): void {
  items.slice(0, 15).forEach((item, i) => {
    setTimeout(() => {
      fetchItem(item).then(data => {
        if (data) cacheItem(data);
      });
    }, i * 100);
  });
}

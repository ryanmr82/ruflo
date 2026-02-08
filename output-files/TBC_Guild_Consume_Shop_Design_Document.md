# TBC Guild Consume Shop - System Design Document

**Version:** 1.0 DRAFT
**Date:** January 16, 2026
**Author:** Claude (AI Assistant)
**Status:** AWAITING USER APPROVAL

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Requirements](#3-requirements)
4. [Item Catalog](#4-item-catalog)
5. [System Architecture](#5-system-architecture)
6. [Database Schema](#6-database-schema)
7. [Discord Bot Design](#7-discord-bot-design)
8. [Web Interface Design](#8-web-interface-design)
9. [AUX Addon Modification](#9-aux-addon-modification)
10. [SavedVariables Parser](#10-savedvariables-parser)
11. [Security & Authentication](#11-security--authentication)
12. [Deployment Plan](#12-deployment-plan)
13. [Open Questions](#13-open-questions)

---

## 1. Executive Summary

### 1.1 Project Goal
Create an automated Guild Consume Shop system for the Thrall's Book Club (TBC) guild on Turtle WoW that:
- Displays alchemy consumable prices in Discord with a configurable discount from AH prices
- Provides a web management interface synced bidirectionally with Discord
- Automates price collection via AUX addon modifications
- Supports order placement through Discord

### 1.2 Key Components
| Component | Technology | Location |
|-----------|------------|----------|
| Discord Bot | Node.js + discord.js v14 | Linux Server |
| Web Interface | Deno Fresh (existing) | Linux Server |
| Database | Deno KV (existing) | Linux Server |
| AUX Addon Mod | Lua | Distributed ZIP |
| SV Parser | PowerShell/Node.js | User's Windows PC |

### 1.3 Current Manual Process
Guild alchemists manually post prices in the `#alchemy` Discord channel under the "Professions" category. Prices are based on AH buyout prices with a 10% discount. This process is:
- Time-consuming (manual AH scanning)
- Inconsistent (depends on who posts and when)
- Hard to track (buried in Discord chat history)
- No order management

---

## 2. Current State Analysis

### 2.1 TBC Guild Website Infrastructure

| Aspect | Details |
|--------|---------|
| **URL** | https://tbcguild.duckdns.org |
| **Framework** | Deno Fresh 1.7.3 |
| **Database** | Deno KV with SQLite backend |
| **Location** | `/home/opc/tbc-website/` |
| **Service** | `tbc-website.service` (systemd) |
| **Server** | Oracle Linux 9 on ARM64 (Oracle Cloud) |
| **Node.js** | v22.17.0 |
| **Python** | 3.9.25 |

### 2.2 Existing Discord Integration
The website already has Discord OAuth implemented:

```
Discord Client ID: 1449004193602998373
Guild ID: 1039762365345976330
Redirect URI: https://tbcguild.duckdns.org/api/auth/discord/callback
```

**Existing Auth Files:**
- `/home/opc/tbc-website/routes/api/auth/discord/login.ts`
- `/home/opc/tbc-website/routes/api/auth/discord/callback.ts`
- `/home/opc/tbc-website/routes/api/auth/me.ts`

Sessions are stored in Deno KV with 7-day expiration.

### 2.3 AUX Addon Analysis

**Version:** aux Turtle (Turtle WoW fork by shirsig)
**Location:** `C:\turtlewow\Interface\AddOns\aux-addon\`
**SavedVariables:** `aux` (account-level)

**Key Data Structures:**
- Item history stored with daily minimum buyout
- Uses weighted median of up to 11 data points
- Data shared via LFT channel (optional)
- Item key format: `item_id:suffix_id:unique_id`

**History Schema (from source):**
```lua
{'tuple', '#',
  {next_push='number'},
  {daily_min_buyout='number'},
  {data_points={'list', ';',
    {'tuple', '@', {value='number'}, {time='number'}}
  }}
}
```

### 2.4 Existing Consumables Database
The website already has a comprehensive consumables database at:
`/home/opc/tbc-website/utils/consumables.ts`

This includes categories: food, potion, elixir, flask, juju, scroll, weapon_oil, sharpening_stone, poison, world_buff, misc.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Display consume prices in Discord channel | HIGH |
| FR-2 | Web management interface for prices | HIGH |
| FR-3 | Bidirectional sync between web and Discord | HIGH |
| FR-4 | Configurable global discount percentage | HIGH |
| FR-5 | Static (flat rate) pricing for flasks | HIGH |
| FR-6 | Dynamic pricing from AH scans | HIGH |
| FR-7 | Admin access management via GUI | HIGH |
| FR-8 | AUX addon button for guild consume scanning | HIGH |
| FR-9 | Automated SavedVariables parsing and upload | HIGH |
| FR-10 | Order placement through Discord | MEDIUM |
| FR-11 | Price update notifications | MEDIUM |
| FR-12 | Interactive category browsing in Discord | MEDIUM |
| FR-13 | Distributable AUX addon ZIP package | HIGH |

### 3.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Bot must run 24/7 on existing Linux server |
| NFR-2 | No hardcoded admin lists - all via GUI |
| NFR-3 | Must work with existing Discord OAuth |
| NFR-4 | Must integrate with existing TBC website |
| NFR-5 | Addon modification must be compatible with base aux-addon |

---

## 4. Item Catalog

### 4.1 Acronym Mapping

Based on the provided price list, here are the item mappings:

#### Protection/Utility Potions
| Acronym | Full Item Name | WoW Item ID | Category |
|---------|----------------|-------------|----------|
| GFPP | Greater Fire Protection Potion | 13457 | potion |
| GAPP | Greater Arcane Protection Potion | 13461 | potion |
| GNPP | Greater Nature Protection Potion | 13458 | potion |
| LIP | Limited Invulnerability Potion | 3387 | potion |
| FAP | Free Action Potion | 5634 | potion |
| LAP | Living Action Potion | 20008 | potion |
| Swiftness | Swiftness Potion | 2459 | potion |
| GSPP | Greater Shadow Protection Potion | 13459 | potion |
| GFrPP | Greater Frost Protection Potion | 13456 | potion |
| Quickness | Potion of Quickness | - | potion |
| Invisibility | Invisibility Potion | 9172 | potion |
| Restorative | Restorative Potion | 9030 | potion |
| Purification | Purification Potion | 13462 | potion |

#### Tank/Melee Consumables
| Acronym | Full Item Name | WoW Item ID | Category |
|---------|----------------|-------------|----------|
| Troll's Blood | Major Troll's Blood Potion | 20004 | potion |
| Mongoose | Elixir of the Mongoose | 13452 | elixir |
| Giants | Elixir of Giants | 9206 | elixir |
| Mighty Rage | Mighty Rage Potion | 13442 | potion |
| Gift of Arthas | Gift of Arthas | 9088 | elixir |
| Greater Stoneshield | Greater Stoneshield Potion | 13455 | potion |
| Superior Defense | Elixir of Superior Defense | 13445 | elixir |
| Oil of Immolation | Oil of Immolation | 8956 | misc |
| Fortitude | Elixir of Fortitude | 3825 | elixir |

#### Caster Consumables
| Acronym | Full Item Name | WoW Item ID | Category |
|---------|----------------|-------------|----------|
| Mageblood | Mageblood Potion | 20007 | potion |
| GAE | Greater Arcane Elixir | 13454 | elixir |
| Greater Frost Power | Elixir of Frost Power | 17708 | elixir |
| Greater Nature Power | Elixir of Greater Nature Power | - | elixir |
| Greater Arcane Power | Greater Arcane Elixir | 13454 | elixir |
| Greater Firepower | Elixir of Greater Firepower | 21546 | elixir |
| Shadow Power | Elixir of Shadow Power | 9264 | elixir |
| Dreamshard | Dreamshard Elixir | - | elixir |
| Major Mana | Major Mana Potion | 13444 | potion |

#### Concoctions (Turtle WoW Custom)
| Name | Full Item Name | Category |
|------|----------------|----------|
| Emerald Mongoose | Emerald Mongoose (TW Custom) | concoction |
| Arcane Giant | Arcane Giant (TW Custom) | concoction |
| Dreamwater | Dreamwater (TW Custom) | concoction |

#### Flasks (STATIC PRICING)
| Name | Full Item Name | Static Price | Category |
|------|----------------|--------------|----------|
| Flask of the Titans | Flask of the Titans | 30g | flask |
| Flask of Distilled Wisdom | Flask of Distilled Wisdom | TBD | flask |
| Flask of Supreme Power | Flask of Supreme Power | TBD | flask |
| Flask of Chromatic Resistance | Flask of Chromatic Resistance | TBD | flask |

### 4.2 Current Pricing (as of Jan 12, 2026)

```
PROTECTION/UTILITY
------------------
GFPP                    1g 75s
GAPP                    1g 05s
GNPP                    2g 10s
LIP                     1g 45s
FAP                     1g 90s
LAP                     3g 15s
Swiftness               25s
GSPP                    3g 30s
GFrPP (Frost)           1g 20s
Quickness               2g 25s
Invisibility            1g 25s
Restorative Potion      2g 40s
Purification Potion     1g 00s

TANK/MELEE
----------
Troll's Blood           2g 05s
Mongoose                1g 10s
Giants                  45s
Mighty Rage             40s
Gift of Arthas          40s
Greater Stoneshield     3g 07s
Superior Defense        1g 70s
Oil of Immolation       1g 10s
Elixir of Fortitude     62s

CASTER
------
Mageblood               2g 00s (holding)
GAE                     1g 75s
Greater Frost Power     1g 25s
Greater Nature Power    2g 25s
Greater Arcane Power    1g 77s
Greater Firepower       1g 40s
Shadow Power            1g 95s
Dreamshard Elixir       1g 65s
Major Mana              1g 50s

CONCOCTIONS
-----------
Emerald Mongoose        4g 20s
Arcane Giant            2g 90s
Dreamwater              2g 00s

FLASKS (STATIC - G-Bank Only)
-----------------------------
Flask of Titans         30g
```

---

## 5. System Architecture

### 5.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TBC GUILD CONSUME SHOP SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────┐                           ┌─────────────────────────────┐ │
│   │   TURTLE WOW    │                           │      LINUX SERVER           │ │
│   │    (Game)       │                           │   (Oracle Cloud ARM64)      │ │
│   │                 │                           │                             │ │
│   │  ┌───────────┐  │                           │  ┌───────────────────────┐  │ │
│   │  │ AUX Addon │  │                           │  │    Discord Bot        │  │ │
│   │  │ + Guild   │  │                           │  │   (Node.js/discord.js)│  │ │
│   │  │  Scanner  │  │                           │  │                       │  │ │
│   │  └─────┬─────┘  │                           │  │  • Slash commands     │  │ │
│   │        │        │                           │  │  • Price display      │  │ │
│   │        ▼        │                           │  │  • Order management   │  │ │
│   │  ┌───────────┐  │                           │  │  • Notifications      │  │ │
│   │  │ Saved     │  │                           │  └───────────┬───────────┘  │ │
│   │  │ Variables │  │                           │              │              │ │
│   │  │ (.lua)    │  │                           │              │ REST API     │ │
│   │  └─────┬─────┘  │                           │              │              │ │
│   │        │        │                           │  ┌───────────▼───────────┐  │ │
│   └────────┼────────┘                           │  │   TBC Website         │  │ │
│            │                                    │  │   (Deno Fresh)        │  │ │
│   ┌────────┼────────┐                           │  │                       │  │ │
│   │  WINDOWS PC     │                           │  │  • /shop (public)     │  │ │
│   │                 │                           │  │  • /shop/admin        │  │ │
│   │  ┌─────▼─────┐  │      HTTPS POST           │  │  • /api/shop/*        │  │ │
│   │  │ SV Parser │──┼───────────────────────────┼──►                       │  │ │
│   │  │(PowerShell│  │    (Authenticated)        │  └───────────┬───────────┘  │ │
│   │  │ or Node)  │  │                           │              │              │ │
│   │  └───────────┘  │                           │  ┌───────────▼───────────┐  │ │
│   │                 │                           │  │    Deno KV Database   │  │ │
│   │  Watches:       │                           │  │                       │  │ │
│   │  WTF/Account/   │                           │  │  • shop_items         │  │ │
│   │  */Saved        │                           │  │  • shop_prices        │  │ │
│   │  Variables/     │                           │  │  • shop_orders        │  │ │
│   │  GuildShop.lua  │                           │  │  • shop_settings      │  │ │
│   │                 │                           │  │  • shop_admins        │  │ │
│   └─────────────────┘                           │  └───────────────────────┘  │ │
│                                                 │                             │ │
│                                                 └─────────────────────────────┘ │
│                                                                                 │
│   ┌─────────────────┐                                                           │
│   │  DISCORD SERVER │◄───────────── Bot posts to #alchemy channel              │
│   │  (TBC Guild)    │                                                           │
│   │                 │                                                           │
│   │  #alchemy       │                                                           │
│   │  (Professions)  │                                                           │
│   └─────────────────┘                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRICE SCAN FLOW:                                                               │
│  ───────────────                                                                │
│                                                                                 │
│  1. Player clicks "Update Guild Prices" button in AUX                           │
│                    │                                                            │
│                    ▼                                                            │
│  2. AUX scans predefined list of guild consume items                            │
│                    │                                                            │
│                    ▼                                                            │
│  3. Results saved to GuildShop.lua SavedVariables                               │
│                    │                                                            │
│                    ▼                                                            │
│  4. SV Parser detects file change (or manual trigger)                           │
│                    │                                                            │
│                    ▼                                                            │
│  5. Parser extracts prices, applies discount, POSTs to API                      │
│                    │                                                            │
│                    ▼                                                            │
│  6. API stores in Deno KV, notifies Discord bot                                 │
│                    │                                                            │
│                    ▼                                                            │
│  7. Bot posts price update to #alchemy channel                                  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                 │
│  ADMIN MANAGEMENT FLOW:                                                         │
│  ──────────────────────                                                         │
│                                                                                 │
│  Web UI ──► API ──► Deno KV ──► Discord Bot (reads on demand)                   │
│     │                              │                                            │
│     └──────────────────────────────┘                                            │
│           (bidirectional sync)                                                  │
│                                                                                 │
│  Discord Bot ──► API ──► Deno KV ──► Web UI (reads on demand)                   │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                 │
│  ORDER FLOW:                                                                    │
│  ───────────                                                                    │
│                                                                                 │
│  User /order ──► Bot validates ──► Creates order in KV ──► Notifies admins      │
│                                                               │                 │
│                                                               ▼                 │
│                                          Admin fulfills via Discord or Web      │
│                                                               │                 │
│                                                               ▼                 │
│                                          Order marked complete, user notified   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Component Responsibilities

| Component | Responsibilities |
|-----------|------------------|
| **Discord Bot** | Slash commands, price display, order intake, notifications, admin commands |
| **Web API** | RESTful endpoints, auth, data persistence, bot communication |
| **Web UI** | Admin panel, public shop display, settings management |
| **AUX Addon** | In-game scanning, SavedVariables export |
| **SV Parser** | File watching, Lua parsing, API upload |
| **Deno KV** | Persistent storage for all data |

---

## 6. Database Schema

### 6.1 Deno KV Key Structure

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SHOP ITEMS - What we sell
// ═══════════════════════════════════════════════════════════════════════════

["shop_items", itemId: number]: ShopItem

interface ShopItem {
  id: number;                    // WoW item ID
  name: string;                  // Display name
  shortName: string;             // Acronym (e.g., "GFPP")
  icon: string;                  // Icon path or URL
  category: ShopCategory;
  pricingType: "static" | "dynamic";
  staticPriceCopper: number | null;  // For flasks (in copper)
  enabled: boolean;
  sortOrder: number;             // Display order within category
  notes: string | null;          // e.g., "G-Bank only by request"
  createdAt: string;
  updatedAt: string;
}

type ShopCategory =
  | "protection"    // Protection potions
  | "melee"         // Tank/Melee consumables
  | "caster"        // Caster consumables
  | "concoction"    // Turtle WoW custom
  | "flask";        // Static priced flasks

// ═══════════════════════════════════════════════════════════════════════════
// SHOP PRICES - AH scan results
// ═══════════════════════════════════════════════════════════════════════════

["shop_prices", itemId: number]: ShopPrice

interface ShopPrice {
  itemId: number;
  ahPriceCopper: number;         // Raw AH buyout price
  discountedPriceCopper: number; // After discount applied
  scanTimestamp: string;         // ISO timestamp
  scannedBy: string;             // Discord username who uploaded
  scannedByDiscordId: string;
  source: "aux_scan" | "manual"; // How price was obtained
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP SETTINGS - Global configuration
// ═══════════════════════════════════════════════════════════════════════════

["shop_settings"]: ShopSettings

interface ShopSettings {
  discountPercent: number;           // Default 10
  announcementChannelId: string;     // Discord channel ID for #alchemy
  enableOrders: boolean;             // Allow order placement
  enableNotifications: boolean;      // Post updates to channel
  lastUpdated: string;
  updatedBy: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP ADMINS - Who can manage the shop
// ═══════════════════════════════════════════════════════════════════════════

["shop_admins", discordId: string]: ShopAdmin

interface ShopAdmin {
  discordId: string;
  discordUsername: string;
  permissions: AdminPermission[];
  addedAt: string;
  addedBy: string;
}

type AdminPermission =
  | "manage_items"      // Add/edit/remove items
  | "manage_prices"     // Update prices manually
  | "manage_orders"     // Fulfill/cancel orders
  | "manage_settings"   // Change global settings
  | "manage_admins"     // Add/remove other admins
  | "upload_scans";     // Upload AUX scan data

// ═══════════════════════════════════════════════════════════════════════════
// SHOP ORDERS - Customer orders
// ═══════════════════════════════════════════════════════════════════════════

["shop_orders", orderId: string]: ShopOrder

interface ShopOrder {
  id: string;                    // UUID
  discordId: string;
  discordUsername: string;
  characterName: string | null;  // In-game character
  items: OrderItem[];
  totalPriceCopper: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  fulfilledAt: string | null;
  fulfilledBy: string | null;
  fulfilledByDiscordId: string | null;
}

interface OrderItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unitPriceCopper: number;       // Price at time of order
  subtotalCopper: number;
}

type OrderStatus =
  | "pending"      // Awaiting fulfillment
  | "in_progress"  // Being prepared
  | "ready"        // Ready for pickup
  | "fulfilled"    // Completed
  | "cancelled";   // Cancelled

// ═══════════════════════════════════════════════════════════════════════════
// SHOP PRICE HISTORY - For analytics
// ═══════════════════════════════════════════════════════════════════════════

["shop_price_history", itemId: number, timestamp: string]: PriceHistoryEntry

interface PriceHistoryEntry {
  itemId: number;
  ahPriceCopper: number;
  discountedPriceCopper: number;
  discountPercent: number;
  scanTimestamp: string;
  scannedBy: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP API KEYS - For SV Parser authentication
// ═══════════════════════════════════════════════════════════════════════════

["shop_api_keys", keyHash: string]: ShopApiKey

interface ShopApiKey {
  keyHash: string;               // SHA-256 hash of the key
  name: string;                  // Description (e.g., "Ryan's PC")
  discordId: string;             // Owner
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  enabled: boolean;
}
```

### 6.2 Initial Data Migration

The initial item catalog from Section 4 will be migrated to the database with:
- All items from the provided price list
- Acronym mappings preserved as `shortName`
- Current prices as initial `shop_prices` entries
- Flask items marked as `pricingType: "static"`

---

## 7. Discord Bot Design

### 7.1 Bot Application Setup

**Required Steps:**
1. Create application at https://discord.com/developers/applications
2. Name: "TBC Guild Shop" (or similar)
3. Enable "Bot" and generate token
4. Required Intents: `GUILD_MESSAGES`, `GUILDS`, `MESSAGE_CONTENT`
5. Required Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`, `Add Reactions`
6. Invite URL will be generated with these permissions

### 7.2 Slash Commands

```
/shop prices [category]
  - Display all prices or filter by category
  - Options: protection, melee, caster, concoction, flask, all (default)
  - Returns embedded message with formatted prices

/shop order <item> <quantity>
  - Place an order for consumables
  - Validates item exists and quantity is reasonable
  - Creates order record and notifies admins

/shop orders
  - View your pending orders

/shop status
  - Show last scan time, discount %, and shop status

/shop admin items
  - (Admin) List all items with management options

/shop admin prices
  - (Admin) View/update prices manually

/shop admin orders
  - (Admin) View and manage all orders

/shop admin settings
  - (Admin) Configure discount %, notifications, etc.

/shop admin admins
  - (Admin) Manage admin access

/shop help
  - Show command help
```

### 7.3 Interactive Components

**Price Display Embed:**
```
╔══════════════════════════════════════════╗
║   🧪 TBC Guild Alchemy Shop              ║
║   Prices updated: Jan 16, 2026 3:45 PM   ║
║   Discount: 10% off AH prices            ║
╠══════════════════════════════════════════╣
║                                          ║
║   🛡️ PROTECTION                          ║
║   ─────────────────────────              ║
║   GFPP (Fire)        1g 75s              ║
║   GAPP (Arcane)      1g 05s              ║
║   GNPP (Nature)      2g 10s              ║
║   ...                                    ║
║                                          ║
║   ⚔️ MELEE                               ║
║   ─────────────────────────              ║
║   Mongoose           1g 10s              ║
║   Giants             45s                 ║
║   ...                                    ║
║                                          ║
╚══════════════════════════════════════════╝
[Protection] [Melee] [Caster] [Flasks] [Order]
```

**Category Buttons:**
- Clicking a category button shows only that category
- "Order" button opens order modal

**Order Modal:**
```
┌────────────────────────────────────┐
│  Place Order                       │
├────────────────────────────────────┤
│  Item: [Dropdown - searchable]     │
│  Quantity: [Number input]          │
│  Character: [Text input]           │
│  Notes: [Text area]                │
│                                    │
│  [Cancel]           [Place Order]  │
└────────────────────────────────────┘
```

### 7.4 Notifications

The bot will post to `#alchemy` channel when:
- Prices are updated (scan uploaded)
- Global discount changes
- New items added

Example notification:
```
📊 **Price Update**
Scanned by @Ryan at Jan 16, 2026 3:45 PM

**Changes detected:**
• Mongoose: 1g 10s → 1g 25s (+15s)
• GFPP: 1g 75s → 1g 60s (-15s)

Use `/shop prices` to see all current prices.
```

### 7.5 File Structure

```
/home/opc/guild-shop-bot/
├── package.json
├── .env
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   ├── commands/
│   │   ├── index.ts          # Command registry
│   │   ├── prices.ts         # /shop prices
│   │   ├── order.ts          # /shop order
│   │   ├── orders.ts         # /shop orders
│   │   ├── status.ts         # /shop status
│   │   ├── help.ts           # /shop help
│   │   └── admin/
│   │       ├── items.ts
│   │       ├── prices.ts
│   │       ├── orders.ts
│   │       ├── settings.ts
│   │       └── admins.ts
│   ├── components/
│   │   ├── buttons.ts        # Button handlers
│   │   ├── modals.ts         # Modal handlers
│   │   └── embeds.ts         # Embed builders
│   ├── api/
│   │   └── client.ts         # TBC Website API client
│   └── utils/
│       ├── permissions.ts    # Admin permission checks
│       └── formatting.ts     # Gold/silver/copper formatting
└── ecosystem.config.js       # PM2 config
```

---

## 8. Web Interface Design

### 8.1 New Routes

```
/shop                    - Public price display
/shop/admin              - Admin dashboard (requires auth)
/shop/admin/items        - Item management
/shop/admin/prices       - Price management
/shop/admin/orders       - Order management
/shop/admin/settings     - Global settings
/shop/admin/admins       - Admin management
/shop/admin/api-keys     - API key management
```

### 8.2 API Endpoints

```
GET  /api/shop/items              - List all items
POST /api/shop/items              - Create item (admin)
PUT  /api/shop/items/:id          - Update item (admin)
DEL  /api/shop/items/:id          - Delete item (admin)

GET  /api/shop/prices             - Get all current prices
POST /api/shop/prices             - Upload scan data (API key auth)
PUT  /api/shop/prices/:itemId     - Manual price update (admin)

GET  /api/shop/orders             - List orders (admin or own)
POST /api/shop/orders             - Create order
PUT  /api/shop/orders/:id         - Update order status (admin)

GET  /api/shop/settings           - Get settings
PUT  /api/shop/settings           - Update settings (admin)

GET  /api/shop/admins             - List admins (admin)
POST /api/shop/admins             - Add admin (admin)
DEL  /api/shop/admins/:discordId  - Remove admin (admin)

POST /api/shop/api-keys           - Generate API key (admin)
DEL  /api/shop/api-keys/:keyHash  - Revoke API key (admin)
```

### 8.3 Admin Dashboard Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  TBC Guild Shop Admin                                    [Ryan] [Logout]        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Items  │ │ Prices  │ │ Orders  │ │Settings │ │ Admins  │ │API Keys │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  📊 Dashboard Overview                                                     ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ║ │
│  ║  │   32 Items   │  │ Last Scan:   │  │  5 Pending   │  │   10%        │  ║ │
│  ║  │   Active     │  │ 2 hours ago  │  │   Orders     │  │  Discount    │  ║ │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  ║ │
│  ║                                                                           ║ │
│  ║  Recent Activity                                                          ║ │
│  ║  ─────────────────────────────────────────────────────────────────────   ║ │
│  ║  • Price scan uploaded by Ryan (3:45 PM)                                  ║ │
│  ║  • Order #1234 fulfilled by Stormshadow (2:30 PM)                         ║ │
│  ║  • New item added: Emerald Mongoose (1:15 PM)                             ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Items Management Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Items Management                                              [+ Add Item]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Filter: [All Categories ▼]  Search: [________________]                         │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Icon │ Name                  │ Short │ Category   │ Type    │ Price     │ │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │ 🧪  │ Greater Fire Prot.    │ GFPP  │ Protection │ Dynamic │ 1g 75s   │✎│ │
│  │ 🧪  │ Greater Arcane Prot.  │ GAPP  │ Protection │ Dynamic │ 1g 05s   │✎│ │
│  │ 🧪  │ Elixir of Mongoose    │ Mong. │ Melee      │ Dynamic │ 1g 10s   │✎│ │
│  │ ⚗️  │ Flask of the Titans   │ Titan │ Flask      │ Static  │ 30g 00s  │✎│ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Showing 1-10 of 32 items                              [< Prev] [1] [2] [Next >]│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.5 Settings Page Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Shop Settings                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  Pricing                                                                   ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  Discount Percentage:  [ 10 ]%                                            ║ │
│  ║                                                                           ║ │
│  ║  Formula: Shop Price = AH Price × (1 - Discount%)                         ║ │
│  ║  Example: 2g AH price × 0.90 = 1g 80s shop price                          ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  Discord Integration                                                       ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  Announcement Channel: [#alchemy ▼]                                       ║ │
│  ║                                                                           ║ │
│  ║  ☑ Enable price update notifications                                      ║ │
│  ║  ☑ Enable order notifications                                             ║ │
│  ║  ☐ Enable low stock alerts (future)                                       ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  Orders                                                                    ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  ☑ Enable order placement                                                 ║ │
│  ║  Max items per order: [ 50 ]                                              ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                                                                 │
│                                                      [Cancel]  [Save Settings] │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. AUX Addon Modification

### 9.1 Approach

We will create a **separate companion addon** that integrates with aux-addon rather than modifying aux directly. This ensures:
- Compatibility with future aux updates
- Easy distribution as a standalone ZIP
- No risk of breaking existing aux functionality

**Addon Name:** `GuildShopScanner`

### 9.2 Addon Structure

```
Interface/AddOns/GuildShopScanner/
├── GuildShopScanner.toc
├── GuildShopScanner.lua
├── items.lua              # Item list to scan
├── ui.lua                 # Button/frame code
└── README.txt             # Instructions for users
```

### 9.3 TOC File

```lua
## Interface: 11200
## Title: Guild Shop Scanner
## Notes: Scans AH for TBC guild consume prices
## Author: TBC Guild
## Dependencies: aux-addon
## SavedVariables: GuildShopData

GuildShopScanner.lua
items.lua
ui.lua
```

### 9.4 Core Logic

```lua
-- GuildShopScanner.lua (simplified overview)

GuildShopScanner = {}
GuildShopData = {}  -- SavedVariables

-- Item list (loaded from items.lua)
local GUILD_ITEMS = {
  -- Protection
  { id = 13457, name = "Greater Fire Protection Potion", short = "GFPP" },
  { id = 13461, name = "Greater Arcane Protection Potion", short = "GAPP" },
  -- ... all items from catalog
}

-- Hook into AUX scan completion
function GuildShopScanner:OnScanComplete(results)
  local priceData = {}
  local timestamp = time()

  for _, item in ipairs(GUILD_ITEMS) do
    local value = aux.core.history.value(item.id .. ":0:0")
    if value then
      priceData[item.id] = {
        name = item.name,
        short = item.short,
        price = value,  -- in copper
        timestamp = timestamp
      }
    end
  end

  -- Store in SavedVariables
  GuildShopData.lastScan = priceData
  GuildShopData.lastScanTime = timestamp
  GuildShopData.scannedBy = UnitName("player")

  print("|cff00ff00[Guild Shop]|r Scan complete! " ..
        table.getn(priceData) .. " items priced.")
  print("|cff00ff00[Guild Shop]|r Data saved. Please /reload or logout to save.")
end

-- Create scan button (added to AUX frame)
function GuildShopScanner:CreateButton()
  -- Button positioned on AUX search tab
  -- Clicking triggers a batch search of all guild items
end
```

### 9.5 Scanning Process

The addon will:
1. Add a "Guild Shop Scan" button to the AUX interface
2. When clicked, initiate a search for each guild item (using aux's search)
3. Collect the `daily_min_buyout` values from aux's history
4. Store results in `GuildShopData` SavedVariables
5. On logout/reload, data persists to `GuildShopScanner.lua`

### 9.6 Distribution Package

```
GuildShopScanner_v1.0.zip
├── GuildShopScanner/
│   ├── GuildShopScanner.toc
│   ├── GuildShopScanner.lua
│   ├── items.lua
│   ├── ui.lua
│   └── README.txt
└── INSTALL.txt
```

**INSTALL.txt:**
```
TBC Guild Shop Scanner - Installation Guide
============================================

1. Extract the GuildShopScanner folder to:
   C:\turtlewow\Interface\AddOns\

2. Your folder structure should look like:
   C:\turtlewow\Interface\AddOns\GuildShopScanner\GuildShopScanner.toc

3. Restart WoW (or /reload if already in-game)

4. The addon requires aux-addon to be installed and enabled.

5. At the Auction House, you'll see a "Guild Shop Scan" button
   in the AUX interface. Click it to scan all guild items.

6. After scanning, logout or /reload to save the data.

7. Run the Guild Shop Uploader on your PC to send prices
   to the TBC Guild website.

Questions? Contact the guild officers on Discord.
```

---

## 10. SavedVariables Parser

### 10.1 SavedVariables File Location

```
C:\turtlewow\WTF\Account\<ACCOUNTNAME>\SavedVariables\GuildShopScanner.lua
```

### 10.2 SavedVariables Format

```lua
GuildShopData = {
  ["lastScan"] = {
    [13457] = {
      ["name"] = "Greater Fire Protection Potion",
      ["short"] = "GFPP",
      ["price"] = 17500,  -- 1g 75s in copper
      ["timestamp"] = 1737052800,
    },
    [13461] = {
      ["name"] = "Greater Arcane Protection Potion",
      ["short"] = "GAPP",
      ["price"] = 10500,  -- 1g 05s in copper
      ["timestamp"] = 1737052800,
    },
    -- ... more items
  },
  ["lastScanTime"] = 1737052800,
  ["scannedBy"] = "Stormshadow",
}
```

### 10.3 Parser Options

**Option A: PowerShell Script (Recommended for Windows)**

```powershell
# GuildShopUploader.ps1

$config = @{
    WoWPath = "C:\turtlewow"
    ApiUrl = "https://tbcguild.duckdns.org/api/shop/prices"
    ApiKey = "YOUR_API_KEY_HERE"
}

# Watch for file changes
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "$($config.WoWPath)\WTF\Account"
$watcher.Filter = "GuildShopScanner.lua"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Parse Lua table (simplified - real implementation more robust)
function Parse-LuaTable {
    param([string]$Content)
    # Convert Lua table syntax to PowerShell
    # ... parsing logic
}

# Upload to API
function Upload-Prices {
    param([hashtable]$PriceData)

    $body = @{
        prices = $PriceData
        scannedBy = $PriceData.scannedBy
        timestamp = $PriceData.lastScanTime
    } | ConvertTo-Json -Depth 10

    $headers = @{
        "Authorization" = "Bearer $($config.ApiKey)"
        "Content-Type" = "application/json"
    }

    Invoke-RestMethod -Uri $config.ApiUrl -Method Post -Body $body -Headers $headers
}

# Event handler
Register-ObjectEvent $watcher Changed -Action {
    Write-Host "Detected GuildShopScanner.lua change..."
    Start-Sleep -Seconds 2  # Wait for file write to complete

    $content = Get-Content $Event.SourceEventArgs.FullPath -Raw
    $priceData = Parse-LuaTable -Content $content

    if ($priceData.lastScan) {
        Upload-Prices -PriceData $priceData
        Write-Host "Prices uploaded successfully!"
    }
}

Write-Host "Guild Shop Uploader running. Press Ctrl+C to stop."
while ($true) { Start-Sleep -Seconds 1 }
```

**Option B: Node.js Script**

```javascript
// guild-shop-uploader.js

const fs = require('fs');
const path = require('path');
const https = require('https');
const luaparse = require('luaparse');

const CONFIG = {
  wowPath: 'C:\\turtlewow',
  apiUrl: 'https://tbcguild.duckdns.org/api/shop/prices',
  apiKey: 'YOUR_API_KEY_HERE'
};

function parseLuaFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Use luaparse or custom regex to extract data
  // ... parsing logic
}

function uploadPrices(priceData) {
  // POST to API
}

// Watch for file changes
const svPath = path.join(CONFIG.wowPath, 'WTF', 'Account');
fs.watch(svPath, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('GuildShopScanner.lua')) {
    console.log('Detected change, uploading prices...');
    const data = parseLuaFile(path.join(svPath, filename));
    uploadPrices(data);
  }
});

console.log('Guild Shop Uploader running...');
```

### 10.4 Manual Upload Option

For users who don't want automatic upload:
1. Run `/reload` or logout after scanning
2. Open the uploader tool manually
3. Click "Upload Now" button
4. Tool reads SavedVariables and uploads

### 10.5 Distribution

The parser will be distributed as:
- PowerShell script (`.ps1`) for simple use
- Or a compiled `.exe` for one-click operation
- Include in the addon ZIP or as separate download

---

## 11. Security & Authentication

### 11.1 API Key Authentication

For the SV Parser to upload prices:
1. Admin generates an API key from web interface
2. Key is stored hashed in database
3. Parser includes key in `Authorization: Bearer <key>` header
4. API validates key and logs usage

### 11.2 Discord OAuth for Web Admin

Existing Discord OAuth flow is used:
1. User logs in via Discord
2. System verifies guild membership
3. Admin status checked against `shop_admins` table
4. Session cookie issued

### 11.3 Discord Bot Permissions

Admin commands in Discord check:
1. User is in the guild
2. User's Discord ID is in `shop_admins`
3. User has required permission for the action

### 11.4 Rate Limiting

- Price uploads: Max 1 per minute per API key
- API endpoints: Standard rate limiting
- Discord commands: Discord's built-in rate limits

---

## 12. Deployment Plan

### 12.1 Phase 1: Database & API (Day 1)

1. Create database schema in Deno KV
2. Implement API endpoints
3. Seed initial item catalog
4. Test API with curl/Postman

### 12.2 Phase 2: Web Interface (Day 2)

1. Create public shop page
2. Create admin dashboard
3. Implement all admin pages
4. Test with existing Discord auth

### 12.3 Phase 3: Discord Bot (Day 3)

1. Create Discord application
2. Implement bot with slash commands
3. Add interactive components
4. Deploy with PM2
5. Create systemd service

### 12.4 Phase 4: AUX Addon (Day 4)

1. Create GuildShopScanner addon
2. Test scanning functionality
3. Package as ZIP
4. Write documentation

### 12.5 Phase 5: SV Parser (Day 5)

1. Create PowerShell/Node parser
2. Test file watching
3. Test API upload
4. Package for distribution

### 12.6 Phase 6: Integration Testing (Day 6)

1. End-to-end test: Scan → Upload → Display
2. Test Discord commands
3. Test order flow
4. Fix any issues

### 12.7 Phase 7: Documentation & Rollout (Day 7)

1. Create user documentation
2. Create status report
3. Update INDEX.md
4. Roll out to guild

---

## 13. Open Questions

### 13.1 Questions for User - ALL ANSWERED ✅

1. **Discord Bot Name**: ✅ **"Consumes Bot"**

2. **Flask Static Prices**: ✅ **ANSWERED**
   - Flask of Titans: **30g**
   - Flask of Distilled Wisdom: **20g**
   - Flask of Supreme Power: **20g**
   - Flask of Chromatic Resistance: **20g**

3. **Alchemy Channel ID**: ✅ **`1371230469919608882`**

4. **Your Discord ID**: ✅ **`387885041348247552`** (Initial admin)

5. **API Key Distribution**: ✅ **Self-service via web interface** (Admin generates from GUI, distributes to alchemists)

6. **Order Notifications**: ✅ **Configurable via admin GUI** - Both options available:
   - Post to #alchemy channel (toggleable)
   - DM the admins (toggleable)

7. **Turtle WoW Custom Items**: ✅ **Use existing TBC Guild item lookup API**
   - Reference: `/routes/api/items/lookup.ts`
   - Connects to Turtle WoW Database (https://database.turtlecraft.gg)
   - Self-healing with local cache

### 13.2 Technical Decisions Pending

1. **Bot Framework**: discord.js v14 (recommended) or Deno Discord library?

2. **Parser Language**: PowerShell (simpler for Windows) or Node.js (cross-platform)?

3. **Addon Distribution**: Discord download link or hosted on website?

---

## Approval Checklist

Before proceeding to implementation, please confirm:

- [ ] Architecture diagram is understood and approved
- [ ] Database schema meets requirements
- [ ] Discord bot commands are complete
- [ ] Web interface mockups are acceptable
- [ ] AUX addon approach is approved
- [ ] Open questions are answered
- [ ] Deployment timeline is acceptable

---

**Document Status:** DRAFT - Awaiting User Review

**Next Steps:**
1. User reviews this document
2. User answers open questions
3. User approves design
4. Implementation begins

---


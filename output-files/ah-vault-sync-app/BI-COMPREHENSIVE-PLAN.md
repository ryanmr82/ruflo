# Comprehensive Business Intelligence Plan: Guild Consumables Management

## Executive Summary

This document presents a fully-baked BI system for Thralls Book Club's consumables pipeline. It connects **what we have in stock** (guild vault + bank alts) with **what we sell** (consumes shop orders), **what we need to craft** (recipe system), and **what we should price things at** (supply-driven dynamic pricing). The goal: eliminate waste, prevent shortages, and let supply/demand drive pricing automatically.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [System Gaps & Pain Points](#2-system-gaps--pain-points)
3. [Proposed BI Architecture](#3-proposed-bi-architecture)
4. [Entity Relationship Diagram (ERD)](#4-entity-relationship-diagram-erd)
5. [Feature 1: Stock Intelligence Dashboard](#5-feature-1-stock-intelligence-dashboard)
6. [Feature 2: Supply-Based Dynamic Pricing](#6-feature-2-supply-based-dynamic-pricing)
7. [Feature 3: Recipe-Aware Crafting Queue](#7-feature-3-recipe-aware-crafting-queue)
8. [Feature 4: Low Stock Alerts & Restock Triggers](#8-feature-4-low-stock-alerts--restock-triggers)
9. [Feature 5: Material Demand Forecasting](#9-feature-5-material-demand-forecasting)
10. [Feature 6: Admin Pricing Control Panel](#10-feature-6-admin-pricing-control-panel)
11. [Page Design Decisions](#11-page-design-decisions)
12. [Frontend Mockups](#12-frontend-mockups)
13. [Database Schema Changes](#13-database-schema-changes)
14. [API Changes](#14-api-changes)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Ideas Beyond The Brief](#16-ideas-beyond-the-brief)

---

## 1. Current State Analysis

### What Exists Today

| System | Location | Data |
|--------|----------|------|
| **Guild Vault** | `["guild-bank", "inventory"]` | 163 unique items, 5633 total stacks across 5 tabs |
| **Bank Alts** | `["bank-alts", <account>]` | 2 accounts (TBCGUILD: 9 chars, WORLDOFNERDS: 7 chars) |
| **Combined View** | `/api/guild-storage/combined` | Computed at read time, merges both sources |
| **Consumes Shop** | `/api/consumes/prices` | 84 items, 8 categories, flat 10% discount |
| **Recipe System** | `utils/recipes.ts` | 55 recipes with full reagent data |
| **Orders** | `["consumes", "orders"]` | Full order lifecycle with Discord integration |
| **Material Sales** | `["materials", "sales", <id>]` | Herbalist sell-to-guild system |
| **Herb Catalog** | `utils/herb-data.ts` | 74 materials across 7 categories |
| **Analytics** | `/api/consumes/analytics` | Basic order history and P&L views |

### Current Pricing Model

```
shopPrice = floor(ahPrice * (1 - discountPercent / 100))
```

- **discountPercent**: Global, currently 10% for all items
- **Static overrides**: Admin can pin individual items to fixed prices
- **Flask defaults**: Titans 30g, Wisdom/Supreme Power/Chromatic 20g
- **No per-item discount rates**
- **No supply awareness** in pricing

### What's Connected vs Disconnected

```
CONNECTED:                          DISCONNECTED:
Shop ←→ AH Prices                  Shop ←✕→ Guild Vault Inventory
Shop ←→ Recipes                    Shop ←✕→ Bank Alt Inventory
Shop ←→ Orders                     Vault ←✕→ Recipe Requirements
Shop ←→ Discord                    Orders ←✕→ Stock Levels
Material Sales ←→ Herb Prices      Pricing ←✕→ Supply Levels
                                   Low Stock ←✕→ Restock Actions
```

**The fundamental gap: The guild bank pages and the consumes shop are two completely separate systems with zero data flow between them.**

---

## 2. System Gaps & Pain Points

### Gap 1: No Stock-to-Demand Matching
The shop sells 84 items. The guild vault and bank alts hold hundreds of items. Nobody knows which shop items are actually in stock without manually cross-referencing two separate pages.

### Gap 2: Flat Pricing Ignores Supply
A 10% discount on everything means oversupplied items (we have 200 Greater Fire Protection Potions) get the same price treatment as scarce items (we have 3 Elixirs of the Mongoose). This doesn't discourage farming what we already have plenty of.

### Gap 3: No Crafting Intelligence
When an order comes in for items we don't have in stock, nobody knows what materials are needed to craft them. The recipe data exists in code but isn't surfaced to crafters or admins.

### Gap 4: No Low Stock Visibility
There's a `consumes/admin_restock` KV key and `consumes/restock_acknowledged` key, but these are manual admin-managed lists. Nothing automatically detects when stock drops below a threshold.

### Gap 5: Material Sales Disconnected from Need
Herbalists sell materials to the guild, but the material sales system doesn't know what materials are actually needed. Herbalists can't see "we need 30 Dreamfoil for pending orders" to prioritize their farming.

### Gap 6: No Historical Stock Tracking
Guild bank scans overwrite the previous snapshot. There's no trend data showing "we've been burning through Mongoose elixirs at 20/week and our stock is declining."

### Gap 7: Wildvine Not Trackable
Wildvine (itemId 8153) is used in Emerald Mongoose recipes (6 per craft) but isn't in the HERB_CATALOG. Herbalists can't sell it through the material sales system.

### Gap 8: Crafted Intermediaries Blind Spot
Shadow Oil, Blackmouth Oil, Fire Oil, and Stonescale Oil are used as reagents but have no sub-recipes in the system. The true herb cost of items using these oils can't be calculated.

---

## 3. Proposed BI Architecture

### Core Concept: The Stock Intelligence Layer

A new computation layer sits between the existing systems, connecting them:

```
                    ┌──────────────────────────────┐
                    │   STOCK INTELLIGENCE ENGINE   │
                    │                              │
  Guild Vault ────►│  Match inventory items to    │
  Bank Alts ──────►│  shop catalog by itemId      │◄──── ITEM_CATALOG
                    │                              │
  Order History ──►│  Calculate consumption rates  │◄──── RECIPES
                    │  and stock depletion ETA     │
                    │                              │
  Material Sales ─►│  Determine crafting needs    │◄──── HERB_CATALOG
                    │  and material gaps           │
                    │                              │
                    │  Set dynamic per-item        │
                    │  discount rates based on     │──── Per-Item Pricing
                    │  supply levels               │
                    └──────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Stock Dashboard  Dynamic Pricing  Crafting Queue
        (new section on  (enhanced shop)  (enhanced queue)
         guild-bank page)
```

### New KV Keys Required

| Key | Purpose |
|-----|---------|
| `["consumes", "itemDiscounts"]` | Per-item discount percentages (0-50%) |
| `["consumes", "stockThresholds"]` | Per-item low/critical stock thresholds |
| `["consumes", "stockSnapshots", <date>]` | Daily stock level snapshots for trend tracking |
| `["consumes", "consumptionRates"]` | Computed consumption rates per item (rolling 30-day) |

---

## 4. Entity Relationship Diagram (ERD)

### Current State ERD (Consumes-Related Only)

```
╔════════════════════════════════════════════════════════════════════════╗
║                    CURRENT STATE: DISCONNECTED ISLANDS                ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  GUILD STORAGE (DB A)              CONSUMES SHOP (DB A)              ║
║  ┌─────────────────┐               ┌──────────────────┐             ║
║  │ guild-bank/     │               │ consumes/config  │             ║
║  │ inventory       │               │ {discountPercent}│             ║
║  │                 │               └────────┬─────────┘             ║
║  │ .tabs[].items[] │                        │ applies to            ║
║  │   .name         │     NO LINK    ┌───────▼─────────┐             ║
║  │   .count        │ ◄──── ✕ ────► │ ITEM_CATALOG    │             ║
║  │   .quality      │               │ (84 items,      │             ║
║  │   .itemId       │               │  8 categories)  │             ║
║  └─────────────────┘               │                  │             ║
║                                     │ .id             │             ║
║  ┌─────────────────┐               │ .name           │             ║
║  │ bank-alts/      │               │ .itemId    ─────── match key  ║
║  │ {account}       │               │ .category       │             ║
║  │                 │     NO LINK    └───────┬─────────┘             ║
║  │ .characters[]   │ ◄──── ✕ ────►         │ keyed by              ║
║  │  .bags[].name   │               ┌───────▼─────────┐             ║
║  │  .bags[].count  │               │ RECIPES         │             ║
║  │  .bags[].itemId │               │ (55 recipes)    │             ║
║  │  .bank[].name   │               │                 │             ║
║  │  .bank[].itemId │               │ .reagents[]     │             ║
║  └─────────────────┘               │   .itemId       │             ║
║                                     │   .name         │             ║
║  ┌─────────────────┐               │   .quantity     │             ║
║  │ consumes/       │               │   .type (herb/  │             ║
║  │ orders          │               │    vendor/drop) │             ║
║  │                 │               └─────────────────┘             ║
║  │ .items[]        │                                                ║
║  │   .itemId       │     NO LINK TO STOCK                          ║
║  │   .quantity     │ ◄──── ✕ ────► (can't check if in stock)      ║
║  └─────────────────┘                                                ║
║                                                                      ║
║  ┌─────────────────┐               ┌──────────────────┐             ║
║  │ consumes/       │               │ consumes/        │             ║
║  │ staticPrices    │               │ prices           │             ║
║  │ (per-item       │               │ (AH price cache) │             ║
║  │  overrides)     │               └──────────────────┘             ║
║  └─────────────────┘                                                ║
║                                                                      ║
║  ┌─────────────────┐               ┌──────────────────┐             ║
║  │ materials/      │  NO LINK TO   │ HERB_CATALOG     │             ║
║  │ sales/{id}      │  RECIPE NEEDS │ (74 materials)   │             ║
║  │ (herb sales)    │ ◄──── ✕ ────► │                  │             ║
║  └─────────────────┘               └──────────────────┘             ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════════╝
```

### Proposed State ERD (With BI Layer)

```
╔════════════════════════════════════════════════════════════════════════╗
║                    PROPOSED STATE: CONNECTED BI LAYER                 ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  GUILD STORAGE (existing)          STOCK INTELLIGENCE (NEW)          ║
║  ┌─────────────────┐               ┌──────────────────┐             ║
║  │ guild-bank/     │──── itemId ──►│ STOCK MATCHER    │             ║
║  │ inventory       │               │                  │             ║
║  │ .tabs[].items[] │               │ Joins inventory  │             ║
║  │   .itemId  ─────────────────────│ items to catalog │             ║
║  └─────────────────┘               │ items by itemId  │             ║
║                                     │                  │             ║
║  ┌─────────────────┐               │ Produces:        │             ║
║  │ bank-alts/      │──── itemId ──►│ - inStock count  │             ║
║  │ {account}       │               │ - stockLevel     │             ║
║  │ .characters[]   │               │   (critical/low/ │             ║
║  │  .bags/bank[]   │               │    adequate/     │             ║
║  │  .itemId ───────────────────────│    surplus)      │             ║
║  └─────────────────┘               │ - locations[]    │             ║
║                                     └───────┬──────────┘             ║
║                                             │ feeds                  ║
║  CONSUMES SHOP (existing)          ┌────────▼─────────┐             ║
║  ┌─────────────────┐               │ DYNAMIC PRICING  │             ║
║  │ ITEM_CATALOG    │──── maps ────►│ ENGINE (NEW)     │             ║
║  │ (84 items)      │               │                  │             ║
║  │ .id, .itemId    │               │ Per-item rates:  │             ║
║  └────────┬────────┘               │ Surplus → 25-30% │             ║
║           │                        │ Adequate → 10-15%│             ║
║  ┌────────▼────────┐               │ Low → 5%         │             ║
║  │ RECIPES         │               │ Critical → 0%    │             ║
║  │ (55 recipes)    │               │ Out of stock → 0%│             ║
║  │ .reagents[]     │──── feeds ───►│                  │             ║
║  └─────────────────┘               └───────┬──────────┘             ║
║                                             │ stores                 ║
║  ┌─────────────────┐   NEW         ┌───────▼──────────┐             ║
║  │ consumes/orders │               │ consumes/        │             ║
║  │ (order history) │──── rates ───►│ itemDiscounts    │ NEW KV KEY  ║
║  │                 │  consumption  │ {itemId: rate}   │             ║
║  └─────────────────┘               └──────────────────┘             ║
║                                                                      ║
║  ┌─────────────────┐   NEW         ┌──────────────────┐             ║
║  │ consumes/       │               │ consumes/        │             ║
║  │ stockThresholds │ NEW KV KEY    │ stockSnapshots/  │ NEW KV KEY  ║
║  │ {itemId:        │               │ {date}           │             ║
║  │  {low, critical}│               │ (daily levels)   │             ║
║  └─────────────────┘               └──────────────────┘             ║
║                                                                      ║
║  ┌─────────────────┐   ENHANCED    ┌──────────────────┐             ║
║  │ materials/      │               │ CRAFTING QUEUE   │             ║
║  │ sales/{id}      │◄── shows ─────│ (NEW UI)         │             ║
║  │ (herb sales)    │   what herbs  │ Shows what needs  │             ║
║  └─────────────────┘   are needed  │ crafting + mats   │             ║
║                                     └──────────────────┘             ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

## 5. Feature 1: Stock Intelligence Dashboard

### What It Does
Matches every item in ITEM_CATALOG against current guild vault + bank alt inventory by `itemId`. Shows at a glance: what's in stock, what's running low, what's out of stock, and where everything is located.

### Stock Level Classification

| Level | Condition | Color | Meaning |
|-------|-----------|-------|---------|
| **Surplus** | Stock > 2x threshold | `#22c55e` (green) | We have plenty, increase discount to move inventory |
| **Adequate** | Stock >= threshold | `#3b82f6` (blue) | Normal levels, standard pricing |
| **Low** | Stock < threshold but > 0 | `#f59e0b` (amber) | Running low, reduce discount to preserve stock |
| **Critical** | Stock <= critical threshold | `#ef4444` (red) | Almost out, remove discount entirely |
| **Out of Stock** | Stock = 0 | `#6b7280` (gray) | Not available, show crafting requirements |

### Default Thresholds (Admin-Configurable Per Item)

| Category | Low Threshold | Critical Threshold | Rationale |
|----------|:---:|:---:|------|
| Protection Potions | 20 | 5 | High raid consumption (20+ per raid night) |
| Melee Elixirs | 15 | 5 | Moderate consumption |
| Caster Elixirs | 15 | 5 | Moderate consumption |
| Weapon Buffs | 10 | 3 | Lower consumption (30-min duration) |
| Food & Drink | 20 | 5 | High consumption |
| Concoctions | 10 | 3 | Turtle WoW specific, variable demand |
| Flasks | 5 | 2 | Expensive, lower volume |
| Tokens | 10 | 3 | Trade-in items |

### Data Flow

```
1. GET /api/guild-storage/combined
   → Returns all items with itemId across vault + bank alts

2. GET /api/consumes/prices
   → Returns ITEM_CATALOG with all 84 shop items

3. Client-side JOIN on itemId:
   For each catalog item:
     stock = combined.items.find(i => i.itemId === catalogItem.itemId)
     stockCount = stock ? stock.totalCount : 0
     stockLevel = classify(stockCount, thresholds[catalogItem.id])
```

---

## 6. Feature 2: Supply-Based Dynamic Pricing

### The Core Problem
A flat 10% discount means:
- **Oversupplied items** (200 GFPPs) sell at the same discount as everything else. Guildies don't need to farm them, but the pricing doesn't communicate that.
- **Scarce items** (3 Mongooses) sell at the same discount. The guild loses money on items it desperately needs.

### Proposed Pricing Formula

```
effectiveDiscount = getItemDiscount(itemId, stockLevel, adminOverride)
shopPrice = floor(ahPrice * (1 - effectiveDiscount / 100))
```

Where `getItemDiscount()` resolves in this priority:

1. **Admin per-item override** (if set in `consumes/itemDiscounts`): Use exact rate
2. **Supply-based automatic rate**: Based on stock level classification

### Automatic Discount Rate Table

| Stock Level | Suggested Discount | Effect |
|-------------|:---:|--------|
| **Surplus** (>2x threshold) | 25-30% | Deep discount to move excess inventory, discourage further farming |
| **Adequate** (>= threshold) | 10-15% | Standard guild discount |
| **Low** (< threshold) | 5% | Reduced discount to preserve stock |
| **Critical** (<= critical) | 0% | No discount - AH price, signaling urgency |
| **Out of Stock** | N/A | Cannot purchase, show "Out of Stock" badge |

### How This Discourages Oversupply Farming

When an item has surplus stock:
- **Buyback rate drops**: If we're buying materials from herbalists at 85% of AH and selling the finished product at 70% of AH (30% discount), the margin is negative
- **Visual indicator**: A "SURPLUS" badge on the item card signals "don't farm this"
- **Automatic adjustment**: As stock depletes from sales, the discount automatically decreases, signaling increased demand

### Admin Override Model

Admins can:
- Set per-item discount rates (0-50%) that override the automatic rate
- Lock items to a specific rate regardless of stock level
- Set items to "auto" mode (the default) where stock level drives the rate
- Configure the threshold values that define each stock level band

### KV Storage

```typescript
// ["consumes", "itemDiscounts"]
{
  "GFPP": { mode: "auto" },                     // Auto: stock-based rate
  "Mongoose": { mode: "fixed", rate: 8 },       // Fixed: always 8% off
  "Titans": { mode: "static", price: 300000 },  // Static: fixed copper price (existing)
  "LIP": { mode: "auto", surplusRate: 35 },     // Auto with custom surplus rate
}
```

---

## 7. Feature 3: Recipe-Aware Crafting Queue

### What It Does
When an order comes in for items that aren't in stock, the system shows crafters:
1. What items need to be crafted
2. What materials are needed (from recipes)
3. Which materials are already in the guild bank
4. Which materials need to be farmed/purchased

### Crafting Needs Calculation

```
For each pending/claimed order:
  For each item in order:
    shopItemStock = getStockCount(item.itemId)  // from guild storage
    deficit = max(0, item.quantity - shopItemStock)
    if deficit > 0:
      recipe = getRecipeById(item.shopId)
      if recipe:
        craftsNeeded = ceil(deficit / recipe.yields)
        for each reagent in recipe.reagents:
          totalNeeded += reagent.quantity * craftsNeeded
          inBank = getStockCount(reagent.itemId)  // check guild storage
          toBuy = max(0, totalNeeded - inBank)
```

### Material Categories in Queue View

| Category | Icon | Meaning |
|----------|------|---------|
| **In Bank** | checkmark | Material is in guild vault or bank alts |
| **Herb (Farmable)** | leaf | Can be farmed by herbalists |
| **Vendor** | coin | Buy from NPC vendor (Crystal Vial, etc.) |
| **Drop** | sword | Must be farmed from mobs |
| **Crafted** | anvil | Intermediate craft needed first |

### Addressing Crafted Intermediaries

The system currently doesn't have sub-recipes for Shadow Oil, Blackmouth Oil, Fire Oil, and Stonescale Oil. These should be added:

| Intermediate | Recipe |
|-------------|--------|
| Shadow Oil (3824) | 4x Fadeleaf + 4x Grave Moss + Leaded Vial |
| Blackmouth Oil (6370) | 2x Oily Blackmouth |
| Fire Oil (6371) | 2x Firefin Snapper |
| Stonescale Oil (13423) | 1x Stonescale Eel |

Adding these to the RECIPES object enables recursive cost calculation.

---

## 8. Feature 4: Low Stock Alerts & Restock Triggers

### Automatic Detection
The stock intelligence engine runs on every guild storage scan upload (PUT to either vault or bank-alts endpoint). After updating inventory, it:

1. Joins inventory against ITEM_CATALOG
2. Classifies stock levels for all 84 items
3. Compares against previous classification
4. If any item transitions to **Low** or **Critical**: fires a notification

### Notification Channels

| Trigger | Action |
|---------|--------|
| Item → Low | Yellow warning badge on Stock Dashboard |
| Item → Critical | Red alert badge + Discord notification to alchemy channel |
| Item → Out of Stock | Red "OOS" badge + Discord notification + auto-adds to restock list |
| Stock restored above Low | Clears alert badges automatically |

### Discord Alert Format

```
⚠️ LOW STOCK ALERT

The following items are running low in the guild bank:

🟡 LOW:
  • Elixir of the Mongoose — 8 remaining (threshold: 15)
  • Greater Arcane Elixir — 6 remaining (threshold: 15)

🔴 CRITICAL:
  • Flask of the Titans — 2 remaining (threshold: 5)

🔘 OUT OF STOCK:
  • Mageblood Potion — 0 remaining

Materials needed to restock (from pending orders):
  • 30x Dreamfoil
  • 20x Plaguebloom
  • 4x Black Lotus
```

### Daily Snapshot Storage

Each day, store a stock level snapshot for trend analysis:

```typescript
// ["consumes", "stockSnapshots", "2026-02-08"]
{
  date: "2026-02-08",
  items: {
    "GFPP": { stock: 45, level: "adequate" },
    "Mongoose": { stock: 8, level: "low" },
    // ... all 84 items
  }
}
```

This enables week-over-week trend charts showing stock depletion rates.

---

## 9. Feature 5: Material Demand Forecasting

### Consumption Rate Calculation

Based on order history over a rolling 30-day window:

```
For each shop item:
  completedOrders = orders.filter(o =>
    o.status === "completed" &&
    o.completedAt > (now - 30 days)
  )
  totalConsumed = sum(completedOrders.items[itemId].quantity)
  dailyRate = totalConsumed / 30
  weeklyRate = dailyRate * 7
  daysUntilOOS = currentStock / dailyRate  (if dailyRate > 0)
```

### Material Burn Rate

Using recipes, convert item consumption to material burn:

```
For each herb/material:
  weeklyBurn = 0
  for each recipe using this herb:
    weeklyBurn += (weeklyOrderRate[recipe.output] * reagent.quantity) / recipe.yields

  // Compare to material income
  weeklySupply = sum(material sales in last 30 days for this herb) / 4.3
  netRate = weeklySupply - weeklyBurn
```

### Forecasting Output

| Item | Stock | Weekly Burn | Days Until OOS | Status |
|------|:---:|:---:|:---:|--------|
| Mongoose | 8 | 12/week | 4.7 days | CRITICAL - needs restock |
| GFPP | 45 | 8/week | 39 days | Adequate |
| Titans | 3 | 2/week | 10.5 days | Low |
| Mageblood | 0 | 5/week | OOS | Out of stock |

### Herb Demand Summary

Shows herbalists what to prioritize:

| Herb | Weekly Demand | In Bank | Need | Priority |
|------|:---:|:---:|:---:|---------|
| Dreamfoil | 45 | 12 | 33 | HIGH |
| Mountain Silversage | 28 | 5 | 23 | HIGH |
| Plaguebloom | 22 | 30 | 0 | Low (surplus) |
| Gromsblood | 15 | 8 | 7 | Medium |

---

## 10. Feature 6: Admin Pricing Control Panel

### Enhanced Admin Interface

Replace the current single "discount %" input with a full pricing control panel:

#### Global Settings Section
- **Default discount rate**: The baseline for items in "auto" mode with adequate stock (current 10%)
- **Surplus rate**: Default rate for overstocked items (new, suggest 25%)
- **Low stock rate**: Default rate for low stock items (new, suggest 5%)
- **Critical rate**: Default rate for critical stock items (new, suggest 0%)

#### Per-Item Override Table

| Item | Stock | Level | Mode | Rate | AH Price | Shop Price |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| GFPP | 45 | Adequate | Auto | 10% | 2g 50s | 2g 25s |
| Mongoose | 8 | Low | Auto | 5% | 5g 00s | 4g 75s |
| Titans | 3 | Critical | Static | - | - | 30g 00s |
| LIP | 120 | Surplus | Auto | 25% | 3g 00s | 2g 25s |
| Mageblood | 0 | OOS | Auto | N/A | 4g 00s | N/A |

Admins can click any item to:
- Switch between Auto / Fixed / Static modes
- Set custom rates for any stock level
- Override thresholds for that specific item
- View stock history chart

---

## 11. Page Design Decisions

### Recommendation: Hybrid Approach

**Don't create a whole new page.** Instead:

1. **Enhance the Guild Bank page** (`/guild-bank`) with a new "Stock Intelligence" tab alongside the existing Combined/Vault/Alts tabs. This tab shows the dashboard matching inventory to shop items.

2. **Enhance the Consumes Shop** (`/consumes`) to show stock levels inline on item cards and use supply-based pricing. The admin panel gets expanded with the per-item pricing controls.

3. **New: Crafting Queue section** on the existing Queue page, showing material requirements for pending orders.

### Rationale
- Users already know where to find guild bank info and shop info
- Adding tabs to existing pages is less disruptive than a new top-level page
- Stock intelligence is a view over existing data, not a separate domain
- The admin pricing panel belongs with the existing admin controls in the shop

### Tab Structure Changes

**Guild Bank Page (Enhanced)**:
```
[ Combined View ] [ Guild Vault ] [ Bank Alts ] [ Stock Intelligence (NEW) ]
```

**Consumes Shop (Enhanced)**:
```
Item cards now show: stock count badge, stock level indicator, per-item discount rate
Admin panel: expanded with per-item pricing table
```

---

## 12. Frontend Mockups

### Mockup 1: Stock Intelligence Tab (Guild Bank Page)

```
┌──────────────────────────────────────────────────────────────────┐
│  Guild Bank                                                      │
│  [ Combined View ] [ Guild Vault ] [ Bank Alts ] [▶ Stock Intel ]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ STOCK OVERVIEW                          Last scan: 2h ago  │ │
│  │                                                             │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐│ │
│  │  │ 84      │ │ 52      │ │ 18      │ │  9      │ │  5   ││ │
│  │  │ Total   │ │ In Stock│ │ Low     │ │Critical │ │ OOS  ││ │
│  │  │ Items   │ │ ✓       │ │ ⚠       │ │ ◉       │ │ ✕    ││ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Filter: [All ▼] [Protection ▼] [Melee ▼] [Caster ▼] [Food ▼]  │
│  Show:   [All] [Low & Critical] [Out of Stock] [Surplus]         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Item                    │Stock│Level    │Rate │Shop   │Trend ││
│  ├─────────────────────────┼─────┼─────────┼─────┼───────┼──────┤│
│  │ 🔴 Elixir of Mongoose  │  8  │Critical │  0% │ 5g00s │ ↓↓   ││
│  │ 🔴 Flask of the Titans │  2  │Critical │  -  │30g00s │ ↓    ││
│  │ 🟡 Major Mana Potion   │ 11  │Low      │  5% │ 2g85s │ ↓    ││
│  │ 🟡 Greater Arcane Elix │  6  │Low      │  5% │ 3g33s │ ↓    ││
│  │ 🟡 Mageblood Potion    │ 12  │Low      │  5% │ 3g80s │ →    ││
│  │ 🔵 GFPP                │ 45  │Adequate │ 10% │ 2g25s │ →    ││
│  │ 🔵 GSPP                │ 38  │Adequate │ 10% │ 2g70s │ ↑    ││
│  │ 🟢 LIP                 │120  │Surplus  │ 25% │ 2g25s │ ↑    ││
│  │ 🟢 FAP                 │ 85  │Surplus  │ 25% │ 1g88s │ ↑    ││
│  │ ⬜ Mageblood Potion    │  0  │OOS      │ N/A │  --   │ --   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ OUT OF STOCK ITEMS — Materials Needed                        ││
│  │                                                              ││
│  │ Mageblood Potion (5 pending orders = 15 needed)              ││
│  │   Recipe: 1x Dreamfoil + 2x Plaguebloom + 1x Crystal Vial   ││
│  │   Need: 15x Dreamfoil (3 in bank ✓, 12 needed ⚠)            ││
│  │         30x Plaguebloom (30 in bank ✓)                       ││
│  │         15x Crystal Vial (vendor, ~15s each)                 ││
│  │                                                              ││
│  │ Elixir of the Mongoose (3 pending = 3 needed)                ││
│  │   Recipe: 2x Mountain Silversage + 2x Plaguebloom + Vial    ││
│  │   Need: 6x Mt Silversage (5 in bank ✓, 1 needed ⚠)          ││
│  │         6x Plaguebloom (30 in bank ✓)                        ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Mockup 2: Enhanced Item Card (Consumes Shop)

```
┌───────────────────────────────────────────┐
│  [Icon]  Elixir of the Mongoose           │
│          +25 Agi, +2% crit (60 min)       │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ 2x Mt Silversage │ 2x Plaguebloom  │  │
│  │ 1x Crystal Vial                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  AH: 5g 00s                               │
│  Shop: 4g 75s  (-5%)  [LOW STOCK]         │
│                  ▲           ▲             │
│         reduced rate    stock badge        │
│         (was 10%)       (amber)            │
│                                           │
│  In Stock: 8  📦  [Vault Tab 2: 5]        │
│                   [Bookkeeper (Bank): 3]   │
│                                           │
│  [ - ]  [ 1 ]  [ + ]    [ Add to Cart ]  │
└───────────────────────────────────────────┘
```

vs current card (no stock info, flat 10%):

```
┌───────────────────────────────────────────┐
│  [Icon]  Elixir of the Mongoose           │
│          +25 Agi, +2% crit (60 min)       │
│                                           │
│  AH: 5g 00s                               │
│  Shop: 4g 50s  (-10%)  [AH]              │
│                                           │
│  [ - ]  [ 1 ]  [ + ]    [ Add to Cart ]  │
└───────────────────────────────────────────┘
```

### Mockup 3: Admin Pricing Panel (Enhanced)

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️ ADMIN: Pricing Configuration                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GLOBAL RATE TIERS                                               │
│  ┌───────────────┬──────────────────────────┐                    │
│  │ Surplus Rate   │  [25] %  (stock > 2x)   │                    │
│  │ Adequate Rate  │  [10] %  (normal)        │                    │
│  │ Low Stock Rate │  [ 5] %  (below thresh)  │                    │
│  │ Critical Rate  │  [ 0] %  (near zero)     │                    │
│  └───────────────┴──────────────────────────┘                    │
│                                              [ Save Global ]     │
│                                                                  │
│  PER-ITEM OVERRIDES           Search: [____________] 🔍          │
│  ┌──────────────┬───────┬────────┬──────┬────────┬──────────────┐│
│  │ Item         │ Stock │ Level  │ Mode │ Rate   │ Shop Price   ││
│  ├──────────────┼───────┼────────┼──────┼────────┼──────────────┤│
│  │ GFPP         │  45   │ Adeq.  │[Auto▼]│ 10%  │ 2g 25s      ││
│  │ Mongoose     │   8   │ Low    │[Auto▼]│  5%  │ 4g 75s      ││
│  │ LIP          │ 120   │ Surplus│[Fixed▼]│[12]% │ 2g 64s      ││
│  │ Titans       │   2   │ Crit.  │[Static▼]│    │ [30g 00s]   ││
│  │ Mageblood    │   0   │ OOS    │[Auto▼]│ N/A  │ --          ││
│  └──────────────┴───────┴────────┴──────┴────────┴──────────────┘│
│                                                                  │
│  STOCK THRESHOLDS                                                │
│  ┌──────────────┬──────────┬──────────────┐                      │
│  │ Category     │ Low Thr. │ Critical Thr.│                      │
│  ├──────────────┼──────────┼──────────────┤                      │
│  │ Protection   │   [20]   │     [ 5]     │                      │
│  │ Melee        │   [15]   │     [ 5]     │                      │
│  │ Caster       │   [15]   │     [ 5]     │                      │
│  │ Weapon Buffs │   [10]   │     [ 3]     │                      │
│  │ Food & Drink │   [20]   │     [ 5]     │                      │
│  │ Concoctions  │   [10]   │     [ 3]     │                      │
│  │ Flasks       │   [ 5]   │     [ 2]     │                      │
│  │ Tokens       │   [10]   │     [ 3]     │                      │
│  └──────────────┴──────────┴──────────────┘                      │
│                              [ Save Thresholds ]                 │
└──────────────────────────────────────────────────────────────────┘
```

### Mockup 4: Herb Demand Board (Material Sales Page Enhancement)

```
┌──────────────────────────────────────────────────────────────────┐
│  Sell Materials to Guild                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ 🌿 GUILD NEEDS — What to Farm                               ││
│  │                                                              ││
│  │ HIGH PRIORITY (used in critical/OOS items):                  ││
│  │  🔴 Dreamfoil ........... Need 33/week ... Bank has 12      ││
│  │  🔴 Mountain Silversage . Need 23/week ... Bank has 5       ││
│  │  🔴 Black Lotus ......... Need  4/week ... Bank has 1       ││
│  │                                                              ││
│  │ MEDIUM PRIORITY (used in low stock items):                   ││
│  │  🟡 Gromsblood .......... Need  7/week ... Bank has 8       ││
│  │  🟡 Icecap .............. Need 12/week ... Bank has 15      ││
│  │                                                              ││
│  │ LOW PRIORITY (surplus — farm other things instead):          ││
│  │  🟢 Plaguebloom ......... Surplus ........ Bank has 60      ││
│  │  🟢 Firebloom ........... Surplus ........ Bank has 45      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Continue to material submission form below...]                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 13. Database Schema Changes

### New KV Keys (Database A — Default Deno KV)

#### `["consumes", "itemDiscounts"]`
```typescript
Record<string, {
  mode: "auto" | "fixed" | "static";
  rate?: number;          // For "fixed" mode: exact discount %
  surplusRate?: number;   // For "auto" mode: override surplus rate
  adequateRate?: number;  // For "auto" mode: override adequate rate
  lowRate?: number;       // For "auto" mode: override low rate
  criticalRate?: number;  // For "auto" mode: override critical rate
  price?: number;         // For "static" mode: copper value
  updatedAt?: string;
  updatedBy?: string;
}>
```

#### `["consumes", "stockThresholds"]`
```typescript
{
  global: {
    surplusRate: number;     // Default: 25
    adequateRate: number;    // Default: 10
    lowRate: number;         // Default: 5
    criticalRate: number;    // Default: 0
  },
  categories: Record<string, {
    lowThreshold: number;
    criticalThreshold: number;
  }>,
  items: Record<string, {       // Per-item overrides
    lowThreshold?: number;
    criticalThreshold?: number;
  }>,
  updatedAt: string;
}
```

#### `["consumes", "stockSnapshots", <dateString>]`
```typescript
{
  date: string;               // "2026-02-08"
  capturedAt: string;         // ISO timestamp
  items: Record<string, {     // Keyed by shop item ID
    stock: number;
    level: "surplus" | "adequate" | "low" | "critical" | "oos";
    locations: Record<string, number>;
  }>;
  totalInStock: number;
  totalOOS: number;
}
```

#### `["consumes", "consumptionRates"]`
```typescript
{
  calculatedAt: string;
  windowDays: number;          // 30
  items: Record<string, {
    dailyRate: number;
    weeklyRate: number;
    daysUntilOOS: number | null;  // null if rate is 0
    totalConsumed30d: number;
  }>;
  herbs: Record<string, {     // Keyed by herb itemId
    weeklyDemand: number;
    weeklySupply: number;      // From material sales
    netRate: number;           // supply - demand
    inBank: number;
    priority: "high" | "medium" | "low";
  }>;
}
```

### Modified KV Keys

#### `["consumes", "config"]` — Enhanced
Add fields:
```typescript
{
  discountPercent: number;           // Existing: global default
  pricingMode: "flat" | "dynamic";   // NEW: flat = existing behavior, dynamic = supply-based
  autoSnapshotEnabled: boolean;      // NEW: daily snapshot capture
  lowStockAlertsEnabled: boolean;    // NEW: Discord alerts
  alertChannelId?: string;           // NEW: Discord channel for alerts
}
```

#### `["consumes", "staticPrices"]` — Migrated
Existing per-item static prices will be migrated into the new `itemDiscounts` key with `mode: "static"`. The old key can be kept for backwards compatibility during migration.

---

## 14. API Changes

### New Endpoints

#### `GET /api/consumes/stock-intelligence`
Returns the complete stock intelligence view — the JOIN between inventory and catalog.

**Response:**
```typescript
{
  items: Array<{
    shopId: string;            // "GFPP"
    name: string;              // "Greater Fire Protection Potion"
    itemId: string;            // "13457"
    category: string;          // "protection"
    stock: number;             // 45
    stockLevel: string;        // "adequate"
    locations: Record<string, number>;  // Where items are
    discountRate: number;      // 10
    discountMode: string;      // "auto"
    shopPrice: number;         // In copper
    ahPrice: number;           // In copper
    daysUntilOOS: number | null;
    weeklyConsumption: number;
    recipe: Recipe | null;     // If craftable
    craftingNeeded: number;    // For pending orders
  }>;
  summary: {
    totalItems: number;
    inStock: number;
    low: number;
    critical: number;
    outOfStock: number;
    surplus: number;
  };
  herbDemand: Array<{
    herbName: string;
    herbItemId: string;
    weeklyDemand: number;
    inBank: number;
    shortfall: number;
    priority: string;
  }>;
  lastScanTime: string;
  lastCalculation: string;
}
```

#### `POST /api/consumes/admin/pricing`
Save per-item pricing configuration (replaces/enhances existing admin/update).

#### `GET /api/consumes/stock-history?days=30`
Returns daily stock snapshots for trend charts.

#### `POST /api/consumes/stock-snapshot`
Manually trigger a stock snapshot (also auto-triggered on guild storage upload).

### Modified Endpoints

#### `GET /api/consumes/prices` — Enhanced
Add to response:
- `pricingMode`: "flat" | "dynamic"
- Per-item `discountRate`, `stockLevel`, `stockCount`
- `inStock` boolean per item (for UI "Out of Stock" badge)

#### `PUT /api/guild-bank/inventory` — Enhanced
After storing inventory, trigger stock level recalculation:
1. Re-classify all item stock levels
2. Compare against previous levels
3. Fire Discord alerts for new Low/Critical transitions
4. Optionally capture daily snapshot if not already captured today

#### `PUT /api/bank-alts/inventory` — Enhanced
Same post-upload trigger as guild bank.

---

## 15. Implementation Roadmap

### Phase 1: Stock Matching (Foundation)
**Effort: Medium | Impact: High**

1. Create `/api/consumes/stock-intelligence` endpoint
2. Join guild storage data with ITEM_CATALOG by itemId
3. Add "Stock Intelligence" tab to Guild Bank page
4. Show stock counts, levels, and locations per catalog item
5. Add stock level classification logic with default thresholds

### Phase 2: Supply-Based Pricing
**Effort: Medium | Impact: High**

1. Create `["consumes", "itemDiscounts"]` and `["consumes", "stockThresholds"]` KV keys
2. Add `pricingMode` to consumes config
3. Modify `getItemPriceInfo()` in prices.ts to use per-item rates
4. Enhance admin panel with per-item pricing table
5. Add stock badges and per-item rates to shop item cards
6. Migrate existing staticPrices into new itemDiscounts format

### Phase 3: Crafting Intelligence
**Effort: Medium | Impact: Medium**

1. Add sub-recipes for Shadow Oil, Blackmouth Oil, Fire Oil, Stonescale Oil
2. Add Wildvine to HERB_CATALOG
3. Create crafting needs calculator (match pending orders against stock)
4. Add "Materials Needed" section to Stock Intelligence tab
5. Enhance crafting queue page with recipe-aware requirements

### Phase 4: Alerts & Automation
**Effort: Low | Impact: Medium**

1. Add stock level transition detection to vault/bank-alt upload handlers
2. Implement Discord notifications for Low/Critical/OOS transitions
3. Add daily stock snapshot capture (triggered by first upload of the day)
4. Create stock history API and trend charts

### Phase 5: Demand Forecasting
**Effort: Medium | Impact: Medium**

1. Calculate consumption rates from 30-day order history
2. Calculate days-until-OOS per item
3. Calculate herb demand rates from recipe analysis
4. Add herb demand board to Material Sales page
5. Show "What to Farm" priority list for herbalists

### Phase 6: Polish & Integration
**Effort: Low | Impact: Low**

1. Fix GNP itemId mismatch (50237 in recipes vs 18012 in catalog)
2. Fix TypeScript union type for profession (add "quest", "blacksmithing")
3. Add stock trend sparklines to dashboard
4. Add consumables-to-stock cross-reference in shop search results

---

## 16. Ideas Beyond The Brief

### Idea 1: Raid Night Burn Calculator
Before a raid, predict total consumable usage based on raid composition and historical consumption per player. Show "Tonight we'll burn approximately: 25 GFPP, 15 Mongoose, 10 Mageblood" so crafters can pre-stock.

### Idea 2: Crafter Leaderboard
Track which alchemists/crafters have fulfilled the most orders and crafted the most items. Gamify the crafting process with weekly/monthly stats.

### Idea 3: Auto-Restock Orders
When stock hits critical, automatically generate a "restock order" that gets posted to Discord. Crafters can claim restock orders the same way they claim player orders.

### Idea 4: Material Price Arbitrage Alerts
Compare material buy prices (what we pay herbalists) against finished product sell prices. Alert when it's cheaper to buy finished products on AH than to craft them from purchased materials.

### Idea 5: Smart Cart Suggestions
When a user adds items to cart, suggest related items based on their class/role and what's commonly purchased together. "You added Mongoose — did you also need GFPP and food buffs?"

### Idea 6: Seasonal/Event Stock Preparation
Before known events (world bosses, PvP weeks, new raid tier), proactively increase thresholds and alert about increased demand. Could be a simple "Raid Prep Mode" toggle that doubles all thresholds.

### Idea 7: Guild Bank Tab Optimization
Analyze which items are in which vault tabs and suggest reorganization. "Tab 3 has 12 different alchemy items — consider consolidating with Tab 2's alchemy items."

### Idea 8: Herbalist Payout Dashboard
Show herbalists their total earnings from material sales over time, most profitable herbs, and recommendations for what to farm next based on current guild needs AND AH prices (optimize for their personal gold/hour).

### Idea 9: Webhook-Triggered Price Updates
When the tray app uploads new AH scan data, automatically recalculate all prices and fire a Discord summary: "Price update: GFPP dropped 15%, Mongoose up 8%."

### Idea 10: Expiring Stock Awareness
Track items that are "slow movers" — adequate stock but near-zero consumption. These are dead inventory. Flag them so admins can deep-discount them or redistribute.

---

## Appendix A: Complete Item ID Cross-Reference

The stock matching system depends on `itemId` being consistent across guild storage and ITEM_CATALOG. Here are all 84 catalog items with their item IDs:

| Shop ID | Name | Item ID | Category |
|---------|------|:---:|----------|
| GFPP | Greater Fire Protection Potion | 13457 | protection |
| GAPP | Greater Arcane Protection Potion | 13461 | protection |
| GNPP | Greater Nature Protection Potion | 13458 | protection |
| GFROP | Greater Frost Protection Potion | 13456 | protection |
| GSPP | Greater Shadow Protection Potion | 13459 | protection |
| SPP | Shadow Protection Potion | 6048 | protection |
| LIP | Limited Invulnerability Potion | 3387 | protection |
| FAP | Free Action Potion | 5634 | protection |
| LAP | Living Action Potion | 20008 | protection |
| Restorative | Restorative Potion | 9030 | protection |
| Invisibility | Invisibility Potion | 9172 | protection |
| Swiftness | Swiftness Potion | 2459 | protection |
| Purification | Purification Potion | 13462 | protection |
| Quickness | Potion of Quickness | 61181 | protection |
| MagicResistance | Magic Resistance Potion | 9036 | protection |
| MajorHealing | Major Healing Potion | 13446 | protection |
| Mongoose | Elixir of the Mongoose | 13452 | melee |
| GreaterAgility | Elixir of Greater Agility | 9187 | melee |
| Giants | Elixir of Giants | 9206 | melee |
| MightyRage | Mighty Rage Potion | 13442 | melee |
| GreaterStoneshield | Greater Stoneshield Potion | 13455 | melee |
| Fortitude | Elixir of Fortitude | 3825 | melee |
| SuperiorDefense | Elixir of Superior Defense | 13445 | melee |
| TrollsBlood | Major Troll's Blood Potion | 20004 | melee |
| GiftOfArthas | Gift of Arthas | 9088 | melee |
| OilOfImmolation | Oil of Immolation | 8956 | melee |
| ThistleTea | Thistle Tea | 7676 | melee |
| GoblinSapper | Goblin Sapper Charge | 10646 | melee |
| WinterfallFirewater | Winterfall Firewater | 12820 | melee |
| ROIDS | R.O.I.D.S. | 8410 | melee |
| GroundScorpok | Ground Scorpok Assay | 8412 | melee |
| LungJuice | Lung Juice Cocktail | 8411 | melee |
| Mageblood | Mageblood Potion | 20007 | caster |
| GAE | Greater Arcane Elixir | 13454 | caster |
| ArcaneElixir | Arcane Elixir | 9155 | caster |
| MajorMana | Major Mana Potion | 13444 | caster |
| GFW | Elixir of Greater Firepower | 21546 | caster |
| GSP | Elixir of Shadow Power | 9264 | caster |
| GFrostP | Elixir of Frost Power | 17708 | caster |
| GNP | Elixir of Greater Nature Power | 18012 | caster |
| Dreamshard | Dreamshard Elixir | 61224 | caster |
| DarkRune | Dark Rune | 20520 | caster |
| CerebralCortex | Cerebral Cortex Compound | 8423 | caster |
| GizzardGum | Gizzard Gum | 8424 | caster |
| BrilliantManaOil | Brilliant Mana Oil | 20748 | weaponbuffs |
| BlessedWizardOil | Blessed Wizard Oil | 23123 | weaponbuffs |
| FrostOil | Frost Oil | 3829 | weaponbuffs |
| ElementalStone | Elemental Sharpening Stone | 18262 | weaponbuffs |
| BrilliantWizardOil | Brilliant Wizard Oil | 20749 | weaponbuffs |
| DenseSharpeningStone | Dense Sharpening Stone | 12404 | weaponbuffs |
| GrilledSquid | Grilled Squid | 13928 | food |
| HerbalSalad | Empowering Herbal Salad | 83309 | food |
| NightfinSoup | Nightfin Soup | 13931 | food |
| HardenedMushroom | Hardened Mushroom | 51717 | food |
| LeFishe | Le Fishe Au Chocolat | 84040 | food |
| MedivhMerlot | Medivh's Merlot | 61174 | food |
| MedivhMerlotBlue | Medivh's Merlot Blue | 61175 | food |
| DragonbreathChili | Dragonbreath Chili | 12217 | food |
| DanozoDelight | Danonzo's Tel'Abim Delight | 60977 | food |
| DanozoSurprise | Danonzo's Tel'Abim Surprise | 60976 | food |
| DanozoMedley | Danonzo's Tel'Abim Medley | 60978 | food |
| PowerMushroom | Power Mushroom | 51720 | food |
| SmokedDesertDumplings | Smoked Desert Dumplings | 20452 | food |
| GilneasHotStew | Gilneas Hot Stew | 84041 | food |
| RumseyRumBlackLabel | Rumsey Rum Black Label | 21151 | food |
| EmeraldMongoose | Concoction of the Emerald Mongoose | 47410 | concoctions |
| ArcaneGiant | Concoction of the Arcane Giant | 47412 | concoctions |
| Dreamwater | Concoction of the Dreamwater | 47414 | concoctions |
| ElixirOfDemonslaying | Elixir of Demonslaying | 9224 | concoctions |
| ElixirOfBruteForce | Elixir of Brute Force | 13453 | concoctions |
| Dreamtonic | Dreamtonic | 61423 | concoctions |
| Titans | Flask of the Titans | 13510 | flasks |
| Wisdom | Flask of Distilled Wisdom | 13511 | flasks |
| SupremePower | Flask of Supreme Power | 13512 | flasks |
| Chromatic | Flask of Chromatic Resistance | 13513 | flasks |
| FrostsaberEko | Frostsaber E'ko | 12430 | tokens |
| WinterfallEko | Winterfall E'ko | 12431 | tokens |
| ShardtoothEko | Shardtooth E'ko | 12432 | tokens |
| WildkinEko | Wildkin E'ko | 12433 | tokens |
| ChillwindEko | Chillwind E'ko | 12434 | tokens |
| IceThistleEko | Ice Thistle E'ko | 12435 | tokens |
| FrostmaulEko | Frostmaul E'ko | 12436 | tokens |
| SmallDreamShard | Small Dream Shard | 61198 | tokens |
| BrightDreamShard | Bright Dream Shard | 61199 | tokens |

### Appendix B: Known Data Issues to Fix

| Issue | Severity | Fix |
|-------|----------|-----|
| GNP itemId mismatch: recipes has 50237, catalog has 18012 | High | Update recipes.ts to use 18012 |
| TypeScript union type missing "quest" and "blacksmithing" | Medium | Add to Recipe interface |
| Wildvine (8153) not in HERB_CATALOG | High | Add to herb-data.ts |
| No sub-recipes for Shadow/Blackmouth/Fire/Stonescale Oil | Medium | Add to recipes.ts |
| `herbs/sales` vs `materials/sales` legacy alias | Low | Clean up admin scripts |
| BlessedWizardOil has empty recipe (not craftable) | Info | Correct, no change needed |
| 15 unused items in recipes.ts ITEMS constant | Info | Dead code, clean up optional |

---

*Document generated: 2026-02-08*
*Research based on: 4 parallel deep-dive agents scanning all server-side code, KV patterns, API responses, and frontend components*

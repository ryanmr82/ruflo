# TBC Website - Current State Architecture

## Overview
Deno Fresh web application for a World of Warcraft (Turtle WoW) guild management system. Handles raid attendance tracking, loot management, and SR+ (soft reserve plus) loyalty rewards.

---

## Database Schema (Deno KV)

Single database located at: `/home/opc/tbc-website/data.db`

### KV Key Prefixes

| Prefix | Description | Key Structure | Status |
|--------|-------------|---------------|--------|
| `["attendance", id]` | Individual attendance records | `["attendance", "{raidId}-{playerName}-{timestamp}"]` | Active |
| `["raids-saved", raidId]` | Raid summary after attendance saved | `["raids-saved", "{raidId}"]` | Active |
| `["combat_logs", logId]` | Processed combat log summaries | `["combat_logs", "{logId}"]` | Active |
| `["combat_logs_raw", logId]` | Raw combat log content | `["combat_logs_raw", "{logId}"]` | Active |
| `["sessions", sessionId]` | User login sessions | `["sessions", "{sessionId}"]` | Active |
| `["user_profiles", discordId]` | User profile with linked characters | `["user_profiles", "{discordId}"]` | Active |
| `["items", "by_id", itemId]` | Item cache by WoW item ID | `["items", "by_id", {number}]` | Active |
| `["items", "by_name", normalizedName]` | Item name → ID index | `["items", "by_name", "{name}"]` | Active |
| `["loot", ...]` | Loot distribution records | `["loot", ...]` | Active |
| `["scrape", "cache", eventId]` | Cached RaidRes scrape data | `["scrape", "cache", "{eventId}"]` | Active |
| `["sr_picks", discordId, eventId]` | User's SR+ picks per event | `["sr_picks", "{discordId}", "{eventId}"]` | Active |
| `["sr_plus", "settings"]` | SR+ system settings | `["sr_plus", "settings"]` | Active |
| `["sr_plus", "credits", ...]` | SR+ credit tracking | `["sr_plus", "credits", raidType, playerName, itemId]` | **BROKEN** |
| `["sr_plus", "runs", runId]` | Manual SR+ runs | `["sr_plus", "runs", "{runId}"]` | **UNUSED** |

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐     ┌─────────────────────┐
│   User Session      │     │   User Profile      │
├─────────────────────┤     ├─────────────────────┤
│ sessionId (PK)      │────▶│ discordId (PK)      │
│ discordId (FK)      │     │ characters[]        │
│ discordUsername     │     └─────────────────────┘
│ discordDisplayName  │              │
│ discordAvatar       │              │ 1:N
│ expiresAt           │              ▼
└─────────────────────┘     ┌─────────────────────┐
                            │   SR Pick           │
┌─────────────────────┐     ├─────────────────────┤
│   Attendance        │     │ discordId (PK)      │
├─────────────────────┤     │ eventId (PK)        │
│ id (PK)             │     │ itemName            │
│ raidId              │     │ raidType            │
│ raidTitle           │     │ eventTitle          │
│ raidDate            │     │ eventDate           │
│ playerName          │     └─────────────────────┘
│ playerClass         │
│ srPlusEligible      │     ┌─────────────────────┐
│ attended            │     │   SR+ Credit        │
│ savedAt             │     ├─────────────────────┤
│ savedBy             │     │ raidType (PK)       │
└─────────────────────┘     │ playerName (PK)     │
         │                  │ itemId/itemName (PK)│
         │ N:1              │ timesSRd            │
         ▼                  │ bonusRP             │
┌─────────────────────┐     │ createdAt           │
│   Raid Saved        │     │ updatedAt           │
├─────────────────────┤     └─────────────────────┘
│ raidId (PK)         │              ▲
│ raidTitle           │              │ INCONSISTENT KEYS
│ raidDate            │              │ Some use itemId (number)
│ totalSignups        │              │ Some use itemName (string)
│ srPlusEligible      │              │
│ savedAt             │     ┌─────────────────────┐
│ savedBy             │     │   SR+ Settings      │
└─────────────────────┘     ├─────────────────────┤
                            │ bonusPerSR: 20      │
┌─────────────────────┐     │ hardReserveThreshold│
│   Combat Log        │     │ require24hSignup    │
├─────────────────────┤     │ allowPlayerSelfSvc  │
│ id (PK)             │     │ lockSRBeforeRaid    │
│ raidType            │     └─────────────────────┘
│ raidName            │
│ bossKilled          │     ┌─────────────────────┐
│ startTime           │     │   Item (Cache)      │
│ endTime             │     ├─────────────────────┤
│ lineCount           │     │ id (PK)             │
│ uploadedAt          │     │ name                │
│ playerStats[]       │     │ normalizedName      │
│ loot[]              │     │ icon                │
│ summary             │     │ iconUrl             │
└─────────────────────┘     │ quality             │
                            │ tooltipHtml         │
                            │ slot                │
                            │ armor               │
                            │ itemLevel           │
                            └─────────────────────┘
```

---

## API Routes

### Authentication (`/api/auth/`)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/me` | GET | Session | Get current user session and profile |
| `/api/auth/characters` | GET/PUT | Session | Manage linked WoW characters |
| `/api/auth/discord/callback` | GET | None | Discord OAuth callback |

### SR+ System (`/api/sr-plus/`)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/sr-plus/credits` | GET | None | List all SR+ credits (with filters) |
| `/api/sr-plus/credits` | POST/PUT/DELETE | Admin | CRUD operations on credits |
| `/api/sr-plus/my-picks` | GET | Session | Get user's SR+ picks and upcoming raids |
| `/api/sr-plus/my-picks` | POST/DELETE | Session | Save/remove user's SR+ pick |
| `/api/sr-plus/my-srs` | GET | Session | Get user's SRs from RaidRes for an event |
| `/api/sr-plus/settings` | GET | None | Get SR+ settings |
| `/api/sr-plus/settings` | PUT | Admin | Update SR+ settings |
| `/api/sr-plus/scrape` | POST | Admin | Scrape RaidRes event via Playwright |
| `/api/sr-plus/sync` | POST | Admin | Sync scraped data to credits table |
| `/api/sr-plus/raidres` | GET | None | Direct RaidRes API call (returns raidItemId) |

### Items (`/api/items/`)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/items/lookup` | GET | None | Self-healing item lookup (static→KV→scrape) |
| `/api/items/admin` | GET/POST | Admin | Item database management |
| `/api/items/[id]` | GET | None | Get specific item by ID |

### Combat Logs (`/api/logs`)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/logs` | GET | None | List combat logs with filters |
| `/api/logs` | POST | Admin | Upload and process combat log |
| `/api/logs` | DELETE | Admin | Delete a combat log |

### Raids & Attendance

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/raids` | GET | None | Get raids from Raid-Helper Discord bot |
| `/api/attendance` | GET | None | Query attendance records |
| `/api/attendance` | POST | Admin | Save attendance snapshot |
| `/api/loot` | GET | None | Get loot database (static JSON) |
| `/api/loot/index` | GET | None | Query loot drops from logs |

---

## Data Flow Diagrams

### 1. User SR+ Pick Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Discord    │     │  Raid-Helper │     │  RaidRes.top │
│   OAuth2     │     │     API      │     │   Website    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  /api/auth/  │     │ /api/sr-plus │     │ /api/sr-plus │
│   discord/   │     │  /my-picks   │     │   /scrape    │
│  callback    │     │              │     │ (Playwright) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    Deno KV Database                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  sessions   │  │  sr_picks   │  │ scrape/cache│   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    MySRPortal.tsx                     │
│  - Shows upcoming raids user is signed up for         │
│  - Shows user's SRs from RaidRes                      │
│  - Allows picking ONE item per raid type as SR+       │
└──────────────────────────────────────────────────────┘
```

### 2. Item Lookup Self-Healing Flow

```
┌────────────────┐
│  API Request   │
│ /api/items/    │
│  lookup?name=X │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌─────────────────────┐
│ Check Static   │────▶│ item-tooltips.json  │
│ JSON (7k+ items)│     │ (has icon field?)   │
└───────┬────────┘     └─────────────────────┘
        │
        │ Missing/No Icon?
        ▼
┌────────────────┐     ┌─────────────────────┐
│  Check KV      │────▶│ ["items","by_name"] │
│  Cache         │     │ ["items","by_id"]   │
└───────┬────────┘     └─────────────────────┘
        │
        │ Not Found/No Icon?
        ▼
┌────────────────┐     ┌─────────────────────┐
│  Playwright    │────▶│ database.turtle-wow │
│  Scraper       │     │      .org           │
└───────┬────────┘     └─────────────────────┘
        │
        │ Found Icon
        ▼
┌────────────────┐
│ SELF-HEAL:     │
│ 1. Store in KV │
│ 2. Update JSON │
└────────────────┘
```

### 3. Combat Log Processing Flow

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Upload Log    │────▶│  Parse Log     │────▶│ Extract Data   │
│  /api/logs     │     │  (regex)       │     │                │
└────────────────┘     └────────────────┘     └───────┬────────┘
                                                      │
        ┌─────────────────────────────────────────────┤
        │                                             │
        ▼                                             ▼
┌────────────────┐                          ┌────────────────┐
│  Player Stats  │                          │   Loot Drops   │
│  - Deaths      │                          │   - Player     │
│  - Consumables │                          │   - Item ID    │
│  - CC/Dispels  │                          │   - Quality    │
│  - World Buffs │                          │   - Timestamp  │
└───────┬────────┘                          └───────┬────────┘
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ▼
                    ┌────────────────┐
                    │   Deno KV      │
                    │ combat_logs    │
                    │ combat_logs_raw│
                    └────────────────┘
```

---

## Component Map

### Page Routes (`/routes/`)

| Route | Page | Islands Used |
|-------|------|--------------|
| `/` | `index.tsx` | - |
| `/admin` | `admin.tsx` | SRPlusSpreadsheet, RaidResFetcher, ItemCatalogAdmin |
| `/analysis` | `analysis.tsx` | - |
| `/attendance` | `attendance.tsx` | SaveAttendance |
| `/logs` | `logs.tsx` | LogProcessor, DeleteLogButton |
| `/loot` | `loot.tsx` | - |
| `/my-sr` | `my-sr.tsx` | MySRPortal |
| `/raids` | `raids.tsx` | RaidCalendar, DiscordRaidSelector |
| `/sr-plus` | `sr-plus.tsx` | SRPlusPublic |
| `/upload` | `upload.tsx` | - |

### Islands (Interactive Components)

| Island | API Dependencies | Description |
|--------|------------------|-------------|
| `MySRPortal.tsx` | `/api/auth/me`, `/api/sr-plus/my-picks`, `/api/sr-plus/my-srs`, `/api/items/lookup` | User's SR+ management portal |
| `SRPlusSpreadsheet.tsx` | `/api/sr-plus/credits`, `/api/sr-plus/settings`, `/api/items/lookup` | Admin SR+ management table |
| `SRPlusPublic.tsx` | `/api/sr-plus/credits`, `/api/sr-plus/settings`, `/api/items/lookup` | Read-only guild SR+ view |
| `RaidResFetcher.tsx` | `/api/sr-plus/sync`, `/api/items/lookup` | Sync data from RaidRes |
| `ItemTooltip.tsx` | `/api/items/lookup` | Shared tooltip component |
| `ItemCatalogAdmin.tsx` | `/api/items/admin`, `/api/items/lookup` | Item database admin |
| `LogProcessor.tsx` | `/api/logs` | Combat log upload/processing |
| `PlayerStatsTable.tsx` | - | Display player stats from log |
| `DiscordRaidSelector.tsx` | `/api/raids` | Select raid from Raid-Helper |
| `RaidCalendar.tsx` | `/api/raids` | Calendar view of raids |
| `SaveAttendance.tsx` | `/api/attendance` | Save attendance snapshot |
| `DeleteLogButton.tsx` | `/api/logs` | Delete combat log |
| `LocalTime.tsx` | - | Timezone conversion |

### Shared Components (`/components/`)

| Component | Description |
|-----------|-------------|
| `Layout.tsx` | Page layout wrapper |
| `Nav.tsx` | Navigation bar |

---

## External Dependencies

### APIs

| Service | Purpose | Auth |
|---------|---------|------|
| Raid-Helper | Discord raid scheduling bot | API Key |
| Discord OAuth2 | User authentication | OAuth2 Client |
| RaidRes.top | Soft reserve tracking | Playwright scrape |
| database.turtlecraft.gg | Item database | Playwright scrape |

### Static Data Files

| File | Description | Items |
|------|-------------|-------|
| `static/item-tooltips.json` | Parsed WoW cache items | 7,138 |
| `static/loot-database.json` | Raid loot tables | ~500 |

---

## Known Issues (Current State)

### 1. SR+ Credits Table - Broken
- **Problem:** Key format is inconsistent
  - Some entries: `["sr_plus", "credits", raidType, playerName, itemId]` (itemId = number)
  - Some entries: `["sr_plus", "credits", playerName, itemName]` (itemName = string)
- **Impact:** Credits list shows garbage data
- **Root cause:** Multiple code paths write with different key structures

### 2. SR+ Runs Table - Unused
- **Problem:** `["sr_plus", "runs", runId]` table exists but admin UI doesn't use it meaningfully
- **Impact:** "Create New Run from Discord" feature doesn't do anything useful

### 3. Disconnected Systems
- **Problem:** Three separate data stores that don't connect:
  1. `sr_picks` - User's picks from MySRPortal
  2. `sr_plus/credits` - Historical SR+ tracking
  3. `sr_plus/runs` - Manual run creation
- **Impact:** Admin page shows wrong data, user picks aren't reflected in admin view

### 4. raidItemId vs WoW Item ID
- **Problem:** RaidRes API returns `raidItemId` (their internal ID), not WoW item IDs
- **Impact:** Cannot look up items by ID from RaidRes API data
- **Solution:** Use Playwright scraper to get actual item names from page

### 5. Missing Icons in Static JSON
- **Problem:** 5,990 of 7,138 items missing icon field
- **Solution:** Self-healing lookup implemented - falls through to scraper, writes back to JSON

---

## Files to Delete (Cleanup)

### Database Tables
```
["sr_plus", "credits", ...] - Contains garbage data
["sr_plus", "runs", ...]    - Unused
```

### Admin Page Elements
- "Create New Run from Discord" section
- "Progression Run (requires consumables)" checkbox
- "Recent Runs" table

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Deno |
| Framework | Fresh 1.x |
| Database | Deno KV |
| Frontend | Preact + Islands Architecture |
| Styling | Tailwind CSS |
| Scraping | Playwright |
| Auth | Discord OAuth2 |
| Hosting | Oracle Cloud (OCI) |

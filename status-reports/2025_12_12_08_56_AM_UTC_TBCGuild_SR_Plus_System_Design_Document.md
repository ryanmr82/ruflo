# TBC Guild SR+ System Design Document

**Date:** December 12, 2025, 08:56 AM UTC
**Status:** Design Complete - Ready for Implementation
**Type:** System Architecture / Feature Design
**Project:** https://tbcguild.duckdns.org/
**Server:** torreyserver (132.226.72.121)

---

## Executive Summary

Complete redesign of the SR+ (Soft Reserve Plus) system for Thralls Book Club guild website. This document covers:

1. **Phase 1**: Admin Spreadsheet UI for bulk SR+ credit management
2. **Phase 2**: Discord OAuth SSO for player authentication
3. **Phase 3**: Player Self-Service Portal for SR management
4. **Phase 4**: 24-hour eligibility verification system

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Data Model](#data-model)
5. [Phase 1: Admin Spreadsheet UI](#phase-1-admin-spreadsheet-ui)
6. [Phase 2: Discord OAuth SSO](#phase-2-discord-oauth-sso)
7. [Phase 3: Player Self-Service Portal](#phase-3-player-self-service-portal)
8. [Phase 4: 24-Hour Eligibility System](#phase-4-24-hour-eligibility-system)
9. [Security Model](#security-model)
10. [Implementation Plan](#implementation-plan)
11. [File Structure](#file-structure)
12. [API Endpoints](#api-endpoints)
13. [Migration Strategy](#migration-strategy)

---

## Current State Analysis

### Existing Components

| Component | Location | Status |
|-----------|----------|--------|
| Admin Login | `/admin` | Working - password auth |
| Admin Dashboard | `/admin` | Working - creates raid "runs" |
| Run Detail | `/admin/runs/[id]` | Working - per-run credit editing |
| SR+ Public Page | `/sr-plus` | Working - view-only dashboard |
| Item Database | `/admin/items` | Working - cached items |
| RaidRes Scraper | `/api/sr-plus/scrape` | Working - Playwright scraper |
| Sync API | `/api/sr-plus/sync` | Working - processes scraped data |

### Current Data Structure

```typescript
// Existing SRPlusCredit (missing raid type, no player auth)
interface SRPlusCredit {
  playerName: string;
  itemName: string;
  timesSRd: number;
  currentBonus: number;      // Currently (timesSRd - 1) * 10
  isHardReserve: boolean;    // Currently timesSRd >= 5
  firstSRDate: string;
  lastUpdated: string;
}
```

### Current Database Contents (16 credits)

| Player | Item | Times SR'd | Bonus | HR |
|--------|------|------------|-------|-----|
| FelBringer | Royal Scepter of Vek'lor | 5 | +40 | YES |
| Fieldwalker | Cloak of Clarity | 3 | +20 | No |
| Keenhoof | Forked Tongue | 3 | +20 | No |
| Khloroform | Skin of Great Sandworm | 3 | +20 | No |
| Meltyougood | Shard of Fallen Star | 3 | +20 | No |
| Boomdj | Band of Accuria | 1 | +0 | No |
| (+ 10 more with 1 SR each) |

---

## Problem Statement

### Issues with Current System

| Issue | Impact |
|-------|--------|
| **No Raid Segmentation** | Can't track same player SR'ing different items in MC vs BWL vs AQ40 |
| **Hardcoded Bonus (+10)** | Admin cannot adjust bonus value per SR |
| **No Player Authentication** | Anyone can claim to be anyone on RaidRes |
| **No 24hr Eligibility Check** | Credits given regardless of Discord signup timing |
| **No Bulk Admin UI** | Must edit credits one-by-one per raid run |
| **No Player Self-Service** | Players cannot manage their own SRs securely |

---

## Proposed Solution

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TBC GUILD WEBSITE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Discord   │───▶│   OAuth     │───▶│   Player Portal         │ │
│  │   Login     │    │   Verify    │    │   /my-sr                │ │
│  └─────────────┘    └─────────────┘    │   - Set SR preferences  │ │
│                                         │   - View credits        │ │
│                                         │   - Link characters     │ │
│                                         └─────────────────────────┘ │
│                                                      │              │
│                                                      ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DENO KV DATABASE                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │
│  │  │ Players  │  │ Credits  │  │ Reserves │  │   Settings   │ │   │
│  │  │ (OAuth)  │  │ (SR+)    │  │ (per-raid)│  │  (admin)     │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            ▲                                        │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │                    ADMIN PANEL                               │   │
│  │   /admin/sr-plus    - Spreadsheet UI (bulk edit)            │   │
│  │   /admin/settings   - Configure bonus values, thresholds    │   │
│  │   /admin/players    - Manage player accounts                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 EXTERNAL INTEGRATIONS                        │   │
│  │   Discord API      - Guild membership, signup times          │   │
│  │   Raid-Helper API  - Raid events, signups with timestamps    │   │
│  │   RaidRes Scraper  - Backup SR data (Playwright)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New/Updated Interfaces

```typescript
// ============================================
// SETTINGS (Admin Configurable)
// ============================================
interface SRPlusSettings {
  bonusPerSR: number;           // Default: 20 (was 10)
  hardReserveThreshold: number; // Default: 5 (times SR'd to get HR)
  require24hSignup: boolean;    // Default: true
  allowPlayerSelfService: boolean; // Default: true
  lockSRBeforeRaid: number;     // Hours before raid to lock SR changes (default: 2)
}

// ============================================
// PLAYER ACCOUNTS (Discord OAuth)
// ============================================
interface PlayerAccount {
  odUserId: string;             // Discord ID "123456789012345678" - PRIMARY KEY
  odUserName: string;           // Discord username "Bambow#1234"
  displayName: string;          // Custom display name (can differ from Discord)
  characters: CharacterLink[];  // Linked in-game characters
  createdAt: string;
  lastLogin: string;
  isGuildMember: boolean;       // Verified via Discord API
  isAdmin: boolean;             // Can access admin panel
}

interface CharacterLink {
  characterName: string;        // "Bambow"
  isPrimary: boolean;           // Main character
  linkedAt: string;
  verifiedBy?: string;          // Admin who verified (optional)
}

// ============================================
// SR+ CREDITS (Updated)
// ============================================
interface SRPlusCredit {
  // Composite key: [playerName, itemId, raidType]
  playerName: string;
  itemId: number;
  itemName: string;
  raidType: string;             // NEW: "MC" | "BWL" | "AQ40" | "AQ20" | "ZG" | "NAXX" | "EMERALD" | "ONY"
  timesSRd: number;
  currentBonus: number;         // Calculated: (timesSRd - 1) * settings.bonusPerSR
  isHardReserve: boolean;       // Calculated: timesSRd >= settings.hardReserveThreshold
  firstSRDate: string;
  lastUpdated: string;

  // NEW: Tracking fields
  odUserId?: string;            // Discord ID of owner (if linked)
  eligibleDates: string[];      // Dates where player was 24h+ eligible
  ineligibleDates: string[];    // Dates where player was NOT eligible (for audit)
}

// ============================================
// SOFT RESERVES (Player Submissions)
// ============================================
interface SoftReserve {
  odUserId: string;             // Discord ID - OWNER (can only edit own)
  characterName: string;        // In-game character name
  raidId: string;               // Discord Raid-Helper event ID
  raidType: string;             // "MC" | "BWL" | "AQ40" etc.
  raidDate: string;             // "2025-12-14"
  itemName: string;
  itemId?: number;
  submittedAt: string;
  updatedAt?: string;
  lockedAt?: string;            // Timestamp when locked (can't change)
  eligible24h: boolean;         // Was signed up 24h+ in advance?
  signupTimestamp?: number;     // When they signed up on Discord
}

// ============================================
// RAID TYPES (Reference)
// ============================================
type RaidType =
  | "MC"       // Molten Core
  | "BWL"      // Blackwing Lair
  | "AQ40"     // Temple of Ahn'Qiraj
  | "AQ20"     // Ruins of Ahn'Qiraj
  | "ZG"       // Zul'Gurub
  | "ONY"      // Onyxia's Lair
  | "NAXX"     // Naxxramas
  | "EMERALD"  // Emerald Sanctum / Dragons of Nightmare
  | "KARA"     // Lower Karazhan Halls (Turtle WoW)
  | "OTHER";   // Fallback

// ============================================
// ITEM TO RAID MAPPING (for auto-detection)
// ============================================
interface ItemRaidMapping {
  itemId: number;
  itemName: string;
  raidType: RaidType;
  bossName?: string;
}
```

### Database Key Structure (Deno KV)

```typescript
// Settings
["settings", "sr_plus"] → SRPlusSettings

// Player Accounts
["players", odUserId] → PlayerAccount

// SR+ Credits (segmented by raid)
["sr_plus", "credits", raidType, playerName, itemId] → SRPlusCredit

// Soft Reserves (per raid event)
["sr_plus", "reserves", raidId, odUserId] → SoftReserve

// Audit Log
["sr_plus", "audit", timestamp] → AuditEntry
```

---

## Phase 1: Admin Spreadsheet UI

### Route: `/admin/sr-plus`

### Features

| Feature | Description |
|---------|-------------|
| **Raid Tabs** | Filter by MC, BWL, AQ40, etc. or view All |
| **Inline Editing** | Click cell to edit timesSRd value |
| **Bulk Actions** | Delete multiple, reset player, export CSV |
| **Search** | Find player or item instantly |
| **Settings Panel** | Configure bonusPerSR, HR threshold |
| **Auto-Calculate** | Bonus and HR status update on change |
| **Add Credit** | Manual credit entry form |
| **Import CSV** | Paste from spreadsheet |

### UI Wireframe

```
+--------------------------------------------------------------------------+
| SR+ Credits Manager                    [Settings ⚙️] [Export CSV]        |
+--------------------------------------------------------------------------+
| [All] [MC] [BWL] [AQ40] [AQ20] [ZG] [EMERALD]    Search: [____________]  |
+--------------------------------------------------------------------------+
| Settings: Bonus per SR: [20]  |  Hard Reserve at: [5] times              |
+--------------------------------------------------------------------------+

=== AQ40 (Temple of Ahn'Qiraj) === [+ Add]
+---------------+------------------------+----------+-------+-----+---------+
| Player        | Item                   | Times SR | Bonus | HR  | Actions |
+---------------+------------------------+----------+-------+-----+---------+
| FelBringer    | Royal Scepter of Vek   | [5]      | +80   | YES | [x]     |
| Fieldwalker   | Cloak of Clarity       | [3]      | +40   | No  | [x]     |
| Keenhoof      | Forked Tongue          | [3]      | +40   | No  | [x]     |
| Khloroform    | Skin of Great Sandworm | [3]      | +40   | No  | [x]     |
| Meltyougood   | Shard of Fallen Star   | [3]      | +40   | No  | [x]     |
+---------------+------------------------+----------+-------+-----+---------+

=== MC (Molten Core) === [+ Add]
+---------------+------------------------+----------+-------+-----+---------+
| Boomdj        | Band of Accuria        | [1]      | +0    | No  | [x]     |
| Khloroform    | Band of Accuria        | [1]      | +0    | No  | [x]     |
+---------------+------------------------+----------+-------+-----+---------+

[+ Add New Credit]

Add Credit Form:
  Player: [____________]  Item: [____________]  Raid: [AQ40 ▼]  Times: [1]
  [Add Credit]
+--------------------------------------------------------------------------+
```

### Files to Create

```
routes/admin/sr-plus.tsx          # Main spreadsheet page
islands/SRPlusSpreadsheet.tsx     # Interactive spreadsheet component
islands/SRPlusSettings.tsx        # Settings panel component
routes/api/sr-plus/credits.ts     # CRUD API for credits
routes/api/sr-plus/settings.ts    # Settings API
```

---

## Phase 2: Discord OAuth SSO

### Discord Application Setup

1. Create Discord Application at https://discord.com/developers/applications
2. Configure OAuth2:
   - Redirect URI: `https://tbcguild.duckdns.org/auth/callback`
   - Scopes: `identify`, `guilds`, `guilds.members.read`
3. Store credentials securely

### Environment Variables

```bash
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://tbcguild.duckdns.org/auth/callback
DISCORD_GUILD_ID=1039762365345976330  # Thralls Book Club server
```

### OAuth Flow

```
1. User clicks "Login with Discord"
   GET /auth/login → Redirect to Discord OAuth

2. Discord authenticates user
   Redirect back to /auth/callback?code=xxx

3. Server exchanges code for tokens
   POST https://discord.com/api/oauth2/token

4. Server fetches user info
   GET https://discord.com/api/users/@me
   GET https://discord.com/api/users/@me/guilds

5. Verify guild membership
   Check if user is in guild 1039762365345976330

6. Create/update PlayerAccount in DB
   Set session cookie with Discord ID

7. Redirect to /my-sr or original destination
```

### Routes

```
routes/auth/login.ts      # Initiates OAuth flow
routes/auth/callback.ts   # Handles Discord callback
routes/auth/logout.ts     # Clears session
routes/api/auth/me.ts     # Returns current user info
```

### Session Management

```typescript
// Cookie-based session
interface Session {
  odUserId: string;
  odUserName: string;
  isAdmin: boolean;
  expiresAt: number;
}

// Cookie: tbc_session=<encrypted_session_data>
// HttpOnly, Secure, SameSite=Strict, Max-Age=7 days
```

---

## Phase 3: Player Self-Service Portal

### Route: `/my-sr`

### Features

| Feature | Description |
|---------|-------------|
| **View Credits** | See all your SR+ credits across raids |
| **Set SR** | Choose item for upcoming raid |
| **Link Characters** | Associate in-game names with Discord |
| **Settings** | Change display name |
| **Eligibility Status** | See if signed up 24h+ for upcoming raids |

### UI Wireframe

```
+------------------------------------------------------------------+
| My SR+ Dashboard                      Logged in as: Bambow [Logout]
+------------------------------------------------------------------+
| Display Name: [Bambow_________] [Save]                            |
|                                                                    |
| Your Characters: [Bambow ✓] [Bambowalt] [+ Link Character]        |
+------------------------------------------------------------------+

=== Your SR+ Credits ===
+------------------------+----------+-------+-------+----------------+
| Item                   | Raid     | Times | Bonus | Status         |
+------------------------+----------+-------+-------+----------------+
| Band of Accuria        | MC       | 3     | +40   | Building...    |
| Royal Scepter of Vek   | AQ40     | 5     | +80   | HARD RESERVE   |
| Striker's Mark         | BWL      | 1     | +0    | Building...    |
+------------------------+----------+-------+-------+----------------+

=== Set Your Soft Reserve ===
Upcoming Raids:

┌─────────────────────────────────────────────────────────────────┐
│ AQ40 - Temple of Ahn'Qiraj                                      │
│ Saturday, Dec 14, 2025 @ 4:00 PM                                │
│                                                                  │
│ Your signup: ✓ Dec 11 (72h early) - ELIGIBLE FOR SR+            │
│                                                                  │
│ Your SR: [Royal Scepter of Vek'lor___] [Search 🔍]              │
│          └─ Auto-complete from AQ40 loot table                  │
│                                                                  │
│ [Save SR]  Status: Saved ✓                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MC - Molten Core                                                │
│ Sunday, Dec 15, 2025 @ 3:00 PM                                  │
│                                                                  │
│ Your signup: ✗ NOT SIGNED UP                                    │
│ ⚠️ Sign up on Discord to set SR                                 │
└─────────────────────────────────────────────────────────────────┘
+------------------------------------------------------------------+
```

### Routes

```
routes/my-sr.tsx              # Player dashboard (requires auth)
routes/my-sr/settings.tsx     # Player settings page
islands/PlayerSRForm.tsx      # SR selection component
islands/CharacterLinker.tsx   # Character linking component
routes/api/my-sr/reserve.ts   # Set/update SR
routes/api/my-sr/characters.ts # Manage character links
```

---

## Phase 4: 24-Hour Eligibility System

### Logic Flow

```typescript
async function checkEligibility(
  odUserId: string,
  raidId: string
): Promise<{ eligible: boolean; signupTime: number | null; hoursEarly: number }> {

  // 1. Get raid start time from Raid-Helper API
  const raidEvent = await fetchRaidHelperEvent(raidId);
  const raidStartTime = raidEvent.startTime; // Unix timestamp

  // 2. Get user's signup time from Raid-Helper API
  const signups = raidEvent.signUps;
  const userSignup = signups.find(s => s.odUserId === odUserId);

  if (!userSignup) {
    return { eligible: false, signupTime: null, hoursEarly: 0 };
  }

  // 3. Calculate hours early
  const signupTime = userSignup.entryTime; // Unix timestamp
  const hoursEarly = (raidStartTime - signupTime) / 3600;

  // 4. Check against 24h threshold
  const eligible = hoursEarly >= 24;

  return { eligible, signupTime, hoursEarly };
}
```

### Integration Points

```
When player submits SR:
  1. Check Discord signup via Raid-Helper API
  2. Calculate hours early
  3. Store eligibility status on SoftReserve record
  4. Show warning if not eligible

When admin syncs RaidRes:
  1. For each reservation, look up player's Discord ID
  2. Check eligibility
  3. Only increment credit if eligible (or per settings)
  4. Log ineligible reservations for review
```

---

## Security Model

### Authentication Layers

| Layer | Protection |
|-------|------------|
| **Discord OAuth** | Verifies real Discord identity |
| **Guild Check** | Must be member of Thralls Book Club Discord |
| **Session Cookie** | HttpOnly, Secure, encrypted |
| **CSRF Protection** | Token validation on mutations |
| **Rate Limiting** | Prevent abuse |

### Authorization Rules

```typescript
// Who can do what
const permissions = {
  // Anyone (no auth)
  viewPublicSRPage: true,
  viewRaidCalendar: true,

  // Authenticated players
  viewOwnCredits: "self",
  setOwnSR: "self",
  editOwnSettings: "self",
  linkOwnCharacters: "self",

  // Admins only
  viewAllCredits: "admin",
  editAnyCredit: "admin",
  deleteCredits: "admin",
  changeSettings: "admin",
  viewAuditLog: "admin",
  managePlayerAccounts: "admin",
};
```

### Data Isolation

```typescript
// Players can ONLY access their own data
async function getPlayerData(sessionUserId: string, requestedUserId: string) {
  if (sessionUserId !== requestedUserId && !isAdmin(sessionUserId)) {
    throw new Error("Unauthorized");
  }
  // ... fetch data
}
```

---

## Implementation Plan

### Phase 1: Admin Spreadsheet UI (Estimated: First)

| Step | Task |
|------|------|
| 1.1 | Create settings data model and API |
| 1.2 | Migrate existing credits to add raidType field |
| 1.3 | Create item-to-raid mapping utility |
| 1.4 | Build `/admin/sr-plus` route |
| 1.5 | Build `SRPlusSpreadsheet` island component |
| 1.6 | Add inline editing with auto-save |
| 1.7 | Add filtering by raid type |
| 1.8 | Add search functionality |
| 1.9 | Add bulk actions (delete, export CSV) |
| 1.10 | Add manual credit entry form |
| 1.11 | Test and verify |

### Phase 2: Discord OAuth SSO (Estimated: Second)

| Step | Task |
|------|------|
| 2.1 | Create Discord application |
| 2.2 | Configure OAuth2 settings |
| 2.3 | Add environment variables to server |
| 2.4 | Create `/auth/login` route |
| 2.5 | Create `/auth/callback` route |
| 2.6 | Create `/auth/logout` route |
| 2.7 | Implement session management |
| 2.8 | Add guild membership verification |
| 2.9 | Create PlayerAccount data model |
| 2.10 | Add "Login with Discord" to nav |
| 2.11 | Test OAuth flow end-to-end |

### Phase 3: Player Self-Service Portal (Estimated: Third)

| Step | Task |
|------|------|
| 3.1 | Create `/my-sr` route (auth required) |
| 3.2 | Build player dashboard UI |
| 3.3 | Create character linking system |
| 3.4 | Build SR selection component with autocomplete |
| 3.5 | Create SR submission API |
| 3.6 | Add display name settings |
| 3.7 | Show eligibility status per raid |
| 3.8 | Add SR locking before raid |
| 3.9 | Test player workflows |

### Phase 4: 24-Hour Eligibility System (Estimated: Fourth)

| Step | Task |
|------|------|
| 4.1 | Create eligibility check utility |
| 4.2 | Integrate with Raid-Helper API |
| 4.3 | Update SR submission to check eligibility |
| 4.4 | Update sync process to verify eligibility |
| 4.5 | Add eligibility display to player portal |
| 4.6 | Add ineligible reservation flagging |
| 4.7 | Test eligibility scenarios |

---

## File Structure

```
/home/opc/tbc-website/
├── routes/
│   ├── admin/
│   │   ├── sr-plus.tsx           # NEW: Spreadsheet admin page
│   │   ├── players.tsx           # NEW: Player account management
│   │   └── ...
│   ├── auth/
│   │   ├── login.ts              # NEW: Discord OAuth initiate
│   │   ├── callback.ts           # NEW: Discord OAuth callback
│   │   └── logout.ts             # NEW: Session logout
│   ├── my-sr.tsx                 # NEW: Player self-service portal
│   ├── my-sr/
│   │   └── settings.tsx          # NEW: Player settings
│   └── api/
│       ├── auth/
│       │   └── me.ts             # NEW: Current user info
│       ├── sr-plus/
│       │   ├── credits.ts        # NEW: Credits CRUD API
│       │   ├── settings.ts       # NEW: Settings API
│       │   └── ...
│       └── my-sr/
│           ├── reserve.ts        # NEW: Player SR submission
│           └── characters.ts     # NEW: Character linking
├── islands/
│   ├── SRPlusSpreadsheet.tsx     # NEW: Admin spreadsheet component
│   ├── SRPlusSettings.tsx        # NEW: Settings panel
│   ├── PlayerSRForm.tsx          # NEW: Player SR selection
│   ├── CharacterLinker.tsx       # NEW: Character linking UI
│   └── ...
├── utils/
│   ├── auth.ts                   # NEW: Session/auth utilities
│   ├── discord.ts                # NEW: Discord API client
│   ├── eligibility.ts            # NEW: 24h check utilities
│   ├── raid-mapping.ts           # NEW: Item-to-raid mapping
│   └── ...
└── data.db                       # Deno KV database
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login` | Initiate Discord OAuth |
| GET | `/auth/callback` | Handle OAuth callback |
| POST | `/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |

### Admin SR+ Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sr-plus/credits` | List all credits (filterable) |
| POST | `/api/sr-plus/credits` | Create credit |
| PUT | `/api/sr-plus/credits/[id]` | Update credit |
| DELETE | `/api/sr-plus/credits/[id]` | Delete credit |
| GET | `/api/sr-plus/settings` | Get settings |
| PUT | `/api/sr-plus/settings` | Update settings |

### Player Self-Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/my-sr/credits` | Get own credits |
| GET | `/api/my-sr/reserves` | Get own reserves |
| POST | `/api/my-sr/reserve` | Submit/update SR |
| DELETE | `/api/my-sr/reserve/[raidId]` | Remove SR |
| GET | `/api/my-sr/characters` | Get linked characters |
| POST | `/api/my-sr/characters` | Link character |
| DELETE | `/api/my-sr/characters/[name]` | Unlink character |
| PUT | `/api/my-sr/settings` | Update display name |

---

## Migration Strategy

### Migrating Existing 16 Credits

```typescript
// Migration script to add raidType to existing credits
async function migrateCredits() {
  const kv = await Deno.openKv("/home/opc/tbc-website/data.db");

  // Item to raid mapping (based on known items)
  const itemRaidMap: Record<string, string> = {
    "Royal Scepter of Vek'lor": "AQ40",
    "Cloak of Clarity": "AQ40",
    "Forked Tongue": "AQ40",
    "Skin of the Great Sandworm": "AQ40",
    "Shard of the Fallen Star": "AQ40",
    "Band of Accuria": "MC",
    "Head of Solnius": "EMERALD",
    "Shard of Nightmare": "EMERALD",
    "Nemesis Pants": "BWL",
    "Death's Sting": "AQ40",
    // ... etc
  };

  // Read existing credits
  const oldCredits = [];
  const iter = kv.list({ prefix: ["sr_plus", "credits"] });
  for await (const entry of iter) {
    oldCredits.push({ key: entry.key, value: entry.value });
  }

  // Migrate each credit
  for (const { key, value } of oldCredits) {
    const raidType = itemRaidMap[value.itemName] || "OTHER";

    // Create new key with raidType
    const newKey = ["sr_plus", "credits", raidType, value.playerName, value.itemId || value.itemName];

    // Add raidType to value
    const newValue = { ...value, raidType };

    // Write new record
    await kv.set(newKey, newValue);

    // Delete old record
    await kv.delete(key);
  }

  kv.close();
}
```

---

## Discord Application Setup Instructions

### Step 1: Create Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: "Thralls Book Club"
4. Save Application ID (Client ID)

### Step 2: Configure OAuth2

1. Go to OAuth2 > General
2. Add Redirect: `https://tbcguild.duckdns.org/auth/callback`
3. Copy Client Secret (save securely)

### Step 3: Configure Bot (Optional, for guild check)

1. Go to Bot section
2. Create bot
3. Enable "Server Members Intent"
4. Copy Bot Token

### Step 4: Add to Server

1. Go to OAuth2 > URL Generator
2. Select scopes: `identify`, `guilds`
3. Generate URL and add bot to Thralls Book Club server

---

## Configuration Values

```typescript
// Default settings
const DEFAULT_SETTINGS: SRPlusSettings = {
  bonusPerSR: 20,               // +20 per consecutive SR
  hardReserveThreshold: 5,      // 5 times = Hard Reserve
  require24hSignup: true,       // Must sign up 24h early
  allowPlayerSelfService: true, // Players can set own SR
  lockSRBeforeRaid: 2,          // Lock 2 hours before raid
};

// Raid-Helper API
const RAID_HELPER_API_KEY = "84hOyEGqAqFowsToIDusYNBlQvXzXqmc1sWorhMj";
const DISCORD_SERVER_ID = "1039762365345976330";
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Admin can view all credits in spreadsheet format
- [ ] Admin can filter by raid type
- [ ] Admin can inline-edit timesSRd values
- [ ] Bonus auto-calculates based on configurable bonusPerSR
- [ ] Admin can add/delete credits
- [ ] Settings panel allows changing bonus values
- [ ] Existing 16 credits migrated with raidType

### Phase 2 Complete When:
- [ ] Players can login with Discord
- [ ] Guild membership is verified
- [ ] Session persists across page loads
- [ ] Logout clears session
- [ ] Login state shown in nav

### Phase 3 Complete When:
- [ ] Players can view their own credits
- [ ] Players can set SR for upcoming raids
- [ ] Players can link characters to their account
- [ ] Players can change display name
- [ ] SR is locked to owner (others can't edit)

### Phase 4 Complete When:
- [ ] 24h eligibility is checked on SR submission
- [ ] Ineligible submissions are flagged
- [ ] Eligibility status shown to players
- [ ] Admin can see eligibility in spreadsheet

---

## Related Documentation

- Previous SR+ work: See status reports in `C:\Claude-Flow\status-reports\`
- Website: https://tbcguild.duckdns.org/
- Discord OAuth Docs: https://discord.com/developers/docs/topics/oauth2
- Raid-Helper API: https://raid-helper.dev/api/

---

*Document created: December 12, 2025, 08:56 AM UTC*
*Author: Claude Code (Opus 4.5)*
*Project: Thralls Book Club Guild Website*

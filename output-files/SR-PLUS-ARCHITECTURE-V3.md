# SR+ LOOT SYSTEM - COMPLETE ARCHITECTURE
## Version 3.0 - Built on Existing Infrastructure

---

# 1. CURRENT STATE (What Already Exists)

## 1.1 Website Tabs

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT WEBSITE STRUCTURE                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  [ Home ]  [ Raids ]  [ Attendance ]  [ Loot ]  [ Upload Loot ]  [ Combat Logs ]  [ Analysis ]
      │         │            │            │             │                │              │
      │         │            │            │             │                │              │
      ▼         ▼            ▼            ▼             ▼                ▼              ▼
   Static    Raid-Helper   SR+ Rate    Loot from    RollFor.lua     WoWCombatLog   Consumables
   Guild     Discord API   already     combat       upload          upload         CC, Deaths
   Page      signups +     tracks      logs         ────────────    ────────────   Dispels
             24hr check    eligibility auto-parse   REDUNDANT!      Works great    Stats
                                                    Combat logs
                                                    already do this

  EXTERNAL LINKS (in nav):
  ├── Soft Reserve (raidres.top) ← SR lists are here, NOT integrated yet
  ├── Gear Planner
  └── TurtleLogs
```

## 1.2 Existing SR+ Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         WHAT'S ALREADY BUILT                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  RAID-HELPER DISCORD API
  ────────────────────────
  ├── Fetches upcoming raids
  ├── Gets signups with timestamps (entryTime)
  ├── Calculates hours before raid
  └── Splits eligible (24h+) vs late signups

  ATTENDANCE TRACKING
  ────────────────────
  ├── srPlusEligible: boolean (already stored!)
  ├── signupTime: number (already stored!)
  ├── SR+ rate per player (already calculated!)
  └── Save Attendance button (already works!)

  COMBAT LOG PARSING
  ──────────────────
  ├── Consumables: Flasks, elixirs, potions, food
  ├── Loot drops: "Player receives [Item]"
  ├── Attendance: Who was in the raid
  ├── CC: Kicks, polymorphs, stuns
  └── Dispels

  DENO KV DATABASE
  ─────────────────
  ├── ["attendance", id] - Player attendance records with srPlusEligible
  ├── ["raids-saved", raidId] - Raid summaries
  └── ["combat_logs", id] - Parsed combat logs with loot
```

## 1.3 What's NOT Integrated Yet

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         WHAT'S MISSING                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  RAIDRES.TOP
  ───────────
  ✗ Not integrated at all
  ✗ We don't know what items players are SR'ing
  ✗ Just a link in the nav bar

  SR+ CREDIT ACCUMULATION
  ────────────────────────
  ✗ No tracking of how many times player SR'd same item
  ✗ No +10/+20/+30/+40 bonus calculation
  ✗ No hard reserve after 5 times

  LOOT DISTRIBUTION
  ─────────────────
  ✗ No connection between SR'd items and loot drops
  ✗ No roll tracking
  ✗ No winner/loser tracking
  ✗ No credit burn on win

  ADMIN TOOLS
  ───────────
  ✗ No way to mark progression vs farm runs
  ✗ No way to manually adjust credits
  ✗ No way to finalize loot distribution
```

---

# 2. TARGET STATE (What We're Building)

## 2.1 Tab Changes

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              TAB RESTRUCTURE                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  CURRENT                                          FUTURE
  ───────                                          ──────

  [ Home ]                            ──►          [ Home ]           KEEP (no changes)

  [ Raids ]                           ──►          [ Raids ]          ENHANCE
                                                   └── Add: Link SR event, consumable check

  [ Attendance ]                      ──►          [ Attendance ]     KEEP (already has SR+)

  [ Loot ]                            ──►          [ Loot ]           KEEP (shows loot drops)

  [ Upload Loot ]                     ──►          [ SR+ ]            REPURPOSE
                                                   └── Player SR+ Dashboard
                                                   └── View credits, history, bonuses

  [ Combat Logs ]                     ──►          [ Combat Logs ]    KEEP (no changes)

  [ Analysis ]                        ──►          [ Analysis ]       KEEP (no changes)

                                      ──►          [ Admin ]          NEW (password protected)
                                                   └── Run management
                                                   └── Credit overrides
                                                   └── Finalize distributions


  FINAL TAB ORDER:
  ┌────────┬─────────┬────────────┬────────┬────────┬──────────────┬────────────┬─────────┐
  │  Home  │  Raids  │ Attendance │  Loot  │  SR+   │ Combat Logs  │  Analysis  │  Admin  │
  └────────┴─────────┴────────────┴────────┴────────┴──────────────┴────────────┴─────────┘
                                              │                                       │
                                         New tab                              Password
                                         (replaces                            protected
                                         Upload Loot)
```

## 2.2 Data Source Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES & INTEGRATION                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘


                    ┌────────────────────────────────────────────────────────────┐
                    │                    DISCORD                                 │
                    │              (Raid-Helper API)                             │
                    │                                                            │
                    │  • Raid schedule                ✓ ALREADY WORKS            │
                    │  • Signup list                  ✓ ALREADY WORKS            │
                    │  • Signup timestamps            ✓ ALREADY WORKS            │
                    │  • 24hr eligibility             ✓ ALREADY WORKS            │
                    │                                                            │
                    └────────────────────────┬───────────────────────────────────┘
                                             │
                                             │ Pulls signups
                                             ▼
┌───────────────────────────┐     ┌─────────────────────────────┐     ┌───────────────────────────┐
│       RAIDRES.TOP         │     │                             │     │       COMBAT LOGS         │
│         API               │     │      TBC WEBSITE            │     │         (Upload)          │
│                           │     │                             │     │                           │
│  ✗ NOT INTEGRATED YET     │────►│   Linux: 132.226.72.121     │◄────│  ✓ ALREADY WORKS          │
│                           │     │   Deno KV Database          │     │                           │
│  Need to add:             │     │                             │     │  Provides:                │
│  • Fetch SR lists         │     │   Stores:                   │     │  • Consumables ✓          │
│  • Get item IDs           │     │   • Attendance ✓            │     │  • Loot drops ✓           │
│  • Match to players       │     │   • Combat logs ✓           │     │  • Attendance ✓           │
│                           │     │   • SR+ credits (NEW)       │     │  • CC/Dispels ✓           │
│  API: /api/events/{ID}    │     │   • Runs (NEW)              │     │                           │
│                           │     │                             │     │                           │
└───────────────────────────┘     └──────────────┬──────────────┘     └───────────────────────────┘
                                                 │
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
          ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
          │   SR+ Credits   │          │   Run Records   │          │  Item Database  │
          │      (NEW)      │          │      (NEW)      │          │     (NEW)       │
          │                 │          │                 │          │                 │
          │ Per player      │          │ Progression/    │          │ Item ID →       │
          │ Per item        │          │ Farm flag       │          │ Item Name       │
          │ Times SR'd      │          │ SR Event ID     │          │ Item Icon       │
          │ Current bonus   │          │ Combat log link │          │                 │
          │ Hard reserve?   │          │ Loot distrib    │          │ Source: Combat  │
          │                 │          │ Credit changes  │          │ logs have names │
          └─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

# 3. COMPLETE DATA FLOW

## 3.1 Pre-Raid Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PRE-RAID FLOW                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  STEP 1: Raid Posted in Discord
  ══════════════════════════════

  Discord                          Raid-Helper                      TBC Website
     │                                 │                                │
     │  Officer posts raid             │                                │
     │  w/ SR link in description      │                                │
     │─────────────────────────────────►                                │
     │                                 │                                │
     │                                 │  Raid-Helper stores event      │
     │                                 │  with signup timestamps        │
     │                                 │                                │
     │                                 │  ◄──────────────────────────── │ Website fetches
     │                                 │        GET /api/v2/events      │ from Raid-Helper
     │                                 │  ────────────────────────────► │
     │                                 │                                │
     │                                 │        Returns signups         │
     │                                 │        with entryTime          │


  STEP 2: Admin Links SR Event (NEW)
  ═══════════════════════════════════

  Admin goes to /admin/runs/new:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  CREATE NEW RUN                                                             │
  │                                                                             │
  │  Raid-Helper Event:  [Dec 10 BWL ▼]     ← Dropdown of upcoming raids        │
  │  RaidRes Event ID:   [SG8ZWX      ]     ← Paste from SR URL                 │
  │  Run Type:           (●) Progression  ( ) Farm                              │
  │                                                                             │
  │  [Fetch SR Data]   [Create Run]                                             │
  └─────────────────────────────────────────────────────────────────────────────┘

  When "Fetch SR Data" clicked:

  TBC Website                       RaidRes.top                       Database
     │                                   │                                │
     │  GET /api/events/SG8ZWX           │                                │
     │──────────────────────────────────►│                                │
     │                                   │                                │
     │  Returns:                         │                                │
     │  {                                │                                │
     │    softReserves: [                │                                │
     │      { player: "Keenhoof",        │                                │
     │        items: [19364] },          │                                │
     │      { player: "Dirtmcskrt",      │                                │
     │        items: [19364] }           │                                │
     │    ]                              │                                │
     │  }                                │                                │
     │◄──────────────────────────────────│                                │
     │                                                                    │
     │  Lookup item names from combat log history or item DB              │
     │  19364 → "Ashkandi, Greatsword of the Brotherhood"                 │
     │                                                                    │
     │  Check current SR+ credits for each player                         │
     │────────────────────────────────────────────────────────────────────►
     │                                                                    │
     │  Keenhoof has SR'd Ashkandi 3 times before → +30 bonus            │
     │  Dirtmcskrt has SR'd Ashkandi 2 times before → +20 bonus          │
     │◄────────────────────────────────────────────────────────────────────


  STEP 3: Eligibility Calculation
  ═══════════════════════════════

  For each player, check:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                                                                             │
  │  PLAYER          │ 24HR SIGNUP │ FLASK │ ELIXIR │ SR ITEM     │ ELIGIBLE   │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Keenhoof        │ ✓ 36 hrs    │ ?     │ ?      │ Ashkandi    │ ? Pending  │
  │  Dirtmcskrt      │ ✓ 28 hrs    │ ?     │ ?      │ Ashkandi    │ ? Pending  │
  │  Motguts         │ ✗ 12 hrs    │ ?     │ ?      │ Mish'undare │ ✗ Late     │
  │                                                                             │
  │  Note: Flask/Elixir can only be checked AFTER combat log uploaded          │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 During-Raid Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DURING-RAID FLOW                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  Combat log is being written as raid happens.
  Contains:
  ├── Buff events (flasks, elixirs applied)
  ├── Item events ("Keenhoof receives [Ashkandi, Greatsword of the Brotherhood]")
  └── All combat data


  AFTER RAID: Upload Combat Log
  ═════════════════════════════

  /logs page (existing)
     │
     │  Upload WoWCombatLog.txt
     ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  COMBAT LOG PARSER (already built)                                         │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │  Extracts:                                                                  │
  │  ├── Consumables per player (flask, elixir, potion, food)                  │
  │  ├── Loot drops (item name, player who received)                           │
  │  ├── Attendance (who was in the raid)                                      │
  │  ├── CC abilities                                                          │
  │  └── Dispels                                                               │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
     │
     │  Saves to Deno KV
     ▼
  ["combat_logs", log_id] = {
    playerStats: [...],
    loot: [
      { player: "Keenhoof", itemName: "Ashkandi, Greatsword of the Brotherhood" },
      { player: "Whora", itemName: "Chromatic Boots" }
    ]
  }
```

## 3.3 Post-Raid Admin Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   POST-RAID ADMIN FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  Admin goes to /admin/runs/[run_id]:

  STEP 1: Link Combat Log
  ════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  RUN: BWL - Dec 10, 2025                                                    │
  │                                                                             │
  │  Link Combat Log:  [BWL Dec 10 - 42 players ▼]   [Link]                    │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘

  When linked, system pulls consumable data:

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  ELIGIBILITY (Updated with consumables)                                     │
  │                                                                             │
  │  PLAYER      │ 24HR │ FLASK │ ELIXIR │ SR+ ELIGIBLE │ BONUS │ SR ITEM      │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Keenhoof    │  ✓   │   ✓   │   ✓    │   ✓ YES      │  +30  │ Ashkandi     │
  │  Dirtmcskrt  │  ✓   │   ✓   │   ✓    │   ✓ YES      │  +20  │ Ashkandi     │
  │  Motguts     │  ✗   │   ✓   │   ✓    │   ✗ LATE     │  +50  │ Mish'undare  │
  │  Whora       │  ✓   │   ✗   │   ✗    │   ✗ NO CONS  │  +20  │ Chrom Boots  │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘


  STEP 2: Match Loot to SR
  ════════════════════════

  System auto-matches loot drops from combat log to SR'd items:

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LOOT DISTRIBUTION                                                          │
  │                                                                             │
  │  From combat log, these items dropped:                                      │
  │                                                                             │
  │  ITEM              │ RECEIVED BY │ SR'd BY          │ USED SR+ │ ACTION     │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Ashkandi          │ Keenhoof    │ Keenhoof (+30)   │   [✓]    │ [Won]      │
  │                    │             │ Dirtmcskrt (+20) │   [✓]    │ [Lost]     │
  │                    │             │ Motguts (LATE)   │   [ ]    │ [N/A]      │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Chromatic Boots   │ Whora       │ Whora (NO CONS)  │   [ ]    │ [No SR+]   │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Elementium Ore    │ (none)      │ (no one SR'd)    │   ---    │ [DE'd]     │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘


  STEP 3: Enter Rolls (if not in combat log)
  ══════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  ROLL ENTRY FOR: Ashkandi                                                   │
  │                                                                             │
  │  PLAYER       │ BASE ROLL │ SR+ BONUS │ FINAL ROLL │ RESULT                │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Keenhoof     │ [72    ]  │    +30    │    102     │ ★ WINNER              │
  │  Dirtmcskrt   │ [88    ]  │    +20    │    108     │   Highest but lost?   │
  │                                                                             │
  │  Wait - Dirtmcskrt had higher final roll (108 > 102)?                       │
  │  Admin can correct: Actually Dirtmcskrt won, not Keenhoof                   │
  │                                                                             │
  │  [Override Winner: Dirtmcskrt ▼]                                            │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘


  STEP 4: Finalize Run
  ════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  CREDIT CHANGES PREVIEW                                                     │
  │                                                                             │
  │  When you finalize, these changes will be applied:                          │
  │                                                                             │
  │  PLAYER       │ ITEM        │ CURRENT │ CHANGE  │ NEW VALUE                │
  │  ─────────────────────────────────────────────────────────────────────────  │
  │  Dirtmcskrt   │ Ashkandi    │   +20   │ BURNED  │   0 (won item)           │
  │  Keenhoof     │ Ashkandi    │   +30   │  +10    │  +40 (lost, keep going)  │
  │  Motguts      │ Mish'undare │   +50   │   0     │  +50 (not eligible)      │
  │  Whora        │ Chrom Boots │   +20   │   0     │  +20 (not eligible)      │
  │                                                                             │
  │  [Finalize Run]                                                             │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘

  After finalize:
  ├── SR+ credits updated in database
  ├── History entry added for each player
  ├── Run marked as finalized
  └── Cannot be edited without admin override
```

---

# 4. DATABASE SCHEMA

## 4.1 Existing Keys (Keep As-Is)

```
["attendance", id]                    ← Already has srPlusEligible!
["raids-saved", raidId]               ← Already has SR+ count!
["combat_logs", logId]                ← Already has loot drops!
```

## 4.2 New Keys (To Add)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "credits", {player_name}, {item_id}]                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  {                                                                                             │
│    playerName: "Keenhoof",                                                                     │
│    itemId: 19364,                                                                              │
│    itemName: "Ashkandi, Greatsword of the Brotherhood",                                        │
│    timesSRd: 4,                                                                                │
│    currentBonus: 40,                                                                           │
│    isHardReserve: false,   // True when timesSRd >= 5                                          │
│    firstSRDate: "2025-11-12T00:00:00Z",                                                        │
│    lastUpdated: "2025-12-08T00:00:00Z"                                                         │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "history", {player_name}]                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  {                                                                                             │
│    playerName: "Keenhoof",                                                                     │
│    entries: [                                                                                  │
│      {                                                                                         │
│        runId: "bwl-2025-12-10",                                                               │
│        date: "2025-12-10",                                                                    │
│        raid: "BWL",                                                                           │
│        itemName: "Ashkandi",                                                                  │
│        bonusApplied: 30,                                                                      │
│        baseRoll: 72,                                                                          │
│        finalRoll: 102,                                                                        │
│        won: false,                                                                            │
│        wonBy: "Dirtmcskrt"                                                                    │
│      }                                                                                         │
│    ]                                                                                           │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "runs", {run_id}]                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  {                                                                                             │
│    runId: "bwl-2025-12-10",                                                                   │
│    raidHelperId: "12345",           // Links to Raid-Helper event                              │
│    raidResEventId: "SG8ZWX",        // Links to RaidRes.top                                   │
│    combatLogId: "abc123",           // Links to uploaded combat log                           │
│    raidType: "BWL",                                                                           │
│    raidDate: "2025-12-10",                                                                    │
│    isProgression: true,                                                                       │
│    status: "finalized",             // "draft" | "active" | "finalized"                       │
│    lootDistribution: [                                                                        │
│      {                                                                                         │
│        itemName: "Ashkandi",                                                                  │
│        winner: "Dirtmcskrt",                                                                  │
│        usedSRPlus: true,                                                                      │
│        rolls: {                                                                               │
│          "Keenhoof": { base: 72, bonus: 30, final: 102 },                                     │
│          "Dirtmcskrt": { base: 88, bonus: 20, final: 108 }                                    │
│        }                                                                                       │
│      }                                                                                         │
│    ],                                                                                          │
│    creditChanges: [                                                                            │
│      { player: "Dirtmcskrt", item: "Ashkandi", change: "burned" },                            │
│      { player: "Keenhoof", item: "Ashkandi", change: "+10" }                                  │
│    ],                                                                                          │
│    finalizedAt: "2025-12-10T23:00:00Z",                                                       │
│    finalizedBy: "Ryan"                                                                        │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "config"]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  {                                                                                             │
│    bonusPerSR: 10,                  // +10 per SR                                              │
│    hardReserveThreshold: 5,         // After 5 SRs = hard reserve                              │
│    signupHoursRequired: 24,         // 24hr signup requirement                                 │
│    requireFlaskOnProgression: true,                                                            │
│    requireElixirOnProgression: true,                                                           │
│    adminPassword: "hashed_password"                                                            │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. UI MOCKUPS

## 5.1 SR+ Dashboard (New Tab - Replaces Upload Loot)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [ Home ]  [ Raids ]  [ Attendance ]  [ Loot ]  [ SR+ ]  [ Combat Logs ]  [ Analysis ]         │
│                                                    ▲                                            │
│                                               You are here                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  SR+ DASHBOARD                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  SEARCH PLAYER: [____________________] [Search]                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  ACTIVE SR+ BONUSES                                                                            │
│  ───────────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                                 │
│  PLAYER       │ ITEM                    │ TIMES SR'D │ BONUS │ STATUS                         │
│  ────────────────────────────────────────────────────────────────────────────────────────────  │
│  Motguts      │ Mish'undare             │     5      │  HR   │ ★ HARD RESERVE                 │
│  Keenhoof     │ Ashkandi                │     4      │  +40  │ 1 more = HR                    │
│  Dirtmcskrt   │ Ashkandi                │     3      │  +30  │ Building...                    │
│  Whora        │ Chromatic Boots         │     2      │  +20  │ Building...                    │
│  Aradune      │ Rejuvenating Gem        │     1      │  +10  │ Just started                   │
│                                                                                                 │
│                                                                                                 │
│  RECENT ACTIVITY                                                                               │
│  ───────────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                                 │
│  Dec 7   │ BWL  │ Dirtmcskrt │ Ashkandi     │ +20 → BURNED │ WON ITEM!                        │
│  Dec 7   │ BWL  │ Keenhoof   │ Ashkandi     │ +30 → +40    │ Lost to Dirtmcskrt               │
│  Dec 3   │ AQ40 │ Motguts    │ Mish'undare  │ HARD RES     │ WON ITEM!                        │
│                                                                                                 │
│                                                                                                 │
│  LEADERBOARD: Longest Streaks                                                                  │
│  ───────────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                                 │
│  🥇 Motguts     │ 5 weeks on Mish'undare │ HARD RESERVE ACHIEVED                              │
│  🥈 Keenhoof    │ 4 weeks on Ashkandi                                                          │
│  🥉 Dirtmcskrt  │ 3 weeks on Ashkandi                                                          │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Admin Panel (New Tab - Password Protected)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [ Home ]  [ Raids ]  [ Attendance ]  [ Loot ]  [ SR+ ]  [ Combat Logs ]  [ Analysis ] [Admin] │
│                                                                                           ▲     │
│                                                                                     You are here│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  ⚙️ ADMIN PANEL                                                              [Logout]          │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  [Runs]  [Players]  [Settings]                                                                 │
│                                                                                                 │
│  ───────────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                                 │
│  RECENT RUNS                                                           [+ Create New Run]      │
│                                                                                                 │
│  DATE      │ RAID │ TYPE        │ STATUS      │ ACTIONS                                       │
│  ────────────────────────────────────────────────────────────────────────────────────────────  │
│  Dec 10    │ BWL  │ Progression │ ⏳ Draft     │ [Edit] [Finalize]                             │
│  Dec 7     │ AQ40 │ Farm        │ ✓ Finalized │ [View]                                        │
│  Dec 3     │ MC   │ Farm        │ ✓ Finalized │ [View]                                        │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Run Edit Page (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ ADMIN > RUNS > BWL - Dec 10                                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  RUN CONFIGURATION                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Raid:             BWL - Dec 10, 2025 (from Raid-Helper)                                │   │
│  │  RaidRes Event:    [SG8ZWX         ] [Fetch SR Data]                                    │   │
│  │  Combat Log:       [Dec 10 BWL - 42 players ▼] [Link]                                   │   │
│  │  Run Type:         (●) Progression  ( ) Farm                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  ELIGIBILITY                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  PLAYER      │ 24HR │ FLASK │ ELIXIR │ ELIGIBLE │ SR ITEM      │ CURRENT BONUS         │   │
│  │  ────────────────────────────────────────────────────────────────────────────────────   │   │
│  │  Keenhoof    │  ✓   │   ✓   │   ✓    │  ✓ YES   │ Ashkandi     │ +30                   │   │
│  │  Dirtmcskrt  │  ✓   │   ✓   │   ✓    │  ✓ YES   │ Ashkandi     │ +20                   │   │
│  │  Motguts     │  ✗   │   ✓   │   ✓    │  ✗ LATE  │ Mish'undare  │ +50 (HR)              │   │
│  │  Whora       │  ✓   │   ✗   │   ✗    │  ✗ CONS  │ Chrom Boots  │ +20                   │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  LOOT DISTRIBUTION                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  ITEM            │ DROPPED │ SR'd BY              │ WINNER    │ USED SR+ │ DE'd       │   │
│  │  ────────────────────────────────────────────────────────────────────────────────────   │   │
│  │  Ashkandi        │   ✓     │ Keenhoof, Dirtmcskrt │ [_____▼]  │   [✓]    │   [ ]      │   │
│  │  Chromatic Boots │   ✓     │ Whora                │ [Whora▼]  │   [ ]    │   [ ]      │   │
│  │  Elementium Ore  │   ✓     │ (none)               │ [---  ▼]  │   ---    │   [✓]      │   │
│  │                                                                                         │   │
│  │  [+ Add Item Manually]                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  ROLL ENTRY (For items with multiple SR)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  ASHKANDI                                                                               │   │
│  │                                                                                         │   │
│  │  PLAYER       │ BASE ROLL │ SR+ BONUS │ FINAL │                                        │   │
│  │  ────────────────────────────────────────────────────────────────────────────────────   │   │
│  │  Keenhoof     │ [72    ]  │    +30    │  102  │                                        │   │
│  │  Dirtmcskrt   │ [88    ]  │    +20    │  108  │  ← Highest                             │   │
│  │                                                                                         │   │
│  │  Winner: Dirtmcskrt (108)                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  CREDIT PREVIEW                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Dirtmcskrt  │ Ashkandi   │ +20 → BURNED (won)                                         │   │
│  │  Keenhoof    │ Ashkandi   │ +30 → +40 (lost)                                           │   │
│  │  Motguts     │ Mish       │ +50 → +50 (not eligible)                                   │   │
│  │  Whora       │ Boots      │ +20 → +20 (not eligible)                                   │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
│  [Save Draft]                                              [Finalize Run & Apply Credits]      │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. IMPLEMENTATION PLAN

## Phase 1: Foundation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ ] 1.1  Create /sr-plus route (replace /upload)                                              │
│  [ ] 1.2  Create /admin route (password protected)                                             │
│  [ ] 1.3  Create Deno KV schema for sr_plus_credits, sr_plus_history, sr_plus_runs             │
│  [ ] 1.4  Create basic SR+ dashboard (read-only, display existing data)                        │
│  [ ] 1.5  Create admin run list page                                                           │
│  [ ] 1.6  Create admin run edit page (manual credit entry)                                     │
│  [ ] 1.7  Update Nav.tsx to replace "Upload Loot" with "SR+"                                   │
│                                                                                                 │
│  OUTCOME: Officers can manually enter SR+ credits. Players can view their status.              │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 2: RaidRes Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: RAIDRES INTEGRATION                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ ] 2.1  Test RaidRes.top API - verify response structure                                     │
│  [ ] 2.2  Create /api/sr-plus/raidres.ts proxy endpoint                                        │
│  [ ] 2.3  Add "Fetch SR Data" to admin run page                                                │
│  [ ] 2.4  Build item name lookup (use names from combat logs)                                  │
│  [ ] 2.5  Auto-populate SR list from RaidRes data                                              │
│                                                                                                 │
│  OUTCOME: Paste RaidRes URL, get full SR list with player names and items.                     │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 3: Combat Log Linking

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: COMBAT LOG LINKING                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ ] 3.1  Add combat log selector to run edit page                                             │
│  [ ] 3.2  Pull consumable data for eligibility check                                           │
│  [ ] 3.3  Match loot drops to SR'd items                                                       │
│  [ ] 3.4  Auto-populate loot distribution from combat log                                      │
│  [ ] 3.5  Validate attendance against signups                                                  │
│                                                                                                 │
│  OUTCOME: Link combat log, auto-check consumables, auto-match loot.                            │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 4: Credit Management

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: CREDIT MANAGEMENT                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ ] 4.1  Roll entry UI (base roll input, auto-calculate final)                                │
│  [ ] 4.2  Credit preview (show what will change)                                               │
│  [ ] 4.3  Finalize run workflow                                                                │
│  [ ] 4.4  Auto-update credits on finalize                                                      │
│  [ ] 4.5  Credit burn for winners, +10 for losers                                              │
│  [ ] 4.6  Hard reserve detection (5+ SRs)                                                      │
│                                                                                                 │
│  OUTCOME: Full SR+ workflow from SR to credit update.                                          │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 5: Polish

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: POLISH                                                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ ] 5.1  Player history page (/sr-plus/player/[name])                                         │
│  [ ] 5.2  Leaderboard (longest streaks, most hard reserves)                                    │
│  [ ] 5.3  Admin player override page                                                           │
│  [ ] 5.4  Mobile responsive design pass                                                        │
│  [ ] 5.5  Audit log (track all credit changes)                                                 │
│                                                                                                 │
│  OUTCOME: Complete, polished SR+ system.                                                       │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. OPEN QUESTIONS

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  QUESTIONS TO RESOLVE                                                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  1. ROLL DATA                                                                                   │
│     Are roll results in combat logs? Or must be manually entered?                              │
│     → Check a combat log for "/roll" entries                                                   │
│                                                                                                 │
│  2. RAIDRES API                                                                                 │
│     ✓ RESOLVED - See Section 8 below for complete API documentation                           │
│                                                                                                 │
│  3. HARD RESERVE THRESHOLD                                                                      │
│     4 or 5 times before hard reserve?                                                          │
│     → Make configurable in settings                                                            │
│                                                                                                 │
│  4. ADMIN AUTH                                                                                  │
│     Simple password or Discord OAuth?                                                          │
│     → Start with password, can upgrade later                                                   │
│                                                                                                 │
│  5. ITEM DATABASE                                                                               │
│     Build from combat logs or scrape Turtle WoW?                                               │
│     → Combat logs already have item names, start there                                         │
│     → Icon format: wow.zamimg.com/images/wow/icons/large/{icon_lowercase}.jpg                  │
│     → Turtle WoW DB uses: INV_Jewelry_Ring_39 format for icon names                            │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. RAIDRES API DOCUMENTATION

## 8.1 API Endpoint

```
GET https://raidres.top/api/events/{EVENT_ID}

Example: https://raidres.top/api/events/XZQNM6
         https://raidres.top/api/events/SG8ZWX
```

## 8.2 Response Structure

```json
{
  "reference": "XZQNM6",
  "raidId": 110,
  "startTime": "2026-04-01T00:00:00.000Z",
  "description": "Event description with SR rules",
  "settings": {
    "reserveLimit": 2,
    "srPlusIncrease": 10,
    "allowDuplicates": true,
    "allowComments": true
  },
  "reservations": [
    {
      "raidItemId": 7093,
      "character": {
        "name": "Naite",
        "class": "Warrior",
        "specialization": "Fury"
      },
      "user": "naite7894",
      "srPlus": 21,
      "isInvalid": true,
      "comment": "optional comment",
      "createdAt": "2025-12-06T..."
    }
  ],
  "advancedHrItems": [
    {
      "raidItemId": 6710,
      "isHardReserved": true
    }
  ]
}
```

## 8.3 Key Fields

| Field | Description |
|-------|-------------|
| `reference` | Event ID used in URLs (e.g., XZQNM6) |
| `raidId` | Internal raid template ID |
| `reservations[].raidItemId` | Internal item ID (NOT WoW item ID) |
| `reservations[].character.name` | Player name |
| `reservations[].character.class` | Player class |
| `reservations[].srPlus` | SR+ bonus tracked by RaidRes |
| `reservations[].isInvalid` | If SR became invalid (edited, etc.) |
| `advancedHrItems[]` | Items marked as hard reserved |

## 8.4 Important Notes

1. **raidItemId is NOT WoW Item ID** - It's an internal RaidRes ID. Need to build mapping table or get item names from combat logs.

2. **srPlus is tracked by RaidRes** - RaidRes has its own SR+ tracking (default +10 per SR). This can be cross-referenced with our system.

3. **Cross-reference with Raid-Helper** - Match player names from RaidRes reservations with Raid-Helper signups to verify 24-hour eligibility.

4. **Item Name Resolution Options**:
   - Build static mapping table from known raid loot
   - Match item drops in combat logs by item name
   - Scrape item names from RaidRes web page HTML

## 8.5 Integration Flow

```
1. Admin pastes RaidRes event ID (e.g., XZQNM6)
2. Fetch: GET https://raidres.top/api/events/XZQNM6
3. Extract reservations with player names + raidItemId
4. Match raidItemId to item names (from our item database or combat log)
5. Cross-reference players with Raid-Helper signups (24hr check)
6. Display eligibility table with SR+ bonuses
```

---

# 9. ITEM ICON SOURCES

## 9.1 Turtle WoW Database

```
URL Format: https://database.turtlecraft.gg/?item={ITEM_ID}

Icon Name Extraction:
- Page contains: Icon.create('INV_Jewelry_Ring_39', ...)
- Icon format: INV_{Category}_{Name}_{Number}
```

## 9.2 WoW Icon CDN

```
URL Format: https://wow.zamimg.com/images/wow/icons/large/{icon_lowercase}.jpg

Example: https://wow.zamimg.com/images/wow/icons/large/inv_jewelry_ring_39.jpg
```

## 9.3 Item Database Strategy

Build a local item database with:
- Item ID (WoW item ID)
- Item Name
- Icon name (for CDN lookup)
- Quality (epic, legendary, etc.)
- Source raid(s)

Populate from:
1. Combat logs (already parsed - have item names)
2. Static list of known raid drops
3. Turtle WoW database scraping (if needed)

---

# 10. WEBSITE INFRASTRUCTURE

## 10.1 URLs

| Service | URL |
|---------|-----|
| Website | https://tbcguild.duckdns.org/ |
| SR+ Dashboard | https://tbcguild.duckdns.org/sr-plus |
| Admin Panel | https://tbcguild.duckdns.org/admin |
| HonorSpy | https://tbcguild.duckdns.org/honorspy/ |

## 10.2 Server Details

| Component | Value |
|-----------|-------|
| Server IP | 132.226.72.121 |
| Port | 8000 |
| Service | tbc-website.service |
| Database | /home/opc/tbc-website/data.db (Deno KV) |
| Admin Password | thralls2024 |

## 10.3 External APIs

| Service | API Endpoint |
|---------|--------------|
| Raid-Helper | https://raid-helper.dev/api/v2/servers/{SERVER_ID}/events |
| RaidRes | https://raidres.top/api/events/{EVENT_ID} |
| Turtle WoW DB | https://database.turtlecraft.gg/?item={ITEM_ID} |

---

**Last Updated**: 2025-12-08
**READY TO BUILD** when you approve this architecture.

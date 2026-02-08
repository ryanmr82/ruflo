# SR+ LOOT SYSTEM - COMPLETE ARCHITECTURE
## Version 2.0 - Comprehensive Design Document

---

# TABLE OF CONTENTS
1. [Current State Analysis](#1-current-state-analysis)
2. [Future State Architecture](#2-future-state-architecture)
3. [Website Restructure](#3-website-restructure)
4. [Complete Data Flow](#4-complete-data-flow)
5. [API Integration Map](#5-api-integration-map)
6. [Database Design](#6-database-design)
7. [UI/UX Design](#7-uiux-design)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

# 1. CURRENT STATE ANALYSIS

## 1.1 What Exists Today

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT WEBSITE STRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TABS:  [ HOME ]  [ ANALYSIS ]  [ LOOT ]  [ LOGS ]                        │
│                                                                             │
│   HOME                                                                      │
│   └── Guild info, static content                                           │
│                                                                             │
│   ANALYSIS                                                                  │
│   └── Combat log parsing                                                   │
│   └── Consumables, deaths, CC, dispels per player                          │
│   └── Filter by raid, log, player                                          │
│                                                                             │
│   LOOT                                                                      │
│   └── Manual CSV upload (PROBLEMATIC - will be replaced)                   │
│   └── Shows loot history                                                   │
│                                                                             │
│   LOGS                                                                      │
│   └── Combat log upload                                                    │
│   └── Auto-parses consumables, loot, attendance                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Current Data Sources

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   COMBAT LOGS (WoWCombatLog.txt)                                           │
│   ├── ✓ Consumable usage (flasks, elixirs, potions, food)                  │
│   ├── ✓ Deaths                                                             │
│   ├── ✓ CC abilities (kicks, polymorphs, stuns, fears)                     │
│   ├── ✓ Dispels                                                            │
│   ├── ✓ Loot drops ("Player receives [Item]")                              │
│   ├── ✓ Attendance (who was in the raid)                                   │
│   ├── ? Roll results (NEED TO VERIFY - may or may not be in logs)          │
│   └── ✗ SR information (not in logs)                                       │
│                                                                             │
│   MANUAL CSV UPLOAD                                                         │
│   └── Currently used for loot history                                      │
│   └── WILL BE DEPRECATED - replaced by SR+ system                          │
│                                                                             │
│   DISCORD (NOT YET INTEGRATED)                                             │
│   ├── Signup sheets with timestamps                                        │
│   └── SR URLs embedded in signup posts                                     │
│                                                                             │
│   RAIDRES.TOP (NOT YET INTEGRATED)                                         │
│   └── SR lists per event                                                   │
│   └── Item IDs for each player's soft reserve                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.3 Problems With Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT PROBLEMS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. LOOT PAGE IS BROKEN                                                   │
│      └── Manual CSV upload doesn't scale                                   │
│      └── No connection to SR system                                        │
│      └── No roll tracking                                                  │
│                                                                             │
│   2. NO SR TRACKING                                                        │
│      └── Can't see who's been SR'ing what                                  │
│      └── No history of SR attempts                                         │
│      └── No bonus accumulation                                             │
│                                                                             │
│   3. DISCONNECTED DATA                                                     │
│      └── Combat logs don't connect to SR lists                             │
│      └── Loot drops don't connect to who rolled                            │
│      └── Signup times not tracked                                          │
│                                                                             │
│   4. NO ADMIN TOOLS                                                        │
│      └── Can't mark progression vs farm runs                               │
│      └── Can't manually adjust SR+ credits                                 │
│      └── Can't verify eligibility                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. FUTURE STATE ARCHITECTURE

## 2.1 High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SR+ SYSTEM ARCHITECTURE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────────┐
                                    │      DISCORD         │
                                    │                      │
                                    │  • Signup Sheets     │
                                    │  • Signup Timestamps │
                                    │  • SR URLs           │
                                    └──────────┬───────────┘
                                               │
                                               │ (Manual input or future bot)
                                               │
                                               ▼
┌──────────────────────┐           ┌──────────────────────┐           ┌──────────────────────┐
│    RAIDRES.TOP       │           │                      │           │   TURTLE WOW         │
│        API           │◄─────────►│    TBC WEBSITE       │◄─────────►│   ITEM DATABASE      │
│                      │           │                      │           │                      │
│  GET /api/events/ID  │           │  Linux Server        │           │  Item ID → Name      │
│                      │           │  132.226.72.121      │           │  Item ID → Icon      │
│  Returns:            │           │                      │           │  Item ID → Stats     │
│  • Player SRs        │           │  Routes:             │           │                      │
│  • Item IDs          │           │  • /                 │           │  Source: TBD         │
│  • Hard reserves     │           │  • /analysis         │           │  • database.turtle-  │
│                      │           │  • /sr-plus          │           │    wow.org           │
└──────────────────────┘           │  • /sr-plus/admin    │           │  • Addon exports     │
                                   │  • /api/logs         │           │  • Community JSON    │
                                   │  • /api/sr-plus      │           │                      │
                                   │                      │           └──────────────────────┘
                                   └──────────┬───────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
              ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
              │   COMBAT LOGS    │ │    DENO KV       │ │   RAW LOG FILES  │
              │    (Upload)      │ │    DATABASE      │ │    (Storage)     │
              │                  │ │                  │ │                  │
              │  WoWCombatLog.txt│ │  /home/opc/tbc-  │ │  /home/opc/tbc-  │
              │                  │ │  website/data.db │ │  website/logs/   │
              │  Parsed for:     │ │                  │ │                  │
              │  • Consumables   │ │  Stores:         │ │  *.txt files     │
              │  • Loot drops    │ │  • combat_logs   │ │  For re-parsing  │
              │  • Attendance    │ │  • sr_plus_*     │ │                  │
              │  • CC/Dispels    │ │  • loot_history  │ │                  │
              └──────────────────┘ │  • runs          │ └──────────────────┘
                                   │  • items         │
                                   └──────────────────┘
```

## 2.2 Data Flow - Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 COMPLETE DATA FLOW                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
                                     PHASE 1: PRE-RAID
═══════════════════════════════════════════════════════════════════════════════════════════════════

  OFFICER POSTS RAID                    PLAYERS SIGN UP                  SYSTEM TRACKS
  IN DISCORD                            ON RAIDRES.TOP                   SIGNUP TIME
        │                                      │                              │
        │  "BWL Tuesday 8pm"                   │  Select SR item              │
        │  "SR Link: raidres.top/..."          │                              │
        │                                      │                              │
        ▼                                      ▼                              ▼
  ┌─────────────┐                       ┌─────────────┐                ┌─────────────┐
  │  Discord    │                       │  RaidRes    │                │  TBC Site   │
  │  Signup     │ ─────────────────────►│  .top       │ ──────────────►│  Database   │
  │  Sheet      │    SR URL embedded    │             │   API Fetch    │             │
  └─────────────┘                       └─────────────┘                └─────────────┘
                                                                              │
                                                                              ▼
                                                                       ┌─────────────┐
                                                                       │ ELIGIBILITY │
                                                                       │   CHECK     │
                                                                       │             │
                                                                       │ • 24hr sig? │
                                                                       │ • Has SR?   │
                                                                       └─────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
                                    PHASE 2: DURING RAID
═══════════════════════════════════════════════════════════════════════════════════════════════════

  COMBAT LOG                            LOOT DROPS                       ROLLS HAPPEN
  BEING WRITTEN                         IN RAID                          (Roll4 Addon)
        │                                      │                              │
        │  Player buffs                        │  Boss drops Ashkandi         │  /roll 1-100
        │  Player deaths                       │                              │
        │  Player uses items                   │                              │
        ▼                                      ▼                              ▼
  ┌─────────────┐                       ┌─────────────┐                ┌─────────────┐
  │  Combat     │                       │  Loot       │                │  Roll       │
  │  Log File   │                       │  Master     │                │  Results    │
  │             │                       │  Awards     │                │             │
  └─────────────┘                       └─────────────┘                └─────────────┘
        │                                      │                              │
        │                                      │                              │
        └──────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   COMBAT    │
                                        │   LOG       │
                                        │   UPLOAD    │
                                        └─────────────┘
                                               │
                                               ▼
                           ┌───────────────────────────────────────┐
                           │           LOG PARSER                  │
                           ├───────────────────────────────────────┤
                           │                                       │
                           │  EXTRACTS:                            │
                           │  • Consumables per player             │
                           │  • Loot drops (item → player)         │
                           │  • Attendance list                    │
                           │  • CC/Dispels                         │
                           │  • Deaths                             │
                           │  • ? Roll results (if in log)         │
                           │                                       │
                           └───────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
                                    PHASE 3: POST-RAID
═══════════════════════════════════════════════════════════════════════════════════════════════════

  ADMIN REVIEWS                         MARKS SR+ USAGE                  CREDITS UPDATE
  LOOT DISTRIBUTION                     AND WINNERS                      IN DATABASE
        │                                      │                              │
        ▼                                      ▼                              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                              ADMIN PANEL                                        │
  ├─────────────────────────────────────────────────────────────────────────────────┤
  │                                                                                 │
  │   RUN: BWL - Dec 10, 2025                     TYPE: [●] Progression  [ ] Farm   │
  │   SR URL: https://raidres.top/events/ABC123   [Fetch SR Data]                   │
  │                                                                                 │
  │   ┌─────────────────────────────────────────────────────────────────────────┐  │
  │   │  LOOT DISTRIBUTION                                                      │  │
  │   ├─────────────────────────────────────────────────────────────────────────┤  │
  │   │                                                                         │  │
  │   │   ITEM              WINNER      SR BONUS    USED SR+    ACTION          │  │
  │   │   ─────────────────────────────────────────────────────────────────     │  │
  │   │   Ashkandi          Keenhoof    +30         [✓]         [✓ Burn]        │  │
  │   │   Chromatic Boots   Whora       +10         [✓]         [✓ Burn]        │  │
  │   │   Elementium Ore    ---         ---         ---         [DE'd]          │  │
  │   │   Netherwind Crown  Motguts     +0          [ ]         [No SR+]        │  │
  │   │                                                                         │  │
  │   └─────────────────────────────────────────────────────────────────────────┘  │
  │                                                                                 │
  │   ┌─────────────────────────────────────────────────────────────────────────┐  │
  │   │  LOSERS (Keep Credits, +10 Next Time)                                   │  │
  │   ├─────────────────────────────────────────────────────────────────────────┤  │
  │   │   Dirtmcskrt SR'd Ashkandi (+20) - rolled 45 - LOST to Keenhoof (102)   │  │
  │   │   Motguts SR'd Ashkandi (+10) - rolled 72 - LOST to Keenhoof (102)      │  │
  │   └─────────────────────────────────────────────────────────────────────────┘  │
  │                                                                                 │
  │   [Save All] [Finalize Run]                                                     │
  │                                                                                 │
  └─────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               │ Saves to database
                                               ▼
                                        ┌─────────────┐
                                        │   DENO KV   │
                                        │             │
                                        │ • Credits   │
                                        │   updated   │
                                        │ • History   │
                                        │   logged    │
                                        │ • Run       │
                                        │   finalized │
                                        └─────────────┘
```

---

# 3. WEBSITE RESTRUCTURE

## 3.1 Tab Changes

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TAB RESTRUCTURE                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  CURRENT TABS                                    NEW TABS
  ════════════                                    ════════

  ┌─────────────────────────────────┐            ┌─────────────────────────────────┐
  │  HOME                           │    ──►     │  HOME                           │
  │  (Keep as-is)                   │            │  (Keep as-is)                   │
  └─────────────────────────────────┘            └─────────────────────────────────┘

  ┌─────────────────────────────────┐            ┌─────────────────────────────────┐
  │  ANALYSIS                       │    ──►     │  ANALYSIS                       │
  │  (Keep as-is)                   │            │  (Keep as-is)                   │
  └─────────────────────────────────┘            └─────────────────────────────────┘

  ┌─────────────────────────────────┐            ┌─────────────────────────────────┐
  │  LOOT                           │    ──►     │  SR+                            │
  │  ✗ REMOVE/REPLACE               │            │  ★ NEW - Player Dashboard       │
  │  (Manual CSV broken)            │            │  (See your SR+ status)          │
  └─────────────────────────────────┘            └─────────────────────────────────┘

  ┌─────────────────────────────────┐            ┌─────────────────────────────────┐
  │  LOGS                           │    ──►     │  LOGS                           │
  │  (Keep - needed for upload)     │            │  (Keep - needed for upload)     │
  └─────────────────────────────────┘            └─────────────────────────────────┘

                                                 ┌─────────────────────────────────┐
                                         NEW ──► │  ADMIN                          │
                                                 │  ★ NEW - Officer Tools          │
                                                 │  (Manage runs, SR+, overrides)  │
                                                 └─────────────────────────────────┘


  FINAL TAB ORDER:
  ┌────────┬────────────┬────────┬────────┬─────────┐
  │  HOME  │  ANALYSIS  │  SR+   │  LOGS  │  ADMIN  │
  └────────┴────────────┴────────┴────────┴─────────┘
                           │                   │
                           │                   └── Password protected
                           │                       (Officers only)
                           │
                           └── Public, shows player SR+ info
```

## 3.2 Route Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ROUTE STRUCTURE                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  /home/opc/tbc-website/routes/
  │
  ├── index.tsx                    # HOME - Keep as-is
  │
  ├── analysis.tsx                 # ANALYSIS - Keep as-is (compact layout done)
  │
  ├── loot.tsx                     # ✗ DELETE - Being replaced by SR+
  │
  ├── logs.tsx                     # LOGS - Keep (upload combat logs)
  │
  ├── sr-plus/                     # ★ NEW DIRECTORY
  │   ├── index.tsx                # SR+ Dashboard (player view)
  │   ├── player/[name].tsx        # Individual player history
  │   └── leaderboard.tsx          # Who's been grinding longest?
  │
  ├── admin/                       # ★ NEW DIRECTORY
  │   ├── index.tsx                # Admin dashboard
  │   ├── runs/                    # Run management
  │   │   ├── index.tsx            # List all runs
  │   │   ├── [id].tsx             # Edit specific run
  │   │   └── new.tsx              # Create new run
  │   ├── players/                 # Player management
  │   │   ├── index.tsx            # All players
  │   │   └── [name].tsx           # Override player credits
  │   └── settings.tsx             # SR+ config (threshold, bonus)
  │
  └── api/
      ├── logs.ts                  # Existing - combat log upload
      ├── sr-plus/                 # ★ NEW API ROUTES
      │   ├── credits.ts           # GET/POST player credits
      │   ├── runs.ts              # GET/POST runs
      │   ├── eligibility.ts       # Check player eligibility
      │   └── raidres.ts           # Proxy to RaidRes.top API
      └── items/                   # ★ NEW - Item database
          └── lookup.ts            # Item ID → name/icon
```

---

# 4. COMPLETE DATA FLOW

## 4.1 SR+ Credit Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               SR+ CREDIT LIFECYCLE                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  PLAYER: Keenhoof
  ITEM: Ashkandi, Greatsword of the Brotherhood (Item ID: 19364)

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  WEEK 1: First SR
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │ Keenhoof SRs    │     │ Signed up       │     │ Used Flask?     │
    │ Ashkandi on     │────►│ 36 hours        │────►│ YES (Prog run)  │
    │ RaidRes.top     │     │ before raid     │     │                 │
    └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ SR+ ELIGIBLE  │
                                                    │ Bonus: +10    │
                                                    └───────────────┘
                                                            │
                                                            ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI                                                       │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  Base Roll: 72  +  SR+ Bonus: 10  =  FINAL: 82              │
    │  Dirtmcskrt: Base Roll: 88  +  SR+ Bonus: 0   =  FINAL: 88              │
    │                                                                         │
    │  WINNER: Dirtmcskrt (88 > 82)                                          │
    └─────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ KEENHOOF LOST │
                                                    │ Credits KEPT  │
                                                    │ +10 → +20     │
                                                    │ next time     │
                                                    └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  WEEK 2: Second SR (Same Item)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI                                                       │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  Base Roll: 45  +  SR+ Bonus: 20  =  FINAL: 65              │
    │  Motguts:   Base Roll: 71  +  SR+ Bonus: 0   =  FINAL: 71              │
    │                                                                         │
    │  WINNER: Motguts (71 > 65)                                             │
    └─────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ KEENHOOF LOST │
                                                    │ Credits KEPT  │
                                                    │ +20 → +30     │
                                                    └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  WEEK 3: Third SR (Same Item)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI                                                       │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  Base Roll: 55  +  SR+ Bonus: 30  =  FINAL: 85              │
    │  Newguy:    Base Roll: 92  +  SR+ Bonus: 0   =  FINAL: 92              │
    │                                                                         │
    │  WINNER: Newguy (92 > 85)                                              │
    └─────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ KEENHOOF LOST │
                                                    │ Credits KEPT  │
                                                    │ +30 → +40     │
                                                    └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  WEEK 4: Fourth SR (Same Item)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI                                                       │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  Base Roll: 31  +  SR+ Bonus: 40  =  FINAL: 71              │
    │  Randoguy:  Base Roll: 68  +  SR+ Bonus: 0   =  FINAL: 68              │
    │                                                                         │
    │  WINNER: Keenhoof (71 > 68)                                            │
    └─────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ KEENHOOF WON! │
                                                    │ Credits BURNED│
                                                    │ +40 → RESET   │
                                                    │ to 0          │
                                                    └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  ALTERNATE WEEK 5: HARD RESERVE (If didn't win week 4)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI                                                       │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  ★★★ HARD RESERVE ★★★  AUTO-PRIORITY                        │
    │  Anyguy:    Base Roll: 100 + SR+ Bonus: 0  =  FINAL: 100               │
    │                                                                         │
    │  WINNER: Keenhoof (Hard Reserve beats any roll)                        │
    └─────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  EDGE CASE: Multiple Hard Reserves
  ═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ROLL FOR ASHKANDI (Two players have hard reserve!)                      │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  Keenhoof:  ★ HARD RESERVE ★  Roll: 45                                 │
    │  Dirtmcskrt: ★ HARD RESERVE ★  Roll: 72                                │
    │  Newguy:    Base Roll: 100 (doesn't matter, no hard res)               │
    │                                                                         │
    │  WINNER: Dirtmcskrt (72 > 45, both had hard reserve)                   │
    └─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Eligibility Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ELIGIBILITY CHECK FLOW                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────────┐
                              │     PLAYER WANTS SR+        │
                              │     FOR THIS RAID           │
                              └──────────────┬──────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │  CHECK 1: Has SR on         │
                              │  RaidRes.top?               │
                              └──────────────┬──────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                          ▼                                     ▼
                    ┌──────────┐                          ┌──────────┐
                    │   YES    │                          │   NO     │
                    └────┬─────┘                          └────┬─────┘
                         │                                     │
                         ▼                                     ▼
          ┌─────────────────────────────┐        ┌─────────────────────────────┐
          │  CHECK 2: Signed up 24hrs   │        │  ✗ NOT ELIGIBLE             │
          │  before raid start?         │        │  "No SR registered"         │
          └──────────────┬──────────────┘        └─────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
              ┌──────────┐ ┌──────────┐
              │   YES    │ │   NO     │
              └────┬─────┘ └────┬─────┘
                   │            │
                   ▼            ▼
    ┌─────────────────────┐  ┌─────────────────────────────┐
    │  CHECK 3: Run Type? │  │  ✗ NOT ELIGIBLE             │
    └─────────┬───────────┘  │  "Late signup"              │
              │              └─────────────────────────────┘
         ┌────┴────┐
         │         │
         ▼         ▼
   ┌──────────┐ ┌──────────┐
   │ PROGRESS │ │   FARM   │
   └────┬─────┘ └────┬─────┘
        │            │
        ▼            │
┌─────────────────┐  │
│ CHECK 4: Used   │  │
│ Flask + Elixir? │  │
└───────┬─────────┘  │
        │            │
   ┌────┴────┐       │
   │         │       │
   ▼         ▼       │
┌──────┐ ┌──────┐    │
│ YES  │ │ NO   │    │
└──┬───┘ └──┬───┘    │
   │        │        │
   ▼        ▼        ▼
┌──────────────────────────────────────────────────────────────┐
│  ✓ ELIGIBLE                     ✗ NOT ELIGIBLE               │
│  "Full SR+ bonus applied"       "No consumables on prog run" │
└──────────────────────────────────────────────────────────────┘
```

---

# 5. API INTEGRATION MAP

## 5.1 RaidRes.top Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RAIDRES.TOP API INTEGRATION                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  ENDPOINT:  GET https://raidres.top/api/events/{EVENT_ID}

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  EXAMPLE REQUEST                                                                            │
  ├─────────────────────────────────────────────────────────────────────────────────────────────┤
  │                                                                                             │
  │  GET https://raidres.top/api/events/SG8ZWX                                                 │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  EXPECTED RESPONSE STRUCTURE (needs verification)                                           │
  ├─────────────────────────────────────────────────────────────────────────────────────────────┤
  │                                                                                             │
  │  {                                                                                          │
  │    "id": "SG8ZWX",                                                                         │
  │    "title": "BWL Tuesday",                                                                 │
  │    "raid": "Blackwing Lair",                                                               │
  │    "startTime": "2025-12-10T20:00:00Z",                                                    │
  │    "softReserves": [                                                                       │
  │      {                                                                                     │
  │        "playerName": "Keenhoof",                                                           │
  │        "discordId": "123456789",                                                           │
  │        "items": [19364]                      // Ashkandi item ID                           │
  │      },                                                                                    │
  │      {                                                                                     │
  │        "playerName": "Dirtmcskrt",                                                         │
  │        "discordId": "987654321",                                                           │
  │        "items": [19364]                      // Also SR'd Ashkandi                         │
  │      }                                                                                     │
  │    ],                                                                                      │
  │    "hardReserves": [                                                                       │
  │      {                                                                                     │
  │        "itemId": 12345,                                                                    │
  │        "reservedBy": "officer"                                                             │
  │      }                                                                                     │
  │    ]                                                                                       │
  │  }                                                                                         │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  OUR API PROXY                                                                              │
  ├─────────────────────────────────────────────────────────────────────────────────────────────┤
  │                                                                                             │
  │  // routes/api/sr-plus/raidres.ts                                                          │
  │                                                                                             │
  │  export const handler: Handlers = {                                                        │
  │    async GET(req, ctx) {                                                                   │
  │      const url = new URL(req.url);                                                         │
  │      const eventId = url.searchParams.get("eventId");                                      │
  │                                                                                             │
  │      const response = await fetch(                                                         │
  │        `https://raidres.top/api/events/${eventId}`                                         │
  │      );                                                                                    │
  │                                                                                             │
  │      const data = await response.json();                                                   │
  │                                                                                             │
  │      // Transform item IDs to item names using our item DB                                 │
  │      for (const sr of data.softReserves) {                                                 │
  │        sr.itemNames = await lookupItemNames(sr.items);                                     │
  │      }                                                                                     │
  │                                                                                             │
  │      return new Response(JSON.stringify(data));                                            │
  │    }                                                                                       │
  │  };                                                                                        │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Item Database Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ITEM DATABASE INTEGRATION                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  PROBLEM: RaidRes.top returns ITEM IDs, not names
           We need: Item ID → Name, Icon, Stats

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  OPTION A: Turtle WoW Database Scraping (database.turtlecraft.gg)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

  URL Pattern: https://database.turtlecraft.gg/?item={ITEM_ID}

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  Pros:                                                                                      │
  │  • Official Turtle WoW source                                                              │
  │  • Always up-to-date                                                                       │
  │  • Has icons, stats, everything                                                            │
  │                                                                                             │
  │  Cons:                                                                                      │
  │  • Scraping (not an API)                                                                   │
  │  • Could break if they change layout                                                       │
  │  • Rate limiting concerns                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  OPTION B: Pre-built Item Database (JSON file)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

  Store a JSON file with all relevant items:

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  // data/items.json                                                                        │
  │                                                                                             │
  │  {                                                                                         │
  │    "19364": {                                                                              │
  │      "name": "Ashkandi, Greatsword of the Brotherhood",                                    │
  │      "icon": "inv_sword_36",                                                               │
  │      "quality": "epic",                                                                    │
  │      "source": "Nefarian",                                                                 │
  │      "raid": "BWL"                                                                         │
  │    },                                                                                      │
  │    "19375": {                                                                              │
  │      "name": "Mish'undare, Circlet of the Mind Flayer",                                    │
  │      "icon": "inv_helmet_59",                                                              │
  │      "quality": "epic",                                                                    │
  │      "source": "Nefarian",                                                                 │
  │      "raid": "BWL"                                                                         │
  │    }                                                                                       │
  │    // ... all raid items                                                                   │
  │  }                                                                                         │
  │                                                                                             │
  │  Pros:                                                                                      │
  │  • Fast lookups                                                                            │
  │  • No external dependencies                                                                │
  │  • Works offline                                                                           │
  │                                                                                             │
  │  Cons:                                                                                      │
  │  • Manual maintenance                                                                      │
  │  • Could miss new items                                                                    │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════════════
  OPTION C: Hybrid (Recommended)
  ═══════════════════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  1. Start with pre-built JSON for common raid items                                        │
  │  2. Cache in Deno KV for fast lookups                                                      │
  │  3. On-demand fetch from Turtle WoW DB for unknown items                                   │
  │  4. Store fetched items in cache for future use                                            │
  │                                                                                             │
  │  // routes/api/items/lookup.ts                                                             │
  │                                                                                             │
  │  async function getItem(itemId: number) {                                                  │
  │    // 1. Check Deno KV cache                                                               │
  │    const cached = await kv.get(["items", itemId]);                                         │
  │    if (cached.value) return cached.value;                                                  │
  │                                                                                             │
  │    // 2. Check static JSON                                                                 │
  │    if (STATIC_ITEMS[itemId]) {                                                             │
  │      await kv.set(["items", itemId], STATIC_ITEMS[itemId]);                                │
  │      return STATIC_ITEMS[itemId];                                                          │
  │    }                                                                                       │
  │                                                                                             │
  │    // 3. Fetch from Turtle WoW DB                                                          │
  │    const item = await scrapeTurtleWowDB(itemId);                                           │
  │    await kv.set(["items", itemId], item);                                                  │
  │    return item;                                                                            │
  │  }                                                                                         │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. DATABASE DESIGN

## 6.1 Deno KV Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DENO KV SCHEMA                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
EXISTING KEYS (Keep as-is)
═══════════════════════════════════════════════════════════════════════════════════════════════════

["combat_logs", {log_id}]
├── id: string
├── raidType: string (MC, BWL, AQ40, etc.)
├── raidName: string
├── bossKilled: string | null
├── startTime: string (ISO)
├── endTime: string (ISO)
├── lineCount: number
├── uploadedAt: string
├── fileSize: number
├── playerStats: PlayerStats[]
│   └── name, deaths, consumables, dispels, cc, etc.
└── summary: {...}

═══════════════════════════════════════════════════════════════════════════════════════════════════
NEW KEYS (SR+ System)
═══════════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "credits", {player_name}, {item_id}]                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PURPOSE: Track current SR+ bonus for a player on a specific item                              │
│                                                                                                 │
│  VALUE: {                                                                                      │
│    playerName: string,          // "Keenhoof"                                                  │
│    itemId: number,              // 19364                                                       │
│    itemName: string,            // "Ashkandi, Greatsword of the Brotherhood"                   │
│    timesSRd: number,            // 3                                                           │
│    currentBonus: number,        // 30                                                          │
│    isHardReserve: boolean,      // false (true if timesSRd >= threshold)                       │
│    firstSRDate: string,         // ISO date of first SR                                        │
│    lastUpdated: string          // ISO date of last update                                     │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "history", {player_name}]                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PURPOSE: Complete history of a player's SR+ attempts                                          │
│                                                                                                 │
│  VALUE: {                                                                                      │
│    playerName: string,                                                                         │
│    entries: [                                                                                  │
│      {                                                                                         │
│        runId: string,           // Links to ["sr_plus", "runs", runId]                         │
│        date: string,            // ISO date                                                    │
│        raid: string,            // "BWL"                                                       │
│        itemId: number,          // 19364                                                       │
│        itemName: string,        // "Ashkandi"                                                  │
│        usedSRPlus: boolean,     // true                                                        │
│        bonusApplied: number,    // 30                                                          │
│        baseRoll: number,        // 72                                                          │
│        finalRoll: number,       // 102                                                         │
│        won: boolean,            // true                                                        │
│        lostTo: string | null    // null if won, "Dirtmcskrt" if lost                          │
│      }                                                                                         │
│    ]                                                                                           │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "runs", {run_id}]                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PURPOSE: Track each raid run and its loot distribution                                        │
│                                                                                                 │
│  VALUE: {                                                                                      │
│    runId: string,               // UUID or timestamp-based                                     │
│    raidType: string,            // "BWL"                                                       │
│    raidDate: string,            // ISO date                                                    │
│    isProgression: boolean,      // true = consumables required                                 │
│    raidResEventId: string,      // "SG8ZWX" - from RaidRes.top URL                            │
│    combatLogId: string | null,  // Links to combat log if uploaded                            │
│    status: string,              // "pending" | "in_progress" | "finalized"                     │
│    participants: string[],      // Player names                                                │
│    signupTimes: {               // For 24hr check                                              │
│      [playerName]: string       // ISO timestamp of signup                                     │
│    },                                                                                          │
│    lootDistribution: [                                                                         │
│      {                                                                                         │
│        itemId: number,                                                                         │
│        itemName: string,                                                                       │
│        winner: string | null,   // null if DE'd                                                │
│        disenchanted: boolean,                                                                  │
│        usedSRPlus: boolean,                                                                    │
│        rolls: {                 // All players who rolled                                      │
│          [playerName]: {                                                                       │
│            baseRoll: number,                                                                   │
│            bonus: number,                                                                      │
│            finalRoll: number                                                                   │
│          }                                                                                     │
│        }                                                                                       │
│      }                                                                                         │
│    ],                                                                                          │
│    createdAt: string,                                                                          │
│    updatedAt: string,                                                                          │
│    finalizedAt: string | null,                                                                 │
│    finalizedBy: string | null   // Admin who finalized                                         │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["sr_plus", "config"]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PURPOSE: System-wide SR+ configuration                                                        │
│                                                                                                 │
│  VALUE: {                                                                                      │
│    bonusPerSR: number,          // 10 (each SR adds +10)                                       │
│    hardReserveThreshold: number,// 5 (after 5 SRs, auto hard reserve)                          │
│    signupHoursRequired: number, // 24 (must signup 24hrs before)                               │
│    requireFlaskOnProgression: boolean,  // true                                                │
│    requireElixirOnProgression: boolean, // true                                                │
│    adminPassword: string        // Hashed password for admin access                            │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KEY: ["items", {item_id}]                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PURPOSE: Cache item information (from Turtle WoW DB)                                          │
│                                                                                                 │
│  VALUE: {                                                                                      │
│    itemId: number,              // 19364                                                       │
│    name: string,                // "Ashkandi, Greatsword of the Brotherhood"                   │
│    icon: string,                // "inv_sword_36" or full URL                                  │
│    quality: string,             // "epic" | "rare" | "uncommon"                                │
│    source: string,              // "Nefarian"                                                  │
│    raid: string,                // "BWL"                                                       │
│    cachedAt: string             // ISO timestamp                                               │
│  }                                                                                             │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. UI/UX DESIGN

## 7.1 SR+ Dashboard (Player View)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               SR+ DASHBOARD - PLAYER VIEW                                        │
│                               /sr-plus                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌────────┬────────────┬────────┬────────┬─────────┐                                           │
│  │  HOME  │  ANALYSIS  │  SR+   │  LOGS  │  ADMIN  │                                           │
│  └────────┴────────────┴────────┴────────┴─────────┘                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  SR+ DASHBOARD                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SEARCH PLAYER                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  [Enter player name...                                              ] [Search]      │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ACTIVE SR+ BONUSES                                                    [View All Items] │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ PLAYER          │ ITEM                      │ TIMES SR'D │ BONUS │ STATUS          │ │  │
│  │  ├────────────────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ Keenhoof        │ [⚔] Ashkandi             │     4      │  +40  │ 1 MORE = HR     │ │  │
│  │  │ Dirtmcskrt      │ [⚔] Ashkandi             │     3      │  +30  │ Building...     │ │  │
│  │  │ Motguts         │ [👑] Mish'undare          │     5      │  HR   │ ★ HARD RESERVE  │ │  │
│  │  │ Whora           │ [🛡] Chromatic Boots      │     2      │  +20  │ Building...     │ │  │
│  │  │ Aradune         │ [📿] Rejuvenating Gem     │     1      │  +10  │ Just started    │ │  │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RECENT SR+ ACTIVITY                                                                     │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                          │  │
│  │  Dec 7   │ BWL      │ Keenhoof      │ Ashkandi        │ Roll: 72+40=112 │ ✓ WON      │  │
│  │  Dec 7   │ BWL      │ Dirtmcskrt    │ Ashkandi        │ Roll: 88+30=118 │ ✗ LOST     │  │
│  │  Dec 3   │ AQ40     │ Motguts       │ Mish'undare     │ ★ HARD RESERVE  │ ✓ WON      │  │
│  │  Nov 30  │ MC       │ Whora         │ Chromatic Boots │ Roll: 45+20=65  │ ✗ LOST     │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  LEADERBOARD: Longest SR+ Streaks                                                        │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                          │  │
│  │  🥇 Motguts      - 5 weeks on Mish'undare (HARD RESERVE ACHIEVED!)                       │  │
│  │  🥈 Keenhoof     - 4 weeks on Ashkandi                                                   │  │
│  │  🥉 Dirtmcskrt   - 3 weeks on Ashkandi                                                   │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Individual Player Page

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PLAYER SR+ HISTORY                                                 │
│                               /sr-plus/player/Keenhoof                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to SR+ Dashboard                                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  KEENHOOF                                                                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              CURRENT SR+ STATUS                                        │    │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                                        │    │
│  │   [⚔ ICON]  ASHKANDI, GREATSWORD OF THE BROTHERHOOD                                   │    │
│  │                                                                                        │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │    │
│  │   │  Times SR'd:       4                                                            │ │    │
│  │   │  Current Bonus:    +40                                                          │ │    │
│  │   │  Status:           1 more SR = HARD RESERVE                                     │ │    │
│  │   │  First SR Date:    November 12, 2025                                            │ │    │
│  │   │  Total Raids:      4 consecutive weeks                                          │ │    │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘ │    │
│  │                                                                                        │    │
│  │   PROGRESS TO HARD RESERVE:                                                           │    │
│  │   [████████████████████████████████████████████████░░░░░░░░░░░░] 80% (4/5)            │    │
│  │                                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              ROLL HISTORY FOR ASHKANDI                                 │    │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                                        │    │
│  │  DATE       │ RAID │ BASE ROLL │ BONUS │ FINAL │ OPPONENT ROLL │ RESULT              │    │
│  │  ─────────────────────────────────────────────────────────────────────────────────    │    │
│  │  Dec 7      │ BWL  │    72     │  +40  │  112  │ Dirtmcskrt: 118│  ✗ Lost (6 behind) │    │
│  │  Nov 30     │ BWL  │    55     │  +30  │   85  │ Newguy: 92     │  ✗ Lost (7 behind) │    │
│  │  Nov 23     │ BWL  │    45     │  +20  │   65  │ Motguts: 71    │  ✗ Lost (6 behind) │    │
│  │  Nov 16     │ BWL  │    72     │  +10  │   82  │ Dirtmcskrt: 88 │  ✗ Lost (6 behind) │    │
│  │                                                                                        │    │
│  │  STATS: 0 wins, 4 losses | Average roll: 61 | Average final: 86                      │    │
│  │                                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              PAST SR+ ITEMS (Completed)                                │    │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                                        │    │
│  │  ITEM                    │ TIMES SR'D │ FINAL BONUS │ RESULT                          │    │
│  │  ─────────────────────────────────────────────────────────────────────────────────    │    │
│  │  Chromatically Tempered  │     1      │     +10     │ ✓ WON (Nov 12)                  │    │
│  │  Sword                   │            │             │   Rolled 91+10=101              │    │
│  │                                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 7.3 Admin Panel - Run Management

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               ADMIN PANEL - RUN MANAGEMENT                                       │
│                               /admin/runs                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ ADMIN PANEL                                                           [Logout]              │
│  ─────────────────────────────────────────────────────────────────────────────────────────────  │
│  [Runs] [Players] [Settings]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  RUN MANAGEMENT                                                          [+ Create New Run]    │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RECENT RUNS                                                                             │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                          │  │
│  │  DATE     │ RAID │ TYPE        │ SR EVENT   │ STATUS      │ ACTIONS                    │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────  │  │
│  │  Dec 10   │ BWL  │ Progression │ SG8ZWX     │ ⏳ Pending   │ [Edit] [Finalize]         │  │
│  │  Dec 7    │ AQ40 │ Farm        │ ABC123     │ ✓ Finalized │ [View]                     │  │
│  │  Dec 3    │ MC   │ Farm        │ XYZ789     │ ✓ Finalized │ [View]                     │  │
│  │  Nov 30   │ BWL  │ Progression │ DEF456     │ ✓ Finalized │ [View]                     │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  EDITING RUN: BWL - December 10, 2025                                                          │
│  ─────────────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RUN CONFIGURATION                                                                       │  │
│  │                                                                                          │  │
│  │  Run Type:  (●) Progression  ( ) Farm                                                   │  │
│  │                                                                                          │  │
│  │  RaidRes Event ID:  [SG8ZWX                    ] [Fetch SR Data]                        │  │
│  │                                                                                          │  │
│  │  Combat Log:        [Select log ▼] ← Link to uploaded combat log for consumable check   │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ELIGIBILITY CHECK (from combat log + signup times)                                      │  │
│  │                                                                                          │  │
│  │  PLAYER       │ 24HR SIGNUP │ FLASK │ ELIXIRS │ SR+ ELIGIBLE │ CURRENT BONUS           │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────  │  │
│  │  Keenhoof     │ ✓ 36 hrs    │ ✓     │ ✓       │ ✓ YES        │ +40 on Ashkandi         │  │
│  │  Dirtmcskrt   │ ✓ 28 hrs    │ ✓     │ ✓       │ ✓ YES        │ +30 on Ashkandi         │  │
│  │  Motguts      │ ✗ 12 hrs    │ ✓     │ ✓       │ ✗ NO (late)  │ +50 HARD RES on Mish    │  │
│  │  Whora        │ ✓ 48 hrs    │ ✗     │ ✗       │ ✗ NO (cons)  │ +20 on Chromatic Boots  │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  LOOT DISTRIBUTION                                                                       │  │
│  │                                                                                          │  │
│  │  ITEM                │ WINNER       │ USED SR+  │ DE'D  │ ACTION                        │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────  │  │
│  │  Ashkandi            │ [Keenhoof ▼] │ [✓]       │ [ ]   │ Rolled: 72+40=112             │  │
│  │  Chromatic Boots     │ [Whora ▼]    │ [ ]       │ [ ]   │ Not SR+ eligible              │  │
│  │  Elementium Ore      │ [---     ▼]  │ [ ]       │ [✓]   │ Disenchanted                  │  │
│  │                                                                                          │  │
│  │  [+ Add Item]                                                                            │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SR+ CREDIT UPDATES (Preview)                                                            │  │
│  │                                                                                          │  │
│  │  When you finalize this run, the following credit changes will be applied:              │  │
│  │                                                                                          │  │
│  │  Keenhoof    │ Ashkandi     │ +40 → BURNED (won item)                                   │  │
│  │  Dirtmcskrt  │ Ashkandi     │ +30 → +40 (lost, keep building)                           │  │
│  │  Motguts     │ Mish'undare  │ +50 → +50 (not eligible, no change)                       │  │
│  │  Whora       │ Chrom Boots  │ +20 → +20 (not eligible, no change)                       │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  [Save Draft]                                              [Finalize Run & Apply Credits]      │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 7.4 Admin Panel - Manual Override

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               ADMIN PANEL - PLAYER OVERRIDE                                      │
│                               /admin/players/Keenhoof                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ ADMIN PANEL                                                           [Logout]              │
│  ─────────────────────────────────────────────────────────────────────────────────────────────  │
│  [Runs] [Players] [Settings]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  PLAYER: KEENHOOF                                                                               │
│  ═══════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  CURRENT SR+ CREDITS                                                                     │  │
│  │                                                                                          │  │
│  │  ITEM                    │ TIMES SR'D │ BONUS │ STATUS      │ ACTIONS                   │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────  │  │
│  │  Ashkandi                │     4      │  +40  │ Building    │ [Edit] [Reset]            │  │
│  │  Mish'undare (old)       │     1      │  +10  │ Abandoned   │ [Edit] [Reset]            │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  MANUAL OVERRIDE                                                                         │  │
│  │                                                                                          │  │
│  │  ⚠️  Use this to manually adjust credits. All changes are logged.                        │  │
│  │                                                                                          │  │
│  │  Item:             [Ashkandi                              ▼]                            │  │
│  │  Set Times SR'd:   [4    ]                                                              │  │
│  │  Set Bonus:        [40   ]                                                              │  │
│  │  Force Hard Res:   [ ] Enable hard reserve regardless of count                          │  │
│  │                                                                                          │  │
│  │  Reason for override: [________________________________]                                 │  │
│  │                                                                                          │  │
│  │  [Apply Override]                                                                        │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ADD NEW SR+ CREDIT                                                                      │  │
│  │                                                                                          │  │
│  │  For players who SR'd in the past but weren't tracked yet.                              │  │
│  │                                                                                          │  │
│  │  Item:             [Search item...                        ]                             │  │
│  │  Times SR'd:       [1    ]                                                              │  │
│  │  Bonus:            [10   ] (auto-calculated)                                            │  │
│  │                                                                                          │  │
│  │  [Add Credit]                                                                            │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  AUDIT LOG                                                                               │  │
│  │                                                                                          │  │
│  │  Dec 10  │ System     │ +30 → +40 on Ashkandi (lost roll in BWL)                        │  │
│  │  Dec 3   │ System     │ +20 → +30 on Ashkandi (lost roll in BWL)                        │  │
│  │  Nov 26  │ Admin:Ryan │ +10 → +20 on Ashkandi (manual fix - missed prior SR)            │  │
│  │  Nov 19  │ System     │ +0 → +10 on Ashkandi (first SR)                                 │  │
│  │                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. IMPLEMENTATION ROADMAP

## 8.1 Phase Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              IMPLEMENTATION ROADMAP                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 1: FOUNDATION
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GOAL: Get basic SR+ tracking working with manual data entry

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  TASKS:                                                                                     │
  │                                                                                             │
  │  [ ] 1.1  Delete old loot.tsx route                                                        │
  │  [ ] 1.2  Create /sr-plus route structure                                                  │
  │  [ ] 1.3  Create /admin route structure (password protected)                               │
  │  [ ] 1.4  Set up Deno KV schema (sr_plus_credits, sr_plus_history, sr_plus_runs)           │
  │  [ ] 1.5  Create item lookup system (start with static JSON for common raid items)         │
  │  [ ] 1.6  Build basic SR+ dashboard (read-only player view)                                │
  │  [ ] 1.7  Build admin panel - manual credit entry                                          │
  │  [ ] 1.8  Build admin panel - manual run entry                                             │
  │                                                                                             │
  │  DELIVERABLES:                                                                              │
  │  • Officers can manually enter SR+ credits                                                 │
  │  • Players can view their SR+ status                                                       │
  │  • Basic admin authentication                                                              │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 2: RAIDRES INTEGRATION
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GOAL: Automatically pull SR data from RaidRes.top

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  TASKS:                                                                                     │
  │                                                                                             │
  │  [ ] 2.1  Test RaidRes.top API - verify response structure                                 │
  │  [ ] 2.2  Create /api/sr-plus/raidres.ts proxy endpoint                                    │
  │  [ ] 2.3  Add "Fetch SR Data" button to admin run page                                     │
  │  [ ] 2.4  Auto-populate loot distribution from SR list                                     │
  │  [ ] 2.5  Match SR item IDs to our item database                                           │
  │  [ ] 2.6  Handle item ID → name translation                                                │
  │                                                                                             │
  │  DELIVERABLES:                                                                              │
  │  • Paste RaidRes URL, get full SR list                                                     │
  │  • Item names show instead of IDs                                                          │
  │  • Reduces manual data entry significantly                                                 │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 3: COMBAT LOG INTEGRATION
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GOAL: Link combat logs to runs for consumable verification

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  TASKS:                                                                                     │
  │                                                                                             │
  │  [ ] 3.1  Add combat log selector to admin run page                                        │
  │  [ ] 3.2  Pull consumable data (flask, elixir usage) for each player                       │
  │  [ ] 3.3  Auto-calculate eligibility based on consumables + progression flag               │
  │  [ ] 3.4  Show eligibility status in admin UI                                              │
  │  [ ] 3.5  Validate loot winners against attendance list                                    │
  │                                                                                             │
  │  DELIVERABLES:                                                                              │
  │  • Link any combat log to a run                                                            │
  │  • Automatic consumable verification                                                       │
  │  • Clear eligibility status per player                                                     │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 4: SIGNUP TRACKING
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GOAL: Track signup times for 24-hour rule

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  TASKS:                                                                                     │
  │                                                                                             │
  │  [ ] 4.1  Determine signup time source (Discord bot? Manual entry? RaidRes timestamp?)     │
  │  [ ] 4.2  Add signup time entry to admin run page                                          │
  │  [ ] 4.3  Calculate "hours before raid" for each player                                    │
  │  [ ] 4.4  Add 24-hour eligibility check                                                    │
  │  [ ] 4.5  Show signup status in eligibility panel                                          │
  │                                                                                             │
  │  DELIVERABLES:                                                                              │
  │  • Track when each player signed up                                                        │
  │  • Automatic 24-hour rule enforcement                                                      │
  │  • Clear visibility of late signups                                                        │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 5: AUTOMATION & POLISH
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GOAL: Streamline the workflow, add analytics

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  TASKS:                                                                                     │
  │                                                                                             │
  │  [ ] 5.1  Add "Finalize Run" workflow with credit auto-update                              │
  │  [ ] 5.2  Build player history page (/sr-plus/player/[name])                               │
  │  [ ] 5.3  Build leaderboard (longest streaks, most hard reserves)                          │
  │  [ ] 5.4  Add item icon display                                                            │
  │  [ ] 5.5  Add roll entry (manual for now, check if in combat logs later)                   │
  │  [ ] 5.6  Attendance reports                                                               │
  │  [ ] 5.7  Mobile-responsive design pass                                                    │
  │                                                                                             │
  │  DELIVERABLES:                                                                              │
  │  • One-click run finalization                                                              │
  │  • Rich player history pages                                                               │
  │  • Leaderboards and analytics                                                              │
  │  • Works on mobile                                                                         │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
PHASE 6: FUTURE ENHANCEMENTS (Optional)
═══════════════════════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                             │
  │  POSSIBLE FUTURE FEATURES:                                                                 │
  │                                                                                             │
  │  [ ] Discord bot for signup tracking                                                       │
  │  [ ] Roll4 addon data parsing (if supported)                                               │
  │  [ ] Automatic RaidRes polling for new events                                              │
  │  [ ] Email/Discord notifications for hard reserve achievement                              │
  │  [ ] Public API for other tools to consume                                                 │
  │                                                                                             │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Open Questions to Resolve

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              QUESTIONS NEEDING ANSWERS                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  1. ROLL DATA SOURCE                                                                        │
  │                                                                                             │
  │  Q: Are roll results in combat logs, or only from Roll4 addon?                             │
  │                                                                                             │
  │  If in combat logs:  Parse automatically                                                   │
  │  If not:             Manual entry in admin panel                                           │
  │                                                                                             │
  │  ACTION: Check a combat log for "/roll" entries                                            │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  2. SIGNUP TIME SOURCE                                                                      │
  │                                                                                             │
  │  Q: Where do signup times come from?                                                       │
  │                                                                                             │
  │  Options:                                                                                   │
  │  A. Discord bot tracks signup message timestamps                                           │
  │  B. RaidRes.top provides signup timestamps in API                                          │
  │  C. Manual entry by officers                                                               │
  │                                                                                             │
  │  ACTION: Check RaidRes API response for timestamps                                         │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  3. ITEM DATABASE SOURCE                                                                    │
  │                                                                                             │
  │  Q: Best source for Turtle WoW item ID → name mapping?                                     │
  │                                                                                             │
  │  Options:                                                                                   │
  │  A. Scrape database.turtlecraft.gg                                                         │
  │  B. Use existing addon database (AtlasLoot, etc.)                                          │
  │  C. Community-maintained JSON files                                                        │
  │  D. Build our own from combat log item drops                                               │
  │                                                                                             │
  │  RECOMMENDATION: Start with option D (combat logs already have item names),                │
  │  supplement with scraping for missing items                                                │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  4. HARD RESERVE THRESHOLD                                                                  │
  │                                                                                             │
  │  Q: 4 or 5 times before hard reserve kicks in?                                             │
  │                                                                                             │
  │  RECOMMENDATION: Make configurable in admin settings                                       │
  │  Default: 5                                                                                │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │  5. ADMIN AUTHENTICATION                                                                    │
  │                                                                                             │
  │  Q: How should admin login work?                                                           │
  │                                                                                             │
  │  Options:                                                                                   │
  │  A. Simple password (stored in config)                                                     │
  │  B. Discord OAuth                                                                          │
  │  C. Multiple officer accounts                                                              │
  │                                                                                             │
  │  RECOMMENDATION: Start with A, upgrade to B later                                          │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# SUMMARY

This document provides the complete architecture for the SR+ loot distribution system:

1. **Website Changes**: Replace LOOT tab with SR+, add ADMIN tab
2. **Data Sources**: RaidRes.top API + Combat Logs + Deno KV
3. **Core Features**: SR+ credit tracking, eligibility checking, loot distribution
4. **UI**: Player dashboard, admin panel, run management
5. **Implementation**: 5-phase roadmap from foundation to polish

Ready to start Phase 1 when you approve this design.

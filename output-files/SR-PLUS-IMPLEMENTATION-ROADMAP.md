# SR+ LOOT SYSTEM - IMPLEMENTATION ROADMAP
## Version 1.0 - 2025-12-08

---

# Overview

This document outlines the 5-phase implementation plan for the SR+ loot system for Thralls Book Club (Turtle WoW guild).

**Related Documents:**
- `SR-PLUS-ARCHITECTURE-V3.md` - Complete technical architecture
- `SR-PLUS-VISION.md` - Original vision document

**Project Location:** `/home/opc/tbc-website/`
**Website URL:** https://tbcguild.duckdns.org/

---

# Phase 1: Foundation
**Status:** IN PROGRESS
**Goal:** Create basic structure and manual workflow

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Create `/sr-plus` route (replaces `/upload`) - Player dashboard | |
| 1.2 | Create `/admin` route (password protected) - Officer tools | |
| 1.3 | Create Deno KV schema for `sr_plus_credits`, `sr_plus_history`, `sr_plus_runs` | |
| 1.4 | Build basic SR+ dashboard (read-only view of credits) | |
| 1.5 | Build admin run list page | |
| 1.6 | Build admin run edit page (manual credit entry) | |
| 1.7 | Update `Nav.tsx` - replace "Upload Loot" with "SR+" | |

**Outcome:** Officers can manually enter SR+ credits. Players can view their status.

**Files Created/Modified:**
- `/routes/sr-plus.tsx` (new)
- `/routes/admin.tsx` (new)
- `/routes/admin/runs/index.tsx` (new)
- `/routes/admin/runs/[id].tsx` (new)
- `/routes/api/sr-plus/credits.ts` (new)
- `/components/Nav.tsx` (modified)

---

# Phase 2: RaidRes Integration
**Status:** PENDING
**Goal:** Automate SR list fetching from RaidRes.top

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Test RaidRes.top API - verify response structure | |
| 2.2 | Create `/api/sr-plus/raidres.ts` proxy endpoint | |
| 2.3 | Add "Fetch SR Data" button to admin run page | |
| 2.4 | Build item name lookup (from combat log history) | |
| 2.5 | Auto-populate SR list from RaidRes data | |

**Outcome:** Paste RaidRes event ID, get full SR list with player names and items.

**API Endpoint:** `GET https://raidres.top/api/events/{EVENT_ID}`

**Files Created/Modified:**
- `/routes/api/sr-plus/raidres.ts` (new)
- `/routes/admin/runs/[id].tsx` (modified)

---

# Phase 3: Combat Log Linking
**Status:** PENDING
**Goal:** Connect runs to consumables and loot data

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Add combat log selector to run edit page | |
| 3.2 | Pull consumable data for eligibility check (flask/elixir) | |
| 3.3 | Match loot drops to SR'd items | |
| 3.4 | Auto-populate loot distribution from combat log | |
| 3.5 | Validate attendance against signups | |

**Outcome:** Link combat log, auto-check consumables, auto-match loot.

**Data Sources:**
- Combat logs: `["combat_logs", logId]` in Deno KV
- Consumables: `playerStats[].flasks`, `playerStats[].elixirs`
- Loot: Parsed from combat log text

**Files Created/Modified:**
- `/routes/admin/runs/[id].tsx` (modified)
- `/routes/api/sr-plus/link-log.ts` (new)

---

# Phase 4: Credit Management
**Status:** PENDING
**Goal:** Full roll tracking and credit calculation

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Roll entry UI (base roll input, auto-calculate final) | |
| 4.2 | Credit preview (show what will change before commit) | |
| 4.3 | Finalize run workflow | |
| 4.4 | Auto-update credits on finalize | |
| 4.5 | Credit burn for winners, +10 for losers | |
| 4.6 | Hard reserve detection (5+ SRs) | |

**Outcome:** Full SR+ workflow from SR to credit update.

**Credit Rules:**
- WIN item with SR+ bonus: Credits BURNED (reset to 0)
- LOSE roll with SR+ bonus: Credits +10 (keep accumulating)
- Item DE'd (no one SR'd): No credit change
- Not eligible (late signup or no consumables): No SR+ bonus applied

**Files Created/Modified:**
- `/routes/admin/runs/[id].tsx` (modified)
- `/routes/api/sr-plus/finalize.ts` (new)
- `/islands/RollEntryTable.tsx` (new)

---

# Phase 5: Polish
**Status:** PENDING
**Goal:** UX improvements and audit trail

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Player history page (`/sr-plus/player/[name]`) | |
| 5.2 | Leaderboard (longest streaks, most hard reserves) | |
| 5.3 | Admin player override page | |
| 5.4 | Mobile responsive design pass | |
| 5.5 | Audit log (track all credit changes) | |

**Outcome:** Complete, polished SR+ system.

**Files Created/Modified:**
- `/routes/sr-plus/player/[name].tsx` (new)
- `/routes/sr-plus/leaderboard.tsx` (new)
- `/routes/admin/players/[name].tsx` (new)
- `/islands/SRPlusLeaderboard.tsx` (new)

---

# Database Schema

## New Deno KV Keys

```
["sr_plus", "credits", {player_name}, {item_id}]
→ { playerName, itemId, itemName, timesSRd, currentBonus, isHardReserve, firstSRDate, lastUpdated }

["sr_plus", "history", {player_name}]
→ { playerName, entries: [{ runId, date, raid, itemName, bonusApplied, baseRoll, finalRoll, won, wonBy }] }

["sr_plus", "runs", {run_id}]
→ { runId, raidHelperId, raidResEventId, combatLogId, raidType, raidDate, isProgression, status, lootDistribution, creditChanges, finalizedAt, finalizedBy }

["sr_plus", "config"]
→ { bonusPerSR: 10, hardReserveThreshold: 5, signupHoursRequired: 24, requireFlaskOnProgression: true, adminPassword: "hashed" }
```

---

# Tab Structure

```
BEFORE:
[ Home ] [ Raids ] [ Attendance ] [ Loot ] [ Upload Loot ] [ Combat Logs ] [ Analysis ]

AFTER:
[ Home ] [ Raids ] [ Attendance ] [ Loot ] [ SR+ ] [ Combat Logs ] [ Analysis ] [ Admin ]
                                            ↑                                      ↑
                                      Replaces Upload                        New (protected)
```

---

# Success Criteria

| Phase | Criteria |
|-------|----------|
| 1 | Officers can manually add/view SR+ credits, players can see their bonuses |
| 2 | Admin can paste RaidRes URL and see SR list auto-populate |
| 3 | Linking combat log auto-checks consumables and matches loot |
| 4 | Finalizing a run correctly burns/adds credits based on outcomes |
| 5 | Full audit trail, leaderboards, player history pages work |

---

# Risk Mitigation

| Risk | Mitigation |
|------|------------|
| RaidRes API changes | Graceful fallback to manual entry |
| Combat log format changes | Existing parser is robust, tested |
| Data loss | Deno KV is persistent, add backup exports |
| Admin password leak | Hash password, consider Discord OAuth later |

---

**Last Updated:** 2025-12-08

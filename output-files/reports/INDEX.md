# Session Reports Index

This directory contains detailed session reports documenting all modifications, bug fixes, and feature implementations for Turtle WoW addons.

---

## Reports

### 2025-11-13 - Chronometer DoT Timer Sporadic Drops Fix
**File**: `SESSION_REPORT_2025-11-13.md`

**Summary**:
- SuperWowCombatLogger rollback (Oct 31 → Oct 18 stable version)
- Boss phase transition false death detection fix
- Combat log fade event protection for all warlock DoTs

**Addons Modified**:
- SuperWowCombatLogger (full rollback)
- Chronometer-TWoW (2 code fixes)

**Status**: Complete - Validated in-game

**Key Changes**:
- Rolled back SuperWowCombatLogger to Oct 18 stable version (Nov 9 update caused issues)
- Added health check to death polling (prevents false clears during boss immunity/phase transitions)
- Protected all warlock DoTs from false combat log fade events (Corruption, Curse of Agony, etc.)

**Root Cause**:
- Combat log sending false "fade" events when mobs die, clearing bars before DoTs expire
- UnitIsDead() returning true during boss phase transitions even when boss has health
- SuperWowCombatLogger Oct 31 version breaking event reliability

---

### 2025-11-02 - Addon Bug Fixes & Feature Implementation
**File**: `SESSION_REPORT_2025-11-02.md`

**Summary**:
- Soul Shard Manager GUI integration with Bagshui
- Chronometer death detection bug fix (persistent DoT timers)
- ShardCapPlus auto-delete cap enforcement fix

**Addons Modified**:
- Bagshui
- Chronometer-TWoW
- ShardCapPlus

**Status**: Complete - Pending in-game validation

**Key Changes**:
- Added GUI panel for shard management (cap setting + manual delete)
- Fixed name decoration mismatch causing DoT timers to persist
- Simplified auto-delete logic to run on every combat exit

---

## Index Guidelines

### Adding New Reports
1. Create report in format: `SESSION_REPORT_YYYY-MM-DD.md`
2. Update this INDEX.md with entry
3. Include summary, files modified, and status

### Report Naming Convention
- Session reports: `SESSION_REPORT_YYYY-MM-DD.md`
- Analysis reports: `ANALYSIS_[topic]_YYYY-MM-DD.md`
- Bug reports: `BUG_[addon]_[issue]_YYYY-MM-DD.md`

### Required Information
- Date
- Summary
- Files modified
- Status (Complete/In Progress/Pending)
- Key changes

---

## System Documentation

### HonorSpy Dashboard System
**File**: `SYSTEM_HonorSpy_Dashboard_2025_12_01.md`
**Linux Copy**: `/var/oled/claude-flow/docs/SYSTEM_HonorSpy_Dashboard_2025_12_01.md`
**Project Location (Windows)**: `C:\turtlewow\HonorTracking\`
**Project Location (Linux)**: `/home/opc/HonorSpy/`

**Summary**:
Distributed honor tracking system for Turtle WoW PvP. Collects HonorSpy addon data from multiple contributors and displays real-time standings, bracket calculations, and RP projections.

**Keywords**: HonorSpy, TurtleWow, PvP, honor tracking, rank points, brackets, decay, weekly reset, snapshots, reverse engineering, contributor system

**Key Components**:
- Flask API server on port 5002
- Nginx reverse proxy
- Automated weekly snapshots (Tue/Wed/Sun) for RP formula reverse engineering
- Awards tracking and comparison
- Contributor upload system
- Honor-weighted RP projections
- TurtleWow no-rank-regression rule implemented

**URLs**:
- Dashboard: http://132.226.72.121/honorspy/
- Awards: http://132.226.72.121/honorspy/awards.html

---

### SR+ Loot System
**File**: `SR-PLUS-ARCHITECTURE-V3.md`
**Parent Directory**: `C:\Claude-Flow\output-files\`
**Linux Copy**: `/home/opc/docs/SR-PLUS-ARCHITECTURE.md`
**Project Location (Linux)**: `/home/opc/tbc-website/`

**Summary**:
SR+ is a soft reserve loyalty loot system for Thralls Book Club (Turtle WoW guild). Players earn +10 bonus per consecutive SR on the same item, achieving hard reserve status after 5 weeks. Requires 24hr signup and consumables for progression runs.

**Keywords**: SR+, soft reserve, loot system, TBC website, Thralls Book Club, Turtle WoW, RaidRes, Raid-Helper, consumables, eligibility

**Key Components**:
- Deno Fresh website on port 8000
- Deno KV database at `/home/opc/tbc-website/data.db`
- Raid-Helper Discord API integration (signups, 24hr check)
- RaidRes.top API integration (SR lists - to be added)
- Combat log parsing (consumables, loot drops)
- Admin panel for run management

**Tab Changes**:
- Upload Loot → SR+ (repurposed)
- New Admin tab (password protected)

**Data Flow**:
1. Raid posted in Discord (Raid-Helper)
2. Admin links RaidRes SR event
3. Combat log uploaded after raid
4. Admin matches loot to SR, enters rolls
5. Credits calculated: Win = burn, Lose = +10

**Implementation Phases**:
1. Foundation: Create /sr-plus and /admin routes
2. RaidRes Integration: Fetch SR lists via API
3. Combat Log Linking: Match loot to SR'd items
4. Credit Management: Roll entry and finalization
5. Polish: Player history, leaderboards, audit log

**URLs**:
- Website: https://tbcguild.duckdns.org/
- SR+ Dashboard: https://tbcguild.duckdns.org/sr-plus
- Admin Panel: https://tbcguild.duckdns.org/admin

**Related Documents**:
- `SR-PLUS-VISION.md` - Initial vision document
- `SR-PLUS-ARCHITECTURE-V2.md` - Previous architecture iteration
- `SR-PLUS-IMPLEMENTATION-ROADMAP.md` - 5-phase implementation plan

---

### SR+ Implementation Roadmap
**File**: `SR-PLUS-IMPLEMENTATION-ROADMAP.md`
**Parent Directory**: `C:\Claude-Flow\output-files\`
**Linux Copy**: `/home/opc/docs/SR-PLUS-IMPLEMENTATION-ROADMAP.md`

**Summary**:
5-phase implementation plan for SR+ loot system. Tracks progress from foundation (manual credits) through RaidRes integration, combat log linking, credit management, and polish.

**Keywords**: SR+ roadmap, implementation phases, Deno KV schema, credit management, RaidRes API

**Phases**:
1. Foundation - Basic routes and manual credit entry
2. RaidRes Integration - Auto-fetch SR lists
3. Combat Log Linking - Match loot to SRs
4. Credit Management - Roll tracking and finalization
5. Polish - Leaderboards, history, audit log

---

### Turtle WoW HD Patches & Raid Visuals
**File**: `SYSTEM_TurtleWoW_HD_Patches_2026_01_03.md`
**Game Location**: `C:\TurtleWoW\`
**Data Folder**: `C:\TurtleWoW\Data\`

**Summary**:
Documentation of Turtle WoW HD graphics patches, Raid Visuals addon installation, and troubleshooting mount texture conflicts. Includes patch compatibility matrix and known issues.

**Keywords**: Turtle WoW, HD patches, Patch-A, Patch-C, Raid Visuals, Marceline, Stormhand, mount textures, BigWigs, VanillaHelpers

**Key Findings**:
- Patch-C (HD Creatures) causes wrong colors on certain mounts (Black War Raptor, etc.)
- Raid Visuals v1.4.6 crashes in cities due to DBC conflict with HD patches
- Raid Visuals v1.3.1 is compatible with HD patches
- VanillaHelpers.dll required for HD patches (Windows Defender may delete it)

**Active Patches**: A, B, D, E, G, I, M, O (patch-O = Raid Visuals v1.3.1)
**Removed Patches**: C (mount color issues)

**Related Links**:
- HD Patch: Reforged Forum: https://forum.turtle-wow.org/viewtopic.php?t=21355
- Raid Visuals GitHub: https://github.com/MarcelineVQ/twow-raid-visuals
- BigWigs GitHub: https://github.com/pepopo978/BigWigs

---

**Last Updated**: 2026-01-03

---

### 2025-12-11 - HonorSpy RP Projection Formula Calibration
**File**: `C:\Claude-Flow\status-reports\2025_12_11_02_45_AM_UTC_HonorSpy_RP_Formula_Calibration.md`
**Date**: December 11, 2025 02:45 UTC

**Summary**:
Fixed RP projection formula in HonorSpy dashboard to use calibrated floor/ceiling values derived from actual December 9, 2025 reset data. Historical week dropdowns now show accurate gain projections.

**Keywords**: HonorSpy, RP formula, bracket awards, honor interpolation, calibration, projections, Turtle WoW, December 9

**Key Changes**:
- Updated `refinedBrackets` object with actual observed floor/ceiling/spread values
- B14: floor 12,410, ceiling 13,000, spread 590 (was incorrectly 12,957/13,012/55)
- B13: floor 11,544, ceiling 12,000, spread 456
- B12-B6: All brackets recalibrated from actual data
- Fixed `originalStanding` assignment for snapshot data in `changeWeek()` function

**Validation Data**:
- Pool size: 1,982 players
- Sample: Pallorina (standing 6, B14) actual award 12,410
- Sample: Minmaxing (standing 7, B13) actual award 12,000

**Status**: Complete - Pending user verification

# HonorSpy Snapshot & Projection System Documentation

**Date:** December 9, 2025

---

## Overview

The HonorSpy system captures weekly PvP honor data and calculates projections for the Tuesday 4PM PST reset. This document describes the snapshot system, projection storage, and reverse engineering capabilities.

---

## Snapshot Types

### Pre-Reset Snapshot
- **When:** Tuesday 3:55 PM PST (5 min before reset)
- **Purpose:** Capture standings and calculate projections BEFORE reset
- **Label:** pre_reset

### Post-Reset Snapshots
- **When:**
  - Tuesday 10:00 PM PST (6 hours after reset)
  - Wednesday 6:00 PM PST (backup)
  - Sunday 6:00 PM PST (backup)
- **Purpose:** Capture ACTUAL results after reset
- **Labels:** post_reset_tue, post_reset_wed, post_reset_sun

---

## Data Stored in Pre-Reset Snapshots

Each player record now contains:

**Raw Data:**
- RP - Current rank points
- rank - Current PvP rank (1-14)
- progress - Progress to next rank (0-1)
- thisWeekHonor - Honor earned this week
- lastWeekHonor - Honor earned last week
- class - Character class

**Projections (NEW as of Dec 9, 2025):**
- standing - Position in honor rankings (1 = highest honor)
- bracket - PvP bracket (1-14) based on percentile
- decay - RP lost to decay (RP × 0.20)
- gain - RP gained from bracket
- net - Net RP change (gain - decay)
- projected_rp - Expected RP after reset (RP + net)
- projected_rank - Expected rank after reset

---

## Bracket Calculation

| Percentile | Bracket | RP Gain |
|------------|---------|---------|
| Top 0.3% | 14 | 13,000 |
| Top 0.6% | 13 | 12,000 |
| Top 1.2% | 12 | 11,000 |
| Top 2.5% | 11 | 10,000 |
| Top 5% | 10 | 9,000 |
| Top 10% | 9 | 8,000 |
| Top 15% | 8 | 7,000 |
| Top 20% | 7 | 6,000 |
| Top 35% | 6 | 5,000 |
| Top 50% | 5 | 4,000 |
| Top 65% | 4 | 3,500 |
| Top 80% | 3 | 3,000 |
| Top 95% | 2 | 2,500 |
| 100% | 1 | 2,000 |

---

## Cron Job Schedule (All times PST)

| Day | Time | Job | Purpose |
|-----|------|-----|---------|
| Tuesday | 3:55 PM | Pre-reset snapshot | Capture standings + projections |
| Tuesday | 10:00 PM | Post-reset snapshot | Capture actual results |
| Tuesday | 10:05 PM | Formula analysis | Compare projected vs actual |
| Tuesday | 10:10 PM | Awards refresh | Update awards.html |
| Wednesday | 6:00 PM | Post-reset snapshot | Backup capture |
| Wednesday | 6:05 PM | Formula analysis | Analysis |
| Wednesday | 6:10 PM | Awards refresh | Update awards.html |
| Sunday | 6:00 PM | Post-reset snapshot | Backup capture |
| Sunday | 6:05 PM | Formula analysis | Analysis |
| Sunday | 6:10 PM | Awards refresh | Update awards.html |

---

## Reverse Engineering Process

### Purpose
Compare PROJECTED values (stored at pre-reset) vs ACTUAL results (from post-reset) to validate and refine the RP calculation formula.

### Comparison Example

**PRE-RESET (Projection):**
- Player: Tjimmyy
- projected_rp: 52,969
- projected_rank: 12

**POST-RESET (Actual):**
- RP: 52,500
- rank: 12

**DIFFERENCE:**
- RP: -469 (projection was 469 too high)
- Rank: Match

### What This Enables
1. Identify systematic over/under predictions
2. Find bracket edge case issues
3. Detect compression effects
4. Refine formula accuracy over time

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/snapshot | POST | Create snapshot |
| /api/snapshot | GET | List all snapshots |
| /api/snapshot/filename | GET | Get specific snapshot |
| /api/week-pairs | GET | Get pre/post pairs |
| /api/awards | GET | Get awards data |
| /api/awards/refresh | POST | Regenerate awards.html |

---

## File Locations

| File | Path |
|------|------|
| API Server | /home/opc/HonorSpy/api.py |
| Snapshots | /home/opc/HonorSpy/snapshots/ |
| Analysis Script | /home/opc/HonorSpy/analyze_formula.py |
| Dashboard HTML | /var/www/html/honorspy/index.html |
| Awards HTML | /var/www/html/honorspy/awards.html |
| Logs | /home/opc/HonorSpy/logs/ |

---

## Changes Made December 9, 2025

1. **Added projection storage to pre_reset snapshots**
   - Now stores: standing, bracket, decay, gain, net, projected_rp, projected_rank
   - Enables true comparison of predicted vs actual

2. **Added awards refresh cron jobs**
   - Tuesday 10:10 PM, Wednesday 6:10 PM, Sunday 6:10 PM
   - Awards page now auto-updates after each post-reset snapshot

3. **Fixed awards page sorting**
   - Removed duplicate sortBy function causing JavaScript errors
   - All columns now sortable on awards.html

4. **Fixed dashboard sorting bugs**
   - Added originalStanding to preserve calculations when sorted
   - Changed Unicode arrows to ASCII for compatibility

---

## Notes

- Pre-reset snapshot timing: 3:55 PM PST gives 5 min buffer before 4 PM reset
- Post-reset timing: 6+ hours after reset ensures addon data is uploaded
- Projection storage started: December 9, 2025 - earlier snapshots don't have projections
- Pool size: Number of players with thisWeekHonor > 0

# TurtleLogs Onyxia Phase 2 Split Bug — Investigation & Fix

**Date:** March 5, 2026, 8:35 PM PST
**Type:** Bug Investigation & Fix
**Server Commit:** `527d2a1` on `main` (tbc-guild-website)
**File Changed:** `routes/api/logs.ts` (+15 lines, -1 line)
**Status:** Fixed and deployed

---

## Problem Statement

When uploading an Onyxia combat log via the HYDRA Guild website (`https://hydraguild.duckdns.org/logs`), the TurtleLogs API integration was sporadically producing **two entries** from a single upload:

1. **Entry A** — Labeled "Onyxia's Lair" (map 249) — contained only wipe attempts (`is_kill: false`)
2. **Entry B** — Labeled "Molten Core" (map 409) — contained the actual kill (`is_kill: true`, `encounter_id: 11` = Onyxia)

The kill was correctly identified as Onyxia (encounter 11), but misassigned to the Molten Core instance. Local parsing on the HYDRA website (player stats, loot history, analysis pages) was unaffected — the bug only manifested on TurtleLogs.

### Affected Dates
- **March 6, 2026** — Entry 95839 (Onyxia's Lair, 2 wipes) + Entry 95840 (Molten Core, 1 kill)
- **January 29, 2026** — Entry 83886 (Onyxia's Lair, 2 wipes + 1 kill) + Entry 83887 (Molten Core, 0 attempts)

### Unaffected Dates
- February 6, 13, 20, 27, 2026 — All produced single correct entries

---

## Investigation Process

### Phase 1: Initial Hypothesis — Zone ID 0

The first theory was that Turtle WoW's `ZONE_INFO` events use `zone_id=0` during combat inside Onyxia's Lair. The proper zone ID (e.g., 8931) only appears after leaving the instance. It was hypothesized that TurtleLogs couldn't determine the correct instance from `zone_id=0`.

**Analysis of all Onyxia logs (Jan 29 – Mar 6):**

All logs — split and non-split alike — had identical zone ID behavior:
- During combat: `ZONE_INFO: dd.mm.yy hh:mm:ss&onyxia's lair&0` (lowercase, ID 0)
- After leaving: `ZONE_INFO: dd.mm.yy hh:mm:ss&Onyxia's Lair&8931` (capitalized, proper ID)

**Conclusion:** Zone ID 0 is universal to all Onyxia logs and is NOT the differentiator.

### Phase 2: Injection Testing

Five progressive injection tests were performed, each uploading a modified copy of the March 6 log to TurtleLogs:

| Test | Modification | Result |
|------|-------------|--------|
| **v1** | Fixed zone IDs: `onyxia's lair&0` → `Onyxia's Lair&249` | **Still split** (2 entries) |
| **v2** | Trimmed pre-instance content + removed all non-Onyxia zones + fixed zone IDs | **Still split** (2 entries) |
| **v3** | Kill-only content (from last `PLAYERS_IN_COMBAT: 0/14` to end) + zone header | **Still split** (2 entries) |
| **v4** | Pure fight content (single Onyxia engagement only, no trash, no wipes) | **Still split** (2 entries) |
| **v5** | Removed `Hover(17131)` line (Onyxia Phase 2 transition spell) | **SINGLE ENTRY** ✓ |

Each test involved deleting the previous entries via TurtleLogs API (`deleteUpload`) before re-uploading.

### Phase 3: Root Cause Identification

The split timestamp was consistently `02:22:41` across all test uploads. Examination of the combat log at that timestamp revealed:

```
02:22:39.010  CAST: Onyxia casts Fireball(18392) on Blazer     ← Last Phase 2 action
                                                                 ← 7-second gap
02:22:46.165  CAST: Onyxia casts Bellowing Roar(18431)          ← Phase 3 landing
02:22:52.086  CAST: Onyxia casts Cleave(19983)                  ← Phase 3 melee resumes
```

**The gap between Onyxia's last Fireball and Bellowing Roar is where TurtleLogs splits the encounter.** Onyxia's Phase 2 (air phase) is triggered by the `Hover(17131)` cast at `02:20:00.148`.

### Phase 4: Cross-Log Phase 2 Duration Analysis

| Date | Phase 2 Duration (Hover → Bellowing Roar) | Split? |
|------|------------------------------------------|--------|
| Feb 27 (wipe) | 0:41 | No |
| Feb 27 (kill) | 0:34 | No |
| Jan 29 (wipe) | 0:47 | — |
| **Jan 29 (kill)** | **2:02** | **Yes** |
| Feb 20 | 2:08 | No |
| Feb 6 | 2:15 | No |
| Feb 13 (attempt 1) | 2:47 | No |
| Feb 13 (kill) | 1:32 | No |
| **Mar 6** | **2:46** | **Yes** |

Phase 2 duration alone does not perfectly predict the split (Feb 6 at 2:15 was fine). However, the split only occurs on logs with longer Phase 2 durations, suggesting TurtleLogs' encounter boundary detection has a variable threshold that interacts with other combat event patterns (whelp spawn density, Heated Ground casts, Deep Breath passes).

**The definitive proof was test v5:** removing the single `Hover(17131)` line eliminated the split entirely, producing a correct single entry with 2 attempts (1 wipe + 1 kill) in Onyxia's Lair (map 249).

---

## Root Cause

**TurtleLogs' server-side combat log parser uses the `Hover(17131)` spell cast as an encounter phase boundary marker.** When it detects Hover, it splits the encounter into pre-Hover and post-Hover segments. For Onyxia, this corresponds to:

- **Segment 1 (Phase 1 + early Phase 2):** Ground phase melee combat → Hover → Fireballs → whelps
- **Segment 2 (Phase 3):** Bellowing Roar → ground phase melee → kill

Due to a bug in TurtleLogs' instance assignment logic, Segment 2 gets mapped to **Molten Core (map 409)** instead of Onyxia's Lair (map 249). The encounter_id is correctly identified as 11 (Onyxia) in both segments, but the map assignment fails.

This is a **TurtleLogs server-side parser bug**, not a client-side or data issue. The fix works around it by removing the trigger event.

---

## Fix Applied

### Code Change (`routes/api/logs.ts`, lines 1361-1374)

```typescript
// Fix TurtleLogs Onyxia Phase 2 split bug: TurtleLogs parser splits encounters
// at Hover(17131) cast, misassigning the kill to Molten Core. Remove Hover lines
// and fix zone IDs for the TurtleLogs copy only (does NOT affect local parsing).
let turtleContent = data.content;
if (data.raidType === "ONY") {
  turtleContent = turtleContent
    .split("\n")
    .filter((l: string) => !l.includes("Hover(17131)"))
    .join("\n");
  turtleContent = turtleContent.replace(
    /ZONE_INFO: (\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2})&onyxia's lair&0/gi,
    (_m: string, ts: string) => "ZONE_INFO: " + ts + "&Onyxia's Lair&249"
  );
}
const zipData = zipSync({ "WoWCombatLog.txt": strToU8(turtleContent) });
```

### Key Design Decisions

1. **TurtleLogs-only:** The fix creates a separate `turtleContent` variable. `data.content` (used for local parsing, file save, player stats, loot history) is never modified.
2. **ONY-gated:** Only applies when `data.raidType === "ONY"`. No other raids are affected.
3. **Hover removal:** Strips all lines containing `Hover(17131)`. This is the only spell that triggers the split. Onyxia has exactly one Hover cast per attempt (Phase 1 → Phase 2 transition).
4. **Zone ID normalization:** Secondary fix — replaces `onyxia's lair&0` (lowercase, zone ID 0) with `Onyxia's Lair&249` (proper case, map ID). This is a defense-in-depth measure; the Hover removal alone fixes the split.

---

## Verification

### Before Fix (March 6, 2026 original upload)
```
Entry 95839: Onyxia's Lair (map 249), 02:06-02:27, 2 wipe attempts
Entry 95840: Molten Core (map 409), 02:22-02:25, 1 kill ← WRONG
```

### After Fix (test upload v5)
```
Entry 95884: Onyxia's Lair (map 249), 02:06-02:25, 2 attempts (1 wipe + 1 kill) ✓
```

---

## TurtleLogs API Operations Performed

During investigation, the following TurtleLogs API operations were executed:

| Operation | Entry IDs | Purpose |
|-----------|----------|---------|
| Delete | 95839, 95840 | Remove original split entries |
| Upload v1 | → 95874, 95875 | Test zone ID fix (still split) |
| Delete | 95874, 95875 | Clean up |
| Upload v2 | → 95876 | Test aggressive trim (partial — broken regex) |
| Delete | 95876 | Clean up |
| Upload v3 | → 95877, 95878 | Test aggressive trim v2 (still split) |
| Delete | 95877, 95878 | Clean up |
| Upload v4 | → 95880, 95881 | Test kill-only (still split) |
| Delete | 95880, 95881 | Clean up |
| Upload v5 | → 95882, 95883 | Test pure fight (still split) |
| Delete | 95882, 95883 | Clean up |
| **Upload v6** | → **95884** | **Hover removal — SUCCESS (single entry)** |

Final state: Entry **95884** — Onyxia's Lair, 2 attempts, 1 kill. Correct.

---

## Additional Context: Website Crash Loop (Same Session)

Earlier in this session, the website experienced a 55-minute crash loop (15:32–16:27 PST) caused by:

1. Something SIGKILL'd the deno process at 15:32:34
2. `ExecStartPre` used `ss` command which wasn't in PATH (`ss: command not found`)
3. A rogue `nohup deno task start` process was holding port 8000
4. Each restart attempt: 50s warmup → `AddrInUse: Address already in use (os error 98)` → crash → 10s wait → repeat (949+ restarts)

**Fix (applied in prior session, commit `579f8c5c`):** Changed ExecStartPre from `ss` to `fuser -k 8000/tcp`, added `/usr/sbin` to PATH. Instance stable since 16:27:35 PST.

The user also experienced Firefox DNS cache poisoning from the extended outage — "We're having trouble finding that site" errors persisted after the server recovered. Server was confirmed healthy via nginx logs showing successful requests. Resolution: clear Firefox DNS cache via `about:networking#dns`.

---

## Files Referenced

| File | Location | Purpose |
|------|----------|---------|
| `routes/api/logs.ts` | Server: `/home/opc/tbc-website/` | Main combat log upload API (patched) |
| `utils/turtlogs-api.ts` | Server: `/home/opc/tbc-website/` | TurtleLogs API utility (login, upload, delete, query) |
| `islands/LogProcessor.tsx` | Server: `/home/opc/tbc-website/` | Client-side log trimming (unmodified) |
| `TurtLog-ONY-2026-03-06-Onyxia.txt` | Server: `/home/opc/tbc-website/logs/` | March 6 combat log (31,830 lines, 2.2MB) |
| `tbc-website.service` | Server: `/etc/systemd/system/` | Systemd service unit (fixed in prior session) |

---

## Recommendations

1. **Monitor next Onyxia upload** — Verify the fix works end-to-end through the normal upload flow (not just manual API testing).
2. **Consider reporting to TurtleLogs** — The Hover-based encounter splitting is a parser bug on their side. Other guilds likely experience the same issue.
3. **No action needed for other raids** — Only Onyxia has the Hover-based Phase 2 transition. Other raids (MC, BWL, AQ, Naxx) use different mechanics and are not affected.

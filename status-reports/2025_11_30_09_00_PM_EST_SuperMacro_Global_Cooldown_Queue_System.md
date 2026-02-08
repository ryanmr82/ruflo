# SuperMacro Global Cooldown & Queue System Implementation

**Date:** November 30, 2025, 9:00 PM EST
**Status:** Completed Successfully
**Type:** Feature Enhancement

---

## Summary

Added a global cooldown system with queue functionality to the SuperMacro addon's auto-run feature. This prevents multiple auto-run macros from posting within a configurable time window, avoiding spam violations in TurtleWoW.

---

## Problem Solved

**Original Issue:** Multiple auto-run macros with different intervals (e.g., 7 min and 11 min) would eventually collide and post within the same time window:
- Macro A at 7 min intervals: 0, 7, 14, **21**, 28...
- Macro B at 11 min intervals: 0, 11, **22**, 33...
- At minutes 21 and 22: only 1 minute apart → spam violation (GM warning)

**Solution:** Implemented a global cooldown that ensures a minimum time gap between ANY two auto-run macro posts, regardless of individual intervals.

---

## Features Added

### 1. Global Cooldown System
- Configurable minimum time between any two macro posts (1-10 minutes)
- Default: 3 minutes
- Persists across sessions via SavedVariables

### 2. Queue System
- When a macro's timer fires during global cooldown, it gets queued
- Queued macros post automatically when cooldown expires
- First-in-first-out (FIFO) order
- Macros removed from queue if disabled
- Chat messages notify when macros are queued/posted

### 3. UI Elements
- **Global CD:** label with input field (minutes)
- **Queue:** label with count display showing queued macros

---

## Files Modified

| File | Changes |
|------|---------|
| `SM_AutoRun.lua` | Complete rewrite with global cooldown, queue system, new functions |
| `SuperMacro.xml` | Added Global CD labels, input field, Queue display elements |
| `SuperMacro.toc` | Added `SM_AUTORUN_SETTINGS` to SavedVariables |

---

## Technical Implementation

### New Functions in SM_AutoRun.lua:
- `SM_AutoRun_GetGlobalCooldown()` - Returns cooldown in seconds
- `SM_AutoRun_SetGlobalCooldown(minutes)` - Sets cooldown (1-10 min range)
- `SM_AutoRun_GetQueueSize()` - Returns number of queued macros
- `IsInQueue(macroName)` - Check if macro is queued
- `AddToQueue(macroName)` - Add macro to queue
- `RemoveFromQueue(macroName)` - Remove macro from queue
- `ProcessQueue()` - Post next queued macro if cooldown allows

### New Variables:
- `SM_AUTORUN_SETTINGS` - SavedVariables table for global settings
- `lastGlobalPost` - Timestamp of last post from ANY macro
- `postQueue` - Array of macro names waiting to post

### Logic Flow:
1. On each update tick, `ProcessQueue()` runs first
2. If queue has items AND global cooldown passed → post first queued macro
3. Then check each enabled macro's individual timer
4. If individual timer fires AND global cooldown passed → post immediately
5. If individual timer fires BUT global cooldown active → add to queue

---

## UI Layout (SuperMacro Frame - Super Tab)

```
Auto-Run: [checkbox]
Every [ 7 ] min

Global CD: [ 3 ] min
Queue: 0
```

---

## Backups Created

| Original File | Backup Location |
|--------------|-----------------|
| `SM_AutoRun.lua` | `backup\SM_AutoRun.lua.backup_2025_11_30` |
| `SuperMacro.xml` | `backup\SuperMacro.xml.backup_2025_11_30` |

---

## Rollback Procedure

To restore original files:
```powershell
Copy-Item "C:\TurtleWoW\Interface\AddOns\SuperMacro\backup\SM_AutoRun.lua.backup_2025_11_30" "C:\TurtleWoW\Interface\AddOns\SuperMacro\SM_AutoRun.lua" -Force
Copy-Item "C:\TurtleWoW\Interface\AddOns\SuperMacro\backup\SuperMacro.xml.backup_2025_11_30" "C:\TurtleWoW\Interface\AddOns\SuperMacro\SuperMacro.xml" -Force
```

Also revert SuperMacro.toc line 8 to remove `SM_AUTORUN_SETTINGS`.

---

## Testing Checklist

1. [ ] Launch TurtleWoW and open SuperMacro frame
2. [ ] Go to Super tab - verify new UI elements appear (Global CD, Queue)
3. [ ] Set Global CD to desired value (e.g., 3 min)
4. [ ] Enable auto-run on multiple macros with different intervals
5. [ ] Verify macros queue when they would collide
6. [ ] Verify queued macros post when cooldown expires
7. [ ] Check chat messages for queue/post notifications

---

## Chat Messages

The system outputs status messages:
- `SuperMacro: [name] queued (cooldown active)` - Macro added to queue
- `SuperMacro: [name] posted (from queue)` - Macro posted from queue
- `SuperMacro: Global cooldown = X min` - When cooldown value changed

---

## Configuration Limits

| Setting | Min | Max | Default |
|---------|-----|-----|---------|
| Global Cooldown | 1 min | 10 min | 3 min |
| Individual Interval | 1 min | 60 min | 5 min |

---

*Report generated: November 30, 2025, 9:00 PM EST*

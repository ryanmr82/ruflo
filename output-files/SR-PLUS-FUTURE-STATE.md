# SR+ System - Future State Design

## Overview
SR+ is a loyalty reward system where players who repeatedly soft-reserve the same item across multiple raids earn bonus roll priority.

---

## User Flow

1. User signs up for raid (via Raid-Helper Discord bot)
2. User creates soft reserves on raidres.top
3. User visits MySRPortal on website
4. User sees raids they're signed up for
5. User picks ONE item per raid type to mark as SR+ (from their raidres.top SRs)
6. Pick is stored in database
7. User attends raid:
   - **Wins item** → SR+ entry cleared, pick new item next time
   - **Doesn't win** → SR+ tally increases by 1

---

## Admin Flow

### View:
- Admin selects raid type (MC, BWL, AQ40, etc.)
- Sees ALL players with SR+ picks for that raid type
- For each player:
  - Player name
  - Item marked as SR+
  - Times SR+'d (attendance count while SR+'ing this item)
  - Current bonus (calculated from times SR+'d)

### Edit:
- Admin can manually adjust "Times SR+'d" count
- All admin edits are logged (immutable)

---

## Automation Flow (Cron Job - Every 5 Minutes)

1. Check for new combat logs uploaded
2. For each unprocessed log:
   - Extract raid type and date
   - Check against reset schedule to determine if continuation or new lockout
   - Get player attendance (name in playerStats = present)
   - For each present player with SR+ pick for that raid type:
     - Increment their "Times SR+'d" by 1
   - Scan loot array for SR+ item matches
   - For each player who won their SR+ item:
     - Clear their SR+ entry
     - Log to history
   - Mark log as processed

---

## Data Model

### sr_plus_entries
```
Key: ["sr_plus", "entries", raidType, visitorId]
Value: {
  visitorId: string,           // Discord ID
  playerName: string,          // Character name
  raidType: string,            // MC, BWL, AQ40, etc.
  itemName: string,            // Current SR+ item
  timesSRd: number,            // Times attended while SR+'ing this item
  currentBonus: number,        // timesSRd * bonusPerSR
  pickedAt: timestamp,         // When they picked this item
  lastIncrementedAt: timestamp,
  lastProcessedLogId: string,  // Prevent double-counting
}
```

### sr_plus_history
```
Key: ["sr_plus", "history", visitorId, timestamp]
Value: {
  visitorId: string,
  playerName: string,
  raidType: string,
  itemName: string,
  action: "picked" | "incremented" | "won" | "changed" | "admin_edit",
  previousValue: number,
  newValue: number,
  logId: string,               // If from log processing
  adminNote: string,           // If admin edit
  timestamp: timestamp,
}
```

### sr_plus_admin_log (Immutable)
```
Key: ["sr_plus", "admin_log", timestamp]
Value: {
  adminId: string,
  action: string,
  targetPlayer: string,
  targetRaidType: string,
  previousValue: any,
  newValue: any,
  timestamp: timestamp,
}
```

### sr_plus_settings
```
Key: ["sr_plus", "settings"]
Value: {
  bonusPerSR: number,          // Default: 20
  hardReserveThreshold: number // Default: 5
}
```

---

## UI Components

### MySRPortal Page (Two Tabs)
1. **"My SR+" Tab**
   - User's own picks per raid type
   - Select raid → see their raidres.top SRs → pick one for SR+
   - In-app notification when tally increases

2. **"Guild SR+" Tab**
   - Read-only view of all players' SR+ status
   - Filter by raid type
   - Shows: Player, Item, Times SR+'d, Bonus, Status (HR if >= 5)

### Admin SR+ Manager
- Raid type tabs (MC, BWL, AQ40, etc.)
- Table: Player | Item | Times SR+'d | Bonus | Status | Edit
- Edit button allows manual adjustment
- All edits logged
- Export CSV button
- Settings panel (bonus per SR, HR threshold)

---

## Reset Schedule (Tel'Abim Server)

| Category | Raids | Reset Frequency | Reset Day/Time |
|----------|-------|-----------------|----------------|
| RAID 40 | MC, BWL, ES, AQ40, Naxx | Weekly | Thursday 16:29 ST |
| KARA 40 | Tower of Karazhan | Weekly | Wednesday 16:29 ST |
| ONYXIA | Onyxia | Every 5 days | Rolling |
| KARA 10 | Lower Karazhan | Every 5 days | Rolling |
| RAID 20 | ZG, AQ20 | Every 3 days | Rolling |

---

## Business Rules

1. **One SR+ per raid type** - Player can have SR+ in MC AND BWL, but only one item per raid
2. **Reset on new pick** - When player picks new item (win or change), timesSRd resets to 0
3. **Hard Reserve** - At 5+ times SR+'d, item becomes "Hard Reserve" status
4. **Conflict Resolution** - Two players with HR on same item = roll off in-game
5. **Visibility** - All players can see everyone's SR+ status (read-only)
6. **No decay** - SR+ count doesn't decrease over time
7. **Attendance = Present in log** - If player name appears in combat log playerStats, they attended

---

## Items to Delete (Cleanup)

### Database Tables to Remove:
- `["sr_plus", "credits", ...]` - Old broken system
- `["sr_plus", "runs", ...]` - Unused manual run system
- `["sr_picks", ...]` - Old picks format (migrate data first if needed)

### Admin Page Elements to Remove:
- "Create New Run from Discord" section
- "Progression Run (requires consumables)" checkbox
- "Recent Runs" table

---

## Notifications

- **Type:** In-app toast/banner
- **Trigger:** When user visits MySRPortal
- **Message:** "Your SR+ on [Item] increased! You now have X stacks (+Y bonus)"

# TBC Guild Website - Architecture Current State Documentation

## Task Summary
Created comprehensive architecture documentation for the TBC Guild website (Thralls Book Club - Turtle WoW) including database schema, API routes, data flow diagrams, and component mapping.

## Date
December 13, 2025, 3:45 AM UTC

## Server
torreyserver (132.226.72.121)

---

## What Was Accomplished

### 1. Complete Database Audit
Identified all Deno KV key prefixes in use:
- `["attendance", id]` - Individual attendance records
- `["raids-saved", raidId]` - Raid summary after attendance saved
- `["combat_logs", logId]` - Processed combat log summaries
- `["combat_logs_raw", logId]` - Raw combat log content
- `["sessions", sessionId]` - User login sessions
- `["user_profiles", discordId]` - User profile with linked characters
- `["items", "by_id/by_name", ...]` - Item cache (self-healing)
- `["sr_picks", discordId, eventId]` - User's SR+ picks per event
- `["sr_plus", "settings"]` - SR+ system settings
- `["sr_plus", "credits", ...]` - **BROKEN** - SR+ credit tracking
- `["sr_plus", "runs", runId]` - **UNUSED** - Manual SR+ runs

### 2. API Routes Documentation
Mapped all 20+ API endpoints across categories:
- Authentication (`/api/auth/*`)
- SR+ System (`/api/sr-plus/*`)
- Items (`/api/items/*`)
- Combat Logs (`/api/logs`)
- Raids & Attendance (`/api/raids`, `/api/attendance`)

### 3. Data Flow Diagrams
Created ASCII diagrams for:
- User SR+ Pick Flow
- Item Lookup Self-Healing Flow
- Combat Log Processing Flow

### 4. Component Map
Documented all 15 islands and their API dependencies:
- MySRPortal.tsx, SRPlusSpreadsheet.tsx, SRPlusPublic.tsx
- RaidResFetcher.tsx, ItemTooltip.tsx, ItemCatalogAdmin.tsx
- LogProcessor.tsx, PlayerStatsTable.tsx, etc.

### 5. Known Issues Documented
- SR+ Credits Table - Broken (inconsistent key formats)
- SR+ Runs Table - Unused
- Disconnected Systems (sr_picks, sr_plus/credits, sr_plus/runs don't connect)
- raidItemId vs WoW Item ID mismatch

### 6. Website Architecture Page
Created `/architecture` route with interactive ArchitectureDocs island:
- **Current State Tab**: Database schema, API routes, data flows, component map, known issues
- **Future State Tab**: SR+ redesign, new data model, automation, business rules

---

## Files Created/Modified

### Local (Windows)
- `C:\Claude-Flow\status-reports\2025_12_13_03_45_AM_UTC_TBCGuild_Architecture_Current_State_Documentation.md` (this file)
- `C:\Claude-Flow\status-reports\2025_12_13_03_50_AM_UTC_TBCGuild_SR_Plus_Future_State_Design.md`

### Server (Linux)
- `/home/opc/tbc-website/routes/architecture.tsx` - New page route
- `/home/opc/tbc-website/islands/ArchitectureDocs.tsx` - Interactive component (29KB)
- `/home/opc/tbc-website/components/Nav.tsx` - Updated with Architecture link

---

## Commands Used

```bash
# Deploy files to server
scp -i "C:\Users\ryanr\.ssh\git-key" "architecture.tsx" opc@132.226.72.121:/home/opc/tbc-website/routes/
scp -i "C:\Users\ryanr\.ssh\git-key" "ArchitectureDocs.tsx" opc@132.226.72.121:/home/opc/tbc-website/islands/
scp -i "C:\Users\ryanr\.ssh\git-key" "Nav.tsx" opc@132.226.72.121:/home/opc/tbc-website/components/

# Restart Deno server with watch on islands/components
ssh opc@132.226.72.121 "kill <pid>; cd /home/opc/tbc-website && nohup deno run -A --watch=static/,routes/,islands/,components/ dev.ts > /tmp/tbc.log 2>&1 &"

# Verify page works
curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/architecture
# Returns: 200
```

---

## Technologies
- Deno Fresh framework
- Deno KV database
- Preact islands architecture
- TypeScript
- SSH/SCP for deployment

---

## Verification

Architecture page verified working at `http://localhost:8001/architecture`:
- Returns HTTP 200
- Nav link shows "Architecture" in menu bar
- Both Current State and Future State tabs render correctly
- All collapsible sections work (Database, API, Flow Diagrams, Components, Issues)

---

## Related Documentation

- Previous: `2025_12_12_09_10_AM_UTC_TBCGuild_SR_Plus_Phase1_Admin_UI.md`
- Previous: `2025_12_12_08_56_AM_UTC_TBCGuild_SR_Plus_System_Design_Document.md`

---

## Lessons Learned

1. Deno Fresh with `--watch` only monitors specified directories - had to add `islands/` and `components/` to watch list for hot reload
2. The server was already running on port 8001 in dev mode - changes required server restart when adding new islands
3. Document discovered that 5,990 of 7,138 items in static JSON are missing icons - self-healing lookup was previously implemented to address this

---

## Status
Completed Successfully

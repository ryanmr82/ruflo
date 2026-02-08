# GBankExport Addon - Created for TurtleWoW

**Date:** 2026-02-04 03:10 AM PST (updated 03:18 AM PST)
**Task:** Build a TurtleWoW addon to scan and export guild bank contents

---

## What Was Accomplished

Built a custom TurtleWoW addon called **GBankExport** that:
1. Auto-scans all guild bank tabs when the player opens the guild bank
2. Records every item's name, count, quality, itemId, slot, and tab
3. Saves all data to WoW's SavedVariables system (persists across sessions)
4. Provides in-game slash commands for viewing data
5. **Auto-exports to JSON and TXT** via a background file watcher — no manual steps needed

## Files Created

| File | Path | Purpose |
|------|------|---------|
| GBankExport.toc | `C:\turtlewow\Interface\AddOns\GBankExport\GBankExport.toc` | Addon descriptor (Interface 11200) |
| GBankExport.lua | `C:\turtlewow\Interface\AddOns\GBankExport\GBankExport.lua` | Main addon code (~250 lines Lua) |
| AutoExport.ps1 | `C:\turtlewow\Interface\AddOns\GBankExport\AutoExport.ps1` | Background watcher — auto-exports on SavedVariables change |
| AutoExport.log | `C:\turtlewow\Interface\AddOns\GBankExport\AutoExport.log` | Watcher activity log |
| Export.ps1 | `C:\turtlewow\Interface\AddOns\GBankExport\Export.ps1` | Manual one-off exporter (interactive, with prompts) |
| Export.bat | `C:\turtlewow\Interface\AddOns\GBankExport\Export.bat` | Batch wrapper for manual Export.ps1 |
| GBankExport-AutoExport.vbs | `C:\Users\ryanr\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\` | Windows Startup launcher (runs watcher hidden on login) |

## Auto-Export System

### How It Works
1. `GBankExport-AutoExport.vbs` in the Windows Startup folder launches `AutoExport.ps1` hidden at every Windows login
2. `AutoExport.ps1` polls `C:\turtlewow\WTF\Account\*\SavedVariables\GBankExport.lua` every 5 seconds
3. When WoW flushes SavedVariables (logout, /reload, character switch), the file modification time changes
4. Watcher detects the change, waits 1.5s debounce, then parses and exports
5. Output: `GuildBank_<ACCOUNT>.json` and `GuildBank_<ACCOUNT>.txt` in the addon folder

### Watcher Features
- **Mutex lock**: prevents duplicate instances
- **Log rotation**: AutoExport.log rotates at 2MB
- **Smart initial export**: on startup, only re-exports if SavedVariables is newer than existing output files
- **Re-scans account dirs** each cycle (handles new accounts appearing)
- **Error handling**: catches and logs errors without crashing

### Watcher Process
- Runs as: `powershell.exe -WindowStyle Hidden` (no visible window)
- PID logged in AutoExport.log
- To stop: kill the PowerShell process via Task Manager, or delete the .vbs from Startup folder
- To verify running: check `AutoExport.log` for recent timestamps

## Technical Details — Addon

### How the Lua Addon Works
- Registers for `GUILDBANKFRAME_OPENED` event and hooks `GuildBankFrame:OnShow()` as a fallback
- Iterates tabs using `GetNumGuildBankTabs()`, queries each with `QueryGuildBankTab(tab)`
- Waits for `GUILDBANKBAGSLOTS_CHANGED` event or `GuildBankFrame_Update` hook to confirm data loaded
- Falls back to a 2-second timeout if no data event fires (reads cached data)
- Stores two SavedVariables:
  - `GBankExport_Data` — full structured Lua table
  - `GBankExport_FlatData` — pipe-delimited flat text for easy external parsing

### SavedVariables Location
`C:\turtlewow\WTF\Account\<ACCOUNT_NAME>\SavedVariables\GBankExport.lua`

### In-Game Commands
- `/gbe` or `/gbankexport` — Show help
- `/gbe scan` — Manual rescan (must be at guild bank)
- `/gbe status` — Show last scan summary
- `/gbe list` — List all items sorted A-Z
- `/gbe tabs` — List items organized by tab

### Output Files (auto-generated)
- `C:\turtlewow\Interface\AddOns\GBankExport\GuildBank_<ACCOUNT>.json` — Full JSON
- `C:\turtlewow\Interface\AddOns\GBankExport\GuildBank_<ACCOUNT>.txt` — Formatted text

### TurtleWoW API Functions Used
- `GetNumGuildBankTabs()`
- `GetGuildBankTabInfo(tab)`
- `GetGuildBankItemInfo(tab, slot)`
- `GetGuildBankItemLink(tab, slot)`
- `QueryGuildBankTab(tab)`
- `GetCurrentGuildBankTab()`

### Confirmed Compatibility References
- pfUI's `skins/blizzard/guildbank.lua` confirms all guild bank API functions exist in TurtleWoW
- `MAX_GUILDBANK_SLOTS_PER_TAB`, `NUM_GUILDBANK_COLUMNS`, `NUM_SLOTS_PER_GUILDBANK_GROUP` are global constants
- `Blizzard_GuildBankUI` is a load-on-demand addon in TurtleWoW
- `hooksecurefunc` is available in TurtleWoW

## Research Findings

- No existing TurtleWoW addon scans/exports guild bank contents
- BankItems (Classic WoW) does this but is incompatible with 1.12 client
- Road-block/guildbank addon only handles personal bags/bank
- TurtleWoW backported guild bank from WoW 2.3 (TBC) with full API support

## Potential Issues / Notes

1. **Event names**: If `GUILDBANKFRAME_OPENED` or `GUILDBANKBAGSLOTS_CHANGED` don't exist in TurtleWoW under those exact names, the addon falls back to frame hooks (`OnShow`/`OnHide`) and `GuildBankFrame_Update` hook, plus a 2-second timeout per tab
2. **Data flush**: SavedVariables only write to disk on logout, /reload, or character switch — not in real-time
3. **Tab permissions**: Tabs the player doesn't have view access to are automatically skipped
4. **Multiple accounts**: The watcher handles all accounts found in WTF folder

## Full Automatic Flow

1. Windows login → `GBankExport-AutoExport.vbs` starts watcher hidden
2. Play TurtleWoW → open guild bank → addon auto-scans all tabs
3. Log out or `/reload` → WoW flushes SavedVariables to disk
4. Watcher detects file change → auto-exports JSON + TXT within ~7 seconds
5. View `GuildBank_<ACCOUNT>.json` or `.txt` anytime — always up to date

## Rollback

1. Delete addon folder: `C:\turtlewow\Interface\AddOns\GBankExport\`
2. Delete SavedVariables: `C:\turtlewow\WTF\Account\*\SavedVariables\GBankExport.lua`
3. Delete startup launcher: `C:\Users\ryanr\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\GBankExport-AutoExport.vbs`
4. Kill any running AutoExport PowerShell process via Task Manager

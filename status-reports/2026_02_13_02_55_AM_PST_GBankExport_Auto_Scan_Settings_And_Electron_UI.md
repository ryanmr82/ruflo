# GBankExport v3.1 — Auto-Scan Settings + Electron App UI

**Date:** February 13, 2026, 2:55 AM PST
**Type:** Feature Addition
**Status:** Completed — Installer Built, Ready for Testing

---

## What Was Accomplished

Added user-controlled auto-scan settings to the GBankExport addon and corresponding UI controls in the AH & Vault Sync Electron app. Settings are bidirectionally synced via the WoW SavedVariables file.

### Problem
GBankExport v3.0 auto-scanned every time the guild bank was opened, with no way to disable or throttle it. This caused the addon to cycle through all tabs every time the bank was opened, which was disruptive during normal bank usage.

### Solution Implemented
1. **New SavedVariable:** `GBankExport_Settings` stores `autoScan` (boolean) and `cooldownMinutes` (number)
2. **Auto-scan toggle:** `/gbe auto` flips auto-scan on/off (persists via SavedVariables)
3. **Cooldown timer:** `/gbe cooldown <minutes>` sets minimum time between auto-scans (default: 30 min)
4. **Manual scan always works:** `/gbe scan` bypasses both toggle and cooldown
5. **Electron app UI:** New "Guild Bank Scanner" section with checkbox toggle, cooldown dropdown, and scan info display
6. **Bidirectional sync:** Electron writes to SavedVariables (player does /reload to apply); in-game changes are picked up by file watcher and pushed to Electron UI

---

## Files Modified

### WoW Addon (GBankExport)
| File | Change |
|------|--------|
| `C:\Claude-Flow\output-files\ah-vault-sync-app\addons\GBankExport\GBankExport.lua` | Added `GBankExport_Settings` SavedVariable, `GetSetting()` helper, cooldown gate in OnShow hook, `/gbe auto`, `/gbe cooldown`, `/gbe settings` commands, updated help text. Version 3.0 -> 3.1. |
| `C:\Claude-Flow\output-files\ah-vault-sync-app\addons\GBankExport\GBankExport.toc` | Added `GBankExport_Settings` to `## SavedVariables` line. Version 3.0 -> 3.1. |

### Electron App (AH & Vault Sync)
| File | Change |
|------|--------|
| `C:\Claude-Flow\output-files\ah-vault-sync-app\src\main.js` | Added IPC handlers `get-gbank-settings` and `save-gbank-settings`. Added `parseGBankSettings()`, `writeGBankSettings()`, `readGBankSettingsFromDisk()`, `refreshGBankSettingsToRenderer()` helpers. Hooked `guildBankChanged` to push settings updates to renderer. |
| `C:\Claude-Flow\output-files\ah-vault-sync-app\src\renderer\index.html` | Added "Guild Bank Scanner" section with auto-scan checkbox, cooldown dropdown, scan info box, and in-game command reference. |
| `C:\Claude-Flow\output-files\ah-vault-sync-app\src\renderer\renderer.js` | Added DOM references for new elements. Added IPC handlers for `gbank-settings-data`, `gbank-settings-updated`, `gbank-settings-saved`. Added `updateGBankSettingsUI()`. Modified `saveConfig()` to also save GBank settings. |
| `C:\Claude-Flow\output-files\ah-vault-sync-app\src\renderer\styles.css` | Added styles for `.gbank-info-box`, `.gbank-info-row`, `.gbank-commands`, `.gbank-hint`. |
| `C:\Claude-Flow\output-files\ah-vault-sync-app\package.json` | Version 6.0.0 -> 6.1.0 |

---

## Bidirectional Sync Mechanism

**Shared file:** `WTF\Account\<ACCOUNT>\SavedVariables\GBankExport.lua`

| Direction | Trigger | Mechanism |
|-----------|---------|-----------|
| Electron -> Game | User changes settings in app, clicks "Save Settings" | Electron regex-replaces `GBankExport_Settings` block in the `.lua` file. Player does `/reload` in-game to pick up new values. |
| Game -> Electron | User types `/gbe auto` or `/gbe cooldown 30`, then `/reload` or logs out | WoW writes SavedVariables to disk. Chokidar file watcher detects change on `GBankExport.lua`. Main process reads new settings and sends `gbank-settings-updated` IPC to renderer. |

---

## New In-Game Commands

| Command | Description |
|---------|-------------|
| `/gbe auto` | Toggle auto-scan on/off |
| `/gbe cooldown <min>` | Set scan cooldown (0 = disabled) |
| `/gbe settings` | Show current settings |
| `/gbe scan` | Force manual scan (always works) |

---

## What Was NOT Changed

- All existing scan logic (tab switching, item reading, data export, flat format)
- All existing slash commands (`/gbe scan`, `/gbe status`, `/gbe list`, `/gbe tabs`, `/gbe debug`)
- All existing Electron app sections (WoW Installation, Addons, Accounts, Sync Settings, Sync Status)
- File watcher behavior for price/guild bank/bank alt data uploads
- Server upload logic
- Tray menu behavior

---

## Installer Location

**`C:\Claude-Flow\output-files\ah-vault-sync-app\dist\AH & Vault Sync Setup 6.1.0.exe`**
- Size: 83.4 MB
- Built: February 13, 2026, 2:48 AM PST

---

## Backup Location

**`C:\Claude-Flow\output-files\ah-vault-sync-app\backup\pre-gbank-settings-v6.1\`**

Contains pre-modification copies of all 8 files that were edited.

---

## Testing Checklist

- [ ] Install v6.1.0, verify existing settings/accounts preserved
- [ ] Verify new "Guild Bank Scanner" section visible in app UI
- [ ] Toggle auto-scan checkbox, click Save, verify file written
- [ ] Change cooldown dropdown, click Save, verify file written
- [ ] Click "Reinstall Addons" to update the addon in WoW folder
- [ ] Open guild bank in-game — should auto-scan (first time, no previous scan)
- [ ] Close and re-open guild bank within 30 min — should show cooldown skip message
- [ ] Type `/gbe auto` — should toggle to OFF
- [ ] Re-open guild bank — should show "Auto-scan is OFF" message
- [ ] Type `/gbe scan` — should force scan regardless of toggle/cooldown
- [ ] Type `/gbe cooldown 5` — should set cooldown to 5 min
- [ ] Type `/gbe settings` — should show current values
- [ ] Do `/reload` — Electron app should update to reflect in-game changes

---

## Rollback Procedure

1. Copy all files from `backup\pre-gbank-settings-v6.1\` back to their original locations
2. Run `npm run build` from `ah-vault-sync-app\` to rebuild installer
3. Or reinstall previous version (`AH & Vault Sync Setup 6.0.0.exe` if available in dist)

---

## Lessons Learned

- WoW SavedVariables files are a reliable shared-state mechanism between the game client and external tools
- Regex-based parsing/writing of Lua SavedVariables is safe for flat (non-nested) settings blocks
- The existing `scanTimestamp` field (Unix epoch from `time()`) in `GBankExport_Data` made cooldown comparison trivial — no new timestamp format needed

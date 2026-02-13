# AH & Vault Sync v6.2.0 — Addon Auto-Update on Upgrade

**Date:** February 13, 2026, 3:15 AM PST
**Type:** Bug Fix / Feature Addition
**Status:** Completed — Installer Built, Ready for Testing

---

## What Was Accomplished

Added automatic addon version checking and updating on app startup. Previously, when a user upgraded the Electron app (e.g. from v6.0 to v6.1), the bundled addon files were only copied to the WoW folder if the user manually clicked "Reinstall Addons". Now the app auto-detects version mismatches and updates silently on launch.

### Problem
The NSIS installer packages addon files into the app's `resources/addons/` directory but does NOT copy them to the WoW `Interface/AddOns/` folder. Addon installation is deferred to the Electron app's GUI:
- **First install:** Triggered automatically when the user browses for the WoW folder
- **Upgrades:** NOT triggered — the WoW path is already saved in electron-store, so the browse action never fires

This meant users upgrading from v6.0 to v6.1 still had v3.0 addon files in their WoW folder, missing the new auto-scan settings feature.

### Solution Implemented
1. **`getAddonVersion(tocPath)`** — Reads `## Version:` from a `.toc` file and returns the version string
2. **`autoUpdateAddons(wowPath)`** — Compares bundled addon `.toc` versions against installed addon `.toc` versions. If any differ (or addon is missing), calls `installAddons()` to copy all addon files
3. **Startup hook** — Called in `did-finish-load` callback when `wowPath` is already saved in store
4. **Renderer notification** — `addons-auto-updated` IPC event logs which addons were updated and refreshes the addon status display

---

## Files Modified

### Electron App (AH & Vault Sync)
| File | Change |
|------|--------|
| `src/main.js` | Added `getAddonVersion()` and `autoUpdateAddons()` functions. Modified `did-finish-load` callback to call `autoUpdateAddons()` on startup when WoW path exists. |
| `src/renderer/renderer.js` | Added `addons-auto-updated` IPC handler that logs each updated addon and refreshes addon status display. |
| `package.json` | Version 6.1.0 → 6.2.0 |

---

## Auto-Update Logic

```
App Launch → did-finish-load fires
  → wowPath exists in store?
    → YES: autoUpdateAddons(wowPath)
      → For each addon (GuildShopSync, GBankExport, BankAltExport):
        → Read ## Version from bundled .toc file
        → Read ## Version from installed .toc file
        → If versions differ OR addon not installed → mark for update
      → Any updates needed?
        → YES: installAddons(wowPath) → copy all addon files
        → Send addons-auto-updated IPC to renderer
    → Start file watcher if autoSync enabled
```

---

## What Was NOT Changed

- All existing addon installation logic (browse trigger, Reinstall Addons button)
- All existing scan logic, upload behavior, UI sections
- GBankExport addon files (still v3.1)
- GuildShopSync addon files (still v3.1)
- BankAltExport addon files (still v1.0)
- NSIS installer behavior (still doesn't copy addons directly)
- File watcher, sync, tray menu behavior

---

## Installer Location

**`C:\Claude-Flow\output-files\ah-vault-sync-app\dist\AH & Vault Sync Setup 6.2.0.exe`**

---

## Testing Checklist

- [ ] Install v6.2.0 over existing v6.1.0 installation
- [ ] Launch the app — sync log should show "Auto-updated addon: GBankExport (3.0 → 3.1)" (if addon wasn't manually updated)
- [ ] Verify addon status shows all three addons installed
- [ ] Open guild bank in-game — auto-scan settings should now work (cooldown, toggle)
- [ ] Future version bumps should auto-update without user intervention

---

## Rollback Procedure

1. Revert `src/main.js` changes (remove `getAddonVersion`, `autoUpdateAddons`, startup hook)
2. Revert `src/renderer/renderer.js` changes (remove `addons-auto-updated` handler)
3. Revert `package.json` to 6.1.0
4. Rebuild: `npm run build`

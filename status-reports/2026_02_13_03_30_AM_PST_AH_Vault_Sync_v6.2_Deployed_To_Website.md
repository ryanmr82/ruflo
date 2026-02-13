# AH & Vault Sync v6.2.0 — Deployed to Website with Update Notification

**Date:** February 13, 2026, 3:30 AM PST
**Type:** Deployment / Website Update
**Status:** Completed — Live on https://tbcguild.duckdns.org/guild-bank

---

## What Was Accomplished

Deployed the AH & Vault Sync v6.2.0 installer to the TBC Guild website and added a dismissible update notification banner on the `/guild-bank` page, modeled after the existing Price Scanner notification pattern on `/consumes`.

---

## Changes Made

### 1. New Installer Uploaded
- SCP'd `AH & Vault Sync Setup 6.2.0.exe` from local build to server
- Zipped on server as `AH-Vault-Sync-Setup-6.2.0.zip` (83 MB)
- Old v6.0.0 zip retained for rollback

### 2. Download Route Updated
**File:** `/home/opc/tbc-website/routes/api/download/tray-app.ts`
- Changed file path from `AH-Vault-Sync-Setup-6.0.0.zip` to `AH-Vault-Sync-Setup-6.2.0.zip`
- Changed Content-Disposition filename accordingly
- Still requires `admin_auth=true` cookie

### 3. Version Notification JSON Created
**File:** `/home/opc/tbc-website/static/tray-app-version.json`
- New file, modeled after `scanner-version.json`
- Controls the notification banner dynamically — no code changes needed for future releases
- Fields: `version`, `releaseDate`, `downloadUrl`, `changelog`

### 4. GuildStorageTabs.tsx Updated
**File:** `/home/opc/tbc-website/islands/GuildStorageTabs.tsx`
- Added `trayAppVersion` and `trayVersionDismissed` state
- Added `useEffect` to fetch `/tray-app-version.json` on mount
- Added dismissible notification banner before the admin toggle
- Banner is visible to ALL users (not admin-gated)
- Uses `localStorage("trayAppVersionDismissed")` to persist dismissal per version
- Updated admin download section version: v6.0.0 → v6.2.0
- Backup at `GuildStorageTabs.tsx.bak-pre-6.2.0`

### 5. CSS Styles Added
**File:** `/home/opc/tbc-website/static/styles.css`
- Appended `.tray-update-banner`, `.tray-update-content`, `.tray-update-icon`, `.tray-update-text`, `.tray-update-changelog`, `.tray-update-download`, `.tray-update-dismiss` styles
- Dark green gradient matching the ConsumesShop scanner-update-banner style
- Responsive: collapses gracefully on mobile (600px breakpoint)

---

## Notification Banner Behavior

- Visible to ALL users on `/guild-bank` page
- Shows: "🆕 AH & Vault Sync v6.2.0 released February 13, 2026 — Addon auto-update on upgrade + guild bank scan cooldown & toggle settings"
- "⬇ Update Now" button links to `/api/download/tray-app` (admin auth required)
- "✕" dismiss button saves version to localStorage — won't show again for this version
- Re-appears automatically when `tray-app-version.json` is updated with a new version

### Future Release Process
1. Upload new zip to `/home/opc/tbc-website/static/downloads/`
2. Update `/home/opc/tbc-website/routes/api/download/tray-app.ts` with new filename
3. Edit `/home/opc/tbc-website/static/tray-app-version.json` with new version, date, and changelog
4. Update version string in GuildStorageTabs.tsx admin download section
5. Restart: `sudo systemctl restart tbc-website`

---

## Server Files

| File | Action |
|------|--------|
| `/home/opc/tbc-website/static/downloads/AH-Vault-Sync-Setup-6.2.0.zip` | NEW (83 MB) |
| `/home/opc/tbc-website/static/tray-app-version.json` | NEW |
| `/home/opc/tbc-website/routes/api/download/tray-app.ts` | EDITED — filename updated |
| `/home/opc/tbc-website/islands/GuildStorageTabs.tsx` | EDITED — banner + version bump |
| `/home/opc/tbc-website/static/styles.css` | EDITED — appended banner styles |

## Backups
| File | Backup |
|------|--------|
| `GuildStorageTabs.tsx` | `GuildStorageTabs.tsx.bak-pre-6.2.0` |
| `tray-app.ts` | Previous version was simple; can be rewritten |
| Old installer | `AH-Vault-Sync-Setup-6.0.0.zip` retained in downloads/ |

---

## Verification

- [x] `tray-app-version.json` serves correctly on port 8000
- [x] `/guild-bank` page returns HTTP 200
- [x] Service restarted and running (PID 691454)
- [ ] Visual verification in browser (user to confirm)

---

## Rollback Procedure

1. Restore: `cp GuildStorageTabs.tsx.bak-pre-6.2.0 GuildStorageTabs.tsx`
2. Revert tray-app.ts to reference 6.0.0 filename
3. Delete tray-app-version.json
4. Remove CSS styles (last 14 lines of styles.css)
5. `sudo systemctl restart tbc-website`

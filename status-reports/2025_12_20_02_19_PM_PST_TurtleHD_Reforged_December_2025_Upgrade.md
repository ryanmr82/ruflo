# TurtleHD Reforged - December 2025 Upgrade

**Date:** December 20, 2025 @ 2:19 PM PST
**Status:** READY FOR INSTALLATION (User must run upgrade script after closing game)

---

## Summary

Successfully downloaded and prepared the latest TurtleHD Reforged December 2025 update (by Stormhand81). The upgrade transitions from the previous 2-patch system (A+B) to the new modular 7-patch system (A, B, C, D, E, G, M).

---

## Previous Installation

| Component | Version | Size |
|-----------|---------|------|
| Patch-A.mpq | September 9, 2025 | 1.73 GB |
| Patch-B.mpq | September 9, 2025 | 562 MB |
| VanillaHelpers.dll | Not installed | N/A |

**Total:** ~2.29 GB

---

## New Installation (Downloaded)

| Patch | Purpose | Size |
|-------|---------|------|
| Patch-A_NEW.mpq | HD Characters & NPCs | 1.88 GB |
| Patch-B_NEW.mpq | HD Buildings | 1.61 GB |
| Patch-C_NEW.mpq | HD Creatures | 1.85 GB |
| Patch-D_NEW.mpq | HD Doodads | 1.66 GB |
| Patch-E_NEW.mpq | HD Environment | 713 MB |
| Patch-G_NEW.mpq | HD Ground Textures | 777 MB |
| Patch-M_NEW.mpq | Miscellaneous HD | 434 MB |
| VanillaHelpers.dll | Required dependency | 254 KB |

**Total:** ~8.90 GB

---

## What Was Accomplished

### 1. Backup Created
- Location: `C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\`
- Files backed up:
  - `patch-A_BACKUP.MPQ` (original September 2025 version)
  - `Patch-B_BACKUP.mpq` (original September 2025 version)

### 2. VanillaHelpers.dll Installed
- Downloaded v1.1.1 from GitHub (thaumaturgists repository)
- Placed at: `C:\TurtleWoW\VanillaHelpers.dll`
- Added to: `C:\TurtleWoW\dlls.txt`
- **This is a NEW REQUIRED dependency for HD Patch: Reforged**

### 3. All Patches Downloaded
- Custom Python script created to handle MediaFire downloads
- All 7 patches downloaded successfully with `_NEW` suffix
- Downloads completed in parallel to `C:\TurtleWoW\Data\`

### 4. Upgrade Script Created
- Location: `C:\TurtleWoW\APPLY_HD_UPGRADE.bat`
- When run:
  1. Removes old Patch-A.mpq and Patch-B.mpq
  2. Renames all _NEW patches to final names
  3. Clears WDB cache automatically
  4. Shows confirmation of installed patches

---

## Files Modified

| File | Action |
|------|--------|
| `C:\TurtleWoW\dlls.txt` | Added VanillaHelpers.dll entry |
| `C:\TurtleWoW\VanillaHelpers.dll` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-A_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-B_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-C_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-D_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-E_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-G_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\Data\Patch-M_NEW.mpq` | New file downloaded |
| `C:\TurtleWoW\APPLY_HD_UPGRADE.bat` | New upgrade script created |

---

## Commands Used

```powershell
# Download VanillaHelpers.dll
Invoke-WebRequest -Uri "https://github.com/thaumaturgists/VanillaHelpers/releases/download/v1.1.1/VanillaHelpers.dll" -OutFile "C:\TurtleWoW\VanillaHelpers.dll"

# MediaFire downloads via custom Python script
python /c/Temp/mediafire_download.py "<mediafire_url>" "C:/TurtleWoW/Data/Patch-X_NEW.mpq"
```

---

## Next Steps for User

1. **Close Turtle WoW completely**

2. **Run the upgrade script:**
   ```
   Double-click: C:\TurtleWoW\APPLY_HD_UPGRADE.bat
   ```

3. **Launch Turtle WoW with VanillaFixes.exe** (recommended)

4. **In Turtle WoW Launcher:**
   - Go to "Mods" tab
   - Enable all new patches (A through M)
   - Apply changes

5. **First launch will be slower** (one-time cache rebuild)

---

## New Features in December 2025 Version

- Modular patch system (can disable individual components)
- Updated HD textures for all content through patch 1.18+
- Fixed various model issues reported by community
- Better performance optimization (smaller individual files)
- Continued support from Stormhand81

---

## Rollback Procedure

If issues occur, restore from backup:

```batch
cd C:\TurtleWoW\Data
del Patch-A.mpq Patch-B.mpq Patch-C.mpq Patch-D.mpq Patch-E.mpq Patch-G.mpq Patch-M.mpq
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\patch-A_BACKUP.MPQ" Patch-A.mpq
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\Patch-B_BACKUP.mpq" Patch-B.mpq
rmdir /s /q C:\TurtleWoW\WDB
mkdir C:\TurtleWoW\WDB
```

---

## Lessons Learned

1. **MediaFire downloads require parsing** - No direct links available; created custom Python script with BeautifulSoup to extract download URLs

2. **VanillaHelpers.dll is now mandatory** - HD Patch: Reforged requires this DLL for certain features

3. **_NEW suffix strategy works well** - Allows downloading while game is running without conflicts

4. **Modular patches = better flexibility** - Users can now disable specific components if performance issues occur

---

## Source Information

- **Maintainer:** Stormhand81 (took over from Falarson September 2025)
- **Version:** December 16, 2025 update
- **Download Source:** MediaFire links from GitHub backup repository
- **VanillaHelpers Source:** https://github.com/thaumaturgists/VanillaHelpers

---

## Status

| Task | Status |
|------|--------|
| Backup old patches | COMPLETE |
| Download VanillaHelpers.dll | COMPLETE |
| Download all HD patches | COMPLETE |
| Create upgrade script | COMPLETE |
| User runs upgrade script | PENDING (user must close game first) |
| Clear WDB cache | PENDING (done by upgrade script) |

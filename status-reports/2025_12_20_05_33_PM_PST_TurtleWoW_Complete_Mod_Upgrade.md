# TurtleWoW Complete Mod Upgrade - December 20, 2025

**Date:** December 20, 2025 @ 5:33 PM PST
**Status:** COMPLETED SUCCESSFULLY
**Session Type:** Major Upgrade Session

---

## Executive Summary

Performed a comprehensive upgrade of TurtleWoW client modifications including:
1. **TurtleHD Reforged** - Upgraded from September 2025 (2 patches) to December 2025 (7 patches)
2. **nampower.dll** - Updated to v2.19.1 (released same day)
3. **VanillaFixes** - Updated to v1.5.3 with DXVK 2.6.1
4. **VanillaHelpers.dll** - New required dependency installed

Total data downloaded: ~10.6 GB

---

## Part 1: TurtleHD Reforged Upgrade

### Previous State (September 2025)
| Component | Size | Notes |
|-----------|------|-------|
| Patch-A.mpq | 1.73 GB | HD Characters & NPCs |
| Patch-B.mpq | 562 MB | HD Buildings |
| **Total** | ~2.29 GB | 2-patch system |

### New State (December 2025)
| Component | Size | Purpose |
|-----------|------|---------|
| Patch-A.mpq | 1.88 GB | HD Characters & NPCs |
| Patch-B.mpq | 1.61 GB | HD Buildings |
| Patch-C.mpq | 1.85 GB | HD Creatures |
| Patch-D.mpq | 1.66 GB | HD Doodads |
| Patch-E.mpq | 713 MB | HD Environment |
| Patch-G.mpq | 777 MB | HD Ground Textures |
| Patch-M.mpq | 434 MB | Miscellaneous HD |
| **Total** | ~8.90 GB | 7-patch modular system |

### New Dependency Added
- **VanillaHelpers.dll** v1.1.1 (254 KB)
- Source: https://github.com/thaumaturgists/VanillaHelpers
- Required for HD Patch: Reforged December 2025 edition
- Added to dlls.txt configuration

### HD Patch Download Method
Created custom Python script to handle MediaFire downloads:
- Location: `/c/Temp/mediafire_download.py`
- Uses requests + BeautifulSoup to parse MediaFire pages
- Extracts direct download links from download button
- All 7 patches downloaded in parallel with `_NEW` suffix
- Allowed game to remain running during download phase

### HD Patch Installation Steps Performed
1. Removed old Patch-A.mpq and Patch-B.mpq
2. Renamed all `*_NEW.mpq` files to final names
3. Cleared WDB cache folder completely
4. VanillaHelpers.dll already installed and configured

---

## Part 2: Client Mod Updates

### Mod Version Comparison

| Mod | Previous Version | New Version | Change |
|-----|-----------------|-------------|--------|
| nampower.dll | Dec 2024 (600 KB) | v2.19.1 (725 KB) | **UPGRADED** |
| VanillaFixes.exe | Sep 13, 2024 | v1.5.3 | **UPGRADED** |
| VfPatcher.dll | Sep 13, 2024 | v1.5.3 | **UPGRADED** |
| d3d9.dll (DXVK) | Apr 7, 2025 | v2.6.1 | **UPGRADED** |
| dxvk.conf | N/A | Added | **NEW** |
| vanilla-tweaks.exe | v1.6.0 | v1.6.0 | Already current |
| SuperWoWhook.dll | v1.5.1 (Feb 2025) | v1.5.1 | Already current |
| UnitXP_SP3.dll | v52 | v52 | Already current |
| VanillaHelpers.dll | N/A | v1.1.1 | **NEW** |

### nampower.dll v2.19.1 Update
- **Source:** https://gitea.com/avitasia/nampower/releases
- **Release Date:** December 20, 2025 (same day!)
- **Key Changes:**
  - Fixed rare crash on startup
  - Server tick now subtracted from GCD timer
  - No buffer required for spells with cast time
- **File Size:** 725,504 bytes

### VanillaFixes v1.5.3 Update
- **Source:** https://github.com/hannesmann/vanillafixes/releases
- **Release Date:** May 11, 2025
- **Package:** vanillafixes-1.5.3-dxvk.zip
- **Key Changes:**
  - Updated to DXVK 2.6.1
  - Added `dxvk.allowFse` for exclusive fullscreen support
- **Files Installed:**
  - VanillaFixes.exe (88,576 bytes)
  - VfPatcher.dll (72,704 bytes)
  - d3d9.dll (4,452,366 bytes) - DXVK
  - dxvk.conf (630 bytes) - Configuration

---

## Part 3: Files Modified

### New Files Created
| File | Size | Purpose |
|------|------|---------|
| `C:\TurtleWoW\Data\Patch-A.mpq` | 1.88 GB | HD Characters |
| `C:\TurtleWoW\Data\Patch-B.mpq` | 1.61 GB | HD Buildings |
| `C:\TurtleWoW\Data\Patch-C.mpq` | 1.85 GB | HD Creatures |
| `C:\TurtleWoW\Data\Patch-D.mpq` | 1.66 GB | HD Doodads |
| `C:\TurtleWoW\Data\Patch-E.mpq` | 713 MB | HD Environment |
| `C:\TurtleWoW\Data\Patch-G.mpq` | 777 MB | HD Ground |
| `C:\TurtleWoW\Data\Patch-M.mpq` | 434 MB | HD Misc |
| `C:\TurtleWoW\VanillaHelpers.dll` | 254 KB | Required dependency |
| `C:\TurtleWoW\dxvk.conf` | 630 B | DXVK config |
| `C:\TurtleWoW\APPLY_HD_UPGRADE.bat` | ~1 KB | Upgrade script (for future use) |

### Files Updated
| File | Old Size | New Size | Notes |
|------|----------|----------|-------|
| `C:\TurtleWoW\nampower.dll` | 600 KB | 725 KB | v2.19.1 |
| `C:\TurtleWoW\VanillaFixes.exe` | 88 KB | 88 KB | v1.5.3 |
| `C:\TurtleWoW\VfPatcher.dll` | 72 KB | 72 KB | v1.5.3 |
| `C:\TurtleWoW\d3d9.dll` | 4.4 MB | 4.4 MB | DXVK 2.6.1 |
| `C:\TurtleWoW\dlls.txt` | - | - | Added VanillaHelpers.dll |

### Files Removed
| File | Size | Notes |
|------|------|-------|
| `C:\TurtleWoW\Data\Patch-A.mpq` (old) | 1.73 GB | September 2025 version |
| `C:\TurtleWoW\Data\Patch-B.mpq` (old) | 562 MB | September 2025 version |
| `C:\TurtleWoW\WDB\*` | Variable | Cache cleared |

---

## Part 4: Backup Locations

### TurtleHD Backup
```
C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\
├── patch-A_BACKUP.MPQ    (1.73 GB - September 2025)
└── Patch-B_BACKUP.mpq    (562 MB - September 2025)
```

### Mod Files Backup
```
C:\TurtleWoW\backups\Mods_Backup_2025-12-20\
├── nampower.dll          (600 KB - Previous version)
├── VanillaFixes.exe      (88 KB - Previous version)
├── VfPatcher.dll         (72 KB - Previous version)
├── vanilla-tweaks.exe    (5.9 MB - v1.6.0)
└── d3d9.dll              (4.4 MB - Previous DXVK)
```

---

## Part 5: Current dlls.txt Configuration

```
nampower.dll
no1600x1200.dll
UnitXP_SP3.dll
VfPatcher.dll
SuperWoWhook.dll
VanillaHelpers.dll
```

Note: `perf_boost.dll` is also installed (from Dec 16, 2025 session) but loaded separately.

---

## Part 6: Commands Used

### Backup Commands
```bash
# Create backup directories
mkdir -p "/c/TurtleWoW/backups/TurtleHD_Backup_2025-12-20_Pre-Upgrade"
mkdir -p "/c/TurtleWoW/backups/Mods_Backup_2025-12-20"

# Backup HD patches
cp /c/TurtleWoW/Data/Patch-A.mpq /c/TurtleWoW/backups/TurtleHD_Backup_2025-12-20_Pre-Upgrade/patch-A_BACKUP.MPQ
cp /c/TurtleWoW/Data/Patch-B.mpq /c/TurtleWoW/backups/TurtleHD_Backup_2025-12-20_Pre-Upgrade/Patch-B_BACKUP.mpq

# Backup mod files
cp /c/TurtleWoW/nampower.dll /c/TurtleWoW/backups/Mods_Backup_2025-12-20/
cp /c/TurtleWoW/VanillaFixes.exe /c/TurtleWoW/backups/Mods_Backup_2025-12-20/
cp /c/TurtleWoW/VfPatcher.dll /c/TurtleWoW/backups/Mods_Backup_2025-12-20/
cp /c/TurtleWoW/d3d9.dll /c/TurtleWoW/backups/Mods_Backup_2025-12-20/
```

### Download Commands
```bash
# VanillaHelpers.dll
curl -L -o /c/TurtleWoW/VanillaHelpers.dll \
  "https://github.com/thaumaturgists/VanillaHelpers/releases/download/v1.1.1/VanillaHelpers.dll"

# nampower.dll v2.19.1
curl -L -o /c/TurtleWoW/nampower.dll \
  "https://gitea.com/avitasia/nampower/releases/download/v2.19.1/nampower.dll"

# VanillaFixes v1.5.3 with DXVK
curl -L -o /c/Temp/vanillafixes-1.5.3-dxvk.zip \
  "https://github.com/hannesmann/vanillafixes/releases/download/v1.5.3/vanillafixes-1.5.3-dxvk.zip"

# HD Patches via custom Python MediaFire script
python /c/Temp/mediafire_download.py "<mediafire_url>" "/c/TurtleWoW/Data/Patch-X_NEW.mpq"
```

### Installation Commands
```bash
# Install HD patches
cd /c/TurtleWoW/Data
rm -f Patch-A.mpq Patch-B.mpq
mv Patch-A_NEW.mpq Patch-A.mpq
mv Patch-B_NEW.mpq Patch-B.mpq
mv Patch-C_NEW.mpq Patch-C.mpq
mv Patch-D_NEW.mpq Patch-D.mpq
mv Patch-E_NEW.mpq Patch-E.mpq
mv Patch-G_NEW.mpq Patch-G.mpq
mv Patch-M_NEW.mpq Patch-M.mpq

# Clear WDB cache
rm -rf /c/TurtleWoW/WDB
mkdir /c/TurtleWoW/WDB

# Extract and install VanillaFixes
cd /c/Temp
unzip -o vanillafixes-1.5.3-dxvk.zip
cp VanillaFixes.exe VfPatcher.dll d3d9.dll dxvk.conf /c/TurtleWoW/
```

---

## Part 7: Rollback Procedures

### Rollback TurtleHD to September 2025
```batch
cd C:\TurtleWoW\Data
del Patch-A.mpq Patch-B.mpq Patch-C.mpq Patch-D.mpq Patch-E.mpq Patch-G.mpq Patch-M.mpq
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\patch-A_BACKUP.MPQ" Patch-A.mpq
copy "C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\Patch-B_BACKUP.mpq" Patch-B.mpq
rmdir /s /q C:\TurtleWoW\WDB
mkdir C:\TurtleWoW\WDB
```

### Rollback nampower.dll
```batch
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\nampower.dll" "C:\TurtleWoW\nampower.dll"
```

### Rollback VanillaFixes
```batch
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\VanillaFixes.exe" "C:\TurtleWoW\"
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\VfPatcher.dll" "C:\TurtleWoW\"
copy "C:\TurtleWoW\backups\Mods_Backup_2025-12-20\d3d9.dll" "C:\TurtleWoW\"
del "C:\TurtleWoW\dxvk.conf"
```

### Remove VanillaHelpers.dll (if causing issues)
```batch
del "C:\TurtleWoW\VanillaHelpers.dll"
:: Edit dlls.txt and remove "VanillaHelpers.dll" line
```

---

## Part 8: Post-Installation Requirements

### In Turtle WoW Launcher
1. Navigate to **Mods** tab
2. Enable all HD patches (A through M)
3. Apply changes

### First Launch Notes
- First launch will be slower (one-time WDB cache rebuild)
- Expect 1-3 minutes additional loading time
- Subsequent launches will be normal speed

### In-Game Settings
- Verify Script Memory is set to 512MB (AddOns menu)
- Check that all mods are loading (should see in chat on login)

---

## Part 9: Lessons Learned

### Technical Insights
1. **MediaFire downloads require parsing** - No direct download links; must extract from page HTML
2. **VanillaHelpers.dll is now mandatory** - HD Patch: Reforged won't work without it
3. **_NEW suffix strategy** - Effective for downloading while game is running
4. **File dates in GitHub releases** - May show original build date, not release date; use hash comparison
5. **vanilla-tweaks was already current** - File hash comparison confirmed identical versions

### What Worked Well
- Parallel downloads saved significant time
- Backup-first approach provided safety net
- Using GitHub API to find correct download URLs
- Custom Python script handled MediaFire limitations

### Potential Issues to Watch
- HD patches significantly increase VRAM usage
- First load after cache clear is slow (expected)
- Some users report issues with specific patch combinations (can disable individual patches if needed)

---

## Part 10: Source Information

### HD Patch: Reforged
- **Maintainer:** Stormhand81 (took over September 2025)
- **Version:** December 16, 2025 update
- **Source:** MediaFire links via GitHub backup
- **Forum:** Turtle WoW forums

### nampower
- **Repository:** https://gitea.com/avitasia/nampower
- **Version:** v2.19.1
- **Alternative:** https://github.com/pepopo978/nampower

### VanillaFixes
- **Repository:** https://github.com/hannesmann/vanillafixes
- **Version:** v1.5.3
- **Includes:** DXVK 2.6.1

### VanillaHelpers
- **Repository:** https://github.com/thaumaturgists/VanillaHelpers
- **Version:** v1.1.1

---

## Part 11: Final State Summary

### Installed Components
| Category | Components |
|----------|------------|
| **HD Graphics** | Patch-A, B, C, D, E, G, M (8.9 GB total) |
| **Performance** | VanillaFixes v1.5.3, DXVK 2.6.1, nampower v2.19.1, perf_boost.dll |
| **API Expansion** | SuperWoWhook.dll v1.5.1, VanillaHelpers.dll v1.1.1 |
| **Client Tweaks** | vanilla-tweaks v1.6.0, UnitXP_SP3 v52, no1600x1200.dll |

### Disk Space Used
- HD Patches: ~8.9 GB
- Mod DLLs: ~12 MB
- Backups: ~2.5 GB
- **Total New:** ~11.4 GB

### Launch Command
```
C:\TurtleWoW\VanillaFixes.exe
```

---

*Documentation created: December 20, 2025 @ 5:33 PM PST*
*Session duration: ~2 hours*
*Total downloads: ~10.6 GB*

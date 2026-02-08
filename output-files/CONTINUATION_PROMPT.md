# Continuation Prompt: AH & Vault Sync v5.0 Development

## CRITICAL: Read This First

You are resuming work on the **AH & Vault Sync v5.0** unified guild data pipeline for TurtleWoW (WoW 1.12.1 private server).

**GOLD STANDARD REFERENCE DOCUMENT:**
https://tbcguild.duckdns.org/architecture → **Future Enhancements** tab

This page contains the complete design specification. Always check it first and update it after each phase completion.

---

## Project Overview

Building a unified Windows installer that packages:
1. **GuildShopSync.lua** (v3.0 PRODUCTION) — Scans 68 consumable items at Auction House
2. **GBankExport.lua** (v3.0 PRODUCTION) — Scans guild vault (5 tabs, 490 slots)
3. **BankAltExport.lua** (v1.0 IN PROGRESS) — Scans bank alt character bags and personal bank

All three addons sync to a Windows tray app that uploads to the tbcguild.duckdns.org website.

---

## Current Progress (66% Complete — Phase 4 Done)

### Phase 1: BankAltExport Addon — COMPLETE ✓

**Status:** Tested and verified working. SavedVariables file at `WTF/Account/STORMSHADOW/SavedVariables/BankAltExport.lua` contains 2,814 total items across bags and personal bank.

**Files:**
- `C:/turtlewow/Interface/AddOns/BankAltExport/BankAltExport.lua` (~418 lines)
- `C:/turtlewow/Interface/AddOns/BankAltExport/BankAltExport.toc`

---

### Phase 2: Tray App v5.0 with Settings GUI — SOURCE FILES CREATED (Pending Compile)

**Files Created:**
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/Settings.cs` - Model class with JSON persistence
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/SettingsForm.cs` - WinForms dialog with TreeView
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/SettingsForm.Designer.cs` - Designer file
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/AH_and_VaultSyncTray_v5.cs` - Updated tray app with BankAltExport watcher
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/BankAltExport.lua` - Copy for installer
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/source/BankAltExport.toc` - Copy for installer
- `C:/Claude-Flow/output-files/AH_and_Vault_Sync-v4.0/AH_and_Vault_Sync_v5.iss` - Updated Inno Setup script

**Pending:** Compile with csc.exe or Visual Studio during Phase 5

---

### Phase 3: Server APIs — COMPLETE ✓

**Deployed and tested:**
- `/api/bank-alts/inventory.ts` (PUT/GET/DELETE) — Stores per-account bank alt data
- `/api/guild-storage/combined.ts` (GET) — Merged view of vault + alts with location breakdown
- Location: `/home/opc/tbc-website/routes/api/`

---

### Phase 4: Website UI — COMPLETE ✓

**Deployed and tested:**
- Created `GuildStorageTabs.tsx` island (700 lines) with 3 tabs
- **Guild Vault tab** — Existing functionality preserved
- **Bank Alts tab** — Account/character selector, bag+bank items with location display
- **Combined View tab** — Merged counts with location breakdown toggle
- Updated `routes/guild-bank.tsx` to use new component
- Playwright 20/20 tests passing

---

## Remaining Phases (from Architecture Page)

### Phase 5: Compile v5.0 Installer (NEXT — 2-3 hours)
1. Compile .NET tray app v5.0 with csc.exe or Visual Studio
2. Test Settings GUI opens and displays accounts/characters
3. Test BankAltExport watcher detects changes
4. Update Inno Setup script with all components
5. Compile installer with Inno Setup 6.x
6. Output: `AH_and_Vault_Sync-Setup-v5.0.exe`

### Phase 6: Test & Deploy (2-3 hours)
- Fresh install testing on clean Windows
- Reboot survival verification
- All data flows verified
- Playwright UAT testing

---

## Key File Locations

### Windows (Development Machine)
```
C:/turtlewow/Interface/AddOns/
├── GuildShopSync/GuildShopSync.lua     (PRODUCTION v3.0, 285 lines)
├── GBankExport/GBankExport.lua         (PRODUCTION v3.0, 581 lines)
├── BankAltExport/BankAltExport.lua     (IN PROGRESS v1.0)
└── Bagshui/                            (Reference addon for patterns)

C:/Claude-Flow/output-files/
├── AH_and_Vault_Sync-v4.0/
│   ├── source/
│   │   ├── AH_and_VaultSyncTray.cs     (v4.0 tray app, original)
│   │   ├── AH_and_VaultSyncTray_v5.cs  (v5.0 tray app with BankAltExport)
│   │   ├── Settings.cs                 (v5.0 settings model)
│   │   ├── SettingsForm.cs             (v5.0 settings dialog)
│   │   ├── SettingsForm.Designer.cs    (v5.0 settings designer)
│   │   ├── BankAltExport.lua           (v1.0 addon for installer)
│   │   └── BankAltExport.toc           (addon manifest)
│   ├── AH_and_Vault_Sync.iss           (v4.0 Inno Setup script)
│   └── AH_and_Vault_Sync_v5.iss        (v5.0 Inno Setup script)
├── architecture-future-enhancements-v8.json  (Design doc JSON)
├── CONTINUATION_PROMPT.md              (This file)
└── playwright-test/                    (UAT tests, 20 tests)
```

### Linux Server (tbcguild.duckdns.org)
```
/home/opc/tbc-website/
├── routes/api/
│   ├── consumes/prices.ts              (PRODUCTION)
│   ├── guild-bank/inventory.ts         (PRODUCTION)
│   └── bank-alts/                      (TODO - Phase 3)
├── islands/
│   ├── GuildBankBrowser.tsx            (PRODUCTION)
│   └── ArchitectureDocs.tsx            (Renders architecture page)
└── static/
    └── architecture-future-enhancements.json  (Design doc)
```

---

## SSH Access
```bash
ssh opc@tbcguild.duckdns.org
```

## Architecture Page Password
```
thralls2024
```

---

## Development Rules

1. **Baby Steps**: Test after each change. Don't get too far ahead.
2. **Update Architecture Page**: After each phase, update the JSON and verify with Playwright.
3. **Playwright UAT**: Always run tests to verify website changes work.
4. **Build Order**: Build everything FIRST, compile installer ONCE at the end.
5. **Not Reinventing Wheel**: BankAltExport uses same WoW APIs as Bagshui (analyzed and documented).

---

## Playwright Test Commands
```bash
cd "C:/Claude-Flow/output-files/playwright-test"
npx playwright test --reporter=list
```

## Upload Architecture JSON
```bash
scp "C:/Claude-Flow/output-files/architecture-future-enhancements-v8.json" opc@tbcguild.duckdns.org:/home/opc/tbc-website/static/architecture-future-enhancements.json
```

---

## Data Formats

### BANKALTEXPORT_V1 (New - Phase 1)
```
BANKALTEXPORT_V1
SCAN_TIME|2026-02-06 12:30:45
ACCOUNT|STORMBANK
CHAR|Bankalt|Mage|35
BAG|0|1|Fire Prot Potion|20|1|13457
BANK|-1|1|Arcanite Bar|40|3|12360
ENDCHAR
SUMMARY
TOTAL_ITEMS|4500
END
```

### GBANKEXPORT_V1 (Existing - Reference)
```
GBANKEXPORT_V1
SCAN_TIME|2026-02-06 12:30:45
GUILD|Thralls Book Club
TAB|1|Consumables
ITEM|Greater Fire Protection Potion|20|1|13457|1
SUMMARY
TOTAL_ITEMS|5528
END
```

---

## WoW API Reference (Vanilla 1.12.1)

```lua
-- Container APIs (bags and bank)
GetContainerNumSlots(bagId)           -- Returns slot count
GetContainerItemLink(bagId, slot)     -- Returns item link
GetContainerItemInfo(bagId, slot)     -- Returns texture, count, locked, quality
GetItemInfo(itemId)                   -- Returns full item details

-- Bag IDs
0       = Backpack (16 slots)
1-4     = Equipped bags
-1      = Main bank (24 slots, only at banker)
5-11    = Bank bags (only at banker)

-- Events
BANKFRAME_OPENED    -- Player opens bank at banker NPC
BANKFRAME_CLOSED    -- Bank closes
BAG_UPDATE          -- Bag contents changed
```

---

## Settings GUI Requirements (Phase 2)

User requested ability to SELECT which accounts and characters are included in sync:
- TreeView with accounts from `WTF/Account/` folder
- Characters discovered from SavedVariables files
- Checkboxes to include/exclude
- NOT all accounts/characters should sync by default
- Persist to `%LocalAppData%/AH_and_VaultSync/settings.json`

---

## Resume Instructions

1. Read this prompt completely
2. Go to https://tbcguild.duckdns.org/architecture → Future Enhancements tab
3. Verify current status matches this prompt
4. Ask user where to continue (likely Phase 1 testing or Phase 2)
5. Work in baby steps with testing after each change
6. Update architecture page after completing each phase
7. Run Playwright tests to verify website updates

---

## User Communication Style

The user is direct and expects precision. They do not tolerate:
- Half-assed work
- Failing to verify changes actually render on the website
- Making assumptions without checking existing code
- Reinventing the wheel when existing patterns are available

Always use Playwright to UAT test the architecture page after making changes.

# Claude Flow Status Reports Index

## Overview
This index provides quick access to all status reports with rich metadata for efficient searching and reference.

## Report Index

### 2025-08-21

#### 1. Claude Flow Folders Analysis
- **File:** `2025_08_21_04_14_PM_EST_Claude_Flow_Folders_Analysis.md`
- **Date:** August 21, 2025, 4:14 PM EST
- **Topics:** Directory analysis, Git repositories, Project structure
- **Key Findings:**
  - Identified `C:\claude-flow` as working/runtime directory
  - Identified `C:\claude-flow-source` as Git source repository
  - Documented differences and use cases for each
- **Technologies:** Git, Node.js, PowerShell, Claude Flow v2.0.0-alpha.88
- **Status:** Completed
- **Type:** Analysis/Investigation

#### 2. Claude Flow Consolidation Analysis
- **File:** `2025_08_21_04_21_PM_EST_Claude_Flow_Consolidation_Analysis.md`
- **Date:** August 21, 2025, 4:21 PM EST
- **Topics:** Directory consolidation, Auto-creation investigation, Cleanup strategy
- **Key Findings:**
  - claude-flow-source will NOT auto-recreate (manually created via git clone)
  - Safe to consolidate into single claude-flow directory
  - No scripts or configs reference claude-flow-source
  - Matches Linux server setup (single directory)
- **Technologies:** Git, PowerShell, Windows file management
- **Status:** Completed
- **Type:** Investigation/Recommendation

---

## January 2026 Reports

#### 2. GuildShopSync v2.6 - Registry Path Fix
- **File:** `2026_01_20_04_43_PM_PST_GuildShopSync_v2.6_Registry_Fix.md`
- **Date:** January 20, 2026, 4:43 PM PST
- **Topics:** GuildShopSync, Installer fix, Registry path resolution, Environment variable bug, Price sync
- **Key Findings:**
  - Root cause: Installer v2.5 used environment variable `$env:GUILDSHOPSYNC_WOWPATH` which failed because `setx` only affects future processes
  - Original working solution used hardcoded path - always worked
  - Fixed by implementing Registry-based path resolution with fallbacks
  - Added cleanup of prior versions during install
  - Installer now removes old scheduled tasks, VBS startup scripts, and environment variables
- **Technologies:** PowerShell, Inno Setup, Windows Registry, Git, SCP
- **Status:** Ready for Testing (Installer needs Inno Setup compilation)
- **Type:** Critical Bug Fix
- **Files Modified:**
  - `SyncService.ps1` - Complete rewrite of path resolution
  - `GuildShopSync.iss` - Added cleanup, version bump to 2.6
  - `README.txt` - Version bump
- **Server Files:**
  - `/home/opc/tbc-website/static/GuildShopSync-v2.6.zip` - New distribution
  - Git repo updated: `https://github.com/ryanmr82/guild-shop-sync`
- **Backup Created:** `C:\Claude-Flow\guildsyncbackupworkinglocal\`
- **Rollback Available:** Yes - documented in status report

---

#### 3. Website Background Images Update
- **File:** `2026_01_20_08_59_PM_PST_Website_Background_Images_Update.md`
- **Date:** January 20, 2026, 8:59 PM PST
- **Topics:** Website images, Background replacement, SCP, Admin page, Maraudon, Scarlet Monastery
- **Key Findings:**
  - Deleted old `twow website image jan 2026.png` from server
  - Uploaded `Maraudon_Redrawn_Loading_Screen.png` (2.77 MB) for website background
  - Uploaded `Scarlet_Monastery_Loading_Screen_1.png` (2.86 MB) for Admin page
  - All files verified on torreyserver at `/home/opc/tbc-website-uploads/`
- **Technologies:** SCP, SSH, Linux (Oracle Cloud)
- **Status:** Completed Successfully
- **Type:** File Transfer / Website Update
- **Files Modified:**
  - Deleted: `/home/opc/tbc-website-uploads/twow website image jan 2026.png`
  - Created: `/home/opc/tbc-website-uploads/Maraudon_Redrawn_Loading_Screen.png`
  - Created: `/home/opc/tbc-website-uploads/Scarlet_Monastery_Loading_Screen_1.png`
- **Rollback Available:** Yes - original file still exists locally

---

#### 1. Image Transfer: TWOW Website Image to Linux Server (Superseded)
- **File:** `2026_01_20_04_26_AM_PST_Image_Transfer_TWOW_Website_To_Linux.md`
- **Date:** January 20, 2026, 4:26 AM PST
- **Topics:** File transfer, SCP, SSH, Linux server, Website image upload
- **Key Findings:**
  - Transferred `twow website image jan 2026.png` from Windows OneDrive Desktop to Linux server
  - File located in OneDrive-synced Desktop folder, not local Desktop
  - Used existing SSH config host alias `torreyserver` for transfer
  - File successfully verified on destination: `/home/opc/tbc-website-uploads/`
- **Technologies:** SCP, SSH, Windows, Linux (Oracle Cloud), OneDrive
- **Status:** Superseded by report #3 (image replaced)
- **Type:** File Transfer
- **Files Modified:**
  - Created: `/home/opc/tbc-website-uploads/twow website image jan 2026.png` (818 KB) - Later deleted
- **Rollback Available:** Yes - documented in status report

---

## December 2025 Reports (continued)

#### TurtleWoW Error 132 Fix and Mod Updates
- **File:** `2025_12_31_01_23_AM_PST_TurtleWoW_Error132_Fix_And_Mod_Updates.md`
- **Date:** December 31, 2025, 1:23 AM PST
- **Topics:** Error 132 Fatal Exception, nampower update, VanillaHelpers.dll, HD Patch: Reforged, Patch-I removal
- **Key Findings:**
  - VanillaHelpers.dll was missing from dlls.txt (required for HD patches)
  - nampower v2.19.1 outdated - updated to v2.23.1 (fixes "crashes on launch")
  - UnitXP_SP3 v52 outdated - v70 available (manual update required)
  - Error 132 crashes at CharacterSelect due to missing DLL config
  - Patch-I (Interface) removed per user request
- **Technologies:** PowerShell, TurtleWoW mods, DLL configuration, HD Patch: Reforged
- **Status:** Completed - Requires Testing
- **Type:** Critical Bug Fix / Mod Updates
- **Files Modified:**
  - `C:\TurtleWoW\dlls.txt` - Added VanillaHelpers.dll
  - `C:\TurtleWoW\nampower.dll` - Updated to v2.23.1
- **Files Removed:**
  - `C:\TurtleWoW\Data\Patch-I.mpq` - Moved to backups
- **Rollback Available:** Yes - documented in status report
- **Manual Action Required:** Update UnitXP_SP3 from Codeberg (v52 -> v70)

---

## Quick Search Tags

### By Type
- **Analysis:** Claude Flow Folders Analysis (2025-08-21)
- **Bug Fix:** TurtleWoW Error 132 Fix (2025-12-31)

### By Technology
- **Git:** Claude Flow Folders Analysis
- **Node.js:** Claude Flow Folders Analysis  
- **PowerShell:** Claude Flow Folders Analysis

### By Topic
- **Directory Structure:** Claude Flow Folders Analysis
- **Project Organization:** Claude Flow Folders Analysis
- **Legal Investigation:** Turtle WoW Legal Research (2025-09-01)
- **Windows Configuration:** Windows 10 Start Menu Recommended Section Removal (2025-09-14)
- **Privacy Settings:** Windows 10 Start Menu Recommended Section Removal (2025-09-14)
- **Registry Modifications:** Windows 10 Start Menu Recommended Section Removal (2025-09-14)
- **Copyright Infringement:** Turtle WoW Legal Research (2025-09-01)
- **Technical Infrastructure:** Turtle WoW Legal Research (2025-09-01)
- **System Architecture:** TBC Guild Architecture Current State (2025-12-13)
- **Database Schema:** TBC Guild Architecture Current State (2025-12-13)
- **API Documentation:** TBC Guild Architecture Current State (2025-12-13)
- **SR+ System:** TBC Guild SR+ Design (2025-12-12), TBC Guild SR+ Future State (2025-12-13)
- **Deno Fresh:** TBC Guild Architecture (2025-12-13)
- **Turtle WoW Guild:** TBC Guild Architecture (2025-12-13), SR+ System Design (2025-12-12)
- **NVIDIA ShadowPlay:** AlwaysShadow Installation (2025-12-15), Chrome HW Accel Fix (2025-12-16)
- **System Utilities:** AlwaysShadow Installation (2025-12-15)
- **Chrome Browser:** Chrome HW Accel Fix for Instant Replay (2025-12-16)
- **DRM/Protected Content:** Chrome HW Accel Fix (2025-12-16)
- **TurtleWoW Performance:** PerfBoost DLL Installation (2025-12-18), Complete Mod Upgrade (2025-12-20)
- **WoW Addon Bug Fixes:** DPSMate Parser Battleground Fix (2025-12-18)
- **Raid Optimization:** PerfBoost DLL Installation (2025-12-18)
- **DPSMate:** Parser Battleground Error Fix (2025-12-18)
- **TurtleHD:** HD Reforged Upgrade (2025-12-20), Complete Mod Upgrade (2025-12-20)
- **HD Graphics Mods:** TurtleHD Reforged December 2025 (2025-12-20)
- **nampower:** Complete Mod Upgrade (2025-12-20)
- **VanillaFixes:** Complete Mod Upgrade (2025-12-20)
- **DXVK:** Complete Mod Upgrade (2025-12-20)
- **MediaFire Downloads:** TurtleHD Upgrade (2025-12-20)
- **Client Mods:** Complete Mod Upgrade (2025-12-20)
- **File Transfer:** TurtLog AQ40 Transfer (2025-12-30)
- **TurtLog Combat Logs:** TurtLog AQ40 Transfer (2025-12-30)
- **SCP/SSH:** TurtLog AQ40 Transfer (2025-12-30), TWOW Image Transfer (2026-01-20)
- **Website Uploads:** TWOW Image Transfer (2026-01-20)
- **Linux Server (torreyserver):** TWOW Image Transfer (2026-01-20)

## September 2025 Reports

#### 3. Windows 10 Start Menu "Recommended" Section Removal
- **File:** `2025_09_14_07_41_PM_EST_Windows10_Start_Menu_Recommended_Section_Disabled.md`
- **Date:** September 14, 2025, 7:41 PM EST
- **Topics:** Windows configuration, Privacy settings, Registry modifications, Start menu customization
- **Key Findings:**
  - Successfully disabled "Recommended" section in Windows 10 Start menu
  - Applied registry modifications: Start_TrackDocs=0, Start_TrackProgs=0
  - Cleared existing recent items history from system folders
  - Created registry backup for rollback capability
  - Verified changes applied correctly and Windows Explorer restarted
- **Technologies:** PowerShell, Windows Registry, Windows 10 Home Edition
- **Status:** Completed Successfully
- **Type:** System Configuration/Privacy Enhancement

#### 4. Legal Investigation: Turtle WoW Organization
- **File:** `2025_09_01_03_55_AM_EST_Legal_Investigation_Turtle_WoW_Comprehensive_Report.md`
- **Date:** September 1, 2025, 3:55 AM EST
- **Topics:** Copyright infringement, Domain analysis, Technical infrastructure, Legal research
- **Key Findings:**
  - Primary defendant: Yulia "Torta/Shenna" Savko (Russian national)
  - Domain registered via NameCheap with privacy protection (Iceland-based)
  - UK hosting via CloudFlare CDN (IP: 104.20.27.130, 172.66.152.50)
  - Active federal lawsuit: Blizzard Entertainment v. Turtle Wow (2:25-cv-08194)
  - Discord server: 148,289 members, recent aggressive marketing campaigns
- **Technologies:** DNS analysis, WHOIS lookup, CloudFlare CDN, vMaNGOS server software
- **Status:** Completed
- **Type:** Legal Research/Investigation

## Metadata Structure

Each report contains:
- **Date & Time:** Timestamp of report creation
- **Task Description:** What was accomplished
- **Key Findings:** Important discoveries
- **Lessons Learned:** Knowledge gained
- **Files Modified:** Changes made to system
- **Commands Used:** Technical operations performed
- **Rollback Procedures:** How to undo changes if needed

## Usage Guide

1. Use Ctrl+F to search for specific topics
2. Reports are named with pattern: `YYYY_MM_DD_HH_MM_AM-PM_TIMEZONE_Topic_Description.md`
3. Each report is self-contained with full context
4. Check report status to understand completion state

## January 2025 Reports

#### 4. TurtleWoW LootBlare Addon Installation
- **File:** `2025_01_07_12_53_AM_EST_TurtleWoW_LootBlare_Addon_Installation.md`
- **Date:** January 7, 2025, 12:53 AM EST
- **Topics:** WoW addon installation, LootBlare v2.5, GitHub repository
- **Key Findings:**
  - Successfully installed LootBlare addon from https://github.com/FSuhas/LootBlare
  - Addon provides raid loot roll management with SR/MS/OS/TM roll types
  - Created backup folder structure at C:\turtlewow\backups
  - Cleaned up Git metadata files post-installation
  - Verified installation with 5 addon files totaling ~154KB
- **Technologies:** Git, PowerShell, TurtleWoW client, WoW addons
- **Status:** ✅ Completed Successfully
- **Type:** Addon Installation
- **Files Modified:**
  - Created: C:\turtlewow\Interface\AddOns\LootBlare\*
  - Created: C:\turtlewow\backups\
- **Rollback Available:** Yes - documented deletion procedure

#### 5. TurtleWoW Addon Analysis
- **File:** `2025_01_19_10_45_PM_PST_TurtleWoW_Addon_Analysis.md`
- **Date:** January 19, 2025, 10:45 PM PST
- **Topics:** WoW addon analysis, TurtleWoW client
- **Status:** Completed
- **Type:** Analysis/Investigation

## October 2025 Reports

#### 1. Hive-Mind-Advanced Context Contamination Fix
- **File:** `2025_10_09_02_42_PM_PDT_Hive-Mind-Advanced_Context_Fix.md`
- **Date:** October 9, 2025, 2:42 PM PDT
- **Topics:** Claude Code context loading, PowerShell script modification, Context contamination, Session cleanup
- **Key Findings:**
  - Identified Claude Code auto-discovery behavior loading unwanted swarm coordinator prompts
  - Root cause: `.hive-mind/sessions/hive-mind-prompt-*.txt` files auto-loaded as session context
  - These template files (144 lines) were NOT conversation history - safe to delete
  - PowerShell script explicitly called hive_prompt.txt but Claude Code loaded additional context
  - Solution: Added automatic cleanup before launching Claude Code
- **Technologies:** PowerShell, Claude Code CLI, Windows file management
- **Status:** ✅ Completed Successfully
- **Type:** Bug Fix/System Configuration
- **Files Modified:**
  - Modified: `C:\Claude-Flow\Hive-Mind-Advanced.ps1` (lines 248-281)
  - Created backup: `C:\Claude-Flow\backup\Hive-Mind-Advanced-backup-*.ps1`
  - Created: `C:\Claude-Flow\backup\ROLLBACK-INSTRUCTIONS.md`
- **Rollback Available:** Yes - documented in ROLLBACK-INSTRUCTIONS.md
- **Lessons Learned:**
  - Claude Code scans workspace for context beyond command-line arguments
  - Hidden directories like `.hive-mind/` and `.claude/` inject additional context
  - Template files vs conversation history - important distinction
  - Need to prevent auto-discovery, not just specify correct file

## November 2025 Reports

#### 1. SuperMacro Global Cooldown & Queue System
- **File:** `2025_11_30_09_00_PM_EST_SuperMacro_Global_Cooldown_Queue_System.md`
- **Date:** November 30, 2025, 9:00 PM EST
- **Topics:** SuperMacro addon, Auto-run feature, Global cooldown, Queue system, Spam prevention
- **Key Findings:**
  - Multiple auto-run macros with different intervals eventually collide
  - Implemented global cooldown (1-10 min configurable) between ANY macro posts
  - Added queue system - macros wait and post when cooldown expires
  - UI elements added: Global CD input field, Queue count display
- **Technologies:** Lua, WoW addon development, XML UI
- **Status:** Completed Successfully
- **Type:** Feature Enhancement
- **Files Modified:**
  - Modified: `C:\TurtleWoW\Interface\AddOns\SuperMacro\SM_AutoRun.lua`
  - Modified: `C:\TurtleWoW\Interface\AddOns\SuperMacro\SuperMacro.xml`
  - Modified: `C:\TurtleWoW\Interface\AddOns\SuperMacro\SuperMacro.toc`
  - Backups: `C:\TurtleWoW\Interface\AddOns\SuperMacro\backup\`
- **Rollback Available:** Yes - backup files created

#### 2. TurtleWoW Spy Addon Astrolabe Dungeon/Raid Error Fix
- **File:** `2025_11_30_08_15_PM_EST_TurtleWoW_Spy_Addon_Astrolabe_Dungeon_Error_Fix.md`
- **Date:** November 30, 2025, 8:15 PM EST
- **Topics:** WoW addon fix, Astrolabe library, Lua error, Spy addon, Dungeon/Raid instance errors
- **Key Findings:**
  - Error from Spy addon (NOT HonorSpy) at `Astrolabe-0.2.lua:166`
  - Root cause: Astrolabe lacks map data for dungeon/raid instances
  - Accessing `WorldMapSize[C].parentContinent` on nil throws error
  - Fix: Added nil checks before accessing WorldMapSize properties
  - Spy addon polls position every 0.1s causing rapid error spam
- **Technologies:** Lua, TurtleWoW, Astrolabe library, WoW addon debugging
- **Status:** Completed Successfully
- **Type:** Bug Fix
- **Files Modified:**
  - Modified: `C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\Astrolabe-0.2.lua` (line 166)
  - Backup: `C:\TurtleWoW\Interface\AddOns\Spy\Libs\Astrolabe-0.2\backup\Astrolabe-0.2.lua.backup_2025_11_30`
- **Rollback Available:** Yes - backup file created

## December 2025 Reports

#### 1. TurtleWoW Cursive & TrinketMenu Addon Installation
- **File:** `2025_12_02_02_46_AM_PST_TurtleWoW_Cursive_TrinketMenu_Addon_Installation.md`
- **Date:** December 2, 2025, 2:46 AM PST
- **Topics:** WoW addon installation, Warlock DoT automation, Trinket management, Auto-targeting
- **Key Findings:**
  - Cursive v2.5.5 installed - auto-casts DoTs on targets without the debuff (requires SuperWoW)
  - TrinketMenu 3.41 installed - auto-swaps trinkets when on cooldown, queues during combat
  - Both addons compatible with Turtle WoW (Interface: 11200)
  - SuperWoW dependency already satisfied (SuperWoWhook.dll present)
- **Technologies:** PowerShell, GitHub, TurtleWoW client, WoW addons, SuperWoW
- **Status:** Completed Successfully
- **Type:** Addon Installation
- **Files Modified:**
  - Created: `C:\turtlewow\Interface\AddOns\Cursive\*`
  - Created: `C:\turtlewow\Interface\AddOns\TrinketMenu\*`
- **Rollback Available:** Yes - simple folder deletion
- **Key Commands:**
  - Cursive: `/cursive multicurse Corruption|HIGHEST_HP` (auto-target highest HP enemy)
  - TrinketMenu: Alt+Click trinket slot to enable Auto Queue

#### 2. TurtleWoW Spy Addon Package for Friends
- **File:** `2025_12_02_02_55_AM_PST_TurtleWoW_Spy_Addon_Package_For_Friends.md`
- **Date:** December 2, 2025, 2:55 AM PST
- **Topics:** Addon packaging, ZIP distribution, Spy addon, Astrolabe fix
- **Key Findings:**
  - Created distribution-ready ZIP of patched Spy addon (beta0.3.9)
  - Includes Astrolabe dungeon/raid error fix (line 166 nil checks)
  - Package includes README with installation instructions
  - ZIP size: 2.1 MB
- **Technologies:** PowerShell, Compress-Archive, TurtleWoW addons
- **Status:** Completed Successfully
- **Type:** Packaging/Distribution
- **Files Created:**
  - ZIP Package: `C:\Claude-Flow\output-files\Spy-TurtleWoW-Fixed.zip`
  - README: `C:\Claude-Flow\output-files\Spy-TurtleWoW-Fixed\README.txt`
- **Related Reports:**
  - Fix applied: `2025_11_30_08_15_PM_EST_TurtleWoW_Spy_Addon_Astrolabe_Dungeon_Error_Fix.md`
  - Original install: `2025_10_09_03_16_PM_PDT_TurtleWoW_Spy_Addon_Installation.md`

#### 3. Spacebar Presser Analysis and Packaging
- **File:** `2025_12_03_01_53_PM_PST_Spacebar_Presser_Analysis_And_Packaging.md`
- **Date:** December 3, 2025, 1:53 PM PST
- **Topics:** Batch file analysis, Utility packaging, Keep-alive tool, ZIP distribution
- **Key Findings:**
  - Analyzed spacebar_presser.bat - standalone keep-alive utility
  - Uses PowerShell + Windows Script Host COM object for keystroke simulation
  - Presses spacebar every 30-60 seconds randomly (anti-idle detection)
  - No external dependencies - pure Windows built-in components
  - Created distribution ZIP with README for plug-and-play use
- **Technologies:** Batch scripting, PowerShell, Windows Script Host, Compress-Archive
- **Status:** Completed Successfully
- **Type:** Analysis/Packaging
- **Files Created:**
  - ZIP Package: `C:\Users\ryanr\OneDrive\Desktop\Spacebar_Presser.zip`
  - Contains: spacebar_presser.bat, README.txt
- **Use Case:** Prevents screen lock, idle timeouts, keeps applications active

---
*Index last updated: 2025-12-03 1:53 PM PST*
#### 4. HonorSpy RP Formula Calibration
- **File:** `2025_12_11_02_45_AM_UTC_HonorSpy_RP_Formula_Calibration.md`
- **Date:** December 11, 2025, 2:45 AM UTC
- **Topics:** HonorSpy dashboard, RP formula, bracket awards, honor interpolation, Turtle WoW PvP
- **Key Findings:**
  - Fixed `refinedBrackets` object with calibrated floor/ceiling/spread values from Dec 9 reset data
  - B14: floor 12,410, ceiling 13,000, spread 590 (was garbage: floor 12,957, spread 55)
  - B13: floor 11,544, ceiling 12,000, spread 456
  - Awards are HONOR-BASED within brackets, not standing-based
  - Added `originalStanding` assignment in `changeWeek()` for snapshot data
  - Formula: `award = floor + (honorPosition * spread)`
- **Technologies:** JavaScript, HonorSpy dashboard, Turtle WoW API, Flask/Python backend
- **Status:** Completed - Pending user verification
- **Type:** Bug Fix/Formula Calibration
- **Files Modified:**
  - `/var/www/html/honorspy/index.html` (lines 591-605 refinedBrackets, ~1057 changeWeek)
- **Validation Data:**
  - Pool size: 1,982 players (Dec 9)
  - Pallorina (standing 6, B14): actual award 12,410
  - Minmaxing (standing 7, B13): actual award 12,000
- **Related Documentation:**
  - `C:\Claude-Flow\output-files\TURTLE_WOW_RP_FORMULA.md`
  - `C:\Claude-Flow\output-files\reports\SYSTEM_HonorSpy_Dashboard_2025_12_01.md`

#### 5. TBC Guild Website - SR URL Clickable Links Fix
- **File:** `2025_12_12_07_45_AM_UTC_TBCGuild_SR_URL_Clickable_Links_Fix.md`
- **Date:** December 12, 2025, 7:45 AM UTC
- **Topics:** TBC Guild website, raid signups, Soft Reserve URLs, Deno Fresh, TypeScript
- **Key Findings:**
  - SR URLs in raid descriptions were plain text, not clickable
  - Added `linkifyDescription()` function to convert URLs to anchor tags
  - Links now open in new tab with proper security attributes
  - Fix applies to all raid detail pages automatically
- **Technologies:** Deno Fresh, TypeScript, Preact JSX, SSH
- **Status:** Completed Successfully
- **Type:** Bug Fix
- **Server:** torreyserver (132.226.72.121)
- **Files Modified:**
  - `/home/opc/tbc-website/routes/raids/[id].tsx` (added JSX import, linkifyDescription function)
- **Rollback Available:** Yes - backup at `[id].tsx.backup_20251211_234048`

---
*Index last updated: 2025-12-12 7:45 AM UTC*

#### 6. TBC Guild SR+ System Design Document
- **File:** `2025_12_12_08_56_AM_UTC_TBCGuild_SR_Plus_System_Design_Document.md`
- **Date:** December 12, 2025, 8:56 AM UTC
- **Topics:** SR+ system redesign, Discord OAuth SSO, player self-service, admin spreadsheet UI, 24-hour eligibility
- **Key Components:**
  - Phase 1: Admin Spreadsheet UI (`/admin/sr-plus`) - bulk credit management
  - Phase 2: Discord OAuth SSO - player authentication tied to Discord identity
  - Phase 3: Player Self-Service Portal (`/my-sr`) - players manage own SRs
  - Phase 4: 24-Hour Eligibility System - verify Discord signup timing
- **Data Model Updates:**
  - Added `raidType` field for raid segmentation (MC, BWL, AQ40, etc.)
  - Added `PlayerAccount` for Discord OAuth users
  - Added `SoftReserve` for player SR submissions
  - Configurable `bonusPerSR` (default: +20) and `hardReserveThreshold` (default: 5)
- **Security Model:**
  - Discord OAuth verifies real identity
  - Guild membership check
  - Players can only edit their own SRs
  - Admins have full access
- **Technologies:** Deno Fresh, Discord OAuth2, Deno KV, Raid-Helper API
- **Status:** Design Complete - Ready for Implementation
- **Type:** System Architecture / Feature Design
- **Server:** torreyserver (132.226.72.121)
- **Migration:** 16 existing credits need raidType field added

---

#### 7. TBC Guild Architecture Current State Documentation
- **File:** `2025_12_13_03_45_AM_UTC_TBCGuild_Architecture_Current_State_Documentation.md`
- **Date:** December 13, 2025, 3:45 AM UTC
- **Topics:** System architecture, Database schema, API routes, Data flow diagrams, Component mapping, Deno KV
- **Key Findings:**
  - Audited all 11 Deno KV key prefixes in use
  - Documented 20+ API endpoints across Auth, SR+, Items, Logs, Raids
  - Identified BROKEN `sr_plus/credits` table (inconsistent key formats)
  - Identified UNUSED `sr_plus/runs` table
  - Documented self-healing item lookup flow (static JSON → KV → Playwright scrape)
  - Mapped 15 island components and their API dependencies
- **Files Created:**
  - `/home/opc/tbc-website/routes/architecture.tsx` - New page route
  - `/home/opc/tbc-website/islands/ArchitectureDocs.tsx` - Interactive component (29KB)
  - `/home/opc/tbc-website/components/Nav.tsx` - Updated with Architecture link
- **Technologies:** Deno Fresh, Deno KV, Preact islands, TypeScript, SSH
- **Status:** Completed Successfully
- **Type:** Architecture Documentation
- **Server:** torreyserver (132.226.72.121)
- **Website URL:** `/architecture` (accessible via nav menu)

#### 8. TBC Guild SR+ Future State Design
- **File:** `2025_12_13_03_50_AM_UTC_TBCGuild_SR_Plus_Future_State_Design.md`
- **Date:** December 13, 2025, 3:50 AM UTC
- **Topics:** SR+ redesign, Loyalty rewards, Automation, Cron jobs, Combat log processing, Business rules
- **Key Components:**
  - New data model: `sr_plus_entries`, `sr_plus_history`, `sr_plus_admin_log`
  - One SR+ per raid type rule
  - Hard Reserve status at 5+ times
  - Cron job automation (every 5 min) for attendance/loot processing
  - Tel'Abim server reset schedule documentation
- **Business Rules:**
  - One SR+ per raid type (can have SR+ in MC AND BWL)
  - Reset to 0 on new item pick
  - No decay over time
  - All admin edits logged immutably
  - Players can view everyone's SR+ (read-only)
- **UI Changes:**
  - MySRPortal: Two tabs (My SR+ / Guild SR+)
  - Admin: Raid type tabs, edit logging, CSV export
  - In-app notifications for tally increases
- **Technologies:** Deno Fresh, Deno KV, Cron jobs, Combat log parsing
- **Status:** Design Complete - Ready for Implementation
- **Type:** System Architecture / Feature Design
- **Server:** torreyserver (132.226.72.121)
- **Cleanup Required:** Delete `sr_plus/credits`, `sr_plus/runs` tables

#### 9. TurtleWoW Multibox ForceBindIP Setup
- **File:** `2025_12_14_12_30_AM_PST_TurtleWoW_Multibox_ForceBindIP_Setup.md`
- **Date:** December 14, 2025, 12:30 AM PST
- **Topics:** Multiboxing, ForceBindIP, Cloudflare WARP, Network binding, Dual IP WoW clients
- **Key Findings:**
  - ForceBindIP allows binding WoW.exe to specific network adapters
  - With WARP ON: Real adapter (192.168.1.69) and WARP adapter (172.16.0.2) available
  - Created two desktop shortcuts for launching WoW with different IPs
  - Simple toggle method doesn't work - WARP toggle disconnects running sessions
  - ForceBindIP installed to `C:\TurtleWoW\Tools\ForceBindIP\` (no admin required)
- **Technologies:** ForceBindIP v1.32, Cloudflare WARP, PowerShell, Windows shortcuts
- **Status:** Completed Successfully
- **Type:** Configuration/Setup
- **Files Created:**
  - `C:\TurtleWoW\Tools\ForceBindIP\*` (ForceBindIP installation)
  - `C:\Users\ryanr\OneDrive\Desktop\TurtleWoW - Real IP.lnk`
  - `C:\Users\ryanr\OneDrive\Desktop\TurtleWoW - WARP.lnk`
- **Rollback Available:** Yes - delete Tools\ForceBindIP folder and shortcuts
- **Prerequisites:** Cloudflare WARP must be connected before launching either shortcut

#### 10. HonorSpy Dashboard Exploration and API Fix
- **File:** `2025_12_14_05_21_PM_PST_HonorSpy_Dashboard_Exploration_And_API_Fix.md`
- **Date:** December 14, 2025, 5:21 PM PST
- **Topics:** HonorSpy dashboard, API crash-loop fix, Zombie process, Flask service, Turtle WoW PvP
- **Key Findings:**
  - Explored complete HonorSpy infrastructure on torreyserver
  - Discovered API in crash-loop (81,475+ restart attempts!)
  - Root cause: Zombie Python process (PID 4004103 from Dec 11) blocking port 5002
  - Killed zombie process and restarted systemd service
  - API now running successfully - health check returns OK
  - System tracks ~2,045 players from 2 contributors (Whora, Meltyougood)
- **Technologies:** Flask Python, systemd, nginx, Let's Encrypt SSL, Deno KV snapshots
- **Status:** Completed Successfully
- **Type:** System Exploration / Critical Bug Fix
- **Server:** torreyserver (132.226.72.121)
- **Files Analyzed:**
  - `/home/opc/HonorSpy/api.py` (main Flask API)
  - `/home/opc/HonorSpy/data/merged_players.json` (current player data)
  - `/etc/systemd/system/honorspy-api.service` (service definition)
  - `/etc/nginx/conf.d/honorspy-duckdns.conf` (nginx config)
- **Commands Used:**
  - `sudo lsof -i :5002` (found zombie process)
  - `kill 4004103` (terminated zombie)
  - `sudo systemctl restart honorspy-api` (service restart)
- **Dashboard URL:** https://honorspy.duckdns.org
- **Related Reports:**
  - `2025_12_11_02_45_AM_UTC_HonorSpy_RP_Formula_Calibration.md`

#### 11. AlwaysShadow Installation
- **File:** `2025_12_15_09_18_PM_PST_AlwaysShadow_Installation.md`
- **Date:** December 15, 2025, 9:18 PM PST
- **Topics:** NVIDIA ShadowPlay, Instant Replay, AlwaysShadow utility, Startup automation
- **Key Findings:**
  - NVIDIA Instant Replay has no native "always on" registry setting
  - AlwaysShadow v1.666 monitors and auto-re-enables Instant Replay
  - Runs from system tray with minimal resource usage
  - Startup shortcut ensures auto-launch on boot
- **Technologies:** PowerShell, Windows Startup folder, NVIDIA ShadowPlay, GitHub
- **Status:** Completed Successfully
- **Type:** Software Installation/Configuration
- **Files Created:**
  - Install script: `C:\Temp\install-alwaysshadow.ps1`
  - Application: `C:\Users\ryanr\AppData\Local\AlwaysShadow\AlwaysShadow.exe`
  - Startup shortcut: `%APPDATA%\...\Startup\AlwaysShadow.lnk`
- **Rollback Available:** Yes - documented in status report

#### 12. Chrome Hardware Acceleration Disabled for NVIDIA Instant Replay
- **File:** `2025_12_16_11_11_PM_PST_Chrome_Hardware_Acceleration_Disabled_For_NVIDIA_Instant_Replay.md`
- **Date:** December 16, 2025, 11:11 PM PST
- **Topics:** Chrome, NVIDIA ShadowPlay, Hardware Acceleration, Instant Replay, DRM, Widevine, Protected Content
- **Key Findings:**
  - Chrome's Widevine DRM triggers NVIDIA protected content detection
  - This caused AlwaysShadow to enter error loop trying to re-enable Instant Replay
  - Disabling hardware acceleration prevents HDCP trigger from firing
  - Chrome still functions normally using CPU for video decode
- **Technologies:** PowerShell, Chrome Preferences JSON, NVIDIA ShadowPlay
- **Status:** Completed Successfully
- **Type:** Configuration Fix
- **Files Modified:**
  - Chrome Preferences: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Preferences`
  - Added: `hardware_acceleration_mode.enabled = false`
- **Files Created:**
  - Script: `C:\Temp\disable-chrome-hw-accel.ps1`
- **Rollback Available:** Yes - toggle in Chrome Settings > System or via PowerShell
- **Related Reports:**
  - `2025_12_15_09_18_PM_PST_AlwaysShadow_Installation.md`

#### 13. TurtleWoW PerfBoost DLL Installation
- **File:** `2025_12_18_09_15_PM_PST_TurtleWoW_PerfBoost_DLL_Installation.md`
- **Date:** December 18, 2025, 9:15 PM PST
- **Topics:** TurtleWoW, Performance optimization, perf_boost.dll, Render distance, FPS improvement, Raid performance
- **Key Findings:**
  - perf_boost.dll provides selective unit rendering for better FPS
  - Context-aware settings for combat/non-combat and city/outdoor
  - Smart exceptions ensure raid-marked units always render
  - No conflicts with existing DLLs (nampower, VfPatcher, SuperWoWhook)
- **Technologies:** curl, PowerShell, TurtleWoW DLL system, WoW addon framework
- **Status:** Completed Successfully
- **Type:** Performance Optimization / Addon Installation
- **Files Created:**
  - DLL: `C:\TurtleWoW\perf_boost.dll` (530 KB)
  - Addon: `C:\TurtleWoW\Interface\AddOns\PerfBoostSettings\`
- **Files Modified:**
  - `C:\TurtleWoW\dlls.txt` - added perf_boost.dll
- **Rollback Available:** Yes - documented in status report
- **In-Game Command:** `/pbs` or minimap icon

#### 14. DPSMate Parser Battleground Error Fix
- **File:** `2025_12_18_09_15_PM_PST_DPSMate_Parser_Battleground_Error_Fix.md`
- **Date:** December 18, 2025, 9:15 PM PST
- **Topics:** DPSMate addon, Lua error fix, Battleground, Arena, Parser nil-check
- **Key Findings:**
  - Error: `attempt to perform arithmetic on local 'i' (a nil value)` at line 1679
  - Root cause: `strfind` returns nil when pattern not found, code assumed pattern always exists
  - Battleground messages have different formats than expected healing messages
  - Fix: Added nil-checks before arithmetic operations on strfind results
- **Technologies:** Lua, WoW addon debugging, Combat log parsing
- **Status:** Completed Successfully
- **Type:** Bug Fix
- **Files Modified:**
  - `C:\TurtleWoW\Interface\AddOns\DPSMate\enUS\DPSMate_ParserENUS.lua` (lines 1679, 1683)
- **Rollback Available:** Yes - remove the two nil-check lines

#### 15. TurtleHD Reforged December 2025 Upgrade
- **File:** `2025_12_20_02_19_PM_PST_TurtleHD_Reforged_December_2025_Upgrade.md`
- **Date:** December 20, 2025, 2:19 PM PST
- **Topics:** TurtleHD, HD Patch Reforged, Stormhand81, Graphics upgrade, MPQ patches, VanillaHelpers.dll
- **Key Findings:**
  - Upgraded from September 2025 (2 patches) to December 2025 (7 patches) version
  - New modular patch system: A (Characters), B (Buildings), C (Creatures), D (Doodads), E (Environment), G (Ground), M (Misc)
  - VanillaHelpers.dll v1.1.1 now required dependency
  - Total upgrade size: ~8.9 GB (up from ~2.3 GB)
  - Custom Python script created for MediaFire downloads
- **Technologies:** PowerShell, Python (requests, BeautifulSoup), MediaFire, MPQ files
- **Status:** Ready for Installation (user must run upgrade script after closing game)
- **Type:** Graphics Mod Upgrade
- **Files Downloaded:**
  - `C:\TurtleWoW\Data\Patch-A_NEW.mpq` through `Patch-M_NEW.mpq` (7 files, 8.9 GB total)
  - `C:\TurtleWoW\VanillaHelpers.dll` (254 KB)
- **Files Modified:**
  - `C:\TurtleWoW\dlls.txt` - added VanillaHelpers.dll
- **Files Created:**
  - `C:\TurtleWoW\APPLY_HD_UPGRADE.bat` - automated upgrade script
  - `/c/Temp/mediafire_download.py` - MediaFire download helper
- **Backup Location:** `C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\`
- **Rollback Available:** Yes - documented in status report

#### 16. TurtleWoW Complete Mod Upgrade (Comprehensive)
- **File:** `2025_12_20_05_33_PM_PST_TurtleWoW_Complete_Mod_Upgrade.md`
- **Date:** December 20, 2025, 5:33 PM PST
- **Topics:** TurtleHD Reforged, nampower, VanillaFixes, DXVK, VanillaHelpers, comprehensive mod upgrade
- **Key Findings:**
  - Complete upgrade session covering HD graphics and all client mods
  - TurtleHD: September 2025 (2.3 GB) → December 2025 (8.9 GB, 7 patches)
  - nampower: Updated to v2.19.1 (released same day with crash fixes)
  - VanillaFixes: Updated to v1.5.3 with DXVK 2.6.1
  - VanillaHelpers.dll v1.1.1: New required dependency installed
  - vanilla-tweaks, SuperWoW, UnitXP_SP3: Already current
  - Total downloads: ~10.6 GB
- **Technologies:** Python, curl, PowerShell, MediaFire parsing, GitHub API
- **Status:** Completed Successfully
- **Type:** Major Upgrade Session / Comprehensive Documentation
- **Files Updated:**
  - 7 HD patch files (Patch-A through Patch-M)
  - nampower.dll (v2.19.1)
  - VanillaFixes.exe, VfPatcher.dll, d3d9.dll (v1.5.3 + DXVK 2.6.1)
  - dxvk.conf (new), VanillaHelpers.dll (new)
  - dlls.txt configuration
- **Backup Locations:**
  - HD Patches: `C:\TurtleWoW\backups\TurtleHD_Backup_2025-12-20_Pre-Upgrade\`
  - Mod Files: `C:\TurtleWoW\backups\Mods_Backup_2025-12-20\`
- **Rollback Available:** Yes - full procedures documented
- **Related Reports:**
  - `2025_12_20_02_19_PM_PST_TurtleHD_Reforged_December_2025_Upgrade.md` (earlier partial report)

#### 17. TurtleHD Full Installation ChangeLog & Rollback Guide
- **File:** `2025_12_21_12_37_AM_PST_TurtleHD_Full_Installation_ChangeLog.md`
- **Date:** December 21, 2025, 12:37 AM PST
- **Topics:** TurtleHD Reforged, ChangeLog, Rollback Guide, All 13 Patches, Complete Installation
- **Key Findings:**
  - Complete installation of all 13 HD patches totaling 11.9 GB
  - Core patches: A, B, C, D, E, G, M
  - Optional patches: I (Interface), L (Female), N (Nights), O (Raid Visuals), S (Sounds), U (Ultra HD)
  - Patch dependencies documented (O requires S, U requires A)
  - Full rollback procedures with ready-to-use batch scripts
- **Technologies:** MediaFire, Python, batch scripting
- **Status:** Completed Successfully
- **Type:** ChangeLog / Rollback Documentation
- **Rollback Scripts Created:**
  - `C:\TurtleWoW\ROLLBACK_TO_SEPTEMBER_2025.bat` - Full rollback to Sept 2025
  - `C:\TurtleWoW\REMOVE_OPTIONAL_PATCHES.bat` - Remove I, L, N, O, S, U only
  - `C:\TurtleWoW\ROLLBACK_CLIENT_MODS.bat` - Restore previous nampower/VanillaFixes
- **Related Reports:**
  - `2025_12_20_02_19_PM_PST_TurtleHD_Reforged_December_2025_Upgrade.md`
  - `2025_12_20_05_33_PM_PST_TurtleWoW_Complete_Mod_Upgrade.md`

#### 18. TurtLog AQ40 File Transfer to Linux Server
- **File:** `2025_12_30_05_21_AM_PST_TurtLog_File_Transfer_to_Linux.md`
- **Date:** December 30, 2025, 5:21 AM PST
- **Topics:** File transfer, SCP, SSH, TurtLog combat logs, AQ40 raid logs
- **Key Findings:**
  - Transferred 2 TurtLog combat log files to Linux server
  - Both zip files contained internal `WoWCombatLog.txt` - extracted to separate folders to avoid overwriting
  - Renamed files with date identifiers for clarity on server
  - Files: Dec 19 (10.5 MB), Dec 22 (5.4 MB)
- **Technologies:** SCP, SSH, PowerShell, ZIP extraction
- **Status:** Completed Successfully
- **Type:** File Transfer
- **Local Files:**
  - `C:\Users\ryanr\Downloads\TurtLog-AQ40-2025-12-19-NoKill (1).zip`
  - `C:\Users\ryanr\Downloads\TurtLog-AQ40-2025-12-22-NoKill.zip`
- **Remote Destination:** `/home/opc/tbc-website/logs/`
- **Server:** torreyserver (132.226.72.121)
- **Rollback Available:** Yes - SSH rm command documented

#### 19. TurtleWoW Error 132 Fix and Mod Updates
- **File:** `2025_12_31_01_23_AM_PST_TurtleWoW_Error132_Fix_And_Mod_Updates.md`
- **Date:** December 31, 2025, 1:23 AM PST
- **Topics:** Error 132 Fatal Exception, nampower update, VanillaHelpers.dll, HD Patch: Reforged, Patch-I removal
- **Key Findings:**
  - VanillaHelpers.dll was missing from dlls.txt (required for HD patches)
  - nampower v2.19.1 outdated - updated to v2.23.1 (fixes "crashes on launch")
  - UnitXP_SP3 v52 outdated - v70 available (manual update required)
  - Error 132 crashes at CharacterSelect due to missing DLL config
  - Patch-I (Interface) removed per user request
- **Technologies:** PowerShell, TurtleWoW mods, DLL configuration, HD Patch: Reforged
- **Status:** Completed - Requires Testing
- **Type:** Critical Bug Fix / Mod Updates
- **Files Modified:**
  - `C:\TurtleWoW\dlls.txt` - Added VanillaHelpers.dll
  - `C:\TurtleWoW\nampower.dll` - Updated to v2.23.1
- **Files Removed:**
  - `C:\TurtleWoW\Data\Patch-I.mpq` - Moved to backups
- **Rollback Available:** Yes - documented in status report
- **Manual Action Required:** Update UnitXP_SP3 from Codeberg (v52 -> v70)

---

## January 2026 Reports

#### 1. BagShui Resistance Categories Fix (Initial Attempt - FAILED)
- **File:** `2026_01_07_02_35_AM_PST_BagShui_Resistance_Categories_Fix.md`
- **Date:** January 7, 2026, 2:35 AM PST
- **Topics:** BagShui addon, Resistance categories, Layout groups, Category definitions, Shadow Resist, Arcane Resist
- **Key Findings:**
  - Shadow Resist layout group was acting as catch-all (catching ALL uncategorized gear)
  - Root cause: Layout used string categories ("BOE", "Uncategorized") instead of category ID 29
  - Nature Resist worked correctly because it used category ID 34
  - Arcane Resist category (37) existed but had no layout group (invisible in UI)
  - BagShui has two systems: Categories (backend rules) and Layout Groups (frontend display)
- **Technologies:** PowerShell, Lua SavedVariables, UTF-8 encoding, TurtleWoW addons
- **Status:** FAILED - Global replacement broke entire file
- **Type:** Bug Fix / Feature Addition (FAILED ATTEMPT)
- **Lesson Learned:** DO NOT use global string replacement on large Lua files

#### 2. BagShui Shadow Resist Surgical Fix
- **File:** `2026_01_07_02_44_AM_PST_BagShui_Shadow_Resist_Surgical_Fix.md`
- **Date:** January 7, 2026, 2:44 AM PST
- **Topics:** BagShui addon, Shadow Resist fix, Surgical edit, Backup restore, Byte-position replacement
- **Key Findings:**
  - Restored from October 25, 2025 backup after global replacement broke entire config
  - Applied SURGICAL byte-position fix to ONLY Shadow Resist categories block
  - Changed from catch-all (`"BOE"`, `"Uncategorized"`, etc.) to `[1] = 29`
  - Verification confirmed fix at byte position 700494
  - Arcane Resist layout NOT added (to avoid risk of breaking other categories)
- **Technologies:** PowerShell, Lua SavedVariables, UTF-8 no BOM, byte-position editing
- **Status:** Completed Successfully - Awaiting user /reload verification
- **Type:** Bug Fix (SURGICAL approach)
- **Files Modified:**
  - `C:\TurtleWoW\WTF\Account\STORMSHADOW\SavedVariables\Bagshui.lua`
  - Shadow Resist layout: Changed from catch-all to `[1] = 29`
- **Files Used:**
  - Backup restored: `Bagshui.lua.backup_resistance_fix` (October 25, 2025)
  - Broken file saved: `Bagshui.lua.broken_20260107`
- **Rollback Available:** Yes - restore from October backup
- **Testing Required:** User must `/reload` in-game to verify
- **Pending:** Arcane Resist layout group (can be added if requested)

---

### Quick Search - January 2026
- **BagShui:** Resistance Categories Fix (2026-01-07), Surgical Fix (2026-01-07)
- **WoW Addons:** BagShui Categories (2026-01-07)
- **Bug Fix:** Shadow Resist catch-all (2026-01-07)
- **Failed Approach:** Global string replacement broke file (2026-01-07)
- **Lesson Learned:** Use surgical byte-position edits, not global replace

---
#### 3. BagShui Herbs Category Fix
- **File:** 2026_01_07_03_35_AM_PST_BagShui_Herbs_Category_Fix.md
- **Date:** January 7, 2026, 3:35 AM PST
- **Topics:** BagShui addon, Herbs category, Rule function fix, Subtype matching
- **Status:** Completed Successfully - Awaiting user /reload verification
- **Type:** Bug Fix - Changed rule from invalid Texture("Herb") to Subtype("Herb")

#### 4. Guild Consume Shop Design Document
- **File:** `2026_01_16_11_14_PM_PST_Guild_Consume_Shop_Design_Document.md`
- **Date:** January 16, 2026, 11:14 PM PST
- **Topics:** Discord bot, Guild alchemy shop, Consume pricing, AUX addon, Web interface, Deno Fresh, Bidirectional sync
- **Key Findings:**
  - Comprehensive design documentation for automated guild consume shop system
  - Reviewed existing TBC Guild website infrastructure (Discord OAuth, item lookup API, Deno KV)
  - Analyzed AUX addon source code and SavedVariables structure
  - Designed companion addon "GuildShopScanner" for price scanning
  - 37 items cataloged across 5 categories with acronym mappings
  - 7-day phased implementation plan created
- **Technologies:** Deno Fresh, Discord.js, Deno KV, Lua (WoW Addons), REST API, Server-Sent Events
- **Status:** DRAFT COMPLETE - Awaiting user review and approval
- **Type:** System Architecture / Feature Design
- **Server:** torreyserver (132.226.72.121)
- **Files Created:**
  - `C:\Claude-Flow\output-files\TBC_Guild_Consume_Shop_Design_Document.md` (1,293 lines)
  - `C:\Claude-Flow\output-files\architecture-future-enhancements.json`
  - `/home/opc/tbc-website/static/architecture-future-enhancements.json` (deployed)
- **Configuration Values:**
  - Bot Name: "Consumes Bot"
  - Alchemy Channel ID: `1371230469919608882`
  - Admin Discord ID: `387885041348247552`
  - Default Discount: 10% off AH prices
  - Flask Prices: Titans 30g, others 20g
- **Review Locations:**
  - Local: `C:\Claude-Flow\output-files\TBC_Guild_Consume_Shop_Design_Document.md`
  - Web: `https://tbcguild.duckdns.org/architecture` → "Future Enhancements" tab
- **Next Steps:** User review and approval required before implementation begins
- **Related Documentation:**
  - `2025_12_13_03_45_AM_UTC_TBCGuild_Architecture_Current_State_Documentation.md`
  - `2025_12_13_03_50_AM_UTC_TBCGuild_SR_Plus_Future_State_Design.md`

---

### Quick Search - January 2026 (continued)
- **Discord Bot:** Guild Consume Shop Design (2026-01-16)
- **TBC Guild Website:** Consume Shop Architecture (2026-01-16)
- **Guild Systems:** Alchemy pricing automation (2026-01-16)
- **AUX Addon:** SavedVariables analysis (2026-01-16)
- **Design Documents:** Guild Consume Shop (2026-01-16)

#### 5. Auto-Healing Fix - Playwright to Fetch Migration
- **File:** `2026_01_23_03_56_AM_PST_Auto_Healing_Fix.md`
- **Date:** January 23, 2026, 3:56 AM PST
- **Topics:** Auto-healing, Item lookup, Playwright removal, Fetch-based scraping, Loot history, TurtleWoW database
- **Key Findings:**
  - Auto-healing was failing because it relied on Playwright browser automation (Chromium not installed)
  - The bulk cache population script used simple HTTP fetch - proven to work with 7,700+ items
  - Replaced Playwright-based `scrapeFromTurtleWow()` with fetch-based approach
  - Successfully healed two missing items: Serathil (13015) and Supreme Gloves (15438)
  - Auto-healing now triggers correctly when loading loot history pages
- **Technologies:** Deno Fresh, TypeScript, HTTP fetch, regex HTML parsing, Deno KV
- **Status:** Completed Successfully
- **Type:** Critical Bug Fix
- **Server:** torreyserver (132.226.72.121)
- **Files Modified:**
  - `/home/opc/tbc-website/routes/api/items/lookup.ts` - Replaced Playwright with fetch
- **Files Created:**
  - `/home/opc/tbc-website/routes/api/items/lookup.ts.bak` - Backup of original
- **Testing Verified:**
  - Item 13015 (Serathil): Successfully scraped via fetch
  - Item 15438 (Supreme Gloves): Successfully scraped via fetch
  - Both items added to static cache (`item-tooltips.json`)
- **Auto-Healing Flow:**
  1. Page loads → LootTable.tsx mounts
  2. Batch API called → detects missing items
  3. `lookupItem()` triggered → calls `/api/items/lookup`
  4. Fetch-based scrape → parses TurtleWoW HTML
  5. Data persisted → KV + static JSON updated
- **Rollback Available:** Yes - restore from `.bak` file

#### 6. GuildShopSync Installer v2.7 Fix - Reboot Persistence
- **File:** `2026_01_23_12_25_PM_PST_GuildShopSync_Installer_v2.7_Fix.md`
- **Date:** January 23, 2026, 12:25 PM PST
- **Topics:** GuildShopSync, Installer fix, Scheduled task, Battery settings, Reboot persistence, Price scanner
- **Key Findings:**
  - Root cause: Scheduled task ran at boot but failed (error -1073741510)
  - Two issues: No startup delay, battery restrictions prevented running
  - Fix: Added 30-second delay (`/delay 0000:30`) to scheduled task
  - Fix: Added PowerShell to disable battery restrictions after task creation
  - Website button updated to show version number
- **Technologies:** Inno Setup 6.7.0, PowerShell, Windows Task Scheduler, SSH, SCP
- **Status:** Completed Successfully
- **Type:** Installer Bug Fix
- **Version:** 2.6 → 2.7
- **Files Modified (Linux Server):**
  - `/home/opc/GuildShopSync/GuildShopSync.iss` - Installer script
  - `/home/opc/GuildShopSync/source/README.txt` - Version bump
  - `/home/opc/GuildShopSync/source/SyncService.ps1` - Version comment
  - `/home/opc/tbc-website/islands/ConsumesShop.tsx` - Download button text/link
- **Files Created (Linux Server):**
  - `/home/opc/tbc-website/static/GuildShopSync-Setup-v2.7.exe` (2.1 MB)
  - `/home/opc/tbc-website/static/GuildShopSync-v2.7.zip` (6.7 KB)
- **Download URL:** https://tbcguild.duckdns.org/GuildShopSync-Setup-v2.7.exe
- **Website Button:** "📥 Download Price Scanner v2.7"
- **Rollback Available:** Yes - v2.6 files still on server, backup at `.iss.v2.6.bak`

---

### Quick Search - January 2026 (continued)
- **GuildShopSync:** Installer v2.7 Fix (2026-01-23)
- **Price Scanner:** Reboot persistence fix (2026-01-23)
- **Scheduled Task:** Battery settings, startup delay (2026-01-23)
- **Inno Setup:** Installer compilation (2026-01-23)

#### 7. TurtleWoW Post-Update Restoration
- **File:** `2026_01_23_03_35_PM_PST_TurtleWoW_Post_Update_Restoration.md`
- **Date:** January 23, 2026, 3:35 PM PST
- **Topics:** TurtleWoW update, VanillaFixes, TWPatcher, nampower, Patch-I removal, mod restoration
- **Key Findings:**
  - TurtleWoW update only replaced executables, not Interface/WTF folders
  - All modified addons (DPSMate, SuperMacro, Cursive, Spy) remained intact
  - Missing files: TWPatcher.exe, VanillaFixes.exe, nampower.dll, UnitXP_SP3.dll
  - Patch-I.mpq (Interface - crash-causing) was present and needed removal
- **Technologies:** PowerShell, TurtleWoW mods, DLL configuration
- **Status:** Completed Successfully
- **Type:** Post-Update Restoration
- **Files Copied:**
  - TWPatcher.exe, VanillaFixes.exe, nampower.dll, UnitXP_SP3.dll
- **Files Removed:**
  - `C:\turtlewow\Data\Patch-I.mpq` → `C:\turtlewow\backups\Patch-I_removed_2026-01-23.mpq`
- **Rollback Available:** Yes - backup folder contains all original files

---

### Quick Search - January 2026 (continued)
- **TurtleWoW:** Post-Update Restoration (2026-01-23)
- **VanillaFixes:** Restoration after update (2026-01-23)
- **Patch-I:** Crash-causing patch removed (2026-01-23)
- **GuildShopSync:** Installer v2.7 Fix (2026-01-23)
- **Price Scanner:** Reboot persistence fix (2026-01-23)
- **Scheduled Task:** Battery settings, startup delay (2026-01-23)
- **Inno Setup:** Installer compilation (2026-01-23)

---

## February 2026 Reports

#### 1. GuildShopSync Scheduled Task Missing + SetupTask.ps1 Bug Fix
- **File:** `2026_02_01_11_56_PM_PST_GuildShopSync_Scheduled_Task_Missing_Fix.md`
- **Date:** February 1, 2026, 11:56 PM PST
- **Topics:** GuildShopSync, Scheduled task missing, SetupTask.ps1 bug, $env:USERNAME vs WindowsIdentity, Price sync failure, Tray icon not visible
- **Key Findings:**
  - **ROOT CAUSE:** `SetupTask.ps1` used `$env:USERNAME` (resolves to `rr218400`) instead of full Windows identity. `Register-ScheduledTask` failed silently every install since v2.8.
  - Scheduled task was NEVER successfully created by any installer version
  - Service only ran because installer launched it directly after install
  - After PC reboot, service died and never restarted (no task to trigger it)
  - Service log confirms: ran Jan 27-30, then died. No restarts.
  - User's price scan on Feb 1 at 21:48 had `triggerUpload = true` with nobody to process it
- **Fix Applied:**
  - Manually created scheduled task via admin UAC elevation
  - Launched SyncService.ps1, touched SavedVariables to trigger pending upload
  - 66 prices uploaded successfully, website updated
  - Fixed SetupTask.ps1: full WindowsIdentity, try/catch, schtasks fallback, verification
  - Updated server source file `/home/opc/GuildShopSync/source/SetupTask.ps1`
- **Technologies:** PowerShell, Windows Task Scheduler, Inno Setup, SSH, SCP
- **Status:** Completed Successfully
- **Type:** Critical Bug Fix
- **Server:** torreyserver (132.226.72.121)
- **Files Modified:**
  - Server: `/home/opc/GuildShopSync/source/SetupTask.ps1` (bug fix)
  - Local: Windows Task Scheduler `GuildShopSync` task (created)
  - Local: `%LOCALAPPDATA%\GuildShopSync\service.log` (new entries)
- **Rollback Available:** Yes - documented in status report
- **Pending:** Installer recompilation with fixed SetupTask.ps1

---

### Quick Search - February 2026
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)
- **Price Scanner:** Not syncing, tray icon missing (2026-02-01)
- **Scheduled Task:** $env:USERNAME bug, Register-ScheduledTask failure (2026-02-01)
- **Windows Identity:** $env:USERNAME vs WindowsIdentity.GetCurrent().Name (2026-02-01)
- **Bug Pattern:** Silent failure - script reports success without verifying (2026-02-01)

### 2026-02-02

#### 1. TurtleWoW Combat Log Analysis - Skeram MC & Interrupts
- **File:** `2026_02_02_07_24_PM_PST_TurtleWoW_CombatLog_Analysis_Skeram_MC_Interrupts.md`
- **Date:** February 2, 2026, 7:24 PM PST
- **Topics:** WoW combat log analysis, Prophet Skeram, Mind Control (True Fulfillment), Arcane Explosion interrupts, AQ40 raid
- **Key Findings:**
  - Whora was MC'd by Skeram at 16:11:37.257 via True Fulfillment, died 19.5s later
  - Damage dealers on MC'd Whora: Doomest (warrior, ~1794 dmg), Cmdrkeen (warlock, ~1544 dmg), Boomdj (rogue, ~742 dmg)
  - CC attempts: Noorth (Psychic Scream resisted), Motguts (began Polymorph)
  - 7 Arcane Explosion casts, 3 interrupted: Pussinbooger (Kick), Dirtmcskrt (Kick), Rwagorn (Earth Shock)
  - Whora dealt ~28,000+ damage to raid while MC'd (Frostbolts, Cone of Cold, Arcane Missiles)
- **Technologies:** PowerShell, StreamReader with FileShare.ReadWrite (log locked by running game)
- **Status:** Completed
- **Type:** Combat Log Analysis / Raid Investigation
- **Files Analyzed:**
  - `C:\TurtleWoW\Logs\WoWCombatLog.txt` (444 MB)
- **Working Files Created:**
  - `C:\Claude-Flow\output-files\search_combat_log*.ps1` (3 scripts)
  - `C:\Claude-Flow\output-files\*.txt` (working data extracts)
- **Raid Members Identified:** Keenhoof, Doomest, Howitzers, Whora, Motguts, Griselva, Boomdj, Dirtmcskrt, Pussinbooger, Wholegape, Rwagorn, Jrock, Zogrug, Tonkha, Fieldwalker, Chauncey, Chimei, Cmdrkeen, Felbringer, Slxtduck, Bambow, Venthrax, Noorth, Healsforblow, Meltyougood, Heffer, Khloroform

---

### Quick Search - February 2026
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **WoW Raids:** AQ40 Prophet Skeram fight analysis (2026-02-02)
- **Mind Control:** True Fulfillment on Whora - Doomest, Cmdrkeen, Boomdj damaged (2026-02-02)
- **Interrupts:** Arcane Explosion - Pussinbooger, Dirtmcskrt, Rwagorn (2026-02-02)
- **PowerShell:** FileShare.ReadWrite for locked file reading (2026-02-02)

### 2026-02-04

#### 1. GBankExport Addon Created for TurtleWoW
- **File:** `2026_02_04_03_10_AM_PST_GBankExport_Addon_Created.md`
- **Date:** February 4, 2026, 3:10 AM PST
- **Topics:** TurtleWoW addon development, Guild bank scanning, Data export, SavedVariables, JSON/TXT conversion
- **Key Findings:**
  - No existing TurtleWoW addon scans/exports guild bank contents (verified against all installed addons)
  - TurtleWoW has full guild bank API (backported from WoW 2.3): GetGuildBankItemInfo, GetGuildBankItemLink, QueryGuildBankTab, etc.
  - Confirmed API availability via pfUI's `skins/blizzard/guildbank.lua` which uses GetGuildBankItemLink, MAX_GUILDBANK_SLOTS_PER_TAB, hooksecurefunc
  - BankItems (Classic WoW) incompatible with 1.12 client; Road-block/guildbank only handles personal bags
  - Built custom addon: auto-scans on guild bank open, saves structured + flat data, companion script exports to JSON/TXT
- **Technologies:** Lua (WoW addon), PowerShell, WoW SavedVariables API, TurtleWoW guild bank API
- **Status:** Completed - Awaiting in-game testing
- **Type:** Addon Development
- **Files Created:**
  - `C:\turtlewow\Interface\AddOns\GBankExport\GBankExport.toc`
  - `C:\turtlewow\Interface\AddOns\GBankExport\GBankExport.lua`
  - `C:\turtlewow\Interface\AddOns\GBankExport\Export.ps1`
  - `C:\turtlewow\Interface\AddOns\GBankExport\Export.bat`
- **Rollback:** Delete `C:\turtlewow\Interface\AddOns\GBankExport\` and `C:\turtlewow\WTF\Account\*\SavedVariables\GBankExport.lua`

---

### Quick Search - February 2026 (updated)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Guild Bank:** Auto-scan, data export to JSON/TXT (2026-02-04)
- **TurtleWoW Addon:** Custom-built GBankExport v1.0 (2026-02-04)
- **SavedVariables:** Structured + flat data format for external parsing (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

#### 2. DPSMate Lite Addon Packaged for Distribution
- **File:** `2026_02_04_11_57_PM_PST_DPSMate_Lite_Addon_Packaged_For_Distribution.md`
- **Date:** February 4, 2026, 11:57 PM PST
- **Topics:** DPSMate Lite, Addon packaging, TurtleWoW, File distribution, Zip archive
- **Key Findings:**
  - Core `DPSMate` folder IS the Lite version (identified via .toc title: "DPSMate Lite |cFFFF8080-Optimized-|r")
  - 21 total DPSMate-related folders exist; Lite is the core folder only (84% smaller than full)
  - 20 optional sub-modules (Absorbs, Deaths, Interrupts, etc.) are separate extensions, not part of Lite
  - Packaged as zip with correct top-level `DPSMate/` structure for direct extraction into AddOns
- **Technologies:** PowerShell Compress-Archive, Python zipfile verification
- **Status:** Completed
- **Type:** File Packaging / Distribution
- **Files Created:**
  - `C:\Users\ryanr\Downloads\DPSMate_Lite.zip` (476 KB, 86 entries)
- **Source Directory:** `C:\turtlewow\Interface\AddOns\DPSMate\`
- **Installation (Recipient):** Extract zip into `<TurtleWoW>\Interface\AddOns\`

---

### Quick Search - February 2026 (updated)
- **DPSMate Lite:** Addon packaged for distribution (2026-02-04)
- **TurtleWoW Addon Sharing:** DPSMate Lite zip package (2026-02-04)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Guild Bank:** Auto-scan, data export to JSON/TXT (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

### 2026-02-13

#### 1. Lighthouse External Audit - tbcguild.duckdns.org
- **File:** `2026_02_13_02_20_AM_PST_Lighthouse_External_Audit_TBCGuild.md`
- **Date:** February 13, 2026, 2:20 AM PST
- **Topics:** Lighthouse audit, Performance testing, Core Web Vitals, TBC Guild website, External client test, Desktop preset
- **Key Findings:**
  - Performance score: **100** from external Windows client (vs slower results from server-side test)
  - FCP: 0.5s, LCP: 0.7s, TBT: 0ms, CLS: 0, TTI: 0.7s — all excellent
  - Server response time: 112ms (good)
  - LCP element: `<h1>THRALLS BOOK CLUB</h1>` (text, not hero image)
  - DuckDNS DNS did NOT cause latency issues during this test
  - Opportunities: Minify CSS (9KB), unused CSS (34KB), unused JS (24KB), next-gen images (164KB)
  - 50 requests, 514 KB total transfer (consistent with server-side test)
  - Only cache issue: turtlecraft.gg question mark icon (4h TTL)
- **Technologies:** Lighthouse v12.8.2, Chrome headless, Node.js, npx
- **Status:** Completed Successfully
- **Type:** Performance Audit / External Client Test
- **Reports Created:**
  - `C:\Claude-Flow\lighthouse-reports\tbcguild-windows.report.html` (viewable in browser)
  - `C:\Claude-Flow\lighthouse-reports\tbcguild-windows.report.json` (raw data)
- **Comparison:** Linux server-side was significantly slower (FCP 1.8s, LCP 3.8s, TTI 4.2s) due to resource contention
- **Related:** Linux Lighthouse report at `/var/oled/claude-flow/lighthouse-reports/tbcguild-homepage.report.html`

---

### Quick Search - February 2026 (updated)
- **Lighthouse:** External audit from Windows, Performance 100 (2026-02-13)
- **TBC Guild Website:** Core Web Vitals excellent from external client (2026-02-13)
- **Performance:** FCP 0.5s, LCP 0.7s, TBT 0ms, CLS 0 (2026-02-13)
- **DuckDNS:** DNS latency not observed during test (2026-02-13)
- **DPSMate Lite:** Addon packaged for distribution (2026-02-04)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

#### 2. GBankExport v3.1 — Auto-Scan Settings + Electron App UI
- **File:** `2026_02_13_02_55_AM_PST_GBankExport_Auto_Scan_Settings_And_Electron_UI.md`
- **Date:** February 13, 2026, 2:55 AM PST
- **Topics:** GBankExport addon, Auto-scan toggle, Cooldown timer, Electron app UI, Bidirectional settings sync, SavedVariables
- **Key Findings:**
  - Added `GBankExport_Settings` SavedVariable with `autoScan` (bool) and `cooldownMinutes` (number)
  - New slash commands: `/gbe auto`, `/gbe cooldown <min>`, `/gbe settings`
  - New "Guild Bank Scanner" section in Electron app with toggle, cooldown dropdown, scan info display
  - Bidirectional sync: Electron writes to SavedVariables file, game reads on /reload; game writes on /reload/logout, file watcher pushes to Electron
  - Existing scan logic, upload behavior, and all other UI sections untouched
- **Technologies:** Lua (WoW addon), Electron, Node.js, chokidar file watcher, IPC
- **Status:** Completed — Installer Built, Ready for Testing
- **Type:** Feature Addition
- **Installer:** `C:\Claude-Flow\output-files\ah-vault-sync-app\dist\AH & Vault Sync Setup 6.1.0.exe` (83.4 MB)
- **Version Bumps:** Addon 3.0 -> 3.1, Electron app 6.0.0 -> 6.1.0
- **Files Modified:**
  - `addons\GBankExport\GBankExport.lua` — Settings logic, new commands
  - `addons\GBankExport\GBankExport.toc` — Added SavedVariable
  - `src\main.js` — IPC handlers, settings read/write helpers
  - `src\renderer\index.html` — New GUI section
  - `src\renderer\renderer.js` — DOM bindings, IPC handlers
  - `src\renderer\styles.css` — New section styles
  - `package.json` — Version bump
- **Backup:** `C:\Claude-Flow\output-files\ah-vault-sync-app\backup\pre-gbank-settings-v6.1\`
- **Rollback Available:** Yes — copy backup files back, rebuild

---

### Quick Search - February 2026 (updated)
- **GBankExport v3.1:** Auto-scan settings, cooldown timer, Electron UI (2026-02-13)
- **AH & Vault Sync v6.1.0:** New Guild Bank Scanner section (2026-02-13)
- **Bidirectional Sync:** SavedVariables <-> Electron app settings (2026-02-13)
- **Lighthouse:** External audit from Windows, Performance 100 (2026-02-13)
- **TBC Guild Website:** Core Web Vitals excellent from external client (2026-02-13)
- **DPSMate Lite:** Addon packaged for distribution (2026-02-04)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

#### 3. AH & Vault Sync v6.2.0 — Addon Auto-Update on Upgrade
- **File:** `2026_02_13_03_15_AM_PST_AH_Vault_Sync_v6.2_Addon_Auto_Update_On_Upgrade.md`
- **Date:** February 13, 2026, 3:15 AM PST
- **Topics:** Electron app, Addon auto-update, Version comparison, TOC parsing, Startup logic, Upgrade fix
- **Key Findings:**
  - NSIS installer does NOT copy addons to WoW folder — defers to Electron app GUI
  - On upgrade, addon files were stale because browse action (which triggers install) never fires when WoW path already saved
  - Added `getAddonVersion()` to read `## Version:` from `.toc` files
  - Added `autoUpdateAddons()` that compares bundled vs installed versions on startup
  - Auto-copies all addon files if any version mismatch detected
  - Renderer logs which addons were updated on launch
- **Technologies:** Electron, Node.js, TOC file parsing, IPC
- **Status:** Completed — Installer Built, Ready for Testing
- **Type:** Bug Fix / Feature Addition
- **Installer:** `C:\Claude-Flow\output-files\ah-vault-sync-app\dist\AH & Vault Sync Setup 6.2.0.exe`
- **Version Bump:** 6.1.0 → 6.2.0
- **Files Modified:**
  - `src\main.js` — Added `getAddonVersion()`, `autoUpdateAddons()`, startup hook
  - `src\renderer\renderer.js` — Added `addons-auto-updated` IPC handler
  - `package.json` — Version bump
- **Rollback Available:** Yes — revert 3 files, rebuild

---

#### 4. AH & Vault Sync v6.2.0 — Deployed to Website with Update Notification
- **File:** `2026_02_13_03_30_AM_PST_AH_Vault_Sync_v6.2_Deployed_To_Website.md`
- **Date:** February 13, 2026, 3:30 AM PST
- **Topics:** Website deployment, Installer upload, Update notification banner, guild-bank page, tray-app-version.json
- **Key Findings:**
  - Uploaded AH-Vault-Sync-Setup-6.2.0.zip (83 MB) to server static/downloads/
  - Added dismissible update notification banner on /guild-bank page (visible to all users)
  - Banner driven by /static/tray-app-version.json — no code changes needed for future releases
  - Updated download route (tray-app.ts) to serve v6.2.0
  - Updated admin download section version in GuildStorageTabs.tsx
  - Added CSS styles matching ConsumesShop scanner-update-banner pattern
  - Banner uses localStorage to persist dismissal per version
- **Technologies:** Deno Fresh, TypeScript/TSX, CSS, SCP, SSH, systemd
- **Status:** Completed — Live
- **Type:** Deployment / Website Update
- **Server:** torreyserver (132.226.72.121)
- **Website URL:** https://tbcguild.duckdns.org/guild-bank
- **Files Modified (Server):**
  - `static/downloads/AH-Vault-Sync-Setup-6.2.0.zip` — NEW
  - `static/tray-app-version.json` — NEW
  - `routes/api/download/tray-app.ts` — Updated filename
  - `islands/GuildStorageTabs.tsx` — Banner + version bump
  - `static/styles.css` — Banner CSS appended
- **Backup:** `GuildStorageTabs.tsx.bak-pre-6.2.0`, old zip retained
- **Rollback Available:** Yes — documented in status report

---

### Quick Search - February 2026 (updated)
- **Website Deployment:** AH & Vault Sync v6.2.0 deployed to guild-bank page (2026-02-13)
- **Update Notification:** Dismissible banner on /guild-bank, driven by JSON file (2026-02-13)
- **Addon Auto-Update:** Version comparison on startup, auto-copy on mismatch (2026-02-13)
- **AH & Vault Sync v6.2.0:** Addon auto-update on upgrade fix (2026-02-13)
- **GBankExport v3.1:** Auto-scan settings, cooldown timer, Electron UI (2026-02-13)
- **AH & Vault Sync v6.1.0:** New Guild Bank Scanner section (2026-02-13)
- **Bidirectional Sync:** SavedVariables <-> Electron app settings (2026-02-13)
- **Lighthouse:** External audit from Windows, Performance 100 (2026-02-13)
- **TBC Guild Website:** Core Web Vitals excellent from external client (2026-02-13)
- **DPSMate Lite:** Addon packaged for distribution (2026-02-04)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

#### 5. Guild Bank Upload Timezone Fix — Server-Side Freshness Guard
- **File:** `2026_02_13_11_50_PM_PST_Guild_Bank_Upload_Timezone_Fix.md`
- **Date:** February 13, 2026, 11:50 PM PST
- **Topics:** Guild bank upload, Timezone bug, Server-side freshness guard, scanTime comparison, Dedup guard, Multi-timezone guild members
- **Key Findings:**
  - **ROOT CAUSE:** Server's freshness guard compared `scanTime` strings: `if (body.scanTime <= existing.scanTime)`. Since `scanTime` is local time from the uploading machine (no timezone indicator), uploads from PST users were rejected when an EST user had previously uploaded data with a future-looking timestamp.
  - EST user uploaded with `scanTime=2026-02-14 00:47:17` (their local midnight). All subsequent PST uploads (`2026-02-13 23:25:03`) were rejected because `"2026-02-13" < "2026-02-14"` in string comparison.
  - Server logs showed 7+ consecutive SKIPPED uploads after the EST timestamp was stored, including the user's latest scan with 6236 items (more complete than the stored 4307 items).
  - The Electron app (AH & Vault Sync) was working correctly throughout — file watcher detected changes, parsed FlatData, sent HTTP PUT requests. Problem was entirely server-side rejection.
- **Fix Applied:**
  - Replaced timezone-dependent `scanTime <=` comparison with exact-duplicate dedup check (`scanTime === existing.scanTime && totalItems === existing.totalItems`)
  - All new scans from any timezone are now accepted; only exact duplicates are skipped
  - Verified: PST timestamp that was previously SKIPPED → now ACCEPTED
  - Real data uploaded via Electron file watcher → ACCEPTED (6236 items, 5 tabs)
- **Technologies:** Deno Fresh, TypeScript, Deno KV, SSH, SCP, systemd
- **Status:** Completed — Fix Deployed and Verified
- **Type:** Critical Bug Fix
- **Server:** torreyserver (132.226.72.121)
- **Files Modified:**
  - `/home/opc/tbc-website/routes/api/guild-bank/inventory.ts` — Replaced freshness guard with dedup guard
- **Backup:** `/home/opc/tbc-website/routes/api/guild-bank/inventory.ts.bak-pre-tz-fix`
- **Rollback Available:** Yes — restore from `.bak-pre-tz-fix`, restart service
- **Also Noted:** GuildShopSync scheduled task still missing (price scanner, separate from guild bank)

---

### Quick Search - February 2026 (updated)
- **Guild Bank Upload Bug:** Timezone mismatch in freshness guard, PST uploads rejected (2026-02-13)
- **scanTime Comparison:** String comparison across timezones — unreliable, replaced with dedup (2026-02-13)
- **Multi-Timezone:** EST user's timestamp blocked all PST uploads (2026-02-13)
- **Server-Side Fix:** inventory.ts freshness guard → dedup guard (2026-02-13)
- **Website Deployment:** AH & Vault Sync v6.2.0 deployed to guild-bank page (2026-02-13)
- **Update Notification:** Dismissible banner on /guild-bank, driven by JSON file (2026-02-13)
- **Addon Auto-Update:** Version comparison on startup, auto-copy on mismatch (2026-02-13)
- **AH & Vault Sync v6.2.0:** Addon auto-update on upgrade fix (2026-02-13)
- **GBankExport v3.1:** Auto-scan settings, cooldown timer, Electron UI (2026-02-13)
- **AH & Vault Sync v6.1.0:** New Guild Bank Scanner section (2026-02-13)
- **Bidirectional Sync:** SavedVariables <-> Electron app settings (2026-02-13)
- **Lighthouse:** External audit from Windows, Performance 100 (2026-02-13)
- **TBC Guild Website:** Core Web Vitals excellent from external client (2026-02-13)
- **DPSMate Lite:** Addon packaged for distribution (2026-02-04)
- **GBankExport:** New TurtleWoW addon for guild bank scanning (2026-02-04)
- **Combat Log:** Skeram MC analysis, interrupt tracking (2026-02-02)
- **GuildShopSync:** Scheduled task missing, SetupTask.ps1 bug (2026-02-01)

---
*Index last updated: 2026-02-13 11:50 PM PST*

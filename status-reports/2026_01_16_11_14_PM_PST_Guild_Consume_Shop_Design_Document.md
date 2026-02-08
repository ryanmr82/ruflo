# Guild Consume Shop - Design Document Creation

## Task Summary
Created comprehensive design documentation for the TBC Guild Consume Shop system - an automated alchemy consumable pricing and order management system that integrates Discord, web interface, AUX addon, and the existing TBC Guild website infrastructure.

## Date
January 16, 2026, 11:14 PM PST

## Server
torreyserver (132.226.72.121) - TBC Guild Website

---

## What Was Accomplished

### 1. Infrastructure Assessment
- Connected to TBC Guild Linux server via SSH
- Reviewed existing Deno Fresh website architecture
- Identified existing Discord OAuth implementation (can be reused)
- Found existing item lookup API that connects to Turtle WoW Database
- Reviewed AUX addon source code and SavedVariables structure

### 2. Design Document Created
**Location:** `C:\Claude-Flow\output-files\TBC_Guild_Consume_Shop_Design_Document.md`

Comprehensive 1,300+ line document covering:
- Executive Summary
- Current State Analysis
- Requirements (13 functional, 5 non-functional)
- Item Catalog with 32+ items and acronym mappings
- System Architecture diagrams
- Database Schema (Deno KV)
- Discord Bot Design (slash commands, interactive menus)
- Web Interface Design (mockups)
- AUX Addon Modification approach
- SavedVariables Parser design
- Security & Authentication
- 7-day Deployment Plan

### 3. Architecture Page Updated
**Location:** `https://tbcguild.duckdns.org/architecture` → "Future Enhancements" tab

Replaced outdated content with new Guild Consume Shop design:
- Visual architecture diagrams
- 7-phase implementation plan
- Item catalog by category
- Discord command reference
- Database schema documentation
- UAT checklist
- Design decisions rationale

### 4. User Questions Answered
All configuration details confirmed:
- Bot Name: "Consumes Bot"
- Alchemy Channel ID: `1371230469919608882`
- Initial Admin Discord ID: `387885041348247552`
- Flask Prices: Titans 30g, others 20g
- Order Notifications: Configurable via GUI
- Item Lookup: Use existing TBC website API

---

## Files Created/Modified

### Local (Windows)
| File | Description |
|------|-------------|
| `C:\Claude-Flow\output-files\TBC_Guild_Consume_Shop_Design_Document.md` | Complete design document |
| `C:\Claude-Flow\output-files\architecture-future-enhancements.json` | Architecture page JSON |

### Server (Linux)
| File | Description |
|------|-------------|
| `/home/opc/tbc-website/static/architecture-future-enhancements.json` | Deployed architecture JSON |

---

## Commands Used

```bash
# SSH to server
ssh -i "C:\Users\ryanr\.ssh\git-key" opc@132.226.72.121

# Explore website structure
ls -la /home/opc/tbc-website/
cat /home/opc/tbc-website/routes/api/auth/discord/callback.ts
cat /home/opc/tbc-website/utils/items.ts
cat /home/opc/tbc-website/routes/api/items/lookup.ts

# Review AUX addon
cat C:\turtlewow\Interface\AddOns\aux-addon\aux-addon.toc
cat C:\turtlewow\Interface\AddOns\aux-addon\core\history.lua
cat C:\turtlewow\Interface\AddOns\aux-addon\core\scan.lua

# Deploy JSON
scp -i "C:\Users\ryanr\.ssh\git-key" architecture-future-enhancements.json opc@132.226.72.121:/home/opc/tbc-website/static/
```

---

## Key Findings

### Existing Infrastructure (Can Reuse)
1. **Discord OAuth** - Already implemented at `/routes/api/auth/discord/*`
2. **Item Lookup API** - `/routes/api/items/lookup.ts` connects to Turtle WoW DB
3. **Consumables Database** - `/utils/consumables.ts` has item categorization
4. **Deno KV** - Existing database at `/home/opc/tbc-website/data.db`

### AUX Addon Analysis
- Version: aux Turtle (Turtle WoW fork)
- SavedVariables: `aux` (account-level)
- History stores daily minimum buyout with 11 data points
- Uses weighted median for market value calculation
- Can access via `aux.core.history.value(item_key)`

### Architecture Approach
- **Companion Addon** - Create separate `GuildShopScanner` instead of modifying AUX
- **API-First** - All data flows through REST API
- **Bidirectional Sync** - Web and Discord stay in sync via shared database

---

## Item Catalog Summary

| Category | Count | Pricing |
|----------|-------|---------|
| Protection/Utility | 13 | Dynamic (10% off AH) |
| Tank/Melee | 9 | Dynamic (10% off AH) |
| Caster | 8 | Dynamic (10% off AH) |
| Concoctions | 3 | Dynamic (10% off AH) |
| Flasks | 4 | Static (G-Bank only) |
| **Total** | **37** | |

---

## Next Steps

1. **User Review** - Review design at:
   - Local: `C:\Claude-Flow\output-files\TBC_Guild_Consume_Shop_Design_Document.md`
   - Web: `https://tbcguild.duckdns.org/architecture` → "Future Enhancements" tab

2. **User Approval** - Confirm architecture, database schema, and approach

3. **Discord Bot Setup** - User needs to create Discord application at:
   https://discord.com/developers/applications

4. **Implementation** - 7-day phased rollout as documented

---

## Verification

- [x] Design document created with all sections
- [x] Architecture JSON deployed to server
- [x] User questions answered in document
- [x] Architecture page accessible at https://tbcguild.duckdns.org/architecture
- [x] Service running (tbc-website.service active)

---

## Related Documentation

- Previous: `2025_12_13_03_45_AM_UTC_TBCGuild_Architecture_Current_State_Documentation.md`
- Previous: `2025_12_13_03_50_AM_UTC_TBCGuild_SR_Plus_Future_State_Design.md`

---

## Lessons Learned

1. The TBC website already has substantial infrastructure that can be reused (Discord OAuth, item lookup, KV database)
2. AUX addon stores market history in a specific tuple/list schema that needs custom parsing
3. Creating a companion addon is safer than modifying the base AUX addon
4. The architecture page uses JSON files for content - easy to update without code changes

---

## Status
**DRAFT COMPLETE** - Awaiting user review and approval before implementation

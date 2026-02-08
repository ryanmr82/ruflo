# TBC Guild Website - SR+ Phase 1: Admin Spreadsheet UI

**Date:** December 12, 2025, 09:10 AM UTC
**Status:** Completed Successfully
**Type:** Feature Implementation
**Server:** torreyserver (132.226.72.121)

---

## Summary

Implemented Phase 1 of the SR+ (Soft Reserve Plus) system for the TBC Guild website. This phase delivers a comprehensive admin spreadsheet UI for managing SR+ credits across all raid types.

---

## Features Delivered

### 1. SR+ Admin Spreadsheet Page (`/admin/sr-plus`)

A full-featured spreadsheet-style interface for managing SR+ credits:

- **Raid Type Tabs**: Filter by MC, BWL, AQ40, AQ20, ZG, Naxxramas, Onyxia, Dragons of Nightmare, World Bosses, or All Raids
- **Search**: Search credits by player name or item name
- **Inline Editing**: Click any "Times SR'd" cell to edit directly
- **Bulk Selection**: Checkbox selection for multiple credits
- **Delete Selected**: Bulk delete selected credits
- **Export CSV**: Export all or selected credits to CSV file
- **Add Credit**: Modal form to manually add new credits
- **Stats Dashboard**: Real-time stats showing Total Credits, Players, Total SR Count, and Bonus Per SR

### 2. Settings API (`/api/sr-plus/settings`)

Configurable settings for the SR+ system:

```typescript
interface SRPlusSettings {
  bonusPerSR: number;           // Default: 20 (RP bonus per SR)
  hardReserveThreshold: number; // Default: 5 (SR count for hard reserve)
  require24hSignup: boolean;    // Require 24h advance signup
  allowPlayerSelfService: boolean; // Phase 2+ feature
  lockSRBeforeRaid: number;     // Hours before raid to lock changes
}
```

### 3. Credits API (`/api/sr-plus/credits`)

Full CRUD API for SR+ credits:

- **GET**: List credits with optional filters (raidType, search, playerName)
- **POST**: Create new credit (admin only)
- **PUT**: Update credit timesSRd value (admin only)
- **DELETE**: Remove credit (admin only)

### 4. Raid Type Mapping (`utils/raid-mapping.ts`)

Auto-detection of raid types based on item ID or name:

- Maps known items to their source raids
- Keyword-based detection for raid titles
- Supports: MC, BWL, AQ40, AQ20, ZG, NAXX, ONYXIA, EMERALD, WORLD, OTHER

---

## Files Created/Modified

| File | Location | Description |
|------|----------|-------------|
| `settings.ts` | `/home/opc/tbc-website/routes/api/sr-plus/` | Settings API endpoint |
| `credits.ts` | `/home/opc/tbc-website/routes/api/sr-plus/` | Credits CRUD API endpoint |
| `sr-plus.tsx` | `/home/opc/tbc-website/routes/admin/` | Admin spreadsheet page |
| `SRPlusSpreadsheet.tsx` | `/home/opc/tbc-website/islands/` | Interactive spreadsheet component |
| `raid-mapping.ts` | `/home/opc/tbc-website/utils/` | Raid type auto-detection utility |
| `admin.tsx` | `/home/opc/tbc-website/routes/` | Added SR+ Manager link to admin dashboard |

---

## API Endpoints

### Settings

```
GET  /api/sr-plus/settings     - Get current settings (public)
PUT  /api/sr-plus/settings     - Update settings (admin only)
```

### Credits

```
GET    /api/sr-plus/credits                    - List all credits (public)
GET    /api/sr-plus/credits?raidType=MC        - Filter by raid type
GET    /api/sr-plus/credits?search=player      - Search by player/item
POST   /api/sr-plus/credits                    - Create credit (admin only)
PUT    /api/sr-plus/credits                    - Update credit (admin only)
DELETE /api/sr-plus/credits?playerName=X&itemId=Y&raidType=Z - Delete (admin only)
```

---

## UI Screenshots (Component Structure)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SR+ Credit Manager                              [← Back to Admin]  │
│  Manage soft reserve bonus credits across all raids                 │
├─────────────────────────────────────────────────────────────────────┤
│  [All Raids] [MC] [BWL] [AQ40] [AQ20] [ZG] [NAXX] [ONY] [EMR] [WLD] │
├─────────────────────────────────────────────────────────────────────┤
│  [Search_________] [Search]           [+ Add Credit] [Export CSV]   │
├──────────┬──────────┬──────────┬──────────┐                         │
│ Total: 0 │Players: 0│ SR: 0    │Bonus: +20│                         │
├──────────┴──────────┴──────────┴──────────┴─────────────────────────┤
│  ☐ │ Player  │ Item     │ Item ID │ Raid │ Times SR'd │ Bonus │ Date│
│────┼─────────┼──────────┼─────────┼──────┼────────────┼───────┼─────│
│    │         │ No credits found. Add some or import from RaidRes.   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication

The system uses the existing cookie-based admin authentication:

- Cookie: `admin_auth=true`
- Login via: `/admin` page with password
- Read APIs (GET) are public for data display
- Write APIs (POST/PUT/DELETE) require admin authentication

---

## Verification

1. **API Endpoints**:
   - `GET https://tbcguild.duckdns.org/api/sr-plus/settings` ✓
   - `GET https://tbcguild.duckdns.org/api/sr-plus/credits` ✓

2. **Admin Page**:
   - `https://tbcguild.duckdns.org/admin/sr-plus` - 200 OK ✓
   - Renders with all raid tabs, search, buttons ✓

3. **Fresh Manifest**:
   - SRPlusSpreadsheet island registered ✓
   - admin/sr-plus route registered ✓

---

## Next Steps (Phase 2)

The design document (`2025_12_12_08_56_AM_UTC_TBCGuild_SR_Plus_System_Design_Document.md`) outlines:

1. **Phase 2**: Discord OAuth SSO Integration
   - Discord OAuth2 authentication
   - Player name linking (Discord → WoW character)
   - Session management

2. **Phase 3**: Player Self-Service Portal (`/my-sr`)
   - Players can view and manage their own SRs
   - Secure isolation (can only edit own records)

3. **Phase 4**: 24-Hour Eligibility System
   - Raid-Helper API integration
   - Automatic eligibility verification
   - Signup time tracking

---

## Notes

- The database (Deno KV) was empty after restart; credits need to be added via the admin UI
- The raid-mapping utility will auto-detect raid types when importing from RaidRes
- The bonus RP is calculated dynamically based on the settings `bonusPerSR` value

---

*Report generated: December 12, 2025, 09:10 AM UTC*
*Phase 1 of 4 Complete*

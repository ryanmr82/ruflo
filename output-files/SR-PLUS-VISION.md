# SR+ LOOT DISTRIBUTION SYSTEM
## Complete Architecture & Vision Document

---

## 1. PROBLEM STATEMENT

Traditional Soft Reserve (SR) systems have a flaw: A player who has been chasing an item for months, showing up every week, can lose to a casual player who shows up once and rolls higher. This creates frustration and doesn't reward loyalty.

**SR+ solves this by:**
- Rewarding consistent attendance
- Rewarding advance signup commitment
- Rewarding consumable usage (on progression)
- Accumulating bonuses over time for persistent item chasers
- Providing "hard reserve" protection after sustained effort

---

## 2. CORE BUSINESS RULES

### 2.1 SR+ Eligibility

```
┌─────────────────────────────────────────────────────────────┐
│                    SR+ ELIGIBILITY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROGRESSION RUNS:                                          │
│  ├── 24-hour advance signup       ✓ Required                │
│  ├── Flask usage                  ✓ Required                │
│  ├── Elixir usage                 ✓ Required                │
│  └── Consumables                  ✓ Required                │
│                                                             │
│  NON-PROGRESSION RUNS:                                      │
│  ├── 24-hour advance signup       ✓ Required                │
│  ├── Flask usage                  ✗ Not required            │
│  ├── Elixir usage                 ✗ Not required            │
│  └── Consumables                  ✗ Not required            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 SR+ Roll Formula

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLL CALCULATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FINAL ROLL = BASE ROLL + SR BONUS                          │
│                                                             │
│  Where:                                                     │
│  • Base Roll = Random 1-100                                 │
│  • SR Bonus = (Times SR'd this item) × 10                   │
│                                                             │
│  EXAMPLES:                                                  │
│  ┌──────────────┬────────────┬────────────┬───────────┐     │
│  │ Times SR'd   │ SR Bonus   │ Roll (50)  │ Final     │     │
│  ├──────────────┼────────────┼────────────┼───────────┤     │
│  │ 1st time     │ +10        │ 50         │ 60        │     │
│  │ 2nd time     │ +20        │ 50         │ 70        │     │
│  │ 3rd time     │ +30        │ 50         │ 80        │     │
│  │ 4th time     │ +40        │ 50         │ 90        │     │
│  │ 5th time     │ HARD RES   │ AUTO-WIN   │ PRIORITY  │     │
│  └──────────────┴────────────┴────────────┴───────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Hard Reserve Priority

After SR'ing the same item 4-5 times (configurable), player gets **HARD RESERVE PRIORITY**:
- Automatically wins over any other roller
- If multiple players have hard reserve on same item → highest roll among them wins

### 2.4 SR+ Credit System

```
┌─────────────────────────────────────────────────────────────┐
│                 SR+ CREDIT BURN RULES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SCENARIO                          │ CREDITS                │
│  ──────────────────────────────────┼────────────────────    │
│  Used SR+ and WON item             │ BURNED (reset to 0)    │
│  Used SR+ and LOST roll            │ KEPT (continue +10)    │
│  Did NOT use SR+ (regular roll)    │ NO CHANGE              │
│  Item disenchanted (no one needed) │ NO CHANGE              │
│                                                             │
│  PIVOT RULE:                                                │
│  • Player can change SR target anytime                      │
│  • Loses accumulated bonus on OLD item                      │
│  • Starts fresh (+10) on NEW item                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SR+ SYSTEM ARCHITECTURE                            │
└──────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   DISCORD BOT   │
                              │  (Signup Sheets)│
                              └────────┬────────┘
                                       │
                                       │ Pull signup times
                                       │ Get SR URLs
                                       ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  RAIDRES.TOP    │           │                 │           │  TURTLE WOW     │
│     API         │◄─────────►│   TBC WEBSITE   │◄─────────►│   ITEM DB       │
│                 │           │   (Linux Server)│           │                 │
│ • SR Lists      │           │                 │           │ • Item Names    │
│ • Item IDs      │           │ • SR+ Dashboard │           │ • Item Icons    │
│ • Reservations  │           │ • Admin Panel   │           │ • Item Stats    │
└─────────────────┘           │ • Player View   │           └─────────────────┘
                              │ • Analytics     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
           │ COMBAT LOGS   │  │   ROLL4       │  │  DENO KV DB   │
           │               │  │   ADDON       │  │               │
           │ • Consumables │  │               │  │ • SR+ Credits │
           │ • Attendance  │  │ • Roll Results│  │ • SR History  │
           │ • Loot Drops  │  │ • Who Won     │  │ • Attendance  │
           │ • CC/Dispels  │  │ • Item Rolled │  │ • Run Config  │
           └───────────────┘  └───────────────┘  └───────────────┘
```

---

## 4. DATA FLOW

### 4.1 Pre-Raid Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRE-RAID DATA FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  DISCORD                RAIDRES.TOP              TBC WEBSITE
     │                       │                        │
     │  1. Raid Posted       │                        │
     │  (SR URL in sheet)    │                        │
     │───────────────────────┼───────────────────────►│
     │                       │                        │
     │                       │  2. Fetch SR Data      │
     │                       │◄───────────────────────│
     │                       │                        │
     │                       │  3. Return SR List     │
     │                       │  (Players + Item IDs)  │
     │                       │───────────────────────►│
     │                       │                        │
     │                       │                        │ 4. Translate Item IDs
     │                       │                        │    via Turtle WoW DB
     │                       │                        │
     │  5. Track Signup Time │                        │
     │───────────────────────┼───────────────────────►│
     │                       │                        │
     │                       │                        │ 6. Calculate SR+
     │                       │                        │    Eligibility
     │                       │                        │    (24hr check)
```

### 4.2 During-Raid Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DURING-RAID DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

  COMBAT LOG              ROLL4 ADDON              TBC WEBSITE
     │                       │                        │
     │  1. Log Uploaded      │                        │
     │───────────────────────┼───────────────────────►│
     │                       │                        │
     │                       │                        │ 2. Parse Consumables
     │                       │                        │    (Flask/Elixir check
     │                       │                        │     for progression)
     │                       │                        │
     │                       │                        │ 3. Parse Loot Drops
     │                       │                        │    (Who received what)
     │                       │                        │
     │                       │  4. Roll Data          │
     │                       │  (if in logs)         │
     │                       │───────────────────────►│
     │                       │                        │
     │                       │                        │ 5. Match SR'd items
     │                       │                        │    to drops
```

### 4.3 Post-Raid Flow (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST-RAID ADMIN FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ADMIN                                           TBC WEBSITE
     │                                                │
     │  1. Review Loot Distribution                   │
     │───────────────────────────────────────────────►│
     │                                                │
     │  2. Mark who used SR+ on what item             │
     │───────────────────────────────────────────────►│
     │                                                │
     │  3. Mark winners (burn credits)                │
     │───────────────────────────────────────────────►│
     │                                                │
     │  4. Mark losers (keep credits, +10 next time)  │
     │───────────────────────────────────────────────►│
     │                                                │
     │  5. Handle disenchants (no credit change)      │
     │───────────────────────────────────────────────►│
     │                                                │
     │                                                │ 6. Update SR+ Database
     │                                                │    • Credits updated
     │                                                │    • History logged
```

---

## 5. DATABASE SCHEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────────┘

DENO KV KEYS:

["sr_plus", "credits", {player_name}]
├── item_id: number
├── item_name: string
├── times_srd: number           // How many times they've SR'd this item
├── bonus: number               // Current bonus (+10, +20, +30, +40)
├── hard_reserve: boolean       // True if 5+ times
└── last_updated: timestamp

["sr_plus", "history", {player_name}]
├── entries: [
│   ├── raid_id: string
│   ├── raid_date: timestamp
│   ├── item_id: number
│   ├── item_name: string
│   ├── used_sr_plus: boolean
│   ├── won: boolean
│   ├── roll_result: number
│   └── final_roll: number      // With bonus applied
│   ]

["sr_plus", "attendance", {player_name}]
├── total_raids: number
├── raids_attended: [raid_id]
├── signup_times: { raid_id: timestamp }
└── consumable_usage: { raid_id: { flasks: n, elixirs: n } }

["sr_plus", "runs", {raid_id}]
├── raid_type: string           // MC, BWL, AQ40, etc.
├── raid_date: timestamp
├── is_progression: boolean     // Admin sets this
├── sr_url: string              // RaidRes.top URL
├── loot_distributed: [
│   ├── item_id: number
│   ├── item_name: string
│   ├── winner: string
│   ├── sr_plus_used: boolean
│   ├── disenchanted: boolean
│   └── rolls: { player: roll_value }
│   ]
└── participants: [player_names]

["sr_plus", "config"]
├── hard_reserve_threshold: 5   // Times needed for hard res
├── bonus_per_sr: 10            // +10 per SR
└── signup_hours_required: 24   // Hours before raid
```

---

## 6. USER INTERFACE

### 6.1 Website Tabs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HOME  │  ANALYSIS  │  LOOT  │  SR+  │  ADMIN  │                            │
└─────────────────────────────────────────────────────────────────────────────┘
           Already      Already   NEW     NEW
           Built        Built
```

### 6.2 SR+ Dashboard (Player View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SR+ DASHBOARD                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MY SR+ STATUS                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Current SR: [Ashkandi, Greatsword of the Brotherhood]               │   │
│  │ Times SR'd: 3                                                        │   │
│  │ Current Bonus: +30                                                   │   │
│  │ Status: 2 more SRs until HARD RESERVE                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  UPCOMING RAID ELIGIBILITY                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BWL - Dec 10                                                         │   │
│  │ ├── 24hr Signup: ✓ Signed up 36 hours ago                           │   │
│  │ ├── Run Type: Progression                                            │   │
│  │ ├── Flask Required: ✓                                                │   │
│  │ └── SR+ Eligible: ✓ YES                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  MY SR HISTORY                                                              │
│  ┌──────────┬───────────────┬────────┬───────┬────────┬─────────┐          │
│  │ Date     │ Item          │ Bonus  │ Roll  │ Final  │ Result  │          │
│  ├──────────┼───────────────┼────────┼───────┼────────┼─────────┤          │
│  │ Dec 3    │ Ashkandi      │ +30    │ 72    │ 102    │ LOST    │          │
│  │ Nov 26   │ Ashkandi      │ +20    │ 45    │ 65     │ LOST    │          │
│  │ Nov 19   │ Ashkandi      │ +10    │ 88    │ 98     │ LOST    │          │
│  │ Nov 12   │ Chromatically │ +10    │ 91    │ 101    │ WON ✓   │          │
│  └──────────┴───────────────┴────────┴───────┴────────┴─────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Admin Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN PANEL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RUN MANAGEMENT                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Select Run: [BWL - Dec 3, 2025 ▼]                                   │   │
│  │                                                                      │   │
│  │ Run Type: (●) Progression  ( ) Farm                                 │   │
│  │ SR URL: https://raidres.top/events/ABC123                           │   │
│  │ [Fetch SR Data]                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LOOT DISTRIBUTION                                                          │
│  ┌──────────────────┬────────────┬───────────┬─────────┬──────────────┐    │
│  │ Item             │ Winner     │ Used SR+? │ Result  │ Action       │    │
│  ├──────────────────┼────────────┼───────────┼─────────┼──────────────┤    │
│  │ Ashkandi         │ Keenhoof   │ [✓]       │ Won     │ [Burn Cred]  │    │
│  │ Chromatic Boots  │ Whora      │ [✓]       │ Won     │ [Burn Cred]  │    │
│  │ Elementium Ore   │ -          │ -         │ DE'd    │ [No Action]  │    │
│  │ Netherwind Crown │ Motguts    │ [ ]       │ Won     │ [No Change]  │    │
│  └──────────────────┴────────────┴───────────┴─────────┴──────────────┘    │
│                                                                             │
│  SR+ OVERRIDES                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Player: [___________]  Item: [___________]                          │   │
│  │ Set Bonus: [___] | Set Hard Reserve: [✓]                            │   │
│  │ [Apply Override]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. INTEGRATION DETAILS

### 7.1 RaidRes.top API

```
Endpoint: https://raidres.top/api/events/{EVENT_ID}

Returns:
- Event reference/ID
- Raid type
- Start time
- Reservations (player names, discord IDs)
- Hard reserves (item IDs)
- Soft reserves (item IDs per player)

Usage:
1. Get SR URL from Discord signup sheet
2. Extract EVENT_ID from URL
3. Fetch API data
4. Parse player SRs and item IDs
```

### 7.2 Turtle WoW Item Database

```
Need to find:
- Item ID → Item Name mapping
- Item ID → Item Icon URL
- Item ID → Item stats/description

Potential sources:
- database.turtlecraft.gg (scraping or API)
- Existing addon databases
- Community-maintained JSON files
```

### 7.3 Discord Integration (Existing)

```
Already pulling:
- Signup sheets
- Signup timestamps
- SR URLs embedded in sheets

Need to add:
- 24-hour calculation from signup time to raid time
```

### 7.4 Combat Log Integration (Existing)

```
Already parsing:
- Consumable usage (flasks, elixirs, potions)
- Loot drops (who received what item)
- Player attendance

Need to check:
- Roll results (may or may not be in combat logs)
- If not in logs, need manual entry or Roll4 addon data
```

---

## 8. OPEN QUESTIONS

1. **Roll Data**: Are roll results in combat logs, or only available via Roll4 addon?
   - If not in logs → Admin manual entry required

2. **Item Database**: Best source for Turtle WoW item ID → name mapping?
   - database.turtlecraft.gg?
   - Existing addon?

3. **Hard Reserve Threshold**: 4 or 5 times before hard reserve kicks in?
   - Make configurable in admin settings

4. **Multiple Hard Reserves**: What if 2 players both have hard reserve on same item?
   - Highest roll among hard-reservers wins?

5. **SR Changes**: Can players change their SR mid-week?
   - Lose all accumulated bonus if they do?

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Foundation
- [ ] Item ID database integration
- [ ] SR+ data schema in Deno KV
- [ ] Basic SR+ tracking (manual entry)

### Phase 2: Automation
- [ ] RaidRes.top API integration
- [ ] Discord signup time tracking
- [ ] Consumable verification from logs

### Phase 3: Dashboard
- [ ] Player SR+ view
- [ ] Admin panel
- [ ] Run management

### Phase 4: Polish
- [ ] Roll tracking (if possible)
- [ ] Historical analytics
- [ ] Attendance reports

---

*Document Version: 1.0*
*Last Updated: December 8, 2025*

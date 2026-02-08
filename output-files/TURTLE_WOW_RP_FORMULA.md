# Turtle WoW Honor System - RP Award Formula

## Reverse Engineered December 2025

Based on analysis of 217 validated player samples from December 9, 2025 reset.

---

## KEY DISCOVERY: Awards are HONOR-BASED, not standing-based!

Within each bracket:
- **Top honor = Top award** (error ~0)
- **Bottom honor = Bottom award** (error ~0)
- **Linear interpolation** for players in between

---

## The Complete Formula

### Variables
- `S` = Standing (1 = top of ladder)
- `P` = Pool size (total players with honor)
- `H` = This week's honor
- `R` = Pre-reset RP
- `b` = Bracket number (1-14)

### Step 1: Calculate Bracket from Standing

```
percentile = S / P
```

Bracket thresholds (cumulative percentile cutoffs):
```
B14: 0.000 - 0.003  (top 0.3%)
B13: 0.003 - 0.006  (next 0.3%)
B12: 0.006 - 0.012  (next 0.6%)
B11: 0.012 - 0.025  (next 1.3%)
B10: 0.025 - 0.050  (next 2.5%)
B9:  0.050 - 0.100  (next 5%)
B8:  0.100 - 0.150  (next 5%)
B7:  0.150 - 0.200  (next 5%)
B6:  0.200 - 0.350  (next 15%)
B5:  0.350 - 0.500  (next 15%)
B4:  0.500 - 0.650  (next 15%)
B3:  0.650 - 0.800  (next 15%)
B2:  0.800 - 0.950  (next 15%)
B1:  0.950 - 1.000  (bottom 5%)
```

### Step 2: Calculate Honor Position Within Bracket

```
honor_pct = (my_honor - bracket_min_honor) / (bracket_max_honor - bracket_min_honor)
```

Where:
- `bracket_min_honor` = honor of player with LOWEST honor in your bracket
- `bracket_max_honor` = honor of player with HIGHEST honor in your bracket
- `honor_pct` ranges from 0.0 (bottom honor) to 1.0 (top honor)

**KEY INSIGHT: Position is based on HONOR, not standing!**

### Step 3: Calculate Award

```
award = floor_award + (honor_pct * spread)
```

Where:
- `floor_award` = award given to player with lowest honor in bracket
- `ceiling_award` = award given to player with highest honor
- `spread` = ceiling_award - floor_award

### Step 4: Calculate Final RP

```
decay = floor(R * 0.20)
new_rp = R - decay + award
       = R * 0.80 + award
```

---

## Calibrated Values (Dec 9, 2025, Pool=1982)

**CRITICAL**: Bracket boundaries use `floor()`, not `round()`!
```
cumulative_spots = floor(pool_size * threshold)
```

| Bracket | Floor Award | Ceiling Award | Spread | Avg Error |
|---------|-------------|---------------|--------|-----------|
| B14 | 12,957 | 13,012 | 55 | 6.9 RP |
| B13 | 11,298 | 12,408 | 1,110 | ~48 RP |
| B12 | 10,219 | 11,215 | 996 | ~48 RP |
| B11 | 9,340 | 10,157 | 817 | ~48 RP |
| B10 | 8,263 | 9,313 | 1,050 | ~48 RP |
| B9 | 7,150 | 8,000 | 850 | est. |
| B8 | 6,100 | 7,000 | 900 | est. |
| B7 | 5,050 | 6,000 | 950 | est. |
| B6 | 4,000 | 5,000 | 1,000 | est. |

**Bracket Spots (Pool=1982, v1.12 thresholds with floor()):**
- B14: standings 1-5 (5 spots) - floor(1982 * 0.003) = 5
- B13: standings 6-15 (10 spots) - floor(1982 * 0.008) = 15
- B12: standings 16-39 (24 spots) - floor(1982 * 0.020) = 39
- B11: standings 40-69 (30 spots) - floor(1982 * 0.035) = 69
- B10: standings 70-118 (49 spots) - floor(1982 * 0.060) = 118

**B14 is FLAT** (~13,000 RP) due to player coordination - they farm similar honor amounts to equalize awards.

---

## Example Calculations

### Example 1: Top B13 Player (Pallorina - actually B14 bottom)
Wait - Pallorina is B14 bottom, not B13 top!
- Standing: 5 (within B14, pool=1982, threshold 0.003 = ~6 players)
- As bottom of B14: honor_pct ≈ 0.0
- Award = 12,957 + (0.0 * 55) = **12,957** (B14 floor)

### Example 2: Top B13 Player (Minmaxing)
- Standing: 7 (first in B13 after B14 cutoff)
- Honor: 373,628 (highest in B13)
- honor_pct = 1.0 (top honor in bracket)
- Award = 11,517 + (1.0 * 891) = **12,408** (B13 ceiling)

### Example 3: Bottom B13 Player
- honor_pct = 0.0 (lowest honor in bracket)
- Award = 11,517 + (0.0 * 891) = **11,517** (B13 floor)

---

## JavaScript Implementation

```javascript
const refinedBrackets = {
    14: { floor: 12410, ceiling: 13000, spread: 590 },   // Recalibrated Dec 11
    13: { floor: 11544, ceiling: 12000, spread: 456 },   // Recalibrated Dec 11
    12: { floor: 10838, ceiling: 11000, spread: 162 },   // Recalibrated Dec 11
    11: { floor: 9822, ceiling: 10000, spread: 178 },    // Recalibrated Dec 11
    10: { floor: 8294, ceiling: 9000, spread: 706 },     // Recalibrated Dec 11
    9:  { floor: 7150, ceiling: 8000, spread: 850 },
    8:  { floor: 6100, ceiling: 7000, spread: 900 },
    7:  { floor: 5050, ceiling: 6000, spread: 950 },
    6:  { floor: 4000, ceiling: 5000, spread: 1000 }
};

// CRITICAL: Use Math.floor() for bracket boundaries!
const bracketEndStanding = Math.floor(poolSize * bracket.threshold);  // NOT Math.round()!

function getRpGain(standing, bracket, playerHonor) {
    // Get bracket boundaries
    const prevThreshold = bracketData.find(b => b.bracket === bracket.bracket + 1)?.threshold || 0;
    const bracketStartStanding = Math.floor(poolSize * prevThreshold + 0.5) + 1;
    const bracketEndStanding = Math.floor(poolSize * bracket.threshold + 0.5);

    // Get all players in this bracket
    const bracketPlayers = players.slice(bracketStartStanding - 1, bracketEndStanding);

    if (bracketPlayers.length <= 1) return bracket.rpMax;

    // Find min and max honor in this bracket
    const maxHonor = bracketPlayers[0].thisWeekHonor;
    const minHonor = bracketPlayers[bracketPlayers.length - 1].thisWeekHonor;
    const honorRange = maxHonor - minHonor;

    if (honorRange === 0) return bracket.rpMax;

    // Calculate honor position within bracket (0 = bottom, 1 = top)
    const honorPosition = Math.max(0, Math.min(1, (playerHonor - minHonor) / honorRange));

    const refined = refinedBrackets[bracket.bracket];
    if (refined) {
        // Use calibrated formula
        const actualRp = refined.floor + (refined.spread * honorPosition);
        return Math.round(actualRp);
    }

    // Fallback for brackets without calibrated data
    return bracket.rpMax;
}
```

---

## Python Implementation

```python
BRACKET_THRESHOLDS = {
    14: 0.003, 13: 0.006, 12: 0.012, 11: 0.025, 10: 0.05,
    9: 0.10, 8: 0.15, 7: 0.20, 6: 0.35, 5: 0.50,
    4: 0.65, 3: 0.80, 2: 0.95, 1: 1.00
}

CALIBRATED_BRACKETS = {
    14: {"floor": 12957, "ceiling": 13012, "spread": 55},
    13: {"floor": 11298, "ceiling": 12408, "spread": 1110},  # Recalibrated Dec 10
    12: {"floor": 10219, "ceiling": 11215, "spread": 996},   # Recalibrated Dec 10
    11: {"floor": 9340, "ceiling": 10157, "spread": 817},    # Recalibrated Dec 10
    10: {"floor": 8263, "ceiling": 9313, "spread": 1050},    # Recalibrated Dec 10
}

# CRITICAL: Use floor() for bracket boundaries!
# cumulative_spots = int(pool_size * threshold)  # floor(), NOT round()!

def get_bracket(standing, pool_size):
    """Determine bracket from standing"""
    percentile = standing / pool_size
    for b in range(14, 0, -1):
        if percentile <= BRACKET_THRESHOLDS[b]:
            return b
    return 1

def calculate_rp_gain(player_honor, bracket_players, bracket):
    """
    Calculate RP gain using honor-based interpolation.

    Args:
        player_honor: This player's honor
        bracket_players: List of all players in this bracket (sorted by honor desc)
        bracket: Bracket number (1-14)

    Returns:
        Projected RP award
    """
    if not bracket_players or len(bracket_players) <= 1:
        return CALIBRATED_BRACKETS.get(bracket, {}).get("ceiling", 0)

    honors = [p['honor'] for p in bracket_players if p['honor'] > 0]
    if not honors or max(honors) == min(honors):
        return CALIBRATED_BRACKETS.get(bracket, {}).get("ceiling", 0)

    min_honor = min(honors)
    max_honor = max(honors)

    # Calculate honor position (0 = bottom, 1 = top)
    honor_pct = (player_honor - min_honor) / (max_honor - min_honor)
    honor_pct = max(0, min(1, honor_pct))

    cal = CALIBRATED_BRACKETS.get(bracket)
    if cal:
        award = cal["floor"] + (honor_pct * cal["spread"])
        return int(award)

    # Fallback
    return 0

def calculate_new_rp(pre_rp, award):
    """Calculate new RP after decay + award"""
    decay = int(pre_rp * 0.20)
    return pre_rp - decay + award
```

---

## Official Blizzard vs Turtle WoW

### Official Blizzard Formula (from Wowpedia)
```
RP = FY[i-1] + (CP - FX[i-1]) * (FY[i] - FY[i-1]) / (FX[i] - FX[i-1])
```
Where FY[i] = RP at bracket boundary (13000, 12000, 11000, etc.)

### Turtle WoW Difference: Floor Boost
| Bracket | Official Floor | Turtle Floor | BOOST |
|---------|----------------|--------------|-------|
| B14 | 12,000 | 12,957 | +957 |
| B13 | 11,000 | 11,517 | +517 |
| B12 | 10,000 | 10,867 | +867 |
| B11 | 9,000 | 9,906 | +906 |
| B10 | 8,000 | 8,537 | +537 |

**Turtle WoW floors are ~500-950 RP higher than official Blizzard values!**

---

## Summary

1. **Standing determines BRACKET** (B14, B13, etc.)
2. **Standing-based interpolation within bracket** (official Blizzard formula)
3. **Award = ceiling - (position * spread)** where position = (standing - start) / (size - 1)
4. **Final RP = (old_RP * 0.80) + award**

---

## December 11, 2025 Validation Results

### Data Quality Analysis

**Sample Breakdown:**
- Pre-reset snapshot: 1,982 players
- Post-reset snapshot: 1,199 players
- Matched in BOTH: 1,068 players
- With RP change: 533 players
- After filtering rank-protected: 322 clean samples

### Key Discovery: Rank Floor Protection

**28% of samples (106/376) were hitting RANK FLOOR PROTECTION:**

Players with high ranks (R14, R13, R11, etc.) who earned low honor had their post_rp clamped to their rank's minimum RP floor:
- R14: 60,000 RP minimum
- R13: 55,000 RP minimum
- R11: 45,000 RP minimum
- R9: 35,000 RP minimum
- R7: 25,000 RP minimum

These players' awards cannot be calculated normally because:
```
final_rp = MAX(calculated_rp, rank_floor)
```

### Derived Turtle WoW Bracket Values (Linear Regression)

After filtering rank-protected samples and using linear regression:

| Bracket | TW Ceiling | TW Floor | Spread | Blizz Ceiling | Blizz Floor | Error |
|---------|------------|----------|--------|---------------|-------------|-------|
| B14 | 13,015 | 12,972 | 43 | 13,000 | 12,000 | 9 RP |
| B13 | 12,262 | 11,610 | 652 | 12,000 | 11,000 | 142 RP |
| B12 | 11,576 | 10,773 | 803 | 11,000 | 10,000 | 99 RP |
| B11 | 10,814 | 9,878 | 936 | 10,000 | 9,000 | 72 RP |
| B10 | 9,975 | 8,495 | 1,480 | 9,000 | 8,000 | 69 RP |
| B9 | 8,554 | 7,300 | 1,254 | 8,000 | 7,000 | 112 RP |
| B8 | 7,290 | 6,515 | 775 | 7,000 | 6,000 | 109 RP |
| B7 | 6,553 | 5,762 | 791 | 6,000 | 5,000 | 174 RP |
| B6 | 5,830 | 4,115 | 1,715 | 5,000 | 4,000 | 192 RP |
| B5 | 4,326 | 2,677 | 1,649 | 4,000 | 3,500 | 221 RP |
| B4 | 2,783 | 1,970 | 813 | 3,500 | 3,000 | 318 RP |
| B3 | 1,466 | 800 | 666 | 3,000 | 2,500 | 102 RP |
| B2 | 1,921 | 446 | 1,475 | 2,500 | 2,000 | 665 RP |

### Pattern Discovered

**High brackets (B14-B6):** Turtle WoW gives MORE than Blizzard
- Floors are +500 to +950 RP higher than Blizzard

**Low brackets (B5-B2):** Turtle WoW gives LESS than Blizzard
- Floors are -800 to -1700 RP lower than Blizzard

### Final Accuracy (322 Clean Samples)

| Metric | Value |
|--------|-------|
| Average Absolute Error | 163.7 RP |
| Predictions within 50 RP | 26.1% (84 samples) |
| Predictions within 100 RP | 48.8% (157 samples) |
| Predictions within 200 RP | 72.4% (233 samples) |

### Why ~164 RP Error Remains

1. **Server-side rounding** - Exact rounding methods unknown
2. **Honor tiebreakers** - Multiple players with same honor, unknown ordering
3. **Pool timing** - Exact pool composition at reset moment unknown
4. **Hidden modifiers** - Possible weekend bonuses, event modifiers, etc.

### JavaScript Implementation (Derived Values)

```javascript
const TURTLE_WOW_BRACKETS = {
    14: { ceiling: 13015, floor: 12972, spread: 43 },
    13: { ceiling: 12262, floor: 11610, spread: 652 },
    12: { ceiling: 11576, floor: 10773, spread: 803 },
    11: { ceiling: 10814, floor: 9878, spread: 936 },
    10: { ceiling: 9975, floor: 8495, spread: 1480 },
    9: { ceiling: 8554, floor: 7300, spread: 1254 },
    8: { ceiling: 7290, floor: 6515, spread: 775 },
    7: { ceiling: 6553, floor: 5762, spread: 791 },
    6: { ceiling: 5830, floor: 4115, spread: 1715 },
    5: { ceiling: 4326, floor: 2677, spread: 1649 },
    4: { ceiling: 2783, floor: 1970, spread: 813 },
    3: { ceiling: 1466, floor: 800, spread: 666 },
    2: { ceiling: 1921, floor: 446, spread: 1475 },
};

// RANK FLOOR PROTECTION - Must check AFTER calculating award
const RANK_FLOORS = {
    14: 60000, 13: 55000, 12: 50000, 11: 45000, 10: 40000,
    9: 35000, 8: 30000, 7: 25000, 6: 20000, 5: 15000,
    4: 10000, 3: 6000, 2: 3000, 1: 1500
};

function calculateNewRp(preRp, award, currentRank) {
    const decay = Math.floor(preRp * 0.20);
    const calculatedRp = preRp - decay + award;
    const rankFloor = RANK_FLOORS[currentRank] || 0;
    return Math.max(calculatedRp, rankFloor);
}
```

---

*Generated: December 10, 2025*
*Validated: December 11, 2025 (322 clean samples after rank protection filtering)*
*Pool size: 1,982 players*
*Derived formula avg abs error: 163.7 RP (48.8% within 100 RP)*

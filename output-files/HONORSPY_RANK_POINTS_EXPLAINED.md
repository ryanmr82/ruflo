# HonorSpy Rank Points Explanation

## ❓ What Are Rank Points (RP)?

**Rank Points (RP) is NOT your weekly gain** - it's your **total accumulated rank points** showing your absolute position in the PvP ranking system.

---

## 📊 Understanding The Numbers

### Rank Points (RP) - TOTAL Position
- Shows your cumulative rank points
- Calculated from: `Current Rank` + `Rank Bar Progress`
- Example: Rank 8 at 45% = ~32,500 RP

**Formula:**
```lua
Rank 3+: (rank - 2) * 5000 + rankProgress * 5000
Rank 2:  rankProgress * 3000 + 2000
Rank 0-1: 0
```

### Rank Bar Progress - Visual Indicator
- Shows percentage toward next rank (0-100%)
- This IS what "moves per week" based on your bracket
- Example: Start week at 45%, end week at 62% = 17% gain

---

## 🎯 What You See In HonorSpy Now

When you open `/honorspy show`, you'll see **YOUR STATS** at the top:

```
═══ YOUR STATS ═══
Rank 8                    Bar: 45%
Rank Points:              32,500 RP
Standing:                 #127 (Bracket 3)
This Week Honor:          450,000
Last Week Honor:          380,000
═════════════════════════
```

### What Each Stat Means:

**Rank 8**
- Your current PvP rank (0-14)

**Bar: 45%**
- ✅ THIS is what moves each week!
- Shows progress toward Rank 9
- If you're Bracket 3 this week, you'll gain ~5-7% (approx)

**Rank Points: 32,500 RP**
- Total accumulated RP (absolute position)
- Used for comparing positions, not weekly gains

**Standing: #127 (Bracket 3)**
- Your position out of all players (#127)
- Your bracket (1-14) which determines RP gain/loss
- Bracket 1 = Most gain, Bracket 14 = Most loss

**This Week Honor: 450,000**
- Honor you've earned this week
- Determines your standing/bracket

**Last Week Honor: 380,000**
- Honor from previous week (for comparison)

---

## 📈 How Rank Bar Moves Per Week

Your rank bar percentage changes based on **your bracket**:

| Bracket | Standing % | Weekly RP Gain/Loss | Bar Movement (Rank 8) |
|---------|-----------|---------------------|----------------------|
| 1       | Top 1%    | +13,000 RP          | +260% (rank up fast) |
| 2       | 1-3%      | +10,000 RP          | +200% (rank up)      |
| 3       | 3-6%      | +7,000 RP           | +140% (good progress)|
| 4       | 6-10%     | +5,000 RP           | +100% (1 full rank)  |
| 5       | 10-15%    | +4,000 RP           | +80% (decent)        |
| 6       | 15-21%    | +3,000 RP           | +60% (slow progress) |
| 7       | 21-28%    | +2,000 RP           | +40% (minimal)       |
| 8       | 28-36%    | +1,000 RP           | +20% (very slow)     |
| 9       | 36-45%    | +500 RP             | +10% (barely moving) |
| 10      | 45-55%    | 0 RP                | 0% (no change)       |
| 11      | 55-66%    | -500 RP             | -10% (rank decay)    |
| 12      | 66-78%    | -1,000 RP           | -20% (losing rank)   |
| 13      | 78-91%    | -2,000 RP           | -40% (fast decay)    |
| 14      | 91-100%   | -3,000 RP           | -60% (deranking)     |

**Example:**
- You're Rank 8 at 45% (32,500 RP)
- You get Bracket 3 this week (+7,000 RP)
- Next week: Rank 8 at 185% → Rank 9 at 85%
- Your bar moved: 45% → 85% (in new rank) = Full rank gained!

---

## 🧮 Calculating Your Weekly Progress

### Method 1: Track Bar Percentage
1. Note your rank bar % at weekly reset (Tuesday 10AM UTC)
2. Note your rank bar % next week
3. Difference = your weekly gain

**Example:**
- Start: Rank 8 at 45%
- End: Rank 8 at 62%
- Gain: 17%

### Method 2: Track Rank Points
1. Note your RP at weekly reset
2. Note your RP next week
3. Difference = your weekly RP gain

**Example:**
- Start: 32,500 RP
- End: 33,350 RP
- Gain: 850 RP (~17% of 5000 RP for Rank 8)

---

## 🎯 Using HonorSpy To Track Progress

### Weekly Routine:
1. **Tuesday Morning (Reset)**
   - Open `/honorspy show`
   - Screenshot or write down:
     - Your rank bar %
     - Your RP
     - Your standing/bracket

2. **During The Week**
   - Farm honor to improve standing
   - Check your position periodically
   - Aim for higher bracket

3. **Monday Night (Before Reset)**
   - Check final standing
   - Predict next week's rank bar movement
   - Compare to previous week

---

## 📊 What The Bar Percentage Means

Each rank requires different RP to fill the bar:

| Rank | RP Required For Full Bar | Each % = RP |
|------|-------------------------|-------------|
| 2    | 3,000                   | 30 RP       |
| 3    | 5,000                   | 50 RP       |
| 4    | 5,000                   | 50 RP       |
| 5    | 5,000                   | 50 RP       |
| 6    | 5,000                   | 50 RP       |
| 7    | 5,000                   | 50 RP       |
| 8    | 5,000                   | 50 RP       |
| 9    | 5,000                   | 50 RP       |
| 10   | 5,000                   | 50 RP       |
| 11   | 5,000                   | 50 RP       |
| 12   | 5,000                   | 50 RP       |
| 13   | 5,000                   | 50 RP       |

**Example:**
- Rank 8 at 45% = 32,500 RP (30,000 base + 2,250 progress)
- Each 1% = 50 RP at Rank 8
- To reach 46%: Need 50 more RP
- To reach Rank 9 (100%): Need 2,750 more RP

---

## 🎯 Practical Examples

### Example 1: Bracket 3 Player
**Starting Position:**
- Rank 8 at 45% (32,500 RP)
- Standing: #127 (Bracket 3)

**Weekly Gain (Bracket 3):**
- +7,000 RP

**Next Week:**
- 32,500 + 7,000 = 39,500 RP
- Rank 9 at 85% (35,000 base + 4,250 progress)
- **Bar moved from 45% to full rank + 85% = Ranked up!**

---

### Example 2: Bracket 7 Player
**Starting Position:**
- Rank 8 at 45% (32,500 RP)
- Standing: #523 (Bracket 7)

**Weekly Gain (Bracket 7):**
- +2,000 RP

**Next Week:**
- 32,500 + 2,000 = 34,500 RP
- Rank 8 at 85% (30,000 base + 4,250 progress)
- **Bar moved from 45% to 85% = +40% progress**

---

### Example 3: Bracket 12 Player
**Starting Position:**
- Rank 8 at 45% (32,500 RP)
- Standing: #1,823 (Bracket 12)

**Weekly Loss (Bracket 12):**
- -1,000 RP

**Next Week:**
- 32,500 - 1,000 = 31,500 RP
- Rank 8 at 25% (30,000 base + 1,250 progress)
- **Bar moved from 45% to 25% = -20% decay**

---

## 💡 Key Takeaways

1. **Rank Points (RP)** = Total accumulated position (like total XP)
2. **Rank Bar %** = Progress toward next rank (what moves weekly)
3. **Bracket** = Determines weekly RP gain/loss
4. **Standing** = Your position (#) determines bracket

**To track weekly progress:**
- Watch your **rank bar %**, not your RP
- RP is useful for comparing absolute positions
- Bar % shows actual visible progress

**Your HonorSpy display now shows:**
- ✅ Current rank
- ✅ Current bar percentage (what moves!)
- ✅ Total RP (for comparison)
- ✅ Your standing and bracket
- ✅ This week's honor (determines next standing)

---

## 🔍 Advanced: Predicting Next Week

**Formula to predict bar movement:**
1. Check your current standing (#)
2. Calculate your bracket (1-14)
3. Look up bracket RP gain from table above
4. Divide by 5000 (RP per rank at Rank 8) = % gain
5. Add to current bar %

**Example:**
- Standing: #127
- Total pool: 2,500 players
- 127/2500 = 5.08% → Bracket 3
- Bracket 3 = +7,000 RP
- 7,000 ÷ 5,000 = 1.4 ranks = 140% gain
- Current: 45%
- Next week: 45% + 140% = 185% = Rank up + 85% in new rank

---

**Created:** November 4, 2025
**Updated With:** Personal stats display showing rank bar %
**See Also:** HONORSPY_MODIFICATIONS_SUMMARY_2025_11_04.md

---

**END OF EXPLANATION**

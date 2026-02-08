# Chromaggus Attempt #2 - Klifford Death Analysis
**Date:** October 24, 2025
**Time of Death:** 18:25:02.356
**Victim:** Klifford (Main Tank, Druid)

---

## EXECUTIVE SUMMARY

**CAUSE OF DEATH:** Unavoidable burst damage during heavy healing
- **Total Burst:** 7,686 fire damage in 0.021 seconds
- **Healing Status:** Receiving continuous heavy heals right up to death
- **Frenzy Status:** NOT active (hunters did their job correctly)
- **Bronze Impact:** One healer (Zogrug) stunned for final 9 seconds

**CONCLUSION:** This was NOT a healing failure. Klifford died from a massive Incinerate crit (6195 damage) + Ignite Flesh DoT tick (1491 damage) while being actively healed by 4+ healers. The burst damage exceeded what any heal-over-time or instant cast could prevent.

---

## DEATH EVENT BREAKDOWN

```
18:25:02.230  Frenzied Regeneration heals Klifford for 56 HP
18:25:02.230  Frenzied Regeneration fades from Klifford
18:25:02.302  Zuella's Flash Heal heals Klifford for 753 HP
18:25:02.335  Klifford suffers 1,491 Fire damage (Ignite Flesh DoT)
18:25:02.356  Chromaggus Incinerate hits for 6,195 Fire (2,064 resisted)
18:25:02.356  Klifford dies
18:25:02.371  Chromaggus melee hits for 1,571 (posthumous)
```

**Analysis:**
- Last heal landed 0.054 seconds before death (Zuella's Flash Heal: 753 HP)
- Killing blow: 6,195 fire damage (after 2,064 resistance!)
- Combined with Ignite Flesh DoT: 7,686 total damage in 0.021 seconds
- This burst is essentially unsurvivable without pre-shielding or major cooldowns

---

## HEALING TIMELINE (Final 15 Seconds)

### 18:24:47-18:24:50 (Early Window)
```
18:24:47.069  Zuella - Aegis Heal: 83 HP
18:24:49.597  Zogrug - Chain Heal CRIT: 1,012 HP
18:24:50.262  Zuella - Aegis Heal: 83 HP
```

### 18:24:51-18:24:55 (Mid Window - Peak Healing)
```
18:24:51.679  Zuella - Heal: 854 HP
18:24:53.076  Healsforblow - Flash Heal: 761 HP
18:24:53.247  Klifford - Frenzied Regen: 295 HP
18:24:53.429  Ipushstairs - Lesser Healing Wave: 730 HP
18:24:53.957  Zuella - Heal: 859 HP
18:24:54.237  Klifford - Frenzied Regen: 295 HP
18:24:54.847  Healsforblow - Flash Heal: 822 HP
18:24:55.059  Ipushstairs - Lesser Healing Wave: 759 HP
18:24:55.242  Klifford - Frenzied Regen: 295 HP
18:24:55.307  Zuella - Flash Heal: 760 HP
18:24:55.559  Zogrug - Healing Wave: 1,464 HP  ← LAST HEAL FROM ZOGRUG
```

### 18:24:56-18:25:00 (Late Window - Continued Heavy Healing)
```
18:24:56.229  Klifford - Frenzied Regen: 295 HP
18:24:56.589  Ipushstairs - Lesser Healing Wave: 725 HP
18:24:56.657  Healsforblow - Flash Heal: 826 HP
18:24:56.909  Zuella - Flash Heal: 762 HP
18:24:57.237  Klifford - Frenzied Regen: 295 HP
18:24:58.256  Klifford - Frenzied Regen: 198 HP
18:24:58.429  Healsforblow - Flash Heal: 817 HP
18:24:58.429  Zuella - Flash Heal CRIT: 1,102 HP
18:24:58.750  Ipushstairs - Lesser Healing Wave CRIT: 1,155 HP
18:24:58.783  Fieldwalker - Lesser Healing Wave: 782 HP
18:24:59.244  Klifford - Frenzied Regen: 295 HP
```

### 18:25:00-18:25:02 (Final Seconds)
```
18:25:00.238  Klifford - Frenzied Regen: 275 HP
18:25:00.347  Ipushstairs - Lesser Healing Wave CRIT: 1,122 HP
18:25:01.231  Klifford - Frenzied Regen: 295 HP
18:25:02.230  Klifford - Frenzied Regen: 56 HP (final tick)
18:25:02.302  Zuella - Flash Heal: 753 HP  ← FINAL HEAL (0.054s before death)
```

**TOTAL HEALING RECEIVED (15 seconds):** ~20,000+ HP

**ACTIVE HEALERS:**
- **Zuella** (Priest): 9 heals including 1 crit (7,571 HP)
- **Ipushstairs** (Shaman): 6 heals including 2 crits (5,368 HP)
- **Healsforblow** (Priest): 5 heals (4,063 HP)
- **Fieldwalker** (Shaman): 1 heal (782 HP)
- **Zogrug** (Shaman): 2 heals (2,476 HP) - **STUNNED by Bronze at 18:24:53.141**
- **Klifford** (Self): 11 Frenzied Regen ticks (3,084 HP)

---

## DAMAGE TIMELINE (Final 15 Seconds)

```
18:24:47.069  Chromaggus melee: 979 (crushing)
18:24:47.389  Ignite Flesh DoT: 745
18:24:50.262  Chromaggus melee: 1,836
18:24:50.375  Ignite Flesh DoT: 745
18:24:50.620  Brood Affliction Green: 230
18:24:51.898  Chromaggus melee: 1,681
18:24:53.356  Ignite Flesh DoT: 745
18:24:53.506  Chromaggus melee: 2,709 (crushing)
18:24:55.098  Chromaggus melee: 2,370 (crushing)
18:24:55.661  Brood Affliction Green: 173 (57 resisted)
18:24:56.335  Ignite Flesh DoT: 745
18:24:56.711  Chromaggus melee: 1,763
18:24:58.279  Chromaggus melee: 2,815 (crushing)
18:24:59.353  Ignite Flesh DoT: 0 (745 absorbed by shield)
18:24:59.955  Chromaggus melee: 817 (679 absorbed by shield)
18:25:00.634  Brood Affliction Green: 230
18:25:02.335  Ignite Flesh DoT: 1,491  ← SETUP DAMAGE
18:25:02.356  Incinerate: 6,195 (2,064 resisted)  ← KILLING BLOW
```

**TOTAL DAMAGE TAKEN (15 seconds):** ~25,000+ damage
**DAMAGE vs HEALING:** Damage slightly exceeded healing, but the killing blow was a single massive burst

---

## CHROMAGGUS FRENZY ANALYSIS

### Timeline:
```
18:24:47.636  Chromaggus gains Frenzy (1)
18:24:48.593  Bambow casts Tranquilizing Shot  ← REMOVED FRENZY
[gap of 14 seconds with NO Frenzy]
18:25:02.659  Chromaggus gains Frenzy (1)  ← 0.3 SECONDS AFTER DEATH
```

**VERDICT:** ✅ **HUNTERS DID THEIR JOB CORRECTLY**
- Frenzy was NOT active during Klifford's death
- Last Frenzy removed at 18:24:48.593 (14 seconds before death)
- Next Frenzy gained at 18:25:02.659 (0.3 seconds AFTER death)
- Hunters: Bambow and Orkbob maintained proper dispel rotation

---

## BRONZE AFFLICTION ANALYSIS

### Healer Bronze Status:

**Zogrug (Shaman):**
```
18:24:53.141  Afflicted by Bronze
[NO FADE EVENT BEFORE DEATH]
Duration: 9.2+ seconds (still active at death)
Impact: HIGH - Lost 9 seconds of healing from a main tank healer
Last heal before stun: 18:24:55.559 (Healing Wave 1,464 HP)
```

**Fieldwalker (Shaman):**
```
18:24:53.181  Afflicted by Bronze
18:24:59.991  Used Hourglass Sand to clear Bronze
Duration: 6.8 seconds stunned
Impact: MEDIUM - Cleared 2.3 seconds before death, cast 1 heal at 18:24:58.783
```

**Healsforblow (Priest):**
```
18:24:40.181  Bronze faded (cleared before this window)
Status: CLEAR - Active throughout final 15 seconds
```

**Klifford (Tank - Self):**
```
18:24:53.181  Afflicted by Bronze
18:24:55.692  Used Hourglass Sand to clear Bronze
18:24:55.699  Bronze faded
Duration: 2.5 seconds stunned
Impact: MEDIUM - Cleared quickly, resumed tanking
```

### Bronze Impact Assessment:

**Was healing reduced due to Bronze?**
- YES - Zogrug was stunned for the final 9 seconds and could not heal
- Fieldwalker was stunned for 6.8 seconds but cleared and got 1 heal off before death
- 3 other healers (Zuella, Healsforblow, Ipushstairs) were NOT stunned and healing heavily

**Did Bronze cause the death?**
- NO - Even with Zogrug stunned, Klifford received 15+ heals in the final 10 seconds
- The killing blow (Incinerate 6,195 + DoT 1,491) was a 7,686 burst that no amount of healing could prevent
- Bronze contributed to overall pressure but was not the direct cause

---

## RAID COMPOSITION (Identified from Logs)

### Healers:
- **Zuella** (Priest) - Heavy Flash Heal spam
- **Healsforblow** (Priest) - Flash Heal rotation
- **Zogrug** (Shaman) - Chain Heal + Healing Wave (stunned by Bronze)
- **Fieldwalker** (Shaman) - Lesser Healing Wave
- **Ipushstairs** (Shaman) - Lesser Healing Wave with high crit rate

### Hunters (Tranq Shot Rotation):
- **Bambow** - Primary tranq shot (8 casts during attempt)
- **Orkbob** - Secondary tranq shot (3 casts during attempt)

### Tank:
- **Klifford** (Druid) - Main tank with Frenzied Regeneration active

---

## WHAT COULD HAVE PREVENTED THIS DEATH?

### 1. Power Word: Shield Pre-Cast
- Healsforblow used shield earlier at 18:24:59.353 (absorbed 1,424 damage)
- A fresh shield at 18:25:02 could have absorbed 1,400+ of the 7,686 burst
- **Verdict:** Might have helped but unlikely to save from 6,195 Incinerate

### 2. Major Defensive Cooldowns
- Bark Skin (if available)
- Last Stand (if Klifford had engineering trinket)
- Shield Wall equivalent for druids
- **Verdict:** Hard to predict when to use for random Incinerate

### 3. Fire Resistance Gear/Buffs
- Klifford resisted 2,064 of the Incinerate (25% resist)
- More fire resistance could reduce Incinerate to ~4,000-5,000
- **Verdict:** Most viable long-term solution

### 4. Healer Coordination on Zogrug Bronze
- Zogrug was stunned for 9 seconds without clearing Bronze
- Could have used Hourglass Sand immediately like Fieldwalker/Klifford did
- **Verdict:** Minor improvement, but healing was already heavy from other healers

---

## FINAL VERDICT

### Primary Cause of Death:
**Unavoidable burst damage during active healing window**

### Contributing Factors:
1. **Major:** Incinerate crit for 6,195 fire damage (even after 2,064 resistance)
2. **Minor:** Zogrug stunned by Bronze for 9 seconds (reduced healing throughput)
3. **Minor:** Ignite Flesh DoT ticking for 1,491 at exact moment of Incinerate

### What Went Right:
✅ Hunters removed Frenzy perfectly (14-second gap with no Frenzy)
✅ 4+ healers actively healing throughout death window
✅ Klifford cleared his own Bronze quickly with Hourglass Sand
✅ Tank received 20,000+ healing in final 15 seconds

### What Could Improve:
⚠️ Zogrug should use Hourglass Sand immediately when hit by Bronze (was stunned 9+ seconds)
⚠️ Consider more fire resistance gear for tank (Chromaggus hits hard with fire)
⚠️ Pre-cast Power Word: Shield rotation to absorb burst damage

---

## CONCLUSION

**This was NOT a healing failure.** Klifford received continuous heavy healing from 4+ healers right up until death. The killing blow was a massive Incinerate (6,195 damage) combined with an Ignite Flesh DoT tick (1,491 damage) for a total of 7,686 fire damage in 0.021 seconds.

Even with Zogrug stunned by Bronze Affliction, the remaining healers maintained excellent throughput with multiple critical heals and a final Flash Heal landing just 0.054 seconds before death.

The hunters correctly removed Frenzy 14 seconds before death, so the damage was not amplified.

**Recommendation:** Increase fire resistance on tank gear and maintain Power Word: Shield rotation to absorb random Incinerate bursts. This was simply bad RNG timing on a high-damage breath ability.

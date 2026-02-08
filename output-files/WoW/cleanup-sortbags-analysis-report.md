# Cleanup/SortBags Addon Analysis Report
*Date: January 14, 2025*
*For: Turtle WoW 1.17.2 with VanillaFixes + VanillaTweaks + SuperWoW + ShaguTweaks + Bongos + LazyPig + pfQuest + BetterCharacterStats*

## Executive Summary

### ⚠️ **NOT RECOMMENDED - USE BAGSHUI INSTEAD**

While Cleanup/SortBags can work, it has known issues including the infamous "grayed out items" bug. **Bagshui** is a superior, actively maintained alternative that provides better features and stability without the problems.

---

## What is Cleanup/SortBags?

### Description
- **Two-addon system** for bag sorting
- **Cleanup:** Provides sorting buttons for bags/bank
- **SortBags:** The actual sorting engine
- Automatically stacks and sorts items by "permanence"
- Originally for Classic (1.13), separate vanilla (1.12) versions exist

### Requirements
- **BOTH addons required** - Cleanup AND SortBags
- **Exact folder names** - Must be "Cleanup" and "SortBags"
- **Vanilla versions needed** - Not the Classic versions
- **TurtleSnacks NOT required** - That was a misconception

### Current Status
- **Maintenance:** Minimal/abandoned for vanilla
- **Issues:** Known "grayed out items" bug
- **Fixes:** Community patches exist but problems persist
- **Alternative:** Bagshui recommended instead

---

## Critical Issues Found

### 🔴 The "Grayed Out Items" Bug

**Most Serious Problem:**
- Items become unclickable/unusable after sorting
- Appears randomly, especially with large bags
- Requires game restart to fix (not just /reload)
- Sometimes requires deleting WDB folder

**User Reports:**
> "Some items unable to be moved or used after sorting"
> "Had to restart game and delete WDB folder"
> "Items stuck in unusable state after automatic sorting"

### Technical Details
- Bug occurs when sorting happens too fast
- Affects players with 36-slot donation bags more
- "Fixed" versions increase delay from 0.2s to 1.2s
- Fix doesn't always work reliably

---

## Compatibility Analysis

### With Your Current Setup

| Your Addon | Compatibility | Issue |
|------------|--------------|-------|
| **LazyPig** | ⚠️ OVERLAP | LazyPig has some inventory features that might conflict |
| **ShaguTweaks** | ✅ OK | No direct conflicts |
| **Bongos** | ✅ OK | No conflicts |
| **pfQuest** | ✅ OK | No conflicts |
| **BetterCharacterStats** | ✅ OK | No conflicts |
| **SuperWoW** | ✅ OK | No conflicts |

### LazyPig Overlap
LazyPig already provides:
- Shift split/merge for stacks
- Auto grey sell/repair
- Improved right-click for items
- **BUT NO BAG SORTING**

---

## Installation Complexity

### What You'd Need to Install:

1. **Cleanup-vanilla** from https://github.com/shirsig/Cleanup-vanilla
2. **SortBags-vanilla** from https://github.com/shirsig/SortBags-vanilla
3. **OR** Turtle WoW fixed version from https://github.com/refaim/SortBags

### Installation Requirements:
- Download both addons
- Rename folders exactly to "Cleanup" and "SortBags"
- Remove any -master or -main suffixes
- Both must be installed together
- Use vanilla (1.12) versions, not Classic

### Common Problems:
- Wrong versions (Classic instead of Vanilla)
- Incorrect folder names
- Missing one of the two required addons
- Conflicts with other addons

---

## User Experience Reports

### Negative Feedback (2023-2024):
- "CleanUp produces error messages even after disabling conflicting addons"
- "SortBags works but needs guide to slow it down"
- "Items randomly greyed out"
- "Had to delete WDB folder to fix"

### The Fixed Version:
- refaim created a "fixed" version for Turtle WoW
- Increases delay to prevent graying out
- **Still reports of issues even with fix**

---

## Superior Alternative: BAGSHUI

### Why Bagshui is Better:

**Features:**
- Single window for bags, bank, keyring
- Auto-categorization with custom rules
- Account-wide item directory
- Remote view of alts' inventories
- Beautiful design and UI
- Search functionality
- NO grayed out items bug

**Stability:**
- Actively maintained (updates in 2024/2025)
- Developer fixes bugs quickly
- No known critical issues
- Built specifically for Vanilla/Turtle WoW

**User Reviews:**
> "Bagshui is incredible"
> "Works like AdiBags but better"
> "Good alternative to modern bag addons"

**GitHub:** https://github.com/veechs/Bagshui

---

## Comparison Table

| Feature | Cleanup/SortBags | Bagshui | Your LazyPig |
|---------|------------------|---------|--------------|
| **Bag Sorting** | ✅ Basic | ✅ Advanced | ❌ None |
| **Auto-categorize** | ❌ No | ✅ Yes | ❌ No |
| **Custom Rules** | ❌ No | ✅ Yes | ❌ No |
| **Search** | ❌ No | ✅ Yes | ❌ No |
| **Alt Inventories** | ❌ No | ✅ Yes | ❌ No |
| **Grayed Items Bug** | ❌ YES | ✅ No | N/A |
| **Active Development** | ❌ No | ✅ Yes | ✅ Yes |
| **Ease of Install** | ❌ Complex | ✅ Simple | Already Done |

---

## Final Recommendation

### ❌ **DO NOT INSTALL Cleanup/SortBags**

**Reasons Against:**
1. **Known Critical Bug** - Grayed out items issue
2. **Complex Installation** - Requires two addons with exact naming
3. **No Active Support** - Vanilla versions abandoned
4. **Better Alternative Exists** - Bagshui superior in every way
5. **Potential Conflicts** - With LazyPig features

### ✅ **INSTALL BAGSHUI INSTEAD**

**Why Bagshui:**
1. **No Critical Bugs** - Stable and reliable
2. **More Features** - Far beyond just sorting
3. **Active Development** - Regular updates and fixes
4. **Single Addon** - Easier installation
5. **Modern Design** - Better user experience
6. **Community Praised** - Highly recommended

---

## If You Still Want Basic Sorting

### Your Current Options:

1. **Keep LazyPig Only** - You have stack management already
2. **Install Bagshui** - Best overall solution
3. **Try EngBags** - Another alternative with sort function
4. **Manual Sorting** - Honestly safer than buggy Cleanup

### What LazyPig Already Gives You:
- Shift-click to split stacks
- Auto-sell grays
- Improved item interactions
- Just missing the sorting feature

---

## Installation Guide (If You Choose Bagshui)

```bash
cd C:\TurtleWoW\Interface\AddOns
git clone https://github.com/veechs/Bagshui.git
```

That's it! One addon, no renaming, no dependencies.

---

## Verdict

**Cleanup/SortBags = Outdated, Buggy, Complex**
**Bagshui = Modern, Stable, Feature-Rich**

The choice is clear: Skip Cleanup/SortBags entirely and go with Bagshui if you want bag sorting functionality. The grayed out items bug alone is reason enough to avoid Cleanup/SortBags.

---

*This analysis based on extensive research of GitHub repositories, Turtle WoW forums, user reports, and bug reports through January 2025.*
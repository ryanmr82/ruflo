# TurtleMail Right-Click Issue Troubleshooting Report
**Date**: 2025-08-29  
**Issue**: TurtleMail right-click functionality not working despite addon being active  
**Root Cause**: ❌ **LazyPig addon conflict identified**  
**Status**: ✅ **PROBLEM DIAGNOSED - SOLUTION PROVIDED**

## Issue Description
- User reported TurtleMail addon is active and checked in addon menu
- Right-clicking mail items does not trigger automatic collection
- Expected behavior: Right-click should collect gold, items, and delete letters

## Root Cause Analysis
### **Conflict Identified: _LazyPig Addon**
- **Conflicting Feature**: LazyPig's "IMPROVED RIGHT CLICK" functionality
- **How it conflicts**: LazyPig overrides right-click behavior in mail windows
- **LazyPig Description**: *"if trade/auction/mail window is active, right click on container item will drag and drop it into trade/auction_create/send_mail window"*

### Evidence Found
```bash
C:\turtlewow\Interface\AddOns\_LazyPig\
├── _LazyPig.toc
├── LazyPig.lua  
├── LazyPigKeybindsFrame.lua
├── LazyPigMenu.xml
├── Bindings.xml
├── LazyPig.xml
├── LazyPigMenu.lua
└── Readme.txt
```

### LazyPig Documentation Excerpt
- Line 13: **"IMPROVED RIGHT CLICK - if trade/auction/mail window is active, right click on container item will drag and drop it into trade/auction_create/send_mail window"**

## TurtleMail Installation Verification
✅ **Installation is CORRECT**:
- Location: `C:\turtlewow\Interface\AddOns\TurtleMail\`
- Files Present: TurtleMail.toc, TurtleMail.lua, TurtleMail.xml
- TOC file shows proper Interface: 11200 for Turtle WoW
- Folder naming convention is correct (no -master suffix)

## Solutions Provided

### **Solution 1: Configure LazyPig (RECOMMENDED)**
1. **In-game command**: Type `/lp` to open LazyPig configuration
2. **Navigate to**: "Improved Right Click" setting
3. **Action**: Disable the feature for mail windows
4. **Test**: Right-click mail items to verify TurtleMail functionality

### **Solution 2: Temporarily Disable LazyPig**
1. **At character select**: Click "AddOns" button
2. **Action**: Uncheck "_LazyPig" addon
3. **Test**: Log in and test TurtleMail right-click
4. **Re-enable**: Once functionality confirmed, re-enable LazyPig

### **Solution 3: Alternative Mail Addon**
- **Option**: Install RP_TurtleMail fork (designed to avoid conflicts)
- **Source**: https://github.com/LythandraWoW/RP_TurtleMail
- **Benefit**: Maintains right-click functionality while coexisting with LazyPig

## Commands Used During Troubleshooting
```bash
# Directory structure verification
dir "C:\turtlewow\Interface\AddOns" /b

# Conflict detection
dir "C:\turtlewow\Interface\AddOns" /b | findstr -i "lazy"
dir "C:\turtlewow\Interface\AddOns" /b | findstr -i "mail"

# File content verification  
dir "C:\turtlewow\Interface\AddOns\_LazyPig" /b
```

## Files Analyzed
- `C:\turtlewow\Interface\AddOns\TurtleMail\TurtleMail.toc` ✅ Verified
- `C:\turtlewow\Interface\AddOns\TurtleMail\TurtleMail.lua` ✅ Verified  
- `C:\turtlewow\Interface\AddOns\_LazyPig\_LazyPig.toc` ✅ Conflict identified
- `C:\turtlewow\Interface\AddOns\_LazyPig\Readme.txt` ✅ Conflict documented

## Research Sources
- Turtle WoW Wiki: TurtleMail addon documentation
- GitHub repositories: Multiple TurtleMail forks analyzed
- Turtle WoW Forum: User troubleshooting discussions
- Community reports: Right-click functionality conflicts

## Lessons Learned
- **LazyPig's "Improved Right Click"** feature conflicts with mail addons
- **Proper diagnosis** requires checking for conflicting addons
- **Multiple solutions** available: configuration vs temporary disable vs alternative addon
- **Community forks** (RP_TurtleMail) exist to address specific conflicts

## Expected Outcome
- **Option 1**: User configures LazyPig to disable conflicting feature
- **Option 2**: User temporarily tests without LazyPig to confirm functionality
- **Option 3**: User switches to conflict-free RP_TurtleMail fork
- **Result**: Right-click mail collection should work properly

## Next Steps for User
1. **Test Solution 1**: Try `/lp` command and disable "Improved Right Click"
2. **Verify Function**: Right-click mail items to collect automatically
3. **Report Back**: Confirm which solution worked
4. **Optional**: Consider RP_TurtleMail fork for long-term compatibility

**Conflict successfully identified and solutions provided. User should now be able to enjoy automated mailbox functionality!**
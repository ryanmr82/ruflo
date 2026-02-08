# TurtleWoW LootBlare Addon Installation Status Report

## Date and Time
- **Date**: January 7, 2025
- **Time**: 12:53 AM EST
- **Session Type**: Addon Installation

## Task Summary
Installation of LootBlare addon v2.5 for TurtleWoW from GitHub repository https://github.com/FSuhas/LootBlare

## What Was Accomplished

### 1. Pre-Installation Verification
- ✅ Verified TurtleWoW installation at `C:\turtlewow`
- ✅ Confirmed Interface\AddOns folder structure exists
- ✅ Verified LootBlare was not previously installed
- ✅ Created backup folder structure at `C:\turtlewow\backups`

### 2. Addon Research
- ✅ Researched LootBlare addon features:
  - Pop-up frame for item rolls when uncommon+ items linked in Raid Warning
  - Automatic roll sorting by type (SR/MS/OS/TM)
  - Version 2.5 with item database functionality
  - Commands: `/lootblare` or `/lb` to show/hide frame

### 3. Installation Process
- ✅ Cloned repository from GitHub using git
- ✅ Created addon folder at `C:\turtlewow\Interface\AddOns\LootBlare`
- ✅ Copied addon files to correct location
- ✅ Cleaned up Git repository files (removed .git folder contents)
- ✅ Verified final installation contains only required addon files

### 4. Final Addon Structure
```
C:\turtlewow\Interface\AddOns\LootBlare\
├── LootBlare.lua (38,558 bytes) - Main addon script
├── LootBlare.toc (270 bytes) - Addon metadata
├── readme.md (3,887 bytes) - Documentation
├── image.png (54,812 bytes) - Addon screenshot
└── lootblareframe.PNG (57,016 bytes) - Frame screenshot
```

## Commands Used

### PowerShell Commands
```powershell
# Check TurtleWoW directory
Test-Path 'C:\turtlewow'
Get-ChildItem 'C:\turtlewow' | Select-Object Name

# Check AddOns folder
Test-Path 'C:\turtlewow\Interface\AddOns'
Get-ChildItem 'C:\turtlewow\Interface\AddOns' | Select-Object -First 10

# Create backup folder
New-Item -Path 'C:\turtlewow\backups' -ItemType Directory

# Create addon folder
New-Item -Path 'C:\turtlewow\Interface\AddOns\LootBlare' -ItemType Directory

# Copy addon files
Copy-Item -Path 'C:\turtlewow\temp_lootblare\*' -Destination 'C:\turtlewow\Interface\AddOns\LootBlare\' -Recurse -Force

# Clean up Git files
Remove-Item -Path 'C:\turtlewow\Interface\AddOns\LootBlare\hooks', 'C:\turtlewow\Interface\AddOns\LootBlare\info' [...] -Recurse -Force

# Remove temporary folder
Remove-Item -Path 'C:\turtlewow\temp_lootblare' -Recurse -Force
```

### Git Commands
```bash
# Clone repository
cd C:\turtlewow
git clone https://github.com/FSuhas/LootBlare.git temp_lootblare
```

## Files Modified/Created

### New Directories Created
- `C:\turtlewow\backups\` - Backup folder for future use
- `C:\turtlewow\Interface\AddOns\LootBlare\` - Addon installation directory

### Files Installed
- `C:\turtlewow\Interface\AddOns\LootBlare\LootBlare.lua` - Main addon logic
- `C:\turtlewow\Interface\AddOns\LootBlare\LootBlare.toc` - Table of contents file
- `C:\turtlewow\Interface\AddOns\LootBlare\readme.md` - Documentation
- `C:\turtlewow\Interface\AddOns\LootBlare\image.png` - Screenshot
- `C:\turtlewow\Interface\AddOns\LootBlare\lootblareframe.PNG` - Frame screenshot

## Addon Configuration Details

### LootBlare.toc Contents
```
Interface: 11200
Title: LootBlare 2.5
Author: Ehawne, Sivent, Gulolio, GondoLeon
Version: 2.5
Notes: Make loot rolls obvious
SavedVariables: FrameShownDuration, FrameAutoClose, RollCap, DBItems
```

### In-Game Commands
- `/lootblare` or `/lb` - Show/hide the loot frame
- `/lootblare time <number>` - Adjust frame display duration
- `/lootblare autoClose on/off` - Toggle auto-close feature

### Roll Types
- **SR (Soft Reserve)**: Rolls 1-100
- **MS (Main Spec)**: Rolls 1-100
- **OS (Off Spec)**: Rolls 1-99
- **TM (Transmog)**: Rolls 1-98

## Services/Applications Affected
- TurtleWoW client - New addon installed, requires game restart to load

## Rollback Procedure
If the addon needs to be removed:
1. Exit TurtleWoW completely
2. Delete folder: `C:\turtlewow\Interface\AddOns\LootBlare`
3. Clear WTF saved variables if needed: Delete LootBlare entries from `C:\turtlewow\WTF\Account\[AccountName]\SavedVariables\LootBlare.lua`

## Lessons Learned
1. Git clone includes repository metadata that needs to be cleaned up when installing WoW addons
2. PowerShell's Test-Path with negation requires `-not` operator, not `!` prefix
3. Backup folder structure was successfully created for future addon management
4. LootBlare addon has a simple file structure making installation straightforward

## Things That Didn't Work
1. Initial PowerShell syntax errors with variable assignment in compound commands
2. Negation operator `!` doesn't work directly in PowerShell - must use `-not` operator
3. Had to clean up Git repository files after initial copy

## Next Steps for User
1. **Launch TurtleWoW** - The addon will be loaded automatically
2. **Check addon list** - In-game, go to Character Selection > AddOns button to verify LootBlare is listed
3. **Enable addon** - Ensure checkbox is checked for LootBlare
4. **Test functionality** - In a raid/party, have someone link an uncommon+ item in Raid Warning
5. **Configure settings** - Use `/lootblare` commands to adjust frame behavior as needed

## Additional Notes
- Addon is compatible with Interface version 11200 (Vanilla WoW 1.12)
- No dependencies on other addons required
- Saved variables will be stored per account
- Contributors include Ehawne, Sivent, Gulolio, and GondoLeon

## Status
✅ **COMPLETED SUCCESSFULLY** - LootBlare v2.5 installed and ready for use
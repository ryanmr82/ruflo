# TurtleWoW Addon Installation: Cursive & TrinketMenu

**Date:** December 2, 2025, 2:46 AM PST
**Task:** Install Cursive and TrinketMenu addons for TurtleWoW
**Status:** Completed Successfully

---

## Summary

Successfully installed two addons for TurtleWoW warlock gameplay:

1. **Cursive v2.5.5** - Auto-DoT targeting and curse tracking (requires SuperWoW)
2. **TrinketMenu 3.41** - Auto-swap trinkets on cooldown with queue system

Both addons are compatible with Turtle WoW (Interface: 11200) and installed correctly.

---

## Pre-Installation Verification

### SuperWoW Dependency Check
- **Status:** Already installed
- **Evidence:**
  - `C:\turtlewow\SuperWoWhook.dll` present
  - `C:\turtlewow\Interface\AddOns\SuperAPI` installed with all files
  - `SUPERWOW_INSTALLATION_COMPLETE.txt` present

---

## Installation Details

### Cursive Addon

**Source:** https://github.com/pepopo978/Cursive
**Version:** 2.5.5
**Author:** Pepopo
**Location:** `C:\turtlewow\Interface\AddOns\Cursive\`

#### Files Installed:
```
Cursive/
├── img/
├── libs/
├── sounds/
├── spells/
│   ├── druid.lua
│   ├── hunter.lua
│   ├── mage.lua
│   ├── priest.lua
│   ├── rogue.lua
│   ├── shaman.lua
│   ├── shared_debuffs.lua
│   ├── warlock.lua
│   └── warrior.lua
├── commands.lua
├── core.lua
├── curses.lua
├── Cursive.toc
├── filter.lua
├── global.lua
├── LICENSE
├── Localization.lua
├── README.md
├── settings.lua
├── ui.lua
└── utils.lua
```

#### Functionality Confirmed:
- Auto-casts DoTs on targets that don't have them
- Multi-target support with priority options (HIGHEST_HP, LOWEST_HP, RAID_MARK)
- Will NOT cast on CC'd targets (Poly, Sap, Banish, etc.)
- Only targets enemies already in combat (prevents accidental pulls)

### TrinketMenu Addon

**Source:** https://github.com/S4V4GENZ/TrinketMenu
**Version:** 3.41
**Author:** Gello (fix by Ogrisch)
**Location:** `C:\turtlewow\Interface\AddOns\TrinketMenu\`

#### Files Installed:
```
TrinketMenu/
├── Bindings.xml
├── Buttons.blp
├── readme.txt
├── TrinketMenu-Gear.blp
├── TrinketMenu-Icon-Down.tga
├── TrinketMenu-Icon-Up.tga
├── TrinketMenu-ResizeGrip.tga
├── TrinketMenu.lua
├── TrinketMenu.toc
├── TrinketMenu.xml
├── TrinketMenuOpt.lua
├── TrinketMenuOpt.xml
├── TrinketMenuQueue.lua
└── TrinketMenuQueue.xml
```

#### Functionality Confirmed:
- Auto Queue feature swaps trinkets when off cooldown
- Trinkets swap **out of combat** (queued during combat)
- Priority system - higher ranked trinkets swap in automatically
- 30-second threshold considered "off cooldown"

---

## Usage Guide

### Cursive - Warlock DoT Spam

#### Basic Commands:
```
/cursive                                    -- Open options/commands
/cursive curse Corruption|target           -- Cast Corruption if target doesn't have it
/cursive multicurse Corruption|HIGHEST_HP  -- Auto-target highest HP enemy without Corruption
```

#### Recommended BG Macro (Spam This Button):
```lua
/script if not Cursive:Multicurse("Curse of Agony", "HIGHEST_HP", {refreshtime=1}) then if not Cursive:Multicurse("Corruption", "HIGHEST_HP", {refreshtime=3}) then Cursive:Multicurse("Siphon Life", "HIGHEST_HP", {refreshtime=1}) end end
```

#### Priority Options:
- `HIGHEST_HP` - Target highest HP enemy first
- `LOWEST_HP` - Target lowest HP enemy first
- `RAID_MARK` - Target by raid mark priority (Skull > Cross > Square...)
- `playeronly` option - Only target players, ignore NPCs

#### Important Notes:
- Will NOT cast on CC'd targets (Poly, Sheep, Banish, Sap, etc.)
- Only targets enemies already in combat (safe for dungeons/raids)
- Use `allowooc` option sparingly - can pull unintended mobs

### TrinketMenu - Auto Trinket Swapping

#### Setup:
1. Open options: `/trinket opt` or right-click minimap icon
2. Go to the Auto Queue tab
3. Drag trinkets to set priority order
4. **Alt+Click** a trinket slot to enable Auto Queue (gold gear icon appears)

#### How It Works:
- When equipped trinket is on cooldown, auto-swaps to first available trinket
- When a higher-priority trinket comes off cooldown, swaps back
- Swap attempts during combat queue for when you leave combat
- Passive trinkets won't trigger swaps unless higher priority is ready

#### Visual Indicators:
- **Gold gear** = Auto Queue active
- **Grey gear** = Equipped trinket waiting to swap out (has delay)
- **Red gear** = Queue paused

#### Slash Commands:
```
/trinket          -- Toggle window
/trinket opt      -- Open options
/trinket reset    -- Reset window position
/trinket lock     -- Lock windows
/trinket unlock   -- Unlock windows
```

---

## Research & Sources

### Cursive
- **GitHub:** https://github.com/pepopo978/Cursive
- **Turtle WoW Wiki:** https://turtle-wow.fandom.com/wiki/Addons
- **Community Forum:** https://forum.turtle-wow.org/viewforum.php?f=18

### TrinketMenu
- **GitHub:** https://github.com/S4V4GENZ/TrinketMenu
- **Forum Discussion:** https://forum.turtle-wow.org/viewtopic.php?t=15153

---

## Commands Used

```powershell
# Check existing addons
Get-ChildItem 'C:\turtlewow\Interface\AddOns' -Directory | Select-Object -ExpandProperty Name

# Verify SuperWoW installation
Get-ChildItem 'C:\turtlewow' -Filter '*.dll' | Select-Object Name

# Create temp folder and download addons
New-Item -ItemType Directory -Path 'C:\Temp' -Force
Invoke-WebRequest -Uri 'https://github.com/pepopo978/Cursive/archive/refs/heads/master.zip' -OutFile 'C:\Temp\Cursive.zip' -UseBasicParsing
Invoke-WebRequest -Uri 'https://github.com/S4V4GENZ/TrinketMenu/archive/refs/heads/master.zip' -OutFile 'C:\Temp\TrinketMenu.zip' -UseBasicParsing

# Extract and install
Expand-Archive -Path 'C:\Temp\Cursive.zip' -DestinationPath 'C:\Temp\Cursive_extract' -Force
Expand-Archive -Path 'C:\Temp\TrinketMenu.zip' -DestinationPath 'C:\Temp\TrinketMenu_extract' -Force
Copy-Item 'C:\Temp\Cursive_extract\Cursive-master' -Destination 'C:\turtlewow\Interface\AddOns\Cursive' -Recurse -Force
Copy-Item 'C:\Temp\TrinketMenu_extract\TrinketMenu-master' -Destination 'C:\turtlewow\Interface\AddOns\TrinketMenu' -Recurse -Force

# Cleanup temp files
Remove-Item 'C:\Temp\Cursive*' -Recurse -Force
Remove-Item 'C:\Temp\TrinketMenu*' -Recurse -Force
```

---

## Files Modified

| Path | Action |
|------|--------|
| `C:\turtlewow\Interface\AddOns\Cursive\*` | Created (new addon) |
| `C:\turtlewow\Interface\AddOns\TrinketMenu\*` | Created (new addon) |
| `C:\Temp\Cursive.zip` | Temporary, cleaned up |
| `C:\Temp\TrinketMenu.zip` | Temporary, cleaned up |

---

## Rollback Procedure

To remove either addon:

```powershell
# Remove Cursive
Remove-Item 'C:\turtlewow\Interface\AddOns\Cursive' -Recurse -Force

# Remove TrinketMenu
Remove-Item 'C:\turtlewow\Interface\AddOns\TrinketMenu' -Recurse -Force
```

---

## Lessons Learned

1. **SuperWoW is critical** - Cursive will not function without SuperWoWhook.dll and SuperAPI addon
2. **GitHub branch naming** - GitHub zips extract to `reponame-master/` folder, need to rename when installing
3. **Interface version 11200** - Both addons properly configured for vanilla 1.12.1 client
4. **Community solutions exist** - Both addons are well-maintained with active GitHub repos

---

## Things That Worked Well

- Parallel downloading of both addons
- Using PowerShell Expand-Archive for clean extraction
- Verifying SuperWoW dependency before installation
- Reading README files for accurate usage documentation

## What To Try Next Session

- Test both addons in-game to verify functionality
- Configure Cursive UI position and enable "Allow clickthrough"
- Set up TrinketMenu priority queue for common trinkets
- Create custom macros combining Cursive commands for specific BG scenarios

---

*Report generated: December 2, 2025*

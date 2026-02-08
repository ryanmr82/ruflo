================================================================
   GuildShopSync - AH Price Scanner for TBC Guild Consume Shop
================================================================

This package automatically syncs Auction House prices to the
guild consume shop website at: https://tbcguild.duckdns.org/consumes

REQUIREMENTS:
- Turtle WoW client
- aux-addon installed (required dependency)
- Windows 10/11

================================================================
INSTALLATION - PART 1: WoW Addon
================================================================

1. Close World of Warcraft completely

2. Copy the "GuildShopSync" folder to your addons directory:
   C:\turtlewow\Interface\AddOns\

   Final path should be:
   C:\turtlewow\Interface\AddOns\GuildShopSync\GuildShopSync.lua
   C:\turtlewow\Interface\AddOns\GuildShopSync\GuildShopSync.toc

3. Launch WoW and make sure the addon is enabled in the
   AddOns menu at character select

================================================================
INSTALLATION - PART 2: Auto-Sync (One-Time Setup)
================================================================

1. Keep the "AutoSync" folder somewhere permanent on your PC
   (e.g., C:\GuildShopSync\AutoSync\)

2. Edit AutoSync.ps1 and update WatchPath if needed:
   Default: C:\turtlewow\WTF\Account

3. Run "Setup-AutoSync.bat" as Administrator (right-click)
   - This creates a scheduled task that runs at login
   - The sync watcher will start automatically

================================================================
HOW TO USE
================================================================

1. Log into WoW and go to the Auction House

2. Open the AUX addon window

3. Click the "Sync Prices" button (bottom-right of AUX window)

4. Wait for the scan to complete (scans 34 items)
   - You'll see progress in chat
   - UI will auto-reload when done

5. A Windows notification will confirm the upload

That's it! Prices are now live on the website.

================================================================
WHAT IT SCANS
================================================================

Protection Potions:
- Greater Fire/Arcane/Nature/Frost/Shadow Protection
- Limited Invulnerability, Free Action, Living Action
- Restorative, Invisibility, Swiftness, Purification, Quickness

Tank & Melee:
- Elixir of the Mongoose, Giants, Fortitude, Superior Defense
- Mighty Rage, Greater Stoneshield, Major Troll's Blood
- Gift of Arthas, Oil of Immolation

Caster:
- Mageblood, Greater Arcane Elixir, Major Mana
- Elixir of Greater Firepower/Shadow Power/Frost Power/Nature Power
- Dreamshard Elixir

Turtle WoW Concoctions:
- Emerald Mongoose, Arcane Giant, Dreamwater

================================================================
TROUBLESHOOTING
================================================================

"Button not showing":
- Make sure aux-addon is installed and enabled
- Open the Auction House first, then look for the button

"Scan stops partway through":
- This can happen if the AH is busy
- Try again in a few seconds

"Prices not uploading":
- Make sure AutoSync is running (check Task Scheduler)
- Verify your internet connection
- Check that the WatchPath in AutoSync.ps1 matches your WoW install

"Need to change WoW install path":
- Edit AutoSync.ps1, change $WatchPath to your path
- Re-run Setup-AutoSync.bat

================================================================
COMMANDS
================================================================

/gss scan   - Start scanning (same as clicking button)
/gss stop   - Stop a scan in progress
/gss debug  - Show debug info
/gss help   - Show commands

================================================================
SUPPORT
================================================================

Website: https://tbcguild.duckdns.org/consumes
Discord: Contact guild officers

Version: 2.0

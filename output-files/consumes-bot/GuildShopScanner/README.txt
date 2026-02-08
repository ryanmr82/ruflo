===============================================
  GuildShopScanner v1.0
  TBC Guild Consume Shop Price Scanner
===============================================

INSTALLATION
------------
1. Copy the entire GuildShopScanner folder to your WoW AddOns directory:
   - Windows: C:\Games\Turtle-WoW\Interface\AddOns\
   - The folder should contain:
     - GuildShopScanner.toc
     - GuildShopScanner.lua
     - Items.lua

2. Restart WoW or type /reload

3. You should see: [GuildShopScanner] v1.0 loaded


IN-GAME COMMANDS
----------------
All commands start with /gss

  /gss              - Show help
  /gss scan         - Scan AH prices (must be at Auction House)
  /gss prices       - Show all stored prices
  /gss prices melee - Show prices for a category
  /gss export       - Export prices for manual upload
  /gss curl         - Generate upload command
  /gss status       - Show addon status
  /gss clear        - Clear stored prices


HOW TO USE
----------
1. Go to the Auction House
2. Open the AH window
3. Type: /gss scan
4. Wait for the scan to complete (scans 33 items)
5. Log out to save prices to disk

The addon tracks these categories:
  - Protection & Utility (13 items)
  - Tank & Melee (9 items)
  - Caster (8 items)
  - Concoctions (3 items)
  - Flasks (4 items - static G-Bank prices, not scanned)


UPLOADING PRICES
----------------
After scanning, you have two options:

Option 1: PowerShell Script (Recommended for Windows)
  1. Close WoW to save your SavedVariables
  2. Open PowerShell
  3. Navigate to the GuildShopScanner folder
  4. Run: .\Upload-Prices.ps1
  5. Prices are uploaded to the guild website

Option 2: Bash Script (Linux/WSL)
  1. Close WoW to save your SavedVariables
  2. Open terminal
  3. Run: ./upload-prices.sh /path/to/GuildShopScanner.lua

Option 3: Manual Upload
  1. In-game, type: /gss curl
  2. Copy the generated curl command
  3. Run in terminal/PowerShell


ITEM CATEGORIES
---------------
Protection: GFPP, GAPP, GNPP, GFROP, GSPP, LIP, FAP, LAP,
            Restorative, Invisibility, Swiftness, Purification, Quickness

Melee:      Mongoose, Giants, MightyRage, GreaterStoneshield, Fortitude,
            SuperiorDefense, TrollsBlood, GiftOfArthas, OilOfImmolation

Caster:     Mageblood, GAE, MajorMana, GFW, GSP, GFrostP, GNP, Dreamshard

Concoctions: EmeraldMongoose, ArcaneGiant, Dreamwater

Flasks:     Titans (30g), Wisdom (20g), SupremePower (20g), Chromatic (20g)
            (Flasks are G-Bank only with fixed prices)


TROUBLESHOOTING
---------------
Q: "You must be at the Auction House to scan prices!"
A: Open the Auction House window before running /gss scan

Q: No prices found after scan
A: Some items might not be listed on the AH. Try again later.

Q: Upload script can't find SavedVariables
A: Make sure you've logged out of WoW to save the data.
   The file is saved when you exit the game.

Q: Prices seem outdated
A: Run /gss scan again to refresh prices.


SUPPORT
-------
Website: https://tbcguild.duckdns.org/consumes
Discord: Use /prices to see current shop prices

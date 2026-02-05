AH & Vault Sync v4.0
====================
Thralls Book Club - TurtleWoW Guild Tools

Unified system tray application that automates two guild data pipelines:

1. AUCTION HOUSE PRICES (GuildShopSync)
   - In-game: Open the AH, click "Sync Prices", then reload UI
   - The tray app detects the scan and uploads prices to the guild website
   - Command: /gss scan | /gss debug | /gss stop

2. GUILD BANK INVENTORY (GBankExport)
   - In-game: Open the guild bank - scanning is automatic
   - Log out or /reload to flush data to disk
   - The tray app detects the change and exports JSON + TXT files
   - Command: /gbe scan | /gbe status | /gbe list | /gbe tabs

HOW IT WORKS
------------
- Runs as a system tray icon (green/blue split circle)
- Auto-starts at Windows login via Registry Run key
- Polls WTF\Account folders for SavedVariables changes
- AH prices: uploaded to https://tbcguild.duckdns.org/consumes
- Guild bank: exported locally to WoW\Interface\AddOns\GBankExport\

TRAY MENU
---------
- Right-click the tray icon for status info
- Double-click for a quick status balloon
- "Open Log Folder" - view service.log
- "Open Export Folder" - view guild bank JSON/TXT exports
- "Exit" - stop the tray app

LOG LOCATION
------------
%LocalAppData%\AH_and_VaultSync\service.log

TROUBLESHOOTING
---------------
- If the tray icon doesn't appear, check the log file for errors
- Make sure TurtleWoW is installed and has been run at least once
- The WTF\Account folder must exist (created on first WoW login)
- Only one instance can run at a time (enforced by named mutex)

UNINSTALL
---------
Use "Add or Remove Programs" in Windows Settings, or run the
uninstaller from the Start Menu group.

VERSION HISTORY
---------------
v4.0 - Unified AH & Vault Sync (combines GuildShopSync + GBankExport)
v3.1 - GuildShopSync only (compiled .NET tray app, Registry Run key)
v3.0 - GuildShopSync only (compiled .NET, Task Scheduler - deprecated)
v2.x - GuildShopSync only (PowerShell-based - deprecated)

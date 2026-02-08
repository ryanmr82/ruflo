GuildShopSync v3.1 - Price Scanner
==================================
by Thralls Book Club

Scans Auction House prices for consumables and uploads them to the guild website.

WHAT'S NEW IN v3.1
------------------
- Replaced PowerShell background service with a compiled Windows application
- Tray icon no longer disappears after sleep, shutdown, or reboot
- Uses standard Windows startup (Registry Run key) instead of Task Scheduler
- Automatic cleanup of old scheduled tasks from previous versions

HOW IT WORKS
------------
1. In-Game: Open the Auction House and click "Sync Prices" (bottom-right)
2. The addon scans ~80 items and records lowest buyout prices
3. Click "Reload UI & Sync" when the scan finishes
4. The tray app detects the new prices and uploads them to the guild website

TRAY ICON
---------
- Green circle = service is running and watching for price scans
- Right-click for status menu (version, last upload, upload count)
- Double-click for a status popup
- "Open Log Folder" to view service logs
- "Exit" to stop the service (restarts at next Windows logon)

AUTO-START
----------
The tray app starts automatically when you log into Windows via a Registry
Run key. No Task Scheduler is used. To disable auto-start:
  1. Open Task Manager > Startup tab
  2. Find "GuildShopSync" and disable it

MANUAL START
------------
Run GuildShopSyncTray.exe from the install folder:
  C:\Program Files (x86)\GuildShopSync\GuildShopSyncTray.exe

FILES
-----
- GuildShopSyncTray.exe  - Background tray application
- README.txt             - This file
- Addon\                 - WoW addon files (copied to WoW folder by installer)

LOG LOCATION
------------
%LOCALAPPDATA%\GuildShopSync\service.log

UNINSTALL
---------
Use Windows Settings > Apps > GuildShopSync > Uninstall
This removes the tray app, addon, registry keys, and log folder.

WEBSITE
-------
https://tbcguild.duckdns.org/consumes

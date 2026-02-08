================================================================================
                    SPY ADDON FOR TURTLEWOW (PATCHED VERSION)
                         Dungeon/Raid Error Fix Applied
================================================================================

VERSION: beta0.3.9 (with Astrolabe fix)
SOURCE:  https://github.com/laytya/Spy-vanilla
PATCH:   Astrolabe-0.2.lua line 166 nil check fix

================================================================================
                              INSTALLATION
================================================================================

1. CLOSE TurtleWoW completely if it's running

2. BACKUP your existing Spy folder (if you have one):
   - Navigate to: C:\turtlewow\Interface\AddOns\
   - Rename "Spy" folder to "Spy_backup" (if it exists)

3. EXTRACT the Spy folder from this ZIP:
   - Copy the entire "Spy" folder
   - Paste it into: C:\turtlewow\Interface\AddOns\

4. VERIFY the structure looks like this:
   C:\turtlewow\Interface\AddOns\Spy\
   ├── Spy.toc
   ├── Spy.lua
   ├── Spy.xml
   ├── Libs\
   │   └── Astrolabe-0.2\
   │       └── Astrolabe-0.2.lua  (contains the fix!)
   └── (other files...)

5. LAUNCH TurtleWoW and enable the addon at character select

================================================================================
                              WHAT IS SPY?
================================================================================

Spy is a PvP detection addon that:
- Alerts you when enemy players are nearby (within 50 yards)
- Tracks enemy encounters over the last hour
- Allows you to add players to a "Kill On Sight" list for priority alerts
- Works by scanning the combat log for enemy player actions

================================================================================
                          WHAT WAS FIXED?
================================================================================

PROBLEM: The original Spy addon would spam Lua errors in chat when entering
         dungeons, raids, or any instanced content:

         ".../spy/libs/AstroLabE-0.2/AstroLabE-0.2.lua:166: attempt to
         index field '?' (a nil value)"

CAUSE:   The bundled Astrolabe library lacks map data for dungeon instances.
         When you zone into a dungeon, it tries to access map data that
         doesn't exist, causing a nil reference error every 0.1 seconds.

FIX:     Added nil checks to line 166 of Astrolabe-0.2.lua:

         BEFORE:
         elseif ( C and nC) and ( WorldMapSize[C].parentContinent == WorldMapSize[nC].parentContinent ) then

         AFTER:
         elseif ( C and nC ) and WorldMapSize[C] and WorldMapSize[nC] and ( WorldMapSize[C].parentContinent == WorldMapSize[nC].parentContinent ) then

         This ensures the map data exists before trying to access it.

================================================================================
                           BASIC COMMANDS
================================================================================

/spy show      - Display main Spy window
/spy hide      - Hide main Spy window
/spy reset     - Reset window position to default
/spy clear     - Clear detected players list
/spy config    - Open addon configuration panel
/spy kos       - Manage Kill On Sight list
/spy ignore    - Manage ignore list
/spy stats     - Show enemy encounter statistics
/spy test      - Test positioning warning

================================================================================
                              USAGE TIPS
================================================================================

1. Keep Spy visible when questing in contested zones (STV, Hillsbrad, etc.)

2. Click an enemy name in the Nearby list to target them (out of combat only)

3. Right-click a name to add them to your Kill On Sight (KOS) list -
   you'll get a louder alarm when they're detected

4. Use /spy stats to track where and when you encounter enemies most often

5. Add known gankers to your KOS list for early warning

================================================================================
                           TROUBLESHOOTING
================================================================================

ADDON NOT SHOWING IN LIST:
- Make sure folder is named exactly "Spy" (not "Spy-vanilla" or "Spy-master")
- Verify Spy.toc exists directly inside the Spy folder

NO ENEMY DETECTION:
- Enemies must perform combat log actions within 50 yards to be detected
- Stealthed players won't show until they cast spells or use abilities

ALERT SOUND NOT PLAYING:
- Check in-game Sound Effects volume
- Type /spy config and verify sounds are enabled
- Use /spy test to verify alerts work

WINDOW OFF-SCREEN:
- Type /spy reset to restore default position

================================================================================
                              CREDITS
================================================================================

Original Addon:    Immolation
Vanilla Port:      laytya (https://github.com/laytya/Spy-vanilla)
Astrolabe Fix:     Applied to prevent dungeon/raid error spam

================================================================================
                         ENJOY AND HAPPY HUNTING!
================================================================================

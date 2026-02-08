# Turtle WoW Addon Analysis Status Report
**Date:** January 19, 2025, 10:45 PM PST
**Topic:** Analysis of aux Auction House addon and ShaguTweaks vendor value system

## What Was Accomplished

### 1. Identified Addon Locations
- **Main Installation:** `C:\TurtleWoW\Interface\AddOns`
- **aux-addon:** Full Auction House replacement addon located at `C:\TurtleWoW\Interface\AddOns\aux-addon`
- **ShaguTweaks:** Contains vendor-values module at `C:\TurtleWoW\Interface\AddOns\ShaguTweaks\mods\vendor-values.lua`

### 2. aux Addon Architecture Analysis

#### Core Components
- **Main Module:** `aux-addon.lua` - Initializes the addon, manages tabs, hooks into Blizzard UI
- **Scanning System:** `core\scan.lua` - Handles auction house page-by-page scanning
- **Search Tab:** `tabs\search\` - Provides advanced search functionality with filters
- **Data Storage:** Uses persistence layer to store auction history and pricing data
- **Cache System:** `core\cache.lua` - Maintains item information cache

#### How aux Works
1. **UI Replacement:** Completely replaces the default Blizzard Auction House UI
2. **Scanning Process:**
   - Performs page-by-page scans (50 items per page)
   - Uses `QueryAuctionItems()` WoW API for searches
   - Supports filtered searches with complex query syntax
   - Can scan bidder, owner, or general auction lists
3. **Data Collection:**
   - Stores historical pricing data per realm/faction
   - Tracks daily minimum buyouts
   - Maintains merchant buy/sell prices when available
   - Shares data via LFT channel with other aux users
4. **Search Features:**
   - Supports exact item searches using `/exact` modifier
   - Saved search functionality
   - Real-time result filtering
   - Multi-page result aggregation

### 3. ShaguTweaks Vendor Values Analysis

#### Implementation Details
- **Data Source:** Static database embedded in the addon (lines 15-3864)
- **Database Format:** Lua table mapping item IDs to vendor sell prices in copper
- **Database Size:** Contains ~38,000+ item entries
- **Not Real-time:** Does NOT query vendors in real-time

#### How It Works
1. **Hooks GameTooltip:** Intercepts all tooltip display functions
2. **Item Detection:** Captures item link when tooltip is shown
3. **Price Lookup:** Checks static database for item ID
4. **Display:** Adds vendor price to tooltip if found in database
5. **Stack Support:** Multiplies price by item count for stacks

### 4. Key Findings

#### aux Addon - Auction House Interaction
- **API Usage:** Uses official WoW API functions (`QueryAuctionItems`, `GetAuctionItemInfo`)
- **Search Limitations:** Bound by Blizzard's query throttling (can only search when `CanSendAuctionQuery()` returns true)
- **Data Persistence:** Stores all data locally in SavedVariables
- **Network Communication:** Shares pricing data with guild members via chat channels
- **Performance:** Implements intelligent caching to minimize API calls

#### ShaguTweaks Vendor Values - Data Source
- **Static Database:** Pre-compiled vendor prices, NOT fetched in real-time
- **Coverage:** Comprehensive but may not include all items or recent updates
- **Accuracy:** Prices are hardcoded and may not reflect server-specific changes
- **Performance:** Instant lookups with no server queries needed
- **Limitations:** Cannot detect vendor price changes without addon updates

## Commands Used
```bash
# Directory exploration
ls -la "C:\TurtleWoW\Interface\AddOns"
find /c -type d -iname "*wow*" 2>/dev/null

# File analysis
ls -la "C:\TurtleWoW\Interface\AddOns\aux-addon"
grep -i "vendor|GetItemInfo|sell.*price" (multiple addon files)
```

## Files Modified
No files were modified during this analysis session.

## Lessons Learned
1. **aux is sophisticated:** Full AH replacement with advanced features beyond basic searching
2. **Data sharing exists:** aux users share pricing data via chat channels
3. **Vendor prices are static:** ShaguTweaks uses a pre-compiled database, not real-time queries
4. **WoW API limitations:** Addons must work within Blizzard's API restrictions for AH queries
5. **Performance considerations:** Both addons implement caching to minimize performance impact

## Technical Details

### aux Data Flow
1. User initiates search →
2. Creates query with filters →
3. Submits via `QueryAuctionItems()` →
4. Processes results page by page →
5. Stores pricing history →
6. Updates UI with results

### ShaguTweaks Data Flow
1. Tooltip triggered →
2. Item link captured →
3. Extract item ID →
4. Lookup in static database →
5. Display vendor price if found

## Rollback Procedures
N/A - Analysis only, no changes made

## Additional Notes
- Both addons are open source and appear legitimate
- aux provides significantly more functionality than just AH searching
- ShaguTweaks vendor values could be updated by modifying the static database
- The LFT channel data sharing in aux is an interesting community feature
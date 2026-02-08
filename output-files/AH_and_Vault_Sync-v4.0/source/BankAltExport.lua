-- BankAltExport v1.0
-- TurtleWoW Bank Alt Character Scanner
--
-- Scans character bags (0-4) and personal bank (-1, 5-11)
-- for export to the AH & Vault Sync tray app.
--
-- WoW 1.12.1 Container API:
--   GetContainerNumSlots(bagId)         -> number of slots (0 if not available)
--   GetContainerItemInfo(bagId, slot)   -> texture, count, locked, quality, readable
--   GetContainerItemLink(bagId, slot)   -> item link with itemId
--
-- Bag IDs:
--   0       = Backpack (16 slots)
--   1-4     = Equipped bags (14-18 slots each)
--   -1      = Main bank (24 slots, only at banker)
--   5-11    = Bank bags (14-18 slots each, only at banker)

------------------------------------------------------------
-- SavedVariables
------------------------------------------------------------
BankAltExport_Data     = BankAltExport_Data     or {}
BankAltExport_FlatData = BankAltExport_FlatData or ""

------------------------------------------------------------
-- Constants & State
------------------------------------------------------------
local frame   = CreateFrame("Frame")
local VERSION = "1.0"

local BAG_IDS  = { 0, 1, 2, 3, 4 }         -- Character bags (always available)
local BANK_IDS = { -1, 5, 6, 7, 8, 9, 10, 11 }  -- Bank (only at banker NPC)

local bankIsOpen = false
local scanPending = false

------------------------------------------------------------
-- Helpers
------------------------------------------------------------
local function Print(msg)
    if DEFAULT_CHAT_FRAME then
        DEFAULT_CHAT_FRAME:AddMessage("|cFF00CCFF[BankAltExport]|r " .. tostring(msg))
    end
end

local QUALITY_COLORS = {
    [0] = "9d9d9d", [1] = "ffffff", [2] = "1eff00",
    [3] = "0070dd", [4] = "a335ee", [5] = "ff8000",
}

------------------------------------------------------------
-- Parse itemId from item link
-- Link format: |cff9d9d9d|Hitem:7073:0:0:0|h[Broken Fang]|h|r
-- Pattern borrowed from Bagshui addon
------------------------------------------------------------
local function GetItemIdFromLink(link)
    if not link then return nil end
    local _, _, idStr = string.find(link, "item:(%d+)")
    if idStr then
        return tonumber(idStr)
    end
    return nil
end

------------------------------------------------------------
-- Get full item info using GetItemInfo API
-- Returns: name, itemString, quality, minLevel, itemType, itemSubtype, maxStack, equipLoc, texture
-- Pattern borrowed from Bagshui addon (Components/ItemInfo.lua)
------------------------------------------------------------
local function GetFullItemInfo(itemId)
    if not itemId or not GetItemInfo then return nil end
    local name, itemString, quality, minLevel, itemType, itemSubtype, maxStack, equipLoc, texture = GetItemInfo(itemId)
    return name, quality, itemType, itemSubtype, maxStack, texture
end

------------------------------------------------------------
-- Scan a single container (bag or bank slot)
-- Pattern borrowed from Bagshui addon (Components/Inventory.Cache.lua)
------------------------------------------------------------
local function ScanContainer(bagId, containerType)
    local items = {}
    local numSlots = GetContainerNumSlots(bagId)

    if numSlots == 0 then
        return items, 0
    end

    local totalCount = 0

    for slot = 1, numSlots do
        -- GetContainerItemInfo returns: texture, count, locked, quality, readable
        -- Note: quality can sometimes be -1, so we get it from GetItemInfo instead (Bagshui pattern)
        local texture, itemCount, locked, _, readable = GetContainerItemInfo(bagId, slot)

        if texture then  -- Slot has an item
            local link = GetContainerItemLink(bagId, slot)
            local itemId = GetItemIdFromLink(link)

            if itemId then
                -- Get richer item info from GetItemInfo (Bagshui pattern)
                local itemName, itemQuality, itemType, itemSubtype, maxStack, _ = GetFullItemInfo(itemId)

                -- Fallback: parse name from link if GetItemInfo fails
                if not itemName then
                    local _, _, name = string.find(link, "%[(.+)%]")
                    itemName = name or ("ItemID:" .. itemId)
                end

                -- Handle charges (SuperWoW returns negative count for items with charges)
                -- Pattern borrowed from Bagshui
                local charges = 0
                if itemCount and itemCount < 0 then
                    charges = math.abs(itemCount)
                    itemCount = 1
                end

                table.insert(items, {
                    name     = itemName,
                    count    = itemCount or 1,
                    quality  = itemQuality or 0,
                    itemId   = tostring(itemId),
                    slot     = slot,
                    bagId    = bagId,
                    type     = containerType,
                    itemType = itemType,      -- e.g., "Consumable", "Trade Goods"
                    subType  = itemSubtype,   -- e.g., "Potion", "Cloth"
                    maxStack = maxStack,      -- Max stack size
                    charges  = charges,       -- For items with charges (SuperWoW)
                })
                totalCount = totalCount + (itemCount or 1)
            end
        end
    end

    return items, totalCount
end

------------------------------------------------------------
-- Build flat-text export string (for tray app parsing)
------------------------------------------------------------
local function BuildFlatData()
    if not BankAltExport_Data or not BankAltExport_Data.bags then return end

    local lines = {}
    table.insert(lines, "BANKALTEXPORT_V1")
    table.insert(lines, "SCAN_TIME|" .. (BankAltExport_Data.scanTime or "unknown"))
    table.insert(lines, "ACCOUNT|" .. (BankAltExport_Data.accountName or "unknown"))
    table.insert(lines, "CHAR|" .. (BankAltExport_Data.charName or "unknown") .. "|" ..
                        (BankAltExport_Data.charClass or "unknown") .. "|" ..
                        (BankAltExport_Data.charLevel or 0))

    -- Output bag items
    for bagId, bagData in pairs(BankAltExport_Data.bags) do
        if bagData.type == "BAG" then
            for _, item in ipairs(bagData.items) do
                table.insert(lines, "BAG|" .. bagId .. "|" .. item.slot .. "|" ..
                             item.name .. "|" .. item.count .. "|" .. item.quality .. "|" .. item.itemId)
            end
        end
    end

    -- Output bank items
    for bagId, bagData in pairs(BankAltExport_Data.bags) do
        if bagData.type == "BANK" then
            for _, item in ipairs(bagData.items) do
                table.insert(lines, "BANK|" .. bagId .. "|" .. item.slot .. "|" ..
                             item.name .. "|" .. item.count .. "|" .. item.quality .. "|" .. item.itemId)
            end
        end
    end

    table.insert(lines, "ENDCHAR")
    table.insert(lines, "SUMMARY")
    table.insert(lines, "TOTAL_ITEMS|" .. (BankAltExport_Data.totalItems or 0))
    table.insert(lines, "UNIQUE_ITEMS|" .. (BankAltExport_Data.uniqueItems or 0))
    table.insert(lines, "END")

    BankAltExport_FlatData = table.concat(lines, "\n")
end

------------------------------------------------------------
-- Full scan (bags + bank if open)
------------------------------------------------------------
local function DoFullScan(includeBank)
    local bags = {}
    local summary = {}
    local totalItems = 0
    local uniqueItems = 0

    -- Get account name from saved variables path approach
    -- In vanilla WoW, we can't directly get account name, but the tray app
    -- will know based on which SavedVariables file it's reading
    local accountName = "UNKNOWN"  -- Tray app determines this from file path

    local charName = UnitName("player") or "Unknown"
    local charLevel = UnitLevel("player") or 1
    local _, charClass = UnitClass("player")
    charClass = charClass or "Unknown"

    Print("Scanning " .. charName .. " (Level " .. charLevel .. " " .. charClass .. ")...")

    -- Scan character bags (always available)
    for _, bagId in ipairs(BAG_IDS) do
        local items, count = ScanContainer(bagId, "BAG")
        if table.getn(items) > 0 then
            bags[bagId] = {
                type = "BAG",
                items = items,
                itemCount = count,
                numSlots = GetContainerNumSlots(bagId),
            }
            Print("  Bag " .. bagId .. ": " .. table.getn(items) .. " items (" .. count .. " total)")
        end
    end

    -- Scan bank (only if at banker)
    if includeBank and bankIsOpen then
        for _, bagId in ipairs(BANK_IDS) do
            local items, count = ScanContainer(bagId, "BANK")
            if table.getn(items) > 0 then
                bags[bagId] = {
                    type = "BANK",
                    items = items,
                    itemCount = count,
                    numSlots = GetContainerNumSlots(bagId),
                }
                local bagLabel = bagId == -1 and "Main Bank" or ("Bank Bag " .. (bagId - 4))
                Print("  " .. bagLabel .. ": " .. table.getn(items) .. " items (" .. count .. " total)")
            end
        end
    elseif includeBank and not bankIsOpen then
        Print("  Bank not available (not at banker)")
    end

    -- Build summary (aggregate by item name)
    for bagId, bagData in pairs(bags) do
        for _, item in ipairs(bagData.items) do
            totalItems = totalItems + item.count
            if summary[item.name] then
                summary[item.name].count = summary[item.name].count + item.count
            else
                summary[item.name] = {
                    count = item.count,
                    quality = item.quality,
                    itemId = item.itemId,
                }
                uniqueItems = uniqueItems + 1
            end
        end
    end

    -- Store data
    BankAltExport_Data = {
        scanTime      = date("%Y-%m-%d %H:%M:%S"),
        scanTimestamp = time(),
        accountName   = accountName,
        charName      = charName,
        charClass     = charClass,
        charLevel     = charLevel,
        bags          = bags,
        summary       = summary,
        totalItems    = totalItems,
        uniqueItems   = uniqueItems,
        bankScanned   = includeBank and bankIsOpen,
    }

    BuildFlatData()

    Print("Scan complete!")
    Print("  " .. uniqueItems .. " unique items | " .. totalItems .. " total")
    if includeBank and bankIsOpen then
        Print("  Bank included in scan.")
    end
    Print("  Data saves on logout, /reload, or character switch.")
end

------------------------------------------------------------
-- Events
------------------------------------------------------------
frame:RegisterEvent("ADDON_LOADED")
frame:RegisterEvent("BANKFRAME_OPENED")
frame:RegisterEvent("BANKFRAME_CLOSED")
frame:RegisterEvent("BAG_UPDATE")

frame:SetScript("OnEvent", function()
    if event == "ADDON_LOADED" and arg1 == "BankAltExport" then
        if not BankAltExport_Data then BankAltExport_Data = {} end
        if BankAltExport_Data.scanTime then
            Print("v" .. VERSION .. " loaded. Last scan: " .. BankAltExport_Data.scanTime ..
                  " (" .. (BankAltExport_Data.uniqueItems or 0) .. " unique items)")
        else
            Print("v" .. VERSION .. " loaded. Type /bae scan or open your bank to scan.")
        end
        Print("Type /bae for commands.")

    elseif event == "BANKFRAME_OPENED" then
        bankIsOpen = true
        Print("Bank opened. Auto-scanning with bank contents...")
        -- Small delay to ensure bank data is loaded
        scanPending = true

    elseif event == "BANKFRAME_CLOSED" then
        bankIsOpen = false

    elseif event == "BAG_UPDATE" then
        -- If we have a pending bank scan, execute it now (bank data should be loaded)
        if scanPending then
            scanPending = false
            DoFullScan(true)
        end
    end
end)

------------------------------------------------------------
-- Diagnostics
------------------------------------------------------------
local function PrintDiagnostics()
    Print("--- BankAltExport v" .. VERSION .. " Diagnostics ---")
    Print("Character: " .. (UnitName("player") or "?") .. " (Level " .. (UnitLevel("player") or "?") .. ")")
    Print("bankIsOpen: " .. tostring(bankIsOpen))

    Print("Character Bags:")
    for _, bagId in ipairs(BAG_IDS) do
        local numSlots = GetContainerNumSlots(bagId)
        local occupied = 0
        for slot = 1, numSlots do
            local texture = GetContainerItemInfo(bagId, slot)
            if texture then occupied = occupied + 1 end
        end
        Print("  Bag " .. bagId .. ": " .. occupied .. "/" .. numSlots .. " slots")
    end

    if bankIsOpen then
        Print("Bank Slots:")
        for _, bagId in ipairs(BANK_IDS) do
            local numSlots = GetContainerNumSlots(bagId)
            local occupied = 0
            for slot = 1, numSlots do
                local texture = GetContainerItemInfo(bagId, slot)
                if texture then occupied = occupied + 1 end
            end
            local label = bagId == -1 and "Main Bank" or ("Bank " .. (bagId - 4))
            Print("  " .. label .. ": " .. occupied .. "/" .. numSlots .. " slots")
        end
    else
        Print("Bank: Not available (not at banker)")
    end

    Print("--- End Diagnostics ---")
end

------------------------------------------------------------
-- Slash commands
------------------------------------------------------------
SLASH_BANKALTEXPORT1 = "/bankaltexport"
SLASH_BANKALTEXPORT2 = "/bae"

SlashCmdList["BANKALTEXPORT"] = function(msg)
    if not msg then msg = "" end
    msg = string.lower(msg)

    if msg == "scan" then
        DoFullScan(true)

    elseif msg == "bags" then
        -- Scan only bags (no bank)
        DoFullScan(false)

    elseif msg == "debug" then
        PrintDiagnostics()

    elseif msg == "status" then
        if BankAltExport_Data and BankAltExport_Data.scanTime then
            Print("--- Status ---")
            Print("Last scan: " .. BankAltExport_Data.scanTime)
            Print("Character: " .. (BankAltExport_Data.charName or "?") ..
                  " (Level " .. (BankAltExport_Data.charLevel or "?") .. " " ..
                  (BankAltExport_Data.charClass or "?") .. ")")
            Print("Total: " .. (BankAltExport_Data.uniqueItems or 0) .. " unique, " ..
                  (BankAltExport_Data.totalItems or 0) .. " total")
            Print("Bank scanned: " .. (BankAltExport_Data.bankScanned and "Yes" or "No"))
        else
            Print("No scan data. Type /bae scan or open your bank.")
        end

    elseif msg == "list" then
        if BankAltExport_Data and BankAltExport_Data.summary then
            Print("--- Inventory Contents (A-Z) ---")
            local sorted = {}
            for name, data in pairs(BankAltExport_Data.summary) do
                table.insert(sorted, { name = name, count = data.count, quality = data.quality })
            end
            table.sort(sorted, function(a, b) return a.name < b.name end)
            for _, item in ipairs(sorted) do
                local c = QUALITY_COLORS[item.quality] or "ffffff"
                Print("  |cFF" .. c .. item.name .. "|r x" .. item.count)
            end
            Print("--- " .. table.getn(sorted) .. " unique items ---")
        else
            Print("No data. Type /bae scan first.")
        end

    elseif msg == "clear" then
        BankAltExport_Data = {}
        BankAltExport_FlatData = ""
        Print("Data cleared.")

    else
        Print("--- BankAltExport v" .. VERSION .. " ---")
        Print("  /bae scan   - Scan bags + bank (if at banker)")
        Print("  /bae bags   - Scan bags only")
        Print("  /bae status - Last scan summary")
        Print("  /bae list   - All items sorted A-Z")
        Print("  /bae debug  - Slot diagnostics")
        Print("  /bae clear  - Clear saved data")
        Print("Auto-scans when you open the bank at a banker NPC.")
    end
end

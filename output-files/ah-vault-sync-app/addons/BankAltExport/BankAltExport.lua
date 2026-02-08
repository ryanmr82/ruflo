-- BankAltExport v2.0
-- TurtleWoW Multi-Character Bank Alt Scanner
--
-- Accumulates data for ALL characters on the same WoW account.
-- Each character login updates only that character's entry.
-- SavedVariables are shared per account, so all chars persist.
--
-- WoW 1.12.1 Container API:
--   GetContainerNumSlots(bagId)         -> number of slots
--   GetContainerItemInfo(bagId, slot)   -> texture, count, locked, quality, readable
--   GetContainerItemLink(bagId, slot)   -> item link with itemId
--
-- Bag IDs:
--   0       = Backpack (16 slots)
--   1-4     = Equipped bags
--   -1      = Main bank (24 slots, only at banker)
--   5-11    = Bank bags (only at banker)

------------------------------------------------------------
-- SavedVariables
------------------------------------------------------------
BankAltExport_Data     = BankAltExport_Data     or {}
BankAltExport_FlatData = BankAltExport_FlatData or ""

------------------------------------------------------------
-- Constants & State
------------------------------------------------------------
local frame   = CreateFrame("Frame")
local VERSION = "2.0"

local BAG_IDS  = { 0, 1, 2, 3, 4 }
local BANK_IDS = { -1, 5, 6, 7, 8, 9, 10, 11 }

local bankIsOpen = false
local scanPending = false
local scanDelay = 0
local SCAN_WAIT = 0.5

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

local function GetItemIdFromLink(link)
    if not link then return nil end
    local _, _, idStr = string.find(link, "item:(%d+)")
    if idStr then
        return tonumber(idStr)
    end
    return nil
end

local function GetFullItemInfo(itemId)
    if not itemId or not GetItemInfo then return nil end
    local name, itemString, quality, minLevel, itemType, itemSubtype, maxStack, equipLoc, texture = GetItemInfo(itemId)
    return name, quality, itemType, itemSubtype, maxStack, texture
end

------------------------------------------------------------
-- Scan a single container (bag or bank slot)
------------------------------------------------------------
local function ScanContainer(bagId, containerType)
    local items = {}
    local numSlots = GetContainerNumSlots(bagId)

    if numSlots == 0 then
        return items, 0
    end

    local totalCount = 0

    for slot = 1, numSlots do
        local texture, itemCount, locked, _, readable = GetContainerItemInfo(bagId, slot)

        if texture then
            local link = GetContainerItemLink(bagId, slot)
            local itemId = GetItemIdFromLink(link)

            if itemId then
                local itemName, itemQuality, itemType, itemSubtype, maxStack, _ = GetFullItemInfo(itemId)

                if not itemName then
                    local _, _, name = string.find(link, "%[(.+)%]")
                    itemName = name or ("ItemID:" .. itemId)
                end

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
                    itemType = itemType,
                    subType  = itemSubtype,
                    maxStack = maxStack,
                    charges  = charges,
                })
                totalCount = totalCount + (itemCount or 1)
            end
        end
    end

    return items, totalCount
end

------------------------------------------------------------
-- Migrate old v1 single-character format to v2 multi-char
------------------------------------------------------------
local function MigrateOldFormat()
    -- Detect v1 format: has charName at top level, no characters table
    if BankAltExport_Data and BankAltExport_Data.charName and not BankAltExport_Data.characters then
        local old = BankAltExport_Data
        local charName = old.charName or "Unknown"
        Print("Migrating v1 data for " .. charName .. " to v2 multi-character format...")

        BankAltExport_Data = {
            version = 2,
            characters = {},
        }
        BankAltExport_Data.characters[charName] = {
            charName    = charName,
            charClass   = old.charClass or "Unknown",
            charLevel   = old.charLevel or 1,
            bags        = old.bags or {},
            summary     = old.summary or {},
            totalItems  = old.totalItems or 0,
            uniqueItems = old.uniqueItems or 0,
            bankScanned = old.bankScanned or false,
            scanTime    = old.scanTime or "unknown",
        }
        Print("Migration complete.")
    end

    -- Ensure structure exists
    if not BankAltExport_Data.characters then
        BankAltExport_Data.characters = {}
    end
    BankAltExport_Data.version = 2
end

------------------------------------------------------------
-- Build flat-text export string (ALL characters)
------------------------------------------------------------
local function BuildFlatData()
    if not BankAltExport_Data or not BankAltExport_Data.characters then return end

    local lines = {}
    table.insert(lines, "BANKALTEXPORT_V2")
    table.insert(lines, "SCAN_TIME|" .. date("%Y-%m-%d %H:%M:%S"))
    table.insert(lines, "ACCOUNT|UNKNOWN")

    local grandTotal = 0
    local grandUnique = 0

    -- Sort character names for consistent output
    local charNames = {}
    for name, _ in pairs(BankAltExport_Data.characters) do
        table.insert(charNames, name)
    end
    table.sort(charNames)

    for _, charName in ipairs(charNames) do
        local charData = BankAltExport_Data.characters[charName]
        if charData then
            table.insert(lines, "CHAR|" .. (charData.charName or charName) .. "|" ..
                         (charData.charClass or "Unknown") .. "|" ..
                         (charData.charLevel or 0))

            -- Output bag items
            if charData.bags then
                for bagId, bagData in pairs(charData.bags) do
                    if bagData.type == "BAG" and bagData.items then
                        for _, item in ipairs(bagData.items) do
                            table.insert(lines, "BAG|" .. bagId .. "|" .. item.slot .. "|" ..
                                         item.name .. "|" .. item.count .. "|" .. item.quality .. "|" .. item.itemId)
                        end
                    end
                end

                -- Output bank items
                for bagId, bagData in pairs(charData.bags) do
                    if bagData.type == "BANK" and bagData.items then
                        for _, item in ipairs(bagData.items) do
                            table.insert(lines, "BANK|" .. bagId .. "|" .. item.slot .. "|" ..
                                         item.name .. "|" .. item.count .. "|" .. item.quality .. "|" .. item.itemId)
                        end
                    end
                end
            end

            table.insert(lines, "ENDCHAR")
            grandTotal = grandTotal + (charData.totalItems or 0)
            grandUnique = grandUnique + (charData.uniqueItems or 0)
        end
    end

    table.insert(lines, "SUMMARY")
    table.insert(lines, "TOTAL_ITEMS|" .. grandTotal)
    table.insert(lines, "UNIQUE_ITEMS|" .. grandUnique)
    table.insert(lines, "END")

    BankAltExport_FlatData = table.concat(lines, "\n")
end

------------------------------------------------------------
-- Full scan for CURRENT character (preserves all others)
------------------------------------------------------------
local function DoFullScan(includeBank)
    local bags = {}
    local summary = {}
    local totalItems = 0
    local uniqueItems = 0

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

    -- Update ONLY this character's entry (all other characters are untouched)
    BankAltExport_Data.characters[charName] = {
        charName    = charName,
        charClass   = charClass,
        charLevel   = charLevel,
        bags        = bags,
        summary     = summary,
        totalItems  = totalItems,
        uniqueItems = uniqueItems,
        bankScanned = includeBank and bankIsOpen,
        scanTime    = date("%Y-%m-%d %H:%M:%S"),
    }

    BuildFlatData()

    Print("Scan complete!")
    Print("  " .. uniqueItems .. " unique items | " .. totalItems .. " total")
    if includeBank and bankIsOpen then
        Print("  Bank included in scan.")
    end

    local charCount = 0
    for _ in pairs(BankAltExport_Data.characters) do
        charCount = charCount + 1
    end
    Print("  Tracking " .. charCount .. " character(s) total.")
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
        MigrateOldFormat()

        local charCount = 0
        for _ in pairs(BankAltExport_Data.characters) do
            charCount = charCount + 1
        end

        Print("v" .. VERSION .. " loaded. Tracking " .. charCount .. " character(s).")

        local charName = UnitName("player") or "Unknown"
        local myData = BankAltExport_Data.characters[charName]
        if myData and myData.scanTime then
            Print("  " .. charName .. " last scanned: " .. myData.scanTime ..
                  " (" .. (myData.uniqueItems or 0) .. " unique items)")
        else
            Print("  " .. charName .. " not yet scanned. Type /bae scan or open your bank.")
        end
        Print("Type /bae for commands.")

    elseif event == "BANKFRAME_OPENED" then
        bankIsOpen = true
        Print("Bank opened. Waiting for all bank bags to load...")
        scanPending = true
        scanDelay = SCAN_WAIT

    elseif event == "BANKFRAME_CLOSED" then
        bankIsOpen = false
        scanPending = false
        scanDelay = 0

    elseif event == "BAG_UPDATE" then
        if scanPending then
            scanDelay = SCAN_WAIT
        end
    end
end)

-- OnUpdate timer: waits until BAG_UPDATE events stop firing, then scans
frame:SetScript("OnUpdate", function()
    if scanPending and scanDelay > 0 then
        scanDelay = scanDelay - arg1
        if scanDelay <= 0 then
            scanPending = false
            scanDelay = 0
            Print("All bank bags loaded. Scanning...")
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

    Print("Tracked Characters:")
    for name, data in pairs(BankAltExport_Data.characters) do
        Print("  " .. name .. " (Lvl " .. (data.charLevel or "?") .. " " .. (data.charClass or "?") ..
              ") - " .. (data.uniqueItems or 0) .. " unique, " .. (data.totalItems or 0) .. " total" ..
              (data.bankScanned and " [bank]" or "") ..
              " [" .. (data.scanTime or "never") .. "]")
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
        DoFullScan(false)

    elseif msg == "debug" then
        PrintDiagnostics()

    elseif msg == "status" then
        local charCount = 0
        local totalAll = 0
        for name, data in pairs(BankAltExport_Data.characters) do
            charCount = charCount + 1
            totalAll = totalAll + (data.totalItems or 0)
        end
        Print("--- Status ---")
        Print("Tracking " .. charCount .. " character(s), " .. totalAll .. " total items")
        for name, data in pairs(BankAltExport_Data.characters) do
            local bankStr = data.bankScanned and "Yes" or "No"
            Print("  " .. name .. " (Lvl " .. (data.charLevel or "?") .. " " .. (data.charClass or "?") ..
                  ") | " .. (data.uniqueItems or 0) .. " unique, " .. (data.totalItems or 0) .. " total" ..
                  " | Bank: " .. bankStr ..
                  " | " .. (data.scanTime or "never"))
        end

    elseif msg == "list" then
        local charName = UnitName("player") or "Unknown"
        local myData = BankAltExport_Data.characters[charName]
        if myData and myData.summary then
            Print("--- " .. charName .. " Inventory (A-Z) ---")
            local sorted = {}
            for name, data in pairs(myData.summary) do
                table.insert(sorted, { name = name, count = data.count, quality = data.quality })
            end
            table.sort(sorted, function(a, b) return a.name < b.name end)
            for _, item in ipairs(sorted) do
                local c = QUALITY_COLORS[item.quality] or "ffffff"
                Print("  |cFF" .. c .. item.name .. "|r x" .. item.count)
            end
            Print("--- " .. table.getn(sorted) .. " unique items ---")
        else
            Print("No data for " .. charName .. ". Type /bae scan first.")
        end

    elseif msg == "clear" then
        BankAltExport_Data = { version = 2, characters = {} }
        BankAltExport_FlatData = ""
        Print("All character data cleared.")

    elseif msg == "clearme" then
        local charName = UnitName("player") or "Unknown"
        if BankAltExport_Data.characters[charName] then
            BankAltExport_Data.characters[charName] = nil
            BuildFlatData()
            Print("Data cleared for " .. charName .. ".")
        else
            Print("No data for " .. charName .. ".")
        end

    else
        Print("--- BankAltExport v" .. VERSION .. " ---")
        Print("  /bae scan    - Scan bags + bank (if at banker)")
        Print("  /bae bags    - Scan bags only")
        Print("  /bae status  - All tracked characters")
        Print("  /bae list    - Current char items A-Z")
        Print("  /bae debug   - Slot diagnostics")
        Print("  /bae clear   - Clear ALL character data")
        Print("  /bae clearme - Clear current character only")
        Print("Auto-scans when you open the bank at a banker NPC.")
    end
end

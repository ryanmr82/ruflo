-- GuildShopScanner - AH Price Scanner for TBC Guild Consume Shop
-- Scans auction house prices and stores them for upload to the guild website

local addonName = "GuildShopScanner"
local version = "1.0"

-- Initialize saved variables
GuildShopScannerDB = GuildShopScannerDB or {
    prices = {},
    lastScan = nil,
    scanCount = 0
}

-- Local references
local db = nil
local scanning = false
local currentPage = 0
local totalPages = 0
local itemsToScan = {}
local scannedPrices = {}
local scanStartTime = 0

-- Frame for events
local frame = CreateFrame("Frame")
frame:RegisterEvent("ADDON_LOADED")
frame:RegisterEvent("AUCTION_ITEM_LIST_UPDATE")

-- Colors
local GOLD = "|cFFFFD700"
local GREEN = "|cFF00FF00"
local RED = "|cFFFF0000"
local WHITE = "|cFFFFFFFF"
local CYAN = "|cFF00FFFF"

-- Print helper
local function Print(msg)
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "[GuildShopScanner] " .. WHITE .. msg)
end

local function PrintError(msg)
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "[GuildShopScanner] " .. RED .. msg)
end

local function PrintSuccess(msg)
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "[GuildShopScanner] " .. GREEN .. msg)
end

-- Format copper to gold string
local function FormatGold(copper)
    if not copper or copper == 0 then return "N/A" end
    local gold = math.floor(copper / 10000)
    local silver = math.floor((copper % 10000) / 100)
    local cop = copper % 100
    local result = ""
    if gold > 0 then result = result .. gold .. "g " end
    if silver > 0 then result = result .. silver .. "s " end
    if cop > 0 or result == "" then result = result .. cop .. "c" end
    return result
end

-- Get item link by ID (for searching)
local function GetItemName(itemId)
    local itemData = GuildShopScanner_Items[itemId]
    if itemData then
        return itemData.name
    end
    return nil
end

-- Build list of items to scan (excluding static-priced flasks)
local function BuildScanList()
    itemsToScan = {}
    for itemId, data in pairs(GuildShopScanner_Items) do
        if not data.static then
            table.insert(itemsToScan, {
                itemId = itemId,
                shopId = data.shopId,
                name = data.name,
                category = data.category
            })
        end
    end
    return #itemsToScan
end

-- Start AH scan
local function StartScan()
    if not AuctionFrame or not AuctionFrame:IsVisible() then
        PrintError("You must be at the Auction House to scan prices!")
        return
    end

    if scanning then
        PrintError("Scan already in progress...")
        return
    end

    local count = BuildScanList()
    if count == 0 then
        PrintError("No items to scan!")
        return
    end

    scanning = true
    scannedPrices = {}
    scanStartTime = time()
    currentPage = 1

    Print("Starting scan of " .. count .. " items...")
    ScanNextItem()
end

-- Scan next item in the list
function ScanNextItem()
    if currentPage > #itemsToScan then
        FinishScan()
        return
    end

    local item = itemsToScan[currentPage]
    if item then
        -- Query AH for this item
        QueryAuctionItems(item.name, nil, nil, nil, nil, nil, 0, 0, 0)
    end
end

-- Process auction results
local function ProcessAuctionResults()
    if not scanning then return end

    local item = itemsToScan[currentPage]
    if not item then return end

    local numItems = GetNumAuctionItems("list")
    local lowestBuyout = nil
    local foundCount = 0

    for i = 1, numItems do
        local name, texture, count, quality, canUse, level, minBid, minIncrement, buyoutPrice, bidAmount, highBidder, owner = GetAuctionItemInfo("list", i)

        -- Check if this is the item we're looking for (by name match)
        if name and name == item.name and buyoutPrice and buyoutPrice > 0 then
            -- Calculate per-item buyout
            local perItemBuyout = math.floor(buyoutPrice / count)

            if not lowestBuyout or perItemBuyout < lowestBuyout then
                lowestBuyout = perItemBuyout
            end
            foundCount = foundCount + 1
        end
    end

    -- Store result
    if lowestBuyout then
        scannedPrices[item.shopId] = lowestBuyout
        Print(CYAN .. item.shopId .. WHITE .. ": " .. GREEN .. FormatGold(lowestBuyout) .. WHITE .. " (" .. foundCount .. " auctions)")
    else
        Print(CYAN .. item.shopId .. WHITE .. ": " .. RED .. "Not found on AH")
    end

    -- Move to next item
    currentPage = currentPage + 1

    -- Small delay before next query to avoid throttling
    C_Timer.After(0.5, ScanNextItem)
end

-- Finish scan and save results
local function FinishScan()
    scanning = false

    local scanTime = time() - scanStartTime
    local priceCount = 0

    -- Save prices to DB
    for shopId, price in pairs(scannedPrices) do
        db.prices[shopId] = {
            price = price,
            scannedAt = date("%Y-%m-%d %H:%M:%S")
        }
        priceCount = priceCount + 1
    end

    db.lastScan = date("%Y-%m-%d %H:%M:%S")
    db.scanCount = (db.scanCount or 0) + 1

    PrintSuccess("Scan complete! " .. priceCount .. " prices updated in " .. scanTime .. " seconds.")
    Print("Use " .. CYAN .. "/gss export" .. WHITE .. " to generate upload data.")
end

-- Show current prices
local function ShowPrices(category)
    if not db.prices or next(db.prices) == nil then
        PrintError("No prices stored. Use /gss scan at the AH first!")
        return
    end

    Print("=== Stored Prices ===")
    if db.lastScan then
        Print("Last scan: " .. db.lastScan)
    end

    for itemId, data in pairs(GuildShopScanner_Items) do
        if not category or data.category == category then
            local priceData = db.prices[data.shopId]
            if priceData then
                Print(CYAN .. data.shopId .. WHITE .. " - " .. data.name .. ": " .. GREEN .. FormatGold(priceData.price))
            else
                Print(CYAN .. data.shopId .. WHITE .. " - " .. data.name .. ": " .. RED .. "No price")
            end
        end
    end
end

-- Export prices as JSON-like string for upload
local function ExportPrices()
    if not db.prices or next(db.prices) == nil then
        PrintError("No prices to export. Use /gss scan at the AH first!")
        return
    end

    -- Build export string
    local parts = {}
    for shopId, priceData in pairs(db.prices) do
        table.insert(parts, shopId .. "=" .. priceData.price)
    end

    local exportStr = table.concat(parts, ",")

    Print("=== Export Data ===")
    Print("Copy this to upload prices:")
    Print(WHITE .. exportStr)
    Print("")
    Print("Or run the upload script with your SavedVariables file.")
end

-- Generate curl command for upload
local function GenerateCurlCommand()
    if not db.prices or next(db.prices) == nil then
        PrintError("No prices to export!")
        return
    end

    local pricesJson = "{"
    local first = true
    for shopId, priceData in pairs(db.prices) do
        if not first then pricesJson = pricesJson .. "," end
        pricesJson = pricesJson .. '"' .. shopId .. '":' .. priceData.price
        first = false
    end
    pricesJson = pricesJson .. "}"

    Print("=== Upload Command ===")
    Print("Run this command to upload prices:")
    Print(WHITE .. 'curl -X PUT https://tbcguild.duckdns.org/api/consumes/prices -H "Content-Type: application/json" -d \'{"prices":' .. pricesJson .. ',"source":"addon"}\'')
end

-- Slash command handler
local function SlashHandler(msg)
    local cmd, arg = msg:match("^(%S*)%s*(.-)$")
    cmd = cmd:lower()

    if cmd == "scan" then
        StartScan()
    elseif cmd == "prices" or cmd == "show" then
        ShowPrices(arg ~= "" and arg or nil)
    elseif cmd == "export" then
        ExportPrices()
    elseif cmd == "curl" then
        GenerateCurlCommand()
    elseif cmd == "clear" then
        db.prices = {}
        db.lastScan = nil
        PrintSuccess("Price data cleared.")
    elseif cmd == "status" then
        Print("=== Scanner Status ===")
        Print("Version: " .. version)
        Print("Items tracked: " .. BuildScanList() .. " (+ 4 static flasks)")
        Print("Prices stored: " .. (db.prices and #db.prices or 0))
        Print("Last scan: " .. (db.lastScan or "Never"))
        Print("Total scans: " .. (db.scanCount or 0))
    else
        Print("=== GuildShopScanner Commands ===")
        Print(CYAN .. "/gss scan" .. WHITE .. " - Scan AH prices (must be at AH)")
        Print(CYAN .. "/gss prices [category]" .. WHITE .. " - Show stored prices")
        Print(CYAN .. "/gss export" .. WHITE .. " - Export prices for upload")
        Print(CYAN .. "/gss curl" .. WHITE .. " - Generate upload command")
        Print(CYAN .. "/gss clear" .. WHITE .. " - Clear stored prices")
        Print(CYAN .. "/gss status" .. WHITE .. " - Show addon status")
        Print("")
        Print("Categories: protection, melee, caster, concoctions, flasks")
    end
end

-- Event handler
frame:SetScript("OnEvent", function(self, event, ...)
    if event == "ADDON_LOADED" then
        local addon = ...
        if addon == addonName then
            db = GuildShopScannerDB

            -- Register slash commands
            SLASH_GUILDSHOPSCANNER1 = "/gss"
            SLASH_GUILDSHOPSCANNER2 = "/guildshopscanner"
            SlashCmdList["GUILDSHOPSCANNER"] = SlashHandler

            Print("v" .. version .. " loaded. Type " .. CYAN .. "/gss" .. WHITE .. " for commands.")
        end
    elseif event == "AUCTION_ITEM_LIST_UPDATE" then
        if scanning then
            ProcessAuctionResults()
        end
    end
end)

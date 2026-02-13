-- GBankExport v3.0
-- TurtleWoW Guild Bank Scanner & Exporter
--
-- TurtleWoW's guild bank is 100% custom Lua (no C-side API).
-- The internal "GuildBank" table is LOCAL — not accessible to addons.
-- Instead, we read directly from the UI frame properties:
--   GuildBankFrameItem{1-98}  -> .occupied, .itemID, .count, .tab
--   GuildBankFrameTab{1-5}    -> .unlocked
--   GuildBankFrameTab_OnClick(id) -> global function to switch tabs
--   GetItemInfo(itemID) -> name, link, quality, etc.

------------------------------------------------------------
-- SavedVariables
------------------------------------------------------------
GBankExport_Data     = GBankExport_Data     or {}
GBankExport_FlatData = GBankExport_FlatData or ""
GBankExport_Settings = GBankExport_Settings or {}

------------------------------------------------------------
-- Constants & State
------------------------------------------------------------
local frame   = CreateFrame("Frame")
local VERSION = "3.1"
local MAX_TABS  = 5
local MAX_SLOTS = 98

local bankIsOpen  = false
local isScanning  = false
local scannedTabs = {}
local tabQueue    = {}

-- Timer
local timerActive  = false
local timerElapsed = 0
local INITIAL_WAIT = 2.0   -- wait after bank opens for data to load
local TAB_DELAY    = 1.5   -- delay after tab switch for server data to arrive

local gbFrameHooked   = false
local hookRetryTimer  = 0

------------------------------------------------------------
-- Helpers
------------------------------------------------------------
local function Print(msg)
    if DEFAULT_CHAT_FRAME then
        DEFAULT_CHAT_FRAME:AddMessage("|cFF00FF00[GBankExport]|r " .. tostring(msg))
    end
end

local QUALITY_COLORS = {
    [0] = "9d9d9d", [1] = "ffffff", [2] = "1eff00",
    [3] = "0070dd", [4] = "a335ee", [5] = "ff8000",
}

local function GetSetting(key, default)
    if GBankExport_Settings[key] == nil then
        return default
    end
    return GBankExport_Settings[key]
end

------------------------------------------------------------
-- Detect how many tabs the guild has
------------------------------------------------------------
local function GetTabCount()
    local count = 0
    for i = 1, MAX_TABS do
        local tab = _G["GuildBankFrameTab" .. i]
        if tab and tab.unlocked then
            count = i
        end
    end
    return count
end

------------------------------------------------------------
-- Get tab name from the tab button text
------------------------------------------------------------
local function GetTabName(tabIdx)
    local tab = _G["GuildBankFrameTab" .. tabIdx]
    if tab then
        -- Try reading the tab's tooltip or text
        local textObj = _G["GuildBankFrameTab" .. tabIdx .. "Text"]
        if textObj and textObj.GetText then
            local txt = textObj:GetText()
            if txt and txt ~= "" then return txt end
        end
        -- Try tab.name property
        if tab.name and tab.name ~= "" then return tab.name end
    end
    return "Tab " .. tabIdx
end

------------------------------------------------------------
-- Scan items from the currently displayed tab
-- Reads directly from GuildBankFrameItem{1-98} button props
------------------------------------------------------------
local function ScanCurrentTabSlots()
    local items    = {}
    local tabTotal = 0
    local tabIdx   = 0

    for slot = 1, MAX_SLOTS do
        local btn = _G["GuildBankFrameItem" .. slot]
        if btn and btn.occupied and btn.itemID and btn.itemID ~= 0 then
            local itemID = btn.itemID
            local count  = btn.count or 1
            local name, link, quality

            -- GetItemInfo to resolve name and quality
            if GetItemInfo then
                local ok, n, l, q = pcall(GetItemInfo, itemID)
                if ok then
                    name    = n
                    link    = l
                    quality = q
                end
            end

            if not name then
                -- Fallback: check btn.name (nameIfSuffix from server)
                if btn.name and btn.name ~= "0" and btn.name ~= "" then
                    name = btn.name
                else
                    name = "ItemID:" .. itemID
                end
            end

            -- Determine which tab this slot belongs to
            if btn.tab and btn.tab > 0 then
                tabIdx = btn.tab
            end

            table.insert(items, {
                name    = name or "Unknown",
                count   = count,
                slot    = slot,
                quality = quality or 0,
                itemId  = tostring(itemID),
                link    = link or "",
            })
            tabTotal = tabTotal + count
        else
            -- Also check tab index from empty slots
            if btn and btn.tab and btn.tab > 0 and tabIdx == 0 then
                tabIdx = btn.tab
            end
        end
    end

    return items, tabTotal, tabIdx
end

------------------------------------------------------------
-- Build flat-text export string (for AutoExport.ps1)
------------------------------------------------------------
local function BuildFlatData()
    if not GBankExport_Data or not GBankExport_Data.tabs then return end

    local lines = {}
    table.insert(lines, "GBANKEXPORT_V1")
    table.insert(lines, "SCAN_TIME|" .. (GBankExport_Data.scanTime or "unknown"))
    table.insert(lines, "GUILD|" .. (GBankExport_Data.guildName or "unknown"))

    for _, tab in ipairs(GBankExport_Data.tabs) do
        table.insert(lines, "TAB|" .. tab.tabIndex .. "|" .. tab.tabName)
        for _, item in ipairs(tab.items) do
            table.insert(lines, "ITEM|" .. item.name .. "|" .. item.count .. "|" .. item.quality .. "|" .. item.itemId .. "|" .. item.slot)
        end
    end

    table.insert(lines, "SUMMARY")
    table.insert(lines, "TOTAL_ITEMS|" .. (GBankExport_Data.totalItems or 0))
    table.insert(lines, "UNIQUE_ITEMS|" .. (GBankExport_Data.uniqueItems or 0))

    if GBankExport_Data.summary then
        local sorted = {}
        for name, data in pairs(GBankExport_Data.summary) do
            table.insert(sorted, { name = name, count = data.count, quality = data.quality, itemId = data.itemId or "0" })
        end
        table.sort(sorted, function(a, b) return a.name < b.name end)
        for _, entry in ipairs(sorted) do
            table.insert(lines, "TOTAL|" .. entry.name .. "|" .. entry.count .. "|" .. entry.quality .. "|" .. entry.itemId)
        end
    end

    table.insert(lines, "END")
    GBankExport_FlatData = table.concat(lines, "\n")
end

------------------------------------------------------------
-- Finalize scan
------------------------------------------------------------
local function FinalizeScan()
    isScanning  = false
    timerActive = false

    -- Merge old tabs that weren't rescanned this time
    local freshTabSet = {}
    for _, tab in ipairs(GBankExport_Data.tabs) do
        freshTabSet[tab.tabIndex] = true
    end

    local oldTabs = GBankExport_Data._oldTabs or {}
    for tabIdx, oldTab in pairs(oldTabs) do
        if not freshTabSet[tabIdx] then
            table.insert(GBankExport_Data.tabs, oldTab)
            Print("  Kept previous data for " .. oldTab.tabName)
        end
    end
    GBankExport_Data._oldTabs = nil

    -- Sort tabs by index
    table.sort(GBankExport_Data.tabs, function(a, b) return a.tabIndex < b.tabIndex end)

    -- Recalculate summary from ALL tabs (fresh + preserved)
    local summary     = {}
    local totalItems  = 0
    local uniqueItems = 0

    for _, tab in ipairs(GBankExport_Data.tabs) do
        for _, item in ipairs(tab.items) do
            if summary[item.name] then
                summary[item.name].count = summary[item.name].count + item.count
            else
                summary[item.name] = {
                    count   = item.count,
                    quality = item.quality,
                    itemId  = item.itemId,
                }
                uniqueItems = uniqueItems + 1
            end
            totalItems = totalItems + item.count
        end
    end

    GBankExport_Data.summary     = summary
    GBankExport_Data.totalItems  = totalItems
    GBankExport_Data.uniqueItems = uniqueItems
    GBankExport_Data.guildName   = GetGuildInfo("player") or "Unknown"

    BuildFlatData()

    Print("Scan complete!")
    Print("  " .. uniqueItems .. " unique items | " .. totalItems .. " total | " .. table.getn(GBankExport_Data.tabs) .. " tabs")
    Print("  Data saves on logout, /reload, or character switch.")
end

------------------------------------------------------------
-- Scan current tab then advance
------------------------------------------------------------
local function ScanAndAdvance()
    if not isScanning or not bankIsOpen then
        if isScanning then
            Print("Bank closed. Saving partial data.")
            FinalizeScan()
        end
        return
    end

    -- Read what's currently displayed
    local items, tabTotal, detectedTab = ScanCurrentTabSlots()

    if detectedTab > 0 and not scannedTabs[detectedTab] then
        scannedTabs[detectedTab] = true
        local tabName = GetTabName(detectedTab)
        local tabData = {
            tabName     = tabName,
            tabIndex    = detectedTab,
            items       = items,
            itemCount   = tabTotal,
            uniqueCount = table.getn(items),
        }
        table.insert(GBankExport_Data.tabs, tabData)
        Print("  Tab " .. detectedTab .. " '" .. tabName .. "': " .. table.getn(items) .. " items (" .. tabTotal .. " total)")
    end

    -- Find next unscanned tab
    local nextTab = nil
    while table.getn(tabQueue) > 0 do
        local candidate = table.remove(tabQueue, 1)
        if not scannedTabs[candidate] then
            nextTab = candidate
            break
        end
    end

    if not nextTab then
        FinalizeScan()
        return
    end

    -- Switch to next tab
    local tabBtn = _G["GuildBankFrameTab" .. nextTab]
    if tabBtn and tabBtn.unlocked and GuildBankFrameTab_OnClick then
        Print("  Switching to tab " .. nextTab .. "...")
        pcall(GuildBankFrameTab_OnClick, nextTab)
        -- Schedule next scan after delay (wait for server data)
        timerActive  = true
        timerElapsed = -TAB_DELAY
    else
        -- Tab not available, skip
        scannedTabs[nextTab] = true
        ScanAndAdvance()
    end
end

------------------------------------------------------------
-- Start full scan
------------------------------------------------------------
local function StartFullScan()
    if isScanning then
        Print("Scan already running.")
        return
    end
    if not bankIsOpen then
        Print("Guild bank must be open!")
        return
    end

    local numTabs = GetTabCount()
    if numTabs == 0 then
        Print("No unlocked tabs detected.")
        Print("Type /gbe debug while the bank is open for diagnostics.")
        return
    end

    isScanning  = true
    scannedTabs = {}
    tabQueue    = {}
    timerActive = false

    -- Preserve old tab data for tabs we don't rescan this time
    local oldTabs = {}
    if GBankExport_Data and GBankExport_Data.tabs then
        for _, tab in ipairs(GBankExport_Data.tabs) do
            oldTabs[tab.tabIndex] = tab
        end
    end

    GBankExport_Data = {
        scanTime      = date("%Y-%m-%d %H:%M:%S"),
        scanTimestamp = time(),
        guildName     = GetGuildInfo("player") or "Unknown",
        playerName    = UnitName("player") or "Unknown",
        tabs          = {},
        summary       = {},
        totalItems    = 0,
        uniqueItems   = 0,
        _oldTabs      = oldTabs,
    }

    for i = 1, numTabs do
        table.insert(tabQueue, i)
    end

    Print("Scanning " .. numTabs .. " tab(s)...")
    ScanAndAdvance()
end

------------------------------------------------------------
-- Hook GuildBankFrame
------------------------------------------------------------
local function HookGuildBankFrame()
    if gbFrameHooked then return end
    if not GuildBankFrame then return end
    gbFrameHooked = true

    local origOnShow = GuildBankFrame:GetScript("OnShow")
    GuildBankFrame:SetScript("OnShow", function()
        if origOnShow then origOnShow() end
        bankIsOpen = true

        -- Check if auto-scan is enabled
        if not GetSetting("autoScan", true) then
            Print("Guild bank opened. Auto-scan is OFF. Use /gbe scan to scan manually.")
            return
        end

        -- Check cooldown
        local cooldownMinutes = GetSetting("cooldownMinutes", 30)
        if cooldownMinutes > 0 and GBankExport_Data and GBankExport_Data.scanTimestamp then
            local elapsed = time() - GBankExport_Data.scanTimestamp
            local cooldownSeconds = cooldownMinutes * 60
            if elapsed < cooldownSeconds then
                local minutesAgo = math.floor(elapsed / 60)
                Print("Skipping auto-scan (last scan " .. minutesAgo .. " min ago, cooldown " .. cooldownMinutes .. " min).")
                Print("Use /gbe scan to force a scan at any time.")
                return
            end
        end

        Print("Guild bank opened. Waiting for data to load...")
        timerActive  = true
        timerElapsed = -INITIAL_WAIT  -- negative = countdown to scan start
    end)

    local origOnHide = GuildBankFrame:GetScript("OnHide")
    GuildBankFrame:SetScript("OnHide", function()
        if origOnHide then origOnHide() end
        bankIsOpen = false
        if isScanning then
            Print("Bank closed mid-scan. Saving partial data.")
            FinalizeScan()
        end
    end)

    Print("Hooked GuildBankFrame.")

    -- If bank is already open (e.g. player did /reload with bank open)
    if GuildBankFrame:IsVisible() then
        bankIsOpen = true
        if not GetSetting("autoScan", true) then
            Print("Guild bank already open. Auto-scan is OFF.")
        else
            local cooldownMinutes = GetSetting("cooldownMinutes", 30)
            local shouldScan = true
            if cooldownMinutes > 0 and GBankExport_Data and GBankExport_Data.scanTimestamp then
                local elapsed = time() - GBankExport_Data.scanTimestamp
                if elapsed < cooldownMinutes * 60 then
                    shouldScan = false
                    local minutesAgo = math.floor(elapsed / 60)
                    Print("Bank already open. Skipping auto-scan (last scan " .. minutesAgo .. " min ago).")
                end
            end
            if shouldScan then
                Print("Guild bank already open. Scanning in " .. INITIAL_WAIT .. "s...")
                timerActive  = true
                timerElapsed = -INITIAL_WAIT
            end
        end
    end
end

------------------------------------------------------------
-- Events
------------------------------------------------------------
frame:RegisterEvent("ADDON_LOADED")

frame:SetScript("OnEvent", function()
    if event == "ADDON_LOADED" then
        if arg1 == "GBankExport" then
            if not GBankExport_Data then GBankExport_Data = {} end
            if GBankExport_Data.scanTime then
                Print("v" .. VERSION .. " loaded. Last scan: " .. GBankExport_Data.scanTime .. " (" .. (GBankExport_Data.uniqueItems or 0) .. " unique items)")
            else
                Print("v" .. VERSION .. " loaded. Open the guild bank to auto-scan.")
            end
            Print("Type /gbe for commands.")
        end
        -- Try to hook GuildBankFrame on every addon load (idempotent, safe)
        -- Handles load-on-demand guild bank UI loading after our addon
        if not gbFrameHooked then
            HookGuildBankFrame()
        end
    end
end)

------------------------------------------------------------
-- OnUpdate timer
------------------------------------------------------------
frame:SetScript("OnUpdate", function()
    -- Retry hooking GuildBankFrame every 2 seconds until successful
    if not gbFrameHooked then
        hookRetryTimer = hookRetryTimer + arg1
        if hookRetryTimer >= 2 then
            hookRetryTimer = 0
            HookGuildBankFrame()
        end
    end

    if not timerActive then return end
    timerElapsed = timerElapsed + arg1

    if timerElapsed >= 0 then
        timerActive = false

        if not isScanning then
            -- Initial wait finished — start scanning
            StartFullScan()
        else
            -- Tab switch delay finished — scan now
            ScanAndAdvance()
        end
    end
end)

------------------------------------------------------------
-- Diagnostics
------------------------------------------------------------
local function PrintDiagnostics()
    Print("--- GBankExport v" .. VERSION .. " Diagnostics ---")
    Print("GuildBankFrame: " .. (GuildBankFrame and "EXISTS" or "NIL"))
    if GuildBankFrame then
        Print("  :IsVisible(): " .. tostring(GuildBankFrame:IsVisible()))
    end
    Print("GuildBankFrameTab_OnClick: " .. (GuildBankFrameTab_OnClick and "EXISTS" or "NIL"))
    Print("GetItemInfo: " .. (GetItemInfo and "EXISTS" or "NIL"))

    -- Tab buttons
    for i = 1, MAX_TABS do
        local tab = _G["GuildBankFrameTab" .. i]
        if tab then
            local unlocked = tab.unlocked and "YES" or "NO"
            local checked  = tab.GetChecked and tab:GetChecked() and "YES" or "NO"
            Print("  Tab" .. i .. ": exists, unlocked=" .. unlocked .. ", checked=" .. checked)
        else
            Print("  Tab" .. i .. ": NIL")
        end
    end

    Print("GetTabCount(): " .. GetTabCount())

    -- Sample slot buttons
    Print("Slot buttons (first 5):")
    for i = 1, 5 do
        local btn = _G["GuildBankFrameItem" .. i]
        if btn then
            local occ = btn.occupied and "YES" or "NO"
            local id  = btn.itemID or "nil"
            local cnt = btn.count or "nil"
            local tab = btn.tab or "nil"
            Print("  Item" .. i .. ": occupied=" .. occ .. " itemID=" .. tostring(id) .. " count=" .. tostring(cnt) .. " tab=" .. tostring(tab))
            -- Try GetItemInfo if itemID > 0
            if btn.itemID and btn.itemID > 0 and GetItemInfo then
                local ok, name = pcall(GetItemInfo, btn.itemID)
                if ok and name then
                    Print("    -> " .. name)
                end
            end
        else
            Print("  Item" .. i .. ": NIL")
        end
    end

    -- Check total occupied slots
    local totalOccupied = 0
    for i = 1, MAX_SLOTS do
        local btn = _G["GuildBankFrameItem" .. i]
        if btn and btn.occupied then
            totalOccupied = totalOccupied + 1
        end
    end
    Print("Total occupied slots visible: " .. totalOccupied)

    Print("gbFrameHooked: " .. tostring(gbFrameHooked))
    Print("bankIsOpen: " .. tostring(bankIsOpen))
    Print("isScanning: " .. tostring(isScanning))
    Print("--- End Diagnostics ---")
end

------------------------------------------------------------
-- Slash commands
------------------------------------------------------------
SLASH_GBANKEXPORT1 = "/gbankexport"
SLASH_GBANKEXPORT2 = "/gbe"

SlashCmdList["GBANKEXPORT"] = function(msg)
    if not msg then msg = "" end
    msg = string.lower(msg)

    if msg == "scan" then
        StartFullScan()

    elseif msg == "debug" then
        PrintDiagnostics()

    elseif msg == "status" then
        if GBankExport_Data and GBankExport_Data.scanTime then
            Print("--- Status ---")
            Print("Last scan: " .. GBankExport_Data.scanTime)
            Print("Scanned by: " .. (GBankExport_Data.playerName or "?"))
            Print("Guild: " .. (GBankExport_Data.guildName or "?"))
            Print("Total: " .. (GBankExport_Data.uniqueItems or 0) .. " unique, " .. (GBankExport_Data.totalItems or 0) .. " total")
            if GBankExport_Data.tabs then
                for _, tab in ipairs(GBankExport_Data.tabs) do
                    Print("  " .. tab.tabName .. ": " .. tab.uniqueCount .. " unique, " .. tab.itemCount .. " total")
                end
            end
        else
            Print("No scan data. Open the guild bank to scan.")
        end

    elseif msg == "list" then
        if GBankExport_Data and GBankExport_Data.summary then
            Print("--- Guild Bank Contents (A-Z) ---")
            local sorted = {}
            for name, data in pairs(GBankExport_Data.summary) do
                table.insert(sorted, { name = name, count = data.count, quality = data.quality })
            end
            table.sort(sorted, function(a, b) return a.name < b.name end)
            for _, item in ipairs(sorted) do
                local c = QUALITY_COLORS[item.quality] or "ffffff"
                Print("  |cFF" .. c .. item.name .. "|r x" .. item.count)
            end
            Print("--- " .. table.getn(sorted) .. " unique items ---")
        else
            Print("No data. Open the guild bank first.")
        end

    elseif msg == "tabs" then
        if GBankExport_Data and GBankExport_Data.tabs then
            for _, tab in ipairs(GBankExport_Data.tabs) do
                Print("--- " .. tab.tabName .. " (" .. tab.itemCount .. " items) ---")
                for _, item in ipairs(tab.items) do
                    local c = QUALITY_COLORS[item.quality] or "ffffff"
                    Print("  |cFF" .. c .. item.name .. "|r x" .. item.count)
                end
            end
        else
            Print("No data. Open the guild bank first.")
        end

    elseif msg == "auto" then
        local current = GetSetting("autoScan", true)
        GBankExport_Settings.autoScan = not current
        if GBankExport_Settings.autoScan then
            Print("Auto-scan: ON — will scan when guild bank opens (subject to cooldown).")
        else
            Print("Auto-scan: OFF — use /gbe scan to scan manually.")
        end

    elseif string.find(msg, "^cooldown") then
        local _, _, val = string.find(msg, "cooldown%s+(%d+)")
        if val then
            val = tonumber(val)
            GBankExport_Settings.cooldownMinutes = val
            if val == 0 then
                Print("Scan cooldown: DISABLED — will auto-scan every time the bank is opened.")
            else
                Print("Scan cooldown: " .. val .. " minutes.")
            end
        else
            local current = GetSetting("cooldownMinutes", 30)
            Print("Current scan cooldown: " .. current .. " minutes. Usage: /gbe cooldown <minutes>")
        end

    elseif msg == "settings" then
        Print("--- GBankExport Settings ---")
        Print("  Auto-scan: " .. (GetSetting("autoScan", true) and "ON" or "OFF"))
        Print("  Cooldown:  " .. GetSetting("cooldownMinutes", 30) .. " minutes")
        Print("  Use /gbe auto to toggle, /gbe cooldown <min> to adjust.")

    else
        Print("--- GBankExport v" .. VERSION .. " ---")
        Print("  /gbe scan       - Rescan (guild bank must be open)")
        Print("  /gbe auto       - Toggle auto-scan on/off")
        Print("  /gbe cooldown # - Set cooldown (minutes, 0=off)")
        Print("  /gbe settings   - Show current settings")
        Print("  /gbe status     - Last scan summary")
        Print("  /gbe list       - All items sorted A-Z")
        Print("  /gbe tabs       - Items by tab")
        Print("  /gbe debug      - API diagnostics")
    end
end

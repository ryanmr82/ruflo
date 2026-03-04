-- GuildTracker — tracks guild member joins and leaves with timestamps
-- Vanilla WoW 1.12 / TurtleWoW compatible (Lua 5.0)

GuildTracker_DB = nil

local GT = {}
GT.initialized = false
GT.scanDelay = 0
GT.pendingScan = false

-- Class colors for display
local CLASS_COLORS = {
    ["Warrior"] = "|cffc79c6e",
    ["Paladin"] = "|cfff58cba",
    ["Hunter"] = "|cffabd473",
    ["Rogue"] = "|cfffff569",
    ["Priest"] = "|cffffffff",
    ["Shaman"] = "|cff0070de",
    ["Mage"] = "|cff69ccf0",
    ["Warlock"] = "|cff9482c9",
    ["Druid"] = "|cffff7d0a",
}

local function CC(class, name)
    local c = CLASS_COLORS[class] or "|cffcccccc"
    return c .. name .. "|r"
end

local function Msg(text)
    DEFAULT_CHAT_FRAME:AddMessage("|cff00ccff[GuildTracker]|r " .. text)
end

local function GetTimestamp()
    -- Returns "MM/DD/YY HH:MM" format
    return date("%m/%d/%y %H:%M")
end

local function GetDateOnly()
    return date("%m/%d/%y")
end

-- Parse a stored timestamp "MM/DD/YY HH:MM" into a comparable table
local function ParseDate(str)
    if not str then return nil end
    local _, _, mo, d, y, h, mi = string.find(str, "(%d+)/(%d+)/(%d+) (%d+):(%d+)")
    if not mo then return nil end
    return {
        year = tonumber(y),
        month = tonumber(mo),
        day = tonumber(d),
        hour = tonumber(h),
        minute = tonumber(mi),
    }
end

-- Convert parsed date to a sortable number (YYMMDDHHmm)
local function DateToNum(str)
    local p = ParseDate(str)
    if not p then return 0 end
    return p.year * 100000000 + p.month * 1000000 + p.day * 10000 + p.hour * 100 + p.minute
end

-- Calculate rough days between two date strings
local function DaysBetween(older, newer)
    local o = ParseDate(older)
    local n = ParseDate(newer)
    if not o or not n then return 999 end
    -- Rough calculation: convert to days since epoch-ish
    local function toDays(p)
        return (p.year * 365) + (p.month * 30) + p.day + (p.hour / 24)
    end
    return toDays(n) - toDays(o)
end

-- Scan the guild roster and detect changes
GT.scanning = false
local function ScanRoster()
    if not IsInGuild() then return end
    if GT.scanning then return end  -- prevent re-entry from SetGuildRosterShowOffline triggering GUILD_ROSTER_UPDATE
    GT.scanning = true

    -- Temporarily show offline members so the full roster is returned.
    local prevShowOffline = GetGuildRosterShowOffline()
    SetGuildRosterShowOffline(1)

    local numMembers = GetNumGuildMembers()
    if numMembers == 0 then
        SetGuildRosterShowOffline(prevShowOffline)
        GT.scanning = false
        return
    end

    local db = GuildTracker_DB
    local now = GetTimestamp()
    local currentRoster = {}

    for i = 1, numMembers do
        local name, rank, rankIndex, level, class, zone, note, officernote, online, status = GetGuildRosterInfo(i)
        if name and name ~= "" then
            currentRoster[name] = {
                rank = rank or "?",
                rankIndex = rankIndex or 0,
                level = level or 0,
                class = class or "?",
                zone = zone or "",
                online = online or false,
            }
        end
    end

    -- First run: seed the roster without logging everything as "joins"
    if not db.initialized then
        Msg("First scan — seeding roster with |cff00ff00" .. numMembers .. "|r current members.")
        db.roster = {}
        for name, info in pairs(currentRoster) do
            db.roster[name] = {
                firstSeen = now,
                lastSeen = now,
                rank = info.rank,
                level = info.level,
                class = info.class,
            }
        end
        db.initialized = true
        db.seedDate = now
        db.seedCount = numMembers
        Msg("Tracking started. Future joins and leaves will be logged.")
        SetGuildRosterShowOffline(prevShowOffline)
        GT.scanning = false
        return
    end

    -- Ensure levelHistory table exists
    if not db.levelHistory then
        db.levelHistory = {}
    end

    local today = GetDateOnly()

    -- Detect NEW members (in current but not in saved)
    local newJoins = 0
    for name, info in pairs(currentRoster) do
        if not db.roster[name] then
            -- New member detected
            newJoins = newJoins + 1
            db.roster[name] = {
                firstSeen = now,
                lastSeen = now,
                rank = info.rank,
                level = info.level,
                class = info.class,
            }

            -- Log the join
            local entry = {
                type = "join",
                name = name,
                date = now,
                level = info.level,
                class = info.class,
                rank = info.rank,
            }
            table.insert(db.log, entry)

            Msg("|cff00ff00+JOIN|r " .. CC(info.class, name) .. " (Lv" .. info.level .. " " .. info.class .. ", " .. info.rank .. ")")

            -- Record initial level snapshot for new member
            if info.level < 60 then
                if not db.levelHistory[name] then
                    db.levelHistory[name] = {}
                end
                db.levelHistory[name][today] = info.level
            end
        else
            -- Existing member — update last seen and current info
            db.roster[name].lastSeen = now
            db.roster[name].level = info.level
            db.roster[name].rank = info.rank
            db.roster[name].class = info.class

            -- Record daily level snapshot for under-60 members
            if info.level < 60 then
                if not db.levelHistory[name] then
                    db.levelHistory[name] = {}
                end
                -- Only write once per day to keep data compact
                if not db.levelHistory[name][today] then
                    db.levelHistory[name][today] = info.level
                end
            end
        end
    end

    -- Detect DEPARTED members (in saved but not in current)
    local departed = 0
    for name, info in pairs(db.roster) do
        if not currentRoster[name] and not info.departed then
            -- Member left or was kicked
            departed = departed + 1
            info.departed = true
            info.departedDate = now

            local entry = {
                type = "leave",
                name = name,
                date = now,
                level = info.level or 0,
                class = info.class or "?",
                rank = info.rank or "?",
                firstSeen = info.firstSeen,
            }
            table.insert(db.log, entry)

            Msg("|cffff4444-LEFT|r " .. CC(info.class or "?", name) .. " (Lv" .. (info.level or 0) .. " " .. (info.class or "?") .. ", was " .. (info.rank or "?") .. ")")
        end
    end

    if newJoins > 0 or departed > 0 then
        Msg("Scan complete: |cff00ff00+" .. newJoins .. " joins|r, |cffff4444-" .. departed .. " leaves|r (total: " .. numMembers .. ")")
    end

    -- Restore the user's original show-offline setting
    SetGuildRosterShowOffline(prevShowOffline)
    GT.scanning = false
end

-- Slash command handler
local function HandleCommand(msg)
    if not msg then msg = "" end
    msg = string.lower(msg)

    -- Trim whitespace
    local _, _, cmd, args = string.find(msg, "^(%S+)%s*(.*)")
    if not cmd then cmd = msg end

    local db = GuildTracker_DB

    if cmd == "" or cmd == "help" then
        Msg("|cff00ff00=== GuildTracker Commands ===|r")
        Msg("  /gt |cff66bbffstatus|r — Current tracking status")
        Msg("  /gt |cff66bbffjoins|r — Recent joins (last 7 days)")
        Msg("  /gt |cff66bbffleaves|r — Recent leaves (last 7 days)")
        Msg("  /gt |cff66bbfftoday|r — Today's joins and leaves")
        Msg("  /gt |cff66bbffweek|r — This week's summary")
        Msg("  /gt |cff66bbffstats|r — Overall stats since tracking started")
        Msg("  /gt |cff66bbffall|r — Full join/leave log")
        Msg("  /gt |cff66bbffleveling|r — Under-60 leveling progress")
        Msg("  /gt |cff66bbffscan|r — Force a roster scan now")
        Msg("  /gt |cff66bbffreset|r — Reset all tracking data (re-seed)")
        return
    end

    if not db or not db.initialized then
        Msg("Not initialized yet. Make sure you're in a guild and type |cff66bbff/gt scan|r")
        return
    end

    if cmd == "scan" then
        SetGuildRosterShowOffline(1)
        GuildRoster()  -- Request fresh data
        GT.pendingScan = true
        Msg("Requesting roster update...")
        return
    end

    if cmd == "reset" then
        GuildTracker_DB = { roster = {}, log = {}, initialized = false }
        GT.initialized = false
        Msg("|cffff4444Tracking data reset.|r Next roster update will re-seed.")
        GuildRoster()
        GT.pendingScan = true
        return
    end

    if cmd == "status" then
        local total = 0
        local active = 0
        for name, info in pairs(db.roster) do
            total = total + 1
            if not info.departed then active = active + 1 end
        end
        Msg("|cff00ff00=== Tracking Status ===|r")
        Msg("  Tracking since: |cff66bbff" .. (db.seedDate or "?") .. "|r")
        Msg("  Initial roster:  |cff66bbff" .. (db.seedCount or "?") .. "|r members")
        Msg("  Current tracked: |cff66bbff" .. active .. "|r active, " .. (total - active) .. " departed")
        Msg("  Log entries:     |cff66bbff" .. table.getn(db.log) .. "|r")
        return
    end

    if cmd == "stats" then
        local joins = 0
        local leaves = 0
        for i = 1, table.getn(db.log) do
            if db.log[i].type == "join" then joins = joins + 1
            elseif db.log[i].type == "leave" then leaves = leaves + 1
            end
        end
        local days = DaysBetween(db.seedDate or GetTimestamp(), GetTimestamp())
        if days < 1 then days = 1 end
        Msg("|cff00ff00=== Stats since " .. (db.seedDate or "?") .. " ===|r")
        Msg("  Total joins:  |cff00ff00" .. joins .. "|r")
        Msg("  Total leaves: |cffff4444" .. leaves .. "|r")
        Msg("  Net change:   " .. (joins - leaves >= 0 and "|cff00ff00+" or "|cffff4444") .. (joins - leaves) .. "|r")
        Msg("  Days tracked: |cff66bbff" .. string.format("%.1f", days) .. "|r")
        if days >= 1 then
            Msg("  Avg joins/day:  |cff66bbff" .. string.format("%.1f", joins / days) .. "|r")
            Msg("  Avg leaves/day: |cff66bbff" .. string.format("%.1f", leaves / days) .. "|r")
        end
        return
    end

    if cmd == "today" then
        local today = GetDateOnly()
        local joins = 0
        local leaves = 0
        Msg("|cff00ff00=== Today (" .. today .. ") ===|r")
        for i = 1, table.getn(db.log) do
            local e = db.log[i]
            -- Check if date starts with today's date
            if e.date and string.find(e.date, today, 1, true) then
                if e.type == "join" then
                    joins = joins + 1
                    Msg("  |cff00ff00+JOIN|r " .. CC(e.class, e.name) .. " Lv" .. e.level .. " " .. e.class)
                elseif e.type == "leave" then
                    leaves = leaves + 1
                    Msg("  |cffff4444-LEFT|r " .. CC(e.class, e.name) .. " Lv" .. e.level .. " " .. e.class)
                end
            end
        end
        Msg("  Today: |cff00ff00+" .. joins .. " joins|r, |cffff4444-" .. leaves .. " leaves|r")
        return
    end

    if cmd == "joins" or cmd == "leaves" then
        local filterType = cmd == "joins" and "join" or "leave"
        local label = cmd == "joins" and "+JOIN" or "-LEFT"
        local color = cmd == "joins" and "|cff00ff00" or "|cffff4444"
        local now = GetTimestamp()
        local count = 0

        Msg(color .. "=== Recent " .. (cmd == "joins" and "Joins" or "Leaves") .. " (last 7 days) ===|r")
        -- Show in reverse order (newest first)
        local logLen = table.getn(db.log)
        for i = logLen, 1, -1 do
            local e = db.log[i]
            if e.type == filterType then
                local days = DaysBetween(e.date, now)
                if days <= 7 then
                    count = count + 1
                    local dayStr
                    if days < 1 then
                        dayStr = "today"
                    else
                        dayStr = string.format("%.0f", days) .. "d ago"
                    end
                    Msg("  " .. color .. label .. "|r " .. CC(e.class, e.name) .. " Lv" .. e.level .. " " .. e.class .. " — " .. dayStr .. " (" .. e.date .. ")")
                end
            end
        end
        if count == 0 then
            Msg("  No " .. (cmd == "joins" and "joins" or "leaves") .. " in the last 7 days.")
        else
            Msg("  Total: " .. count)
        end
        return
    end

    if cmd == "week" then
        local now = GetTimestamp()
        local joins = 0
        local leaves = 0
        local joinsByDay = {}
        local leavesByDay = {}

        for i = 1, table.getn(db.log) do
            local e = db.log[i]
            local days = DaysBetween(e.date, now)
            if days <= 7 then
                -- Extract just the date portion
                local _, _, dateOnly = string.find(e.date, "^(%S+)")
                if e.type == "join" then
                    joins = joins + 1
                    joinsByDay[dateOnly] = (joinsByDay[dateOnly] or 0) + 1
                elseif e.type == "leave" then
                    leaves = leaves + 1
                    leavesByDay[dateOnly] = (leavesByDay[dateOnly] or 0) + 1
                end
            end
        end

        Msg("|cff00ff00=== This Week's Summary ===|r")
        Msg("  Joins:  |cff00ff00" .. joins .. "|r")
        Msg("  Leaves: |cffff4444" .. leaves .. "|r")
        Msg("  Net:    " .. (joins - leaves >= 0 and "|cff00ff00+" or "|cffff4444") .. (joins - leaves) .. "|r")

        -- Show per-day breakdown
        local allDays = {}
        for d, _ in pairs(joinsByDay) do
            allDays[d] = true
        end
        for d, _ in pairs(leavesByDay) do
            allDays[d] = true
        end
        for d, _ in pairs(allDays) do
            local j = joinsByDay[d] or 0
            local l = leavesByDay[d] or 0
            Msg("  " .. d .. ": |cff00ff00+" .. j .. "|r / |cffff4444-" .. l .. "|r")
        end
        return
    end

    if cmd == "leveling" then
        Msg("|cff00ff00=== Leveling Tracker ===|r")
        if not db.levelHistory then
            Msg("  No level history data yet. Data is recorded daily.")
            return
        end
        local count = 0
        local levelers = 0
        for name, history in pairs(db.levelHistory) do
            local member = db.roster[name]
            if member and not member.departed and member.level < 60 then
                count = count + 1
                -- Find min and max level in history
                local minLvl = 999
                local maxLvl = 0
                local days = 0
                for dateKey, lvl in pairs(history) do
                    days = days + 1
                    if lvl < minLvl then minLvl = lvl end
                    if lvl > maxLvl then maxLvl = lvl end
                end
                local gained = maxLvl - minLvl
                if gained > 0 then
                    levelers = levelers + 1
                    local vel = string.format("%.1f", gained / math.max(days, 1))
                    Msg("  " .. CC(member.class, name) .. " Lv" .. minLvl .. " -> " .. maxLvl .. " (+" .. gained .. ", " .. vel .. "/day, " .. days .. " days)")
                end
            end
        end
        if levelers == 0 then
            Msg("  No leveling progress detected yet. Check back after a few days.")
        end
        Msg("  Tracking " .. count .. " under-60 members, " .. levelers .. " actively leveling.")
        return
    end

    if cmd == "all" then
        Msg("|cff00ff00=== Full Log (" .. table.getn(db.log) .. " entries) ===|r")
        for i = 1, table.getn(db.log) do
            local e = db.log[i]
            if e.type == "join" then
                Msg("  |cff00ff00+JOIN|r " .. CC(e.class, e.name) .. " Lv" .. e.level .. " " .. e.class .. " — " .. e.date)
            elseif e.type == "leave" then
                Msg("  |cffff4444-LEFT|r " .. CC(e.class, e.name) .. " Lv" .. e.level .. " " .. e.class .. " — " .. e.date)
            end
        end
        return
    end

    Msg("Unknown command: " .. cmd .. " — type |cff66bbff/gt help|r")
end

-- Main frame and event handling
local frame = CreateFrame("Frame", "GuildTrackerFrame", UIParent)
frame:RegisterEvent("ADDON_LOADED")
frame:RegisterEvent("GUILD_ROSTER_UPDATE")
frame:RegisterEvent("PLAYER_ENTERING_WORLD")

frame:SetScript("OnEvent", function()
    if event == "ADDON_LOADED" and arg1 == "GuildTracker" then
        -- Initialize DB
        if not GuildTracker_DB then
            GuildTracker_DB = {
                roster = {},
                log = {},
                initialized = false,
            }
        end
        if not GuildTracker_DB.log then GuildTracker_DB.log = {} end
        if not GuildTracker_DB.roster then GuildTracker_DB.roster = {} end
        if not GuildTracker_DB.levelHistory then GuildTracker_DB.levelHistory = {} end

        Msg("v1.1 loaded. Type |cff66bbff/gt help|r for commands.")
    end

    if event == "PLAYER_ENTERING_WORLD" then
        -- Request guild roster data after entering world
        if IsInGuild() then
            SetGuildRosterShowOffline(1)
            GuildRoster()
            GT.pendingScan = true
        end
    end

    if event == "GUILD_ROSTER_UPDATE" then
        -- Small delay to let data settle, then scan
        if GuildTracker_DB and IsInGuild() then
            ScanRoster()
            GT.pendingScan = false
        end
    end
end)

-- Register slash commands
SLASH_GUILDTRACKER1 = "/guildtracker"
SLASH_GUILDTRACKER2 = "/gt"
SlashCmdList["GUILDTRACKER"] = HandleCommand

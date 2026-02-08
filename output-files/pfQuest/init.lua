-- pfQuest Initialization
-- TurtleWoW Interface 11200 Compatible

pfQuest = pfQuest or {}
pfQuest.version = "4.7.5"
pfQuest.loaded = {}
pfQuest.config = {}

-- Default Configuration
pfQuest.config.tracker = {
  ["enabled"] = true,
  ["visible"] = true,
  ["x"] = 20,
  ["y"] = -100,
  ["width"] = 300,
  ["height"] = 150,
  ["point"] = "TOPLEFT",
  ["relativePoint"] = "TOPLEFT",
}

pfQuest.config.browser = {
  ["enabled"] = true,
  ["showLowLevel"] = false,
  ["showHighLevel"] = true,
  ["showCompleted"] = false,
}

pfQuest.config.map = {
  ["enabled"] = true,
  ["showNodes"] = true,
  ["nodeSize"] = 12,
}

pfQuest.config.tooltip = {
  ["enabled"] = true,
  ["showQuestLevel"] = true,
  ["showObjectives"] = true,
}

pfQuest.config.arrow = {
  ["enabled"] = false,
  ["scale"] = 1.0,
}

-- Color definitions
pfQuest.colors = {
  ["red"] = "|cffff5555",
  ["green"] = "|cff55ff55", 
  ["blue"] = "|cff5555ff",
  ["yellow"] = "|cffffff00",
  ["orange"] = "|cffff8800",
  ["gray"] = "|cff888888",
  ["white"] = "|cffffffff",
  ["close"] = "|r",
}

-- Initialize addon
local function pfQuestInit()
  -- Create saved variables if they don't exist
  if not pfDB then pfDB = {} end
  if not pfDB_chars then pfDB_chars = {} end
  
  local player = UnitName("player")
  if not pfDB_chars[player] then
    pfDB_chars[player] = {}
  end
  
  pfQuest.player = pfDB_chars[player]
  
  -- Load configuration from saved variables
  for module, config in pairs(pfQuest.config) do
    if pfDB[module] then
      for key, value in pairs(pfDB[module]) do
        pfQuest.config[module][key] = value
      end
    end
  end
  
  pfQuest:Print("pfQuest v" .. pfQuest.version .. " loaded successfully")
end

-- Utility functions
function pfQuest:Print(msg)
  if DEFAULT_CHAT_FRAME then
    DEFAULT_CHAT_FRAME:AddMessage(pfQuest.colors.green .. "[pfQuest]" .. pfQuest.colors.close .. " " .. msg)
  end
end

function pfQuest:SaveConfig()
  for module, config in pairs(pfQuest.config) do
    pfDB[module] = config
  end
end

function pfQuest:GetPlayerLevel()
  return UnitLevel("player")
end

function pfQuest:GetQuestColor(level)
  local playerLevel = UnitLevel("player")
  local diff = level - playerLevel
  
  if diff >= 5 then
    return pfQuest.colors.red
  elseif diff >= 3 then
    return pfQuest.colors.orange
  elseif diff >= -2 then
    return pfQuest.colors.yellow
  elseif diff >= -4 then
    return pfQuest.colors.green
  else
    return pfQuest.colors.gray
  end
end

-- Event handling
pfQuest.events = CreateFrame("Frame")
pfQuest.events:RegisterEvent("ADDON_LOADED")
pfQuest.events:RegisterEvent("PLAYER_LOGIN")
pfQuest.events:RegisterEvent("PLAYER_LOGOUT")

pfQuest.events:SetScript("OnEvent", function()
  if event == "ADDON_LOADED" and arg1 == "pfQuest" then
    pfQuestInit()
  elseif event == "PLAYER_LOGOUT" then
    pfQuest:SaveConfig()
  end
end)
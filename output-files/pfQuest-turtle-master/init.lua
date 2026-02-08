-- pfQuest TurtleWoW Extension Initialization
-- Extends pfQuest with TurtleWoW specific content and features

pfTurtle = pfTurtle or {}
pfTurtle.version = "4.7.5-turtle"
pfTurtle.loaded = {}

-- Verify pfQuest dependency
if not pfQuest then
  error("pfQuest-turtle-master requires pfQuest to be loaded first!")
  return
end

-- TurtleWoW Detection
function pfTurtle:IsTurtleWoW()
  local realmName = GetRealmName and GetRealmName() or ""
  return string.find(realmName, "Turtle") ~= nil
end

-- Initialize TurtleWoW extension
local function pfTurtleInit()
  -- Create saved variables if they don't exist
  if not pfTurtle then pfTurtle = {} end
  if not pfTurtle_chars then pfTurtle_chars = {} end
  
  local player = UnitName("player")
  if not pfTurtle_chars[player] then
    pfTurtle_chars[player] = {}
  end
  
  pfTurtle.player = pfTurtle_chars[player]
  
  -- Only initialize if we're on TurtleWoW
  if not pfTurtle:IsTurtleWoW() then
    pfQuest:Print("pfQuest TurtleWoW extension loaded but not on TurtleWoW - features disabled")
    return
  end
  
  pfQuest:Print("pfQuest TurtleWoW extension v" .. pfTurtle.version .. " loaded successfully")
  
  -- Initialize TurtleWoW specific features
  pfTurtle:InitializeTurtleFeatures()
end

-- TurtleWoW specific features
function pfTurtle:InitializeTurtleFeatures()
  -- Custom quest chains tracking
  pfTurtle:InitializeCustomChains()
  
  -- Enhanced zone support
  pfTurtle:InitializeCustomZones()
  
  -- Custom NPCs and quest givers
  pfTurtle:InitializeCustomNPCs()
  
  -- TurtleWoW specific events
  pfTurtle:RegisterTurtleEvents()
end

-- Custom quest chain tracking
function pfTurtle:InitializeCustomChains()
  pfTurtle.chains = {
    -- Hardcore mode support
    hardcore = {
      enabled = true,
      deathPenalty = true,
    },
    -- Custom TurtleWoW content
    custom = {
      enabled = true,
      showCustomQuests = true,
    }
  }
end

-- Enhanced zone support for TurtleWoW
function pfTurtle:InitializeCustomZones()
  -- Add TurtleWoW specific zones to the database
  if pfQuest.db and pfQuest.db.zones then
    -- Extend existing zone database with TurtleWoW zones
    local turtleZones = {
      ["Stonetalon Peak"] = 9001,
      ["Tel'Abim"] = 9002,
      ["Gillijim's Isle"] = 9003,
      ["The Verdant Expanse"] = 9004,
    }
    
    for zoneName, zoneID in pairs(turtleZones) do
      pfQuest.db.zones[zoneName] = zoneID
    end
  end
end

-- Custom NPCs for TurtleWoW
function pfTurtle:InitializeCustomNPCs()
  pfTurtle.customNPCs = {
    -- This would contain TurtleWoW specific NPCs
    -- Format: [npcID] = { name, questsOffered, questsCompleted }
  }
end

-- TurtleWoW event handling
function pfTurtle:RegisterTurtleEvents()
  pfTurtle.events = CreateFrame("Frame")
  pfTurtle.events:RegisterEvent("PLAYER_LEVEL_UP")
  pfTurtle.events:RegisterEvent("ZONE_CHANGED_NEW_AREA")
  pfTurtle.events:RegisterEvent("QUEST_LOG_UPDATE")
  
  pfTurtle.events:SetScript("OnEvent", function()
    if event == "PLAYER_LEVEL_UP" then
      pfTurtle:OnPlayerLevelUp()
    elseif event == "ZONE_CHANGED_NEW_AREA" then
      pfTurtle:OnZoneChanged()
    elseif event == "QUEST_LOG_UPDATE" then
      pfTurtle:OnQuestLogUpdate()
    end
  end)
end

-- Event handlers
function pfTurtle:OnPlayerLevelUp()
  -- Check for new TurtleWoW content available at this level
  pfTurtle:UpdateAvailableContent()
end

function pfTurtle:OnZoneChanged()
  -- Update zone-specific TurtleWoW content
  local zoneName = GetRealZoneText()
  if zoneName then
    pfTurtle:LoadZoneContent(zoneName)
  end
end

function pfTurtle:OnQuestLogUpdate()
  -- Update TurtleWoW specific quest tracking
  pfTurtle:UpdateCustomTracking()
end

-- Content management
function pfTurtle:UpdateAvailableContent()
  local playerLevel = UnitLevel("player")
  -- This would check for TurtleWoW specific content at the player's level
end

function pfTurtle:LoadZoneContent(zoneName)
  -- Load zone-specific TurtleWoW content
  if pfTurtle.customZoneContent and pfTurtle.customZoneContent[zoneName] then
    -- Load custom content for this zone
  end
end

function pfTurtle:UpdateCustomTracking()
  -- Update tracking for TurtleWoW specific quests
  if pfQuest.questlog then
    -- Extend the base quest log with TurtleWoW data
    pfTurtle:EnhanceQuestData()
  end
end

function pfTurtle:EnhanceQuestData()
  -- Enhance quest data with TurtleWoW specific information
  for _, quest in ipairs(pfQuest.questlog.quests or {}) do
    if quest then
      local turtleData = pfTurtle:GetTurtleQuestData(quest.title)
      if turtleData then
        -- Merge TurtleWoW specific data
        for key, value in pairs(turtleData) do
          quest["turtle_" .. key] = value
        end
      end
    end
  end
end

function pfTurtle:GetTurtleQuestData(questTitle)
  -- Look up TurtleWoW specific quest data
  -- This would return additional information specific to TurtleWoW
  return nil -- Placeholder
end

-- API Extensions
function pfTurtle:GetCustomQuests()
  return pfTurtle.customQuests or {}
end

function pfTurtle:IsCustomQuest(questID)
  return pfTurtle.customQuests and pfTurtle.customQuests[questID] ~= nil
end

-- Utility functions
function pfTurtle:Print(msg)
  if DEFAULT_CHAT_FRAME then
    DEFAULT_CHAT_FRAME:AddMessage(pfQuest.colors.orange .. "[pfQuest-Turtle]" .. pfQuest.colors.close .. " " .. msg)
  end
end

-- Event handling
pfTurtle.events = CreateFrame("Frame")
pfTurtle.events:RegisterEvent("ADDON_LOADED")
pfTurtle.events:RegisterEvent("PLAYER_LOGIN")

pfTurtle.events:SetScript("OnEvent", function()
  if event == "ADDON_LOADED" and arg1 == "pfQuest-turtle-master" then
    pfTurtleInit()
  end
end)
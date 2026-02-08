-- pfQuest TurtleWoW Compatibility Module
-- Handles TurtleWoW specific compatibility and API differences

pfTurtle.compat = pfTurtle.compat or {}

-- TurtleWoW Detection and Version
pfTurtle.compat.isTurtle = false
pfTurtle.compat.turtleVersion = nil

function pfTurtle:DetectTurtleWoW()
  local realmName = GetRealmName and GetRealmName() or ""
  pfTurtle.compat.isTurtle = string.find(realmName, "Turtle") ~= nil
  
  if pfTurtle.compat.isTurtle then
    -- Try to detect TurtleWoW version
    pfTurtle.compat.turtleVersion = pfTurtle:GetTurtleVersion()
  end
  
  return pfTurtle.compat.isTurtle
end

function pfTurtle:GetTurtleVersion()
  -- Try to detect TurtleWoW version from various sources
  if TWStats then
    return "1.12.1+turtle"
  end
  return "unknown"
end

-- TurtleWoW API Extensions
function pfTurtle:InitializeTurtleAPI()
  if not pfTurtle.compat.isTurtle then return end
  
  -- TurtleWoW specific API functions
  pfTurtle:RegisterTurtleAPI()
end

function pfTurtle:RegisterTurtleAPI()
  -- Register TurtleWoW specific functions
  
  -- Enhanced quest system
  if not TWQuest then
    TWQuest = {
      GetCustomQuestData = function(questID)
        return pfTurtle:GetCustomQuestData(questID)
      end,
      
      IsHardcoreMode = function()
        return pfTurtle:IsHardcoreMode()
      end,
      
      GetTurtleStats = function()
        return pfTurtle:GetTurtleStats()
      end,
    }
  end
end

-- Hardcore Mode Detection
function pfTurtle:IsHardcoreMode()
  -- Detect if player is in hardcore mode
  if TWStats and TWStats.hardcore then
    return true
  end
  
  -- Check for hardcore indicators
  local guildName = GetGuildInfo("player")
  if guildName and string.find(guildName, "Hardcore") then
    return true
  end
  
  return false
end

-- Custom Quest System Integration
function pfTurtle:IntegrateCustomQuests()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Hook into pfQuest's quest system
  local originalGetQuestData = pfQuest.GetQuestData
  pfQuest.GetQuestData = function(self, questID)
    local baseData = originalGetQuestData(self, questID)
    local turtleData = pfTurtle:GetCustomQuestData(questID)
    
    if turtleData then
      -- Merge TurtleWoW custom data
      if baseData then
        for key, value in pairs(turtleData) do
          baseData[key] = value
        end
      else
        baseData = turtleData
      end
    end
    
    return baseData
  end
end

function pfTurtle:GetCustomQuestData(questID)
  if not pfTurtle.customQuestDB then return nil end
  return pfTurtle.customQuestDB[questID]
end

-- Enhanced Zone Support
function pfTurtle:EnhanceZoneSupport()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Add TurtleWoW specific zones
  local originalGetZoneID = pfQuest.GetZoneID
  pfQuest.GetZoneID = function(self, zoneName)
    local baseZoneID = originalGetZoneID(self, zoneName)
    if baseZoneID and baseZoneID > 0 then
      return baseZoneID
    end
    
    -- Check TurtleWoW custom zones
    return pfTurtle:GetCustomZoneID(zoneName)
  end
end

function pfTurtle:GetCustomZoneID(zoneName)
  local turtleZones = {
    ["Stonetalon Peak"] = 9001,
    ["Tel'Abim"] = 9002,
    ["Gillijim's Isle"] = 9003,
    ["The Verdant Expanse"] = 9004,
    ["Dragon Blight"] = 9005,
    ["Draconic Valley"] = 9006,
  }
  
  return turtleZones[zoneName] or 0
end

-- NPC Integration
function pfTurtle:EnhanceNPCSupport()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Hook NPC quest functions
  local originalGetNPCQuests = pfQuest.GetNPCQuests
  pfQuest.GetNPCQuests = function(self, npcName)
    local baseQuests = originalGetNPCQuests(self, npcName)
    local turtleQuests = pfTurtle:GetCustomNPCQuests(npcName)
    
    if turtleQuests then
      -- Merge quest lists
      if baseQuests then
        for _, quest in ipairs(turtleQuests) do
          table.insert(baseQuests, quest)
        end
      else
        baseQuests = turtleQuests
      end
    end
    
    return baseQuests
  end
end

function pfTurtle:GetCustomNPCQuests(npcName)
  if not pfTurtle.customNPCDB then return nil end
  return pfTurtle.customNPCDB[npcName]
end

-- Database Integration
function pfTurtle:IntegrateDatabase()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Load TurtleWoW specific database
  pfTurtle:LoadCustomDatabase()
  
  -- Integrate with pfQuest database
  pfTurtle:MergeDatabases()
end

function pfTurtle:LoadCustomDatabase()
  -- Initialize custom databases
  pfTurtle.customQuestDB = pfTurtle.customQuestDB or {}
  pfTurtle.customNPCDB = pfTurtle.customNPCDB or {}
  pfTurtle.customObjectDB = pfTurtle.customObjectDB or {}
end

function pfTurtle:MergeDatabases()
  -- Merge TurtleWoW data into pfQuest database
  if pfTurtle.customQuestDB and pfQuest.db and pfQuest.db.quests then
    for questID, questData in pairs(pfTurtle.customQuestDB) do
      pfQuest.db.quests[questID] = questData
    end
  end
end

-- Event System Enhancement
function pfTurtle:EnhanceEventSystem()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Register TurtleWoW specific events
  pfTurtle:RegisterCustomEvents()
end

function pfTurtle:RegisterCustomEvents()
  -- TurtleWoW might have custom events
  local customEvents = {
    "TURTLE_QUEST_COMPLETE",
    "TURTLE_HARDCORE_DEATH",
    "TURTLE_CUSTOM_ACHIEVEMENT",
  }
  
  for _, eventName in ipairs(customEvents) do
    if pfTurtle.events then
      pcall(pfTurtle.events.RegisterEvent, pfTurtle.events, eventName)
    end
  end
end

-- Turtle Stats Integration
function pfTurtle:GetTurtleStats()
  if not pfTurtle.compat.isTurtle then return {} end
  
  local stats = {
    hardcore = pfTurtle:IsHardcoreMode(),
    version = pfTurtle.compat.turtleVersion,
    customQuests = 0,
    customZones = 0,
  }
  
  if pfTurtle.customQuestDB then
    for _ in pairs(pfTurtle.customQuestDB) do
      stats.customQuests = stats.customQuests + 1
    end
  end
  
  return stats
end

-- Configuration Integration
function pfTurtle:IntegrateConfiguration()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Add TurtleWoW specific config options
  if pfQuest.config then
    pfQuest.config.turtle = {
      enabled = true,
      showCustomContent = true,
      hardcoreMode = pfTurtle:IsHardcoreMode(),
      showTurtleQuests = true,
      showCustomZones = true,
    }
  end
end

-- Initialize TurtleWoW compatibility
function pfTurtle:InitializeCompatibility()
  pfTurtle:DetectTurtleWoW()
  
  if pfTurtle.compat.isTurtle then
    pfTurtle:Print("TurtleWoW detected - initializing compatibility layer")
    
    pfTurtle:InitializeTurtleAPI()
    pfTurtle:IntegrateCustomQuests()
    pfTurtle:EnhanceZoneSupport()
    pfTurtle:EnhanceNPCSupport()
    pfTurtle:IntegrateDatabase()
    pfTurtle:EnhanceEventSystem()
    pfTurtle:IntegrateConfiguration()
    
    pfTurtle:Print("TurtleWoW compatibility layer initialized")
  end
end

-- Call compatibility initialization
pfTurtle:InitializeCompatibility()
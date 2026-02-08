-- pfQuest TurtleWoW NPC Management
-- Handles TurtleWoW specific NPCs and quest givers

pfTurtle.npcs = pfTurtle.npcs or {}

-- TurtleWoW NPC enhancements
function pfTurtle:EnhanceNPCSystem()
  if not pfTurtle.compat.isTurtle then return end
  
  pfTurtle:InitializeCustomNPCs()
  pfTurtle:HookNPCInteraction()
  pfTurtle:ExtendNPCTooltips()
end

-- Custom NPC initialization
function pfTurtle:InitializeCustomNPCs()
  pfTurtle.npcs.questGivers = {}
  pfTurtle.npcs.vendors = {}
  pfTurtle.npcs.trainers = {}
  
  -- Load custom NPC data
  pfTurtle:LoadCustomNPCData()
end

function pfTurtle:LoadCustomNPCData()
  -- Quest Givers
  pfTurtle.npcs.questGivers = {
    [90001] = {
      name = "Turtle Guardian Shellheart",
      zone = "Stonetalon Peak",
      level = 15,
      faction = "Alliance",
      quests_available = {50001},
      quests_completed = {50001},
      coordinates = {x = 45.2, y = 62.8},
      description = "A wise turtle guardian protecting the sacred peak",
      greeting = "Greetings, young adventurer. The spirits have foretold of your coming.",
    },
    [90002] = {
      name = "Explorer Seasalt",
      zone = "Tel'Abim",
      level = 40,
      faction = "Neutral",
      quests_available = {50002},
      coordinates = {x = 32.1, y = 55.7},
      description = "An intrepid explorer seeking to unlock Tel'Abim's mysteries",
      greeting = "Ahoy there! You look like someone who appreciates a good adventure!",
    },
    [90003] = {
      name = "Sage Wavecrest",
      zone = "Tel'Abim",
      level = 42,
      faction = "Neutral",
      quests_completed = {50002},
      coordinates = {x = 67.4, y = 23.9},
      description = "An ancient sage who guards the secrets of the island",
      greeting = "The tides of fate have brought you to me, stranger.",
    },
  }
  
  -- Vendors
  pfTurtle.npcs.vendors = {
    [90101] = {
      name = "Captain Goldbeard",
      zone = "Gillijim's Isle",
      level = 25,
      vendor_type = "general",
      items = {
        {id = 90301, name = "Turtle Shell Polish", cost = 50},
        {id = 90302, name = "Maritime Navigation Charts", cost = 125},
      },
      coordinates = {x = 48.0, y = 52.0},
    },
  }
  
  -- Trainers
  pfTurtle.npcs.trainers = {
    [90201] = {
      name = "Master Tidecaller",
      zone = "Tel'Abim",
      level = 50,
      trainer_type = "fishing",
      skills = {"Advanced Fishing", "Deep Sea Angling"},
      coordinates = {x = 30.5, y = 71.2},
    },
  }
end

-- NPC interaction hooks
function pfTurtle:HookNPCInteraction()
  -- Hook gossip system
  pfTurtle:HookGossipSystem()
  
  -- Hook quest giver interactions
  pfTurtle:HookQuestGivers()
end

function pfTurtle:HookGossipSystem()
  -- This would hook into the gossip system to add TurtleWoW specific options
  pfTurtle.originalGossipShow = GossipFrame_OnShow
  GossipFrame_OnShow = function()
    pfTurtle.originalGossipShow()
    pfTurtle:OnGossipShow()
  end
end

function pfTurtle:OnGossipShow()
  local npcName = UnitName("npc")
  if not npcName then return end
  
  local npcData = pfTurtle:GetNPCByName(npcName)
  if npcData and npcData.turtle_custom then
    -- Add TurtleWoW specific gossip options
    pfTurtle:AddCustomGossipOptions(npcData)
  end
end

function pfTurtle:AddCustomGossipOptions(npcData)
  -- This would add custom gossip options for TurtleWoW NPCs
  -- Implementation depends on available gossip API
end

function pfTurtle:HookQuestGivers()
  -- Hook quest giver frame
  if QuestFrame then
    pfTurtle.originalQuestFrameShow = QuestFrame_OnShow
    QuestFrame_OnShow = function()
      pfTurtle.originalQuestFrameShow()
      pfTurtle:OnQuestFrameShow()
    end
  end
end

function pfTurtle:OnQuestFrameShow()
  local npcName = UnitName("questnpc")
  if not npcName then return end
  
  local npcData = pfTurtle:GetNPCByName(npcName)
  if npcData and npcData.turtle_custom then
    -- Enhance quest frame with TurtleWoW information
    pfTurtle:EnhanceQuestFrame(npcData)
  end
end

function pfTurtle:EnhanceQuestFrame(npcData)
  -- Add TurtleWoW specific information to the quest frame
  if npcData.description then
    -- Add NPC description or lore
  end
end

-- Enhanced NPC tooltips
function pfTurtle:ExtendNPCTooltips()
  -- Hook GameTooltip for NPCs
  local originalSetUnit = GameTooltip.SetUnit
  GameTooltip.SetUnit = function(tooltip, unit)
    originalSetUnit(tooltip, unit)
    pfTurtle:AddNPCTooltipInfo(tooltip, unit)
  end
end

function pfTurtle:AddNPCTooltipInfo(tooltip, unit)
  if not unit or not UnitExists(unit) or UnitIsPlayer(unit) then
    return
  end
  
  local npcName = UnitName(unit)
  if not npcName then return end
  
  local npcData = pfTurtle:GetNPCByName(npcName)
  if not npcData then return end
  
  -- Add TurtleWoW specific information
  tooltip:AddLine(" ")
  tooltip:AddLine("TurtleWoW NPC", 0.8, 0.6, 0, 1)
  
  if npcData.description then
    tooltip:AddLine(npcData.description, 0.8, 0.8, 0.8, 1)
  end
  
  -- Show available quests
  if npcData.quests_available then
    tooltip:AddLine("Available Quests:", 1, 1, 0)
    for _, questID in ipairs(npcData.quests_available) do
      local questData = pfTurtle:GetCustomQuest(questID)
      if questData and not pfQuest:IsQuestCompleted(questID) then
        local color = pfQuest:GetQuestColor(questData.level)
        tooltip:AddLine(color .. questData.title, 1, 1, 1, 1)
      end
    end
  end
  
  -- Show quest completion
  if npcData.quests_completed then
    for _, questID in ipairs(npcData.quests_completed) do
      if pfQuest:IsQuestInLog(questID) then
        local questData = pfTurtle:GetCustomQuest(questID)
        if questData then
          tooltip:AddLine("Complete: " .. questData.title, 0, 1, 0, 1)
        end
      end
    end
  end
end

-- NPC finder functions
function pfTurtle:GetNPCByName(npcName)
  -- Search in quest givers
  for npcID, npcData in pairs(pfTurtle.npcs.questGivers) do
    if npcData.name == npcName then
      npcData.turtle_custom = true
      npcData.id = npcID
      return npcData
    end
  end
  
  -- Search in vendors
  for npcID, npcData in pairs(pfTurtle.npcs.vendors) do
    if npcData.name == npcName then
      npcData.turtle_custom = true
      npcData.id = npcID
      return npcData
    end
  end
  
  -- Search in trainers
  for npcID, npcData in pairs(pfTurtle.npcs.trainers) do
    if npcData.name == npcName then
      npcData.turtle_custom = true
      npcData.id = npcID
      return npcData
    end
  end
  
  return nil
end

function pfTurtle:GetNPCByID(npcID)
  -- Check quest givers
  if pfTurtle.npcs.questGivers[npcID] then
    return pfTurtle.npcs.questGivers[npcID]
  end
  
  -- Check vendors
  if pfTurtle.npcs.vendors[npcID] then
    return pfTurtle.npcs.vendors[npcID]
  end
  
  -- Check trainers
  if pfTurtle.npcs.trainers[npcID] then
    return pfTurtle.npcs.trainers[npcID]
  end
  
  return nil
end

function pfTurtle:FindNPCsByZone(zoneName)
  local zoneNPCs = {}
  
  -- Search all NPC types
  local npcCollections = {
    pfTurtle.npcs.questGivers,
    pfTurtle.npcs.vendors,
    pfTurtle.npcs.trainers,
  }
  
  for _, collection in ipairs(npcCollections) do
    for npcID, npcData in pairs(collection) do
      if npcData.zone == zoneName then
        npcData.id = npcID
        table.insert(zoneNPCs, npcData)
      end
    end
  end
  
  return zoneNPCs
end

-- NPC reputation system (if applicable)
function pfTurtle:InitializeNPCReputation()
  pfTurtle.npcs.reputation = {}
  
  -- This could track reputation with individual NPCs or factions
  -- Specific to TurtleWoW's systems
end

function pfTurtle:GetNPCReputation(npcID)
  if pfTurtle.npcs.reputation and pfTurtle.npcs.reputation[npcID] then
    return pfTurtle.npcs.reputation[npcID]
  end
  return 0 -- Neutral
end

function pfTurtle:ModifyNPCReputation(npcID, change)
  if not pfTurtle.npcs.reputation then
    pfTurtle.npcs.reputation = {}
  end
  
  if not pfTurtle.npcs.reputation[npcID] then
    pfTurtle.npcs.reputation[npcID] = 0
  end
  
  pfTurtle.npcs.reputation[npcID] = pfTurtle.npcs.reputation[npcID] + change
end

-- NPC statistics
function pfTurtle:GetNPCStats()
  local stats = {
    quest_givers = 0,
    vendors = 0,
    trainers = 0,
    total_interactions = 0,
  }
  
  for _ in pairs(pfTurtle.npcs.questGivers) do
    stats.quest_givers = stats.quest_givers + 1
  end
  
  for _ in pairs(pfTurtle.npcs.vendors) do
    stats.vendors = stats.vendors + 1
  end
  
  for _ in pairs(pfTurtle.npcs.trainers) do
    stats.trainers = stats.trainers + 1
  end
  
  -- Get interaction count from saved data
  if pfTurtle.player and pfTurtle.player.npc_interactions then
    stats.total_interactions = pfTurtle.player.npc_interactions
  end
  
  return stats
end

-- Track NPC interactions
function pfTurtle:OnNPCInteraction(npcName)
  if not pfTurtle.player then return end
  
  if not pfTurtle.player.npc_interactions then
    pfTurtle.player.npc_interactions = 0
  end
  
  pfTurtle.player.npc_interactions = pfTurtle.player.npc_interactions + 1
  
  -- Track specific NPC interactions
  if not pfTurtle.player.npc_interaction_log then
    pfTurtle.player.npc_interaction_log = {}
  end
  
  if not pfTurtle.player.npc_interaction_log[npcName] then
    pfTurtle.player.npc_interaction_log[npcName] = 0
  end
  
  pfTurtle.player.npc_interaction_log[npcName] = pfTurtle.player.npc_interaction_log[npcName] + 1
end

-- Initialize NPC system
if pfTurtle.compat.isTurtle then
  pfTurtle:EnhanceNPCSystem()
  pfTurtle:InitializeNPCReputation()
end
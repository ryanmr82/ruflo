-- pfQuest TurtleWoW Database Module
-- Contains TurtleWoW specific quest, NPC, and object data

pfTurtle.db = pfTurtle.db or {}

-- Initialize TurtleWoW database
function pfTurtle:InitializeDatabase()
  pfTurtle.db.quests = {}
  pfTurtle.db.npcs = {}
  pfTurtle.db.objects = {}
  pfTurtle.db.zones = {}
  pfTurtle.db.items = {}
  
  pfTurtle:LoadTurtleData()
end

-- TurtleWoW Custom Zones
pfTurtle.db.customZones = {
  [9001] = {
    id = 9001,
    name = "Stonetalon Peak",
    continent = "Kalimdor",
    level_range = {15, 25},
    faction = "contested",
  },
  [9002] = {
    id = 9002,
    name = "Tel'Abim",
    continent = "South Seas",
    level_range = {35, 45},
    faction = "contested",
  },
  [9003] = {
    id = 9003,
    name = "Gillijim's Isle", 
    continent = "South Seas",
    level_range = {20, 30},
    faction = "contested",
  },
  [9004] = {
    id = 9004,
    name = "The Verdant Expanse",
    continent = "Kalimdor",
    level_range = {25, 35},
    faction = "contested",
  }
}

-- Sample TurtleWoW Custom Quests
pfTurtle.db.customQuests = {
  [50001] = {
    id = 50001,
    title = "The Turtle's Call",
    level = 10,
    minLevel = 8,
    zone = "Stonetalon Peak",
    faction = "Alliance",
    starts = { npc = 90001 },
    ends = { npc = 90001 },
    objectives = {
      { type = "slay", id = 90101, count = 12 },
    },
    description = "Venture to Stonetalon Peak and help defend the turtle sanctuary.",
    custom = true,
    turtle_specific = true,
  },
  [50002] = {
    id = 50002,
    title = "Mysteries of Tel'Abim",
    level = 40,
    minLevel = 35,
    zone = "Tel'Abim",
    faction = "Both",
    starts = { npc = 90002 },
    ends = { npc = 90003 },
    objectives = {
      { type = "collect", id = 90201, count = 5 },
      { type = "explore", area = "Tel'Abim Ruins" },
    },
    description = "Explore the mysterious island of Tel'Abim and uncover its secrets.",
    custom = true,
    turtle_specific = true,
  },
  [50003] = {
    id = 50003,
    title = "Hardcore Survivor",
    level = 1,
    minLevel = 1,
    zone = "Any",
    faction = "Both",
    starts = { special = "hardcore" },
    ends = { special = "hardcore" },
    objectives = {
      { type = "survive", level = 60 },
    },
    description = "Survive to level 60 in hardcore mode without dying.",
    custom = true,
    turtle_specific = true,
    hardcore_only = true,
  }
}

-- TurtleWoW Custom NPCs
pfTurtle.db.customNPCs = {
  [90001] = {
    id = 90001,
    name = "Turtle Guardian Shellheart",
    level = 15,
    zone = "Stonetalon Peak",
    faction = "Alliance",
    quests_start = { 50001 },
    quests_end = { 50001 },
    coordinates = { x = 45.2, y = 62.8 },
  },
  [90002] = {
    id = 90002,
    name = "Explorer Seasalt",
    level = 40,
    zone = "Tel'Abim",
    faction = "Neutral",
    quests_start = { 50002 },
    coordinates = { x = 32.1, y = 55.7 },
  },
  [90003] = {
    id = 90003,
    name = "Sage Wavecrest",
    level = 42,
    zone = "Tel'Abim", 
    faction = "Neutral",
    quests_end = { 50002 },
    coordinates = { x = 67.4, y = 23.9 },
  }
}

-- TurtleWoW Custom Items
pfTurtle.db.customItems = {
  [90201] = {
    id = 90201,
    name = "Ancient Tel'Abim Tablet",
    quality = "rare",
    type = "quest",
    description = "An ancient tablet covered in mysterious runes.",
    quest_item = true,
    related_quests = { 50002 },
  },
  [90202] = {
    id = 90202,
    name = "Turtle Shell Fragment",
    quality = "common",
    type = "quest",
    description = "A fragment from a giant turtle shell.",
    quest_item = true,
    related_quests = { 50001 },
  }
}

-- Database access functions
function pfTurtle:GetCustomQuest(questID)
  return pfTurtle.db.customQuests[questID]
end

function pfTurtle:GetCustomNPC(npcID)
  return pfTurtle.db.customNPCs[npcID]
end

function pfTurtle:GetCustomZone(zoneID)
  return pfTurtle.db.customZones[zoneID]
end

function pfTurtle:GetCustomItem(itemID)
  return pfTurtle.db.customItems[itemID]
end

-- Search functions
function pfTurtle:FindQuestsByZone(zoneName)
  local quests = {}
  for questID, questData in pairs(pfTurtle.db.customQuests) do
    if questData.zone == zoneName then
      table.insert(quests, questData)
    end
  end
  return quests
end

function pfTurtle:FindQuestsByLevel(level)
  local quests = {}
  for questID, questData in pairs(pfTurtle.db.customQuests) do
    if questData.level <= level and questData.minLevel <= level then
      table.insert(quests, questData)
    end
  end
  return quests
end

function pfTurtle:FindNPCsByZone(zoneName)
  local npcs = {}
  for npcID, npcData in pairs(pfTurtle.db.customNPCs) do
    if npcData.zone == zoneName then
      table.insert(npcs, npcData)
    end
  end
  return npcs
end

-- Hardcore mode specific functions
function pfTurtle:GetHardcoreQuests()
  local hardcoreQuests = {}
  for questID, questData in pairs(pfTurtle.db.customQuests) do
    if questData.hardcore_only then
      table.insert(hardcoreQuests, questData)
    end
  end
  return hardcoreQuests
end

function pfTurtle:IsHardcoreQuest(questID)
  local quest = pfTurtle:GetCustomQuest(questID)
  return quest and quest.hardcore_only == true
end

-- Integration with pfQuest database
function pfTurtle:MergeWithPfQuestDB()
  if not pfQuest or not pfQuest.db then return end
  
  -- Merge custom quests
  if pfQuest.db.quests then
    for questID, questData in pairs(pfTurtle.db.customQuests) do
      pfQuest.db.quests[questID] = questData
    end
  end
  
  -- Merge custom NPCs
  if pfQuest.db.units then
    for npcID, npcData in pairs(pfTurtle.db.customNPCs) do
      pfQuest.db.units[npcID] = npcData
    end
  end
  
  -- Merge custom zones
  if pfQuest.db.zones then
    for zoneName, zoneID in pairs({
      ["Stonetalon Peak"] = 9001,
      ["Tel'Abim"] = 9002,
      ["Gillijim's Isle"] = 9003,
      ["The Verdant Expanse"] = 9004,
    }) do
      pfQuest.db.zones[zoneName] = zoneID
    end
  end
end

-- Load external data files
function pfTurtle:LoadTurtleData()
  -- This would normally load from external data files
  -- For now, we use the embedded data above
  
  pfTurtle:Print("Loaded " .. pfTurtle:CountCustomQuests() .. " TurtleWoW custom quests")
  pfTurtle:Print("Loaded " .. pfTurtle:CountCustomNPCs() .. " TurtleWoW custom NPCs")
  pfTurtle:Print("Loaded " .. pfTurtle:CountCustomZones() .. " TurtleWoW custom zones")
end

-- Statistics functions
function pfTurtle:CountCustomQuests()
  local count = 0
  for _ in pairs(pfTurtle.db.customQuests) do
    count = count + 1
  end
  return count
end

function pfTurtle:CountCustomNPCs()
  local count = 0
  for _ in pairs(pfTurtle.db.customNPCs) do
    count = count + 1
  end
  return count
end

function pfTurtle:CountCustomZones()
  local count = 0
  for _ in pairs(pfTurtle.db.customZones) do
    count = count + 1
  end
  return count
end

-- Initialize database
pfTurtle:InitializeDatabase()
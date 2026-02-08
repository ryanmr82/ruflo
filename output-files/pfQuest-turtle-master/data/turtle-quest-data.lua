-- TurtleWoW Quest Data
-- Comprehensive quest database for TurtleWoW custom content

pfTurtle.data = pfTurtle.data or {}
pfTurtle.data.quests = {
  -- Stonetalon Peak Quest Chain
  [50001] = {
    id = 50001,
    title = "The Turtle's Call",
    level = 10,
    minLevel = 8,
    maxLevel = 15,
    zone = "Stonetalon Peak",
    faction = "Alliance",
    type = "kill",
    starts = { npc = 90001 },
    ends = { npc = 90001 },
    objectives = {
      { type = "slay", id = 90101, name = "Corrupted Sprite", count = 12 },
      { type = "collect", id = 90201, name = "Sprite Essence", count = 5 },
    },
    description = "The turtle sanctuary is under threat from corrupted sprites. Help Guardian Shellheart cleanse the peak.",
    reward = {
      xp = 850,
      money = 75,
      items = {
        { id = 90301, name = "Turtle Shell Pendant", quality = "uncommon" }
      }
    },
    prereq = {},
    followup = { 50004 },
    coordinates = { x = 45.2, y = 62.8 },
    custom = true,
    turtle_specific = true,
  },
  
  [50002] = {
    id = 50002,
    title = "Mysteries of Tel'Abim",
    level = 40,
    minLevel = 35,
    maxLevel = 45,
    zone = "Tel'Abim",
    faction = "Both",
    type = "collect",
    starts = { npc = 90002 },
    ends = { npc = 90003 },
    objectives = {
      { type = "collect", id = 90202, name = "Ancient Tel'Abim Tablet", count = 5 },
      { type = "explore", area = "Tel'Abim Ruins", coordinates = {x = 55.0, y = 35.0} },
      { type = "interact", id = 90401, name = "Ancient Shrine", count = 1 },
    },
    description = "Explore the mysterious island of Tel'Abim and uncover its ancient secrets by collecting tablets and examining the ruins.",
    reward = {
      xp = 4200,
      money = 425,
      items = {
        { id = 90302, name = "Tel'Abim Explorer's Staff", quality = "rare" },
        { id = 90303, name = "Medallion of the Depths", quality = "uncommon" }
      },
      reputation = {
        { faction = "Tel'Abim Explorers", amount = 250 }
      }
    },
    prereq = {},
    followup = { 50005 },
    coordinates = { x = 32.1, y = 55.7 },
    custom = true,
    turtle_specific = true,
  },
  
  [50003] = {
    id = 50003,
    title = "Hardcore Survivor",
    level = 1,
    minLevel = 1,
    maxLevel = 60,
    zone = "Any",
    faction = "Both",
    type = "special",
    starts = { special = "hardcore_mode" },
    ends = { special = "hardcore_mode" },
    objectives = {
      { type = "survive", level = 60, description = "Reach level 60 without dying" },
    },
    description = "The ultimate test of survival - reach the maximum level in hardcore mode without a single death. Only the bravest dare attempt this challenge.",
    reward = {
      title = "the Survivor",
      achievement = "hardcore_survivor",
      items = {
        { id = 90304, name = "Cloak of the Deathless", quality = "epic" }
      }
    },
    prereq = {},
    followup = {},
    hardcore_only = true,
    custom = true,
    turtle_specific = true,
  },
  
  [50004] = {
    id = 50004,
    title = "The Turtle's Blessing",
    level = 12,
    minLevel = 10,
    maxLevel = 17,
    zone = "Stonetalon Peak",
    faction = "Alliance",
    type = "escort",
    starts = { npc = 90001 },
    ends = { npc = 90004 },
    objectives = {
      { type = "escort", npc = "Spirit Turtle", destination = "Sacred Pool" },
      { type = "protect", duration = 300, description = "Protect the Spirit Turtle for 5 minutes" },
    },
    description = "Escort the Spirit Turtle to the Sacred Pool and protect it during the blessing ceremony.",
    reward = {
      xp = 1200,
      money = 125,
      items = {
        { id = 90305, name = "Blessed Turtle Shell Shield", quality = "uncommon" }
      }
    },
    prereq = { 50001 },
    followup = {},
    coordinates = { x = 45.2, y = 62.8 },
    custom = true,
    turtle_specific = true,
  },
  
  [50005] = {
    id = 50005,
    title = "The Depths of Tel'Abim",
    level = 42,
    minLevel = 40,
    maxLevel = 47,
    zone = "Tel'Abim",
    faction = "Both",
    type = "dungeon",
    starts = { npc = 90003 },
    ends = { npc = 90003 },
    objectives = {
      { type = "enter", dungeon = "Tel'Abim Depths" },
      { type = "kill", boss = "Ancient Guardian Krakenos" },
      { type = "collect", id = 90203, name = "Heart of the Depths", count = 1 },
    },
    description = "Venture into the dangerous depths beneath Tel'Abim and face the ancient guardian that protects the island's greatest treasure.",
    reward = {
      xp = 6500,
      money = 650,
      items = {
        { id = 90306, name = "Trident of the Deep Guardian", quality = "epic" },
        { id = 90307, name = "Amulet of Tidal Force", quality = "rare" }
      },
      reputation = {
        { faction = "Tel'Abim Explorers", amount = 500 }
      }
    },
    prereq = { 50002 },
    followup = {},
    coordinates = { x = 67.4, y = 23.9 },
    dungeon_quest = true,
    custom = true,
    turtle_specific = true,
  },
}

-- Quest chain definitions
pfTurtle.data.questChains = {
  ["stonetalon_turtle"] = {
    name = "Guardian of the Turtle Peak",
    description = "Help protect the sacred turtle sanctuary",
    quests = { 50001, 50004 },
    zone = "Stonetalon Peak",
    level_range = { 8, 17 },
    faction = "Alliance",
  },
  
  ["telabim_explorer"] = {
    name = "Tel'Abim Explorer",
    description = "Uncover the mysteries of the ancient island",
    quests = { 50002, 50005 },
    zone = "Tel'Abim",
    level_range = { 35, 47 },
    faction = "Both",
  },
  
  ["hardcore_challenge"] = {
    name = "The Ultimate Challenge",
    description = "Prove your worth in hardcore mode",
    quests = { 50003 },
    zone = "Any",
    level_range = { 1, 60 },
    faction = "Both",
    hardcore_only = true,
  },
}

-- Achievement definitions
pfTurtle.data.achievements = {
  ["turtle_guardian"] = {
    name = "Guardian of the Turtles",
    description = "Complete all Stonetalon Peak turtle quests",
    requirements = {
      quests = { 50001, 50004 }
    },
    reward = {
      title = "Guardian of the Turtles",
      points = 10
    }
  },
  
  ["telabim_master"] = {
    name = "Master of Tel'Abim",
    description = "Fully explore Tel'Abim and complete all related quests",
    requirements = {
      quests = { 50002, 50005 },
      exploration = "Tel'Abim"
    },
    reward = {
      title = "Master of Tel'Abim",
      points = 25
    }
  },
  
  ["hardcore_legend"] = {
    name = "Hardcore Legend",
    description = "Reach level 60 in hardcore mode",
    requirements = {
      quests = { 50003 }
    },
    reward = {
      title = "the Deathless",
      points = 100
    }
  },
}

-- Load quest data into the main database
function pfTurtle:LoadQuestData()
  if not pfTurtle.db then pfTurtle.db = {} end
  if not pfTurtle.db.customQuests then pfTurtle.db.customQuests = {} end
  
  for questID, questData in pairs(pfTurtle.data.quests) do
    pfTurtle.db.customQuests[questID] = questData
  end
  
  pfTurtle:Print("Loaded " .. table.getn(pfTurtle.data.quests) .. " custom TurtleWoW quests")
end

-- Initialize quest data
if pfTurtle.compat and pfTurtle.compat.isTurtle then
  pfTurtle:LoadQuestData()
end
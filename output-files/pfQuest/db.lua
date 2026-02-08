-- pfQuest Database Module
-- Contains quest data and database functions

pfQuest.db = pfQuest.db or {}
pfQuest.db.quests = {}
pfQuest.db.units = {}
pfQuest.db.objects = {}
pfQuest.db.zones = {}

-- Zone ID mappings
pfQuest.db.zones = {
  ["Elwynn Forest"] = 12,
  ["Westfall"] = 40,
  ["Redridge Mountains"] = 44,
  ["Duskwood"] = 10,
  ["Stranglethorn Vale"] = 33,
  ["Wetlands"] = 11,
  ["Loch Modan"] = 38,
  ["Dun Morogh"] = 1,
  ["Ironforge"] = 1537,
  ["Stormwind City"] = 1519,
  ["Teldrassil"] = 141,
  ["Darkshore"] = 148,
  ["Ashenvale"] = 331,
  ["Desolace"] = 405,
  ["Stonetalon Mountains"] = 406,
  ["Feralas"] = 357,
  ["Thousand Needles"] = 400,
  ["Tanaris"] = 440,
  ["Azshara"] = 16,
  ["Felwood"] = 361,
  ["Un'Goro Crater"] = 490,
  ["Winterspring"] = 618,
  ["Moonglade"] = 493,
  ["Silithus"] = 1377,
  ["Darnassus"] = 1657,
  ["Orgrimmar"] = 1637,
  ["Thunder Bluff"] = 1638,
  ["Undercity"] = 1497,
  ["Durotar"] = 14,
  ["The Barrens"] = 17,
  ["Mulgore"] = 215,
  ["Tirisfal Glades"] = 85,
  ["Silverpine Forest"] = 130,
  ["Hillsbrad Foothills"] = 267,
  ["The Hinterlands"] = 267,
  ["Alterac Mountains"] = 36,
  ["Arathi Highlands"] = 45,
  ["Badlands"] = 3,
  ["Searing Gorge"] = 51,
  ["Burning Steppes"] = 46,
  ["Swamp of Sorrows"] = 8,
  ["Blasted Lands"] = 4,
  ["Eastern Plaguelands"] = 139,
  ["Western Plaguelands"] = 28,
}\n\n-- Quest database functions\nfunction pfQuest:LoadQuestDB()\n  -- Initialize empty database - this would normally load from data files\n  if not pfQuest.db.loaded then\n    pfQuest.db.loaded = true\n  end\nend\n\nfunction pfQuest:GetQuestData(questID)\n  return pfQuest.db.quests[questID] or nil\nend\n\nfunction pfQuest:GetUnitData(unitID)\n  return pfQuest.db.units[unitID] or nil\nend\n\nfunction pfQuest:GetObjectData(objectID)\n  return pfQuest.db.objects[objectID] or nil\nend\n\nfunction pfQuest:GetZoneID(zoneName)\n  return pfQuest.db.zones[zoneName] or 0\nend\n\n-- Quest status functions\nfunction pfQuest:IsQuestCompleted(questID)\n  if not questID then return false end\n  \n  for i = 1, GetNumQuestLogEntries() do\n    local questLogTitleText, level, questTag, isHeader, isCollapsed, isComplete = GetQuestLogTitle(i)\n    if questLogTitleText and pfQuest:GetQuestIDByTitle(questLogTitleText) == questID then\n      return isComplete == 1\n    end\n  end\n  \n  -- Check if quest was previously completed\n  if pfQuest.player and pfQuest.player.completed then\n    return pfQuest.player.completed[questID] ~= nil\n  end\n  \n  return false\nend\n\nfunction pfQuest:IsQuestInLog(questID)\n  if not questID then return false end\n  \n  for i = 1, GetNumQuestLogEntries() do\n    local questLogTitleText = GetQuestLogTitle(i)\n    if questLogTitleText and pfQuest:GetQuestIDByTitle(questLogTitleText) == questID then\n      return true\n    end\n  end\n  \n  return false\nend\n\n-- Helper function to get quest ID from title (simplified)\nfunction pfQuest:GetQuestIDByTitle(title)\n  -- In a real implementation, this would search the quest database\n  -- For now, return a simple hash of the title\n  local hash = 0\n  for i = 1, string.len(title) do\n    hash = hash + string.byte(title, i)\n  end\n  return hash % 10000\nend\n\n-- Sample quest data structure (normally loaded from external data files)\npfQuest.db.sampleQuests = {\n  [1] = {\n    id = 1,\n    title = \"A Threat Within\",\n    level = 1,\n    minLevel = 1,\n    zone = \"Northshire Valley\",\n    starts = { npc = 823 }, -- Marshal McBride\n    ends = { npc = 823 },\n    objectives = {\n      { type = \"slay\", id = 38, count = 8 }, -- Kobold Vermin\n    },\n    description = \"Kill 8 Kobold Vermin, then return to Marshal McBride in Northshire Abbey.\",\n  },\n  [2] = {\n    id = 2,\n    title = \"Kobold Camp Cleanup\",\n    level = 2,\n    minLevel = 1,\n    zone = \"Northshire Valley\",\n    starts = { npc = 823 },\n    ends = { npc = 823 },\n    objectives = {\n      { type = \"slay\", id = 40, count = 10 }, -- Kobold Worker\n    },\n    description = \"Kill 10 Kobold Workers, then return to Marshal McBride.\",\n  },\n}\n\n-- Initialize database on load\npfQuest:LoadQuestDB()
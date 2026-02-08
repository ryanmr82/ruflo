-- pfQuest API Module
-- Public API for other addons to interact with pfQuest

pfQuest.api = {}

-- Quest data access
function pfQuest.api:GetQuestData(questID)
  return pfQuest:GetQuestData(questID)
end

function pfQuest.api:GetAllQuests()
  return pfQuest.questlog.quests or {}
end

function pfQuest.api:GetWatchedQuests()
  return pfQuest.questlog.watched or {}
end

-- Quest status
function pfQuest.api:IsQuestCompleted(questID)
  return pfQuest:IsQuestCompleted(questID)
end

function pfQuest.api:IsQuestInLog(questID)
  return pfQuest:IsQuestInLog(questID)
end

function pfQuest.api:GetQuestProgress(questIndex)
  return pfQuest:GetQuestProgress(questIndex)
end

-- UI control
function pfQuest.api:ShowTracker()
  pfQuest:ShowTracker()
end

function pfQuest.api:HideTracker()
  pfQuest:HideTracker()
end

function pfQuest.api:ToggleTracker()
  pfQuest:ToggleTracker()
end

function pfQuest.api:ShowBrowser()
  pfQuest:ShowBrowser()
end

function pfQuest.api:ShowConfig()
  pfQuest:ShowConfig()
end

-- Configuration access
function pfQuest.api:GetConfig()
  return pfQuest.config
end

function pfQuest.api:SetConfigValue(module, key, value)
  if pfQuest.config[module] then
    pfQuest.config[module][key] = value
    pfQuest:SaveConfig()
    return true
  end
  return false
end

-- Event registration for other addons
pfQuest.api.callbacks = {}

function pfQuest.api:RegisterCallback(event, callback)
  if not pfQuest.api.callbacks[event] then
    pfQuest.api.callbacks[event] = {}
  end
  table.insert(pfQuest.api.callbacks[event], callback)
end

function pfQuest.api:UnregisterCallback(event, callback)
  if not pfQuest.api.callbacks[event] then return end
  
  for i, cb in ipairs(pfQuest.api.callbacks[event]) do
    if cb == callback then
      table.remove(pfQuest.api.callbacks[event], i)
      break
    end
  end
end

function pfQuest.api:FireCallback(event, ...)
  if not pfQuest.api.callbacks[event] then return end
  
  for _, callback in ipairs(pfQuest.api.callbacks[event]) do
    if type(callback) == "function" then
      pcall(callback, ...)
    end
  end
end

-- Database access
function pfQuest.api:GetNPCQuests(npcName)
  return pfQuest:GetNPCQuests(npcName)
end

function pfQuest.api:GetItemQuests(itemName)
  return pfQuest:GetItemQuests(itemName)
end

function pfQuest.api:GetZoneQuests(zoneName)
  -- This would return all quests for a specific zone
  local zoneQuests = {}
  for questID, questData in pairs(pfQuest.db.quests) do
    if questData.zone == zoneName then
      table.insert(zoneQuests, questData)
    end
  end
  return zoneQuests
end

-- Utility functions
function pfQuest.api:GetPlayerLevel()
  return UnitLevel("player")
end

function pfQuest.api:GetQuestColor(level)
  return pfQuest:GetQuestColor(level)
end

function pfQuest.api:Print(message)
  pfQuest:Print(message)
end

-- Version information
function pfQuest.api:GetVersion()
  return pfQuest.version
end

function pfQuest.api:IsCompatible(requiredVersion)
  -- Simple version comparison
  local current = pfQuest.version
  return current >= requiredVersion
end

-- Integration helpers
function pfQuest.api:AddCustomQuestData(questID, questData)
  -- Allow other addons to add quest data
  if not pfQuest.db.custom then
    pfQuest.db.custom = {}
  end
  pfQuest.db.custom[questID] = questData
end

function pfQuest.api:GetCustomQuestData(questID)
  if pfQuest.db.custom then
    return pfQuest.db.custom[questID]
  end
  return nil
end

-- Map integration
function pfQuest.api:UpdateMapNodes()
  pfQuest:UpdateMapNodes()
end

function pfQuest.api:AddMapNode(x, y, icon, tooltip)
  -- Allow other addons to add custom map nodes
  -- This would integrate with the map system
end

-- Export global API
_G.pfQuestAPI = pfQuest.api
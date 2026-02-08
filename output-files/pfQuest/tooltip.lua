-- pfQuest Tooltip Module
-- Enhanced tooltips with quest information

pfQuest.tooltip = {}
pfQuest.tooltip.hooked = false

function pfQuest:InitializeTooltips()
  if not pfQuest.config.tooltip.enabled or pfQuest.tooltip.hooked then
    return
  end
  
  -- Hook GameTooltip
  pfQuest:HookTooltipFunctions()
  pfQuest.tooltip.hooked = true
end

function pfQuest:HookTooltipFunctions()
  -- Hook tooltip for NPCs and objects
  local originalSetUnit = GameTooltip.SetUnit
  local originalSetHyperlink = GameTooltip.SetHyperlink
  
  GameTooltip.SetUnit = function(tooltip, unit)
    originalSetUnit(tooltip, unit)
    pfQuest:AddUnitQuestInfo(tooltip, unit)
  end
  
  GameTooltip.SetHyperlink = function(tooltip, link)
    originalSetHyperlink(tooltip, link)
    pfQuest:AddHyperlinkQuestInfo(tooltip, link)
  end
  
  -- Hook item tooltips
  local originalSetBagItem = GameTooltip.SetBagItem
  local originalSetInventoryItem = GameTooltip.SetInventoryItem
  
  GameTooltip.SetBagItem = function(tooltip, bag, slot)
    originalSetBagItem(tooltip, bag, slot)
    local itemLink = GetContainerItemLink(bag, slot)
    if itemLink then
      pfQuest:AddItemQuestInfo(tooltip, itemLink)
    end
  end
  
  GameTooltip.SetInventoryItem = function(tooltip, unit, slot)
    originalSetInventoryItem(tooltip, unit, slot)
    local itemLink = GetInventoryItemLink(unit, slot)
    if itemLink then
      pfQuest:AddItemQuestInfo(tooltip, itemLink)
    end
  end
end

function pfQuest:AddUnitQuestInfo(tooltip, unit)
  if not unit or not UnitExists(unit) or not UnitIsPlayer(unit) == false then
    return
  end
  
  local unitName = UnitName(unit)
  if not unitName then return end
  
  -- Check if this NPC is related to any quests
  local questInfo = pfQuest:GetNPCQuests(unitName)
  if questInfo and table.getn(questInfo) > 0 then
    tooltip:AddLine(" ") -- Separator
    tooltip:AddLine("Quests:", 1, 1, 0) -- Yellow header
    
    for _, quest in ipairs(questInfo) do
      local color = pfQuest:GetQuestColor(quest.level)
      local statusText = ""
      
      if pfQuest:IsQuestCompleted(quest.id) then
        statusText = " (Complete)"
        color = pfQuest.colors.gray
      elseif pfQuest:IsQuestInLog(quest.id) then
        statusText = " (In Progress)"
      end
      
      tooltip:AddLine(color .. quest.title .. statusText, 1, 1, 1, true)
    end
  end
end

function pfQuest:AddItemQuestInfo(tooltip, itemLink)
  if not itemLink then return end
  
  local itemName = pfQuest:GetItemNameFromLink(itemLink)
  if not itemName then return end
  
  -- Check if this item is needed for any quests
  local questInfo = pfQuest:GetItemQuests(itemName)
  if questInfo and table.getn(questInfo) > 0 then
    tooltip:AddLine(" ") -- Separator
    tooltip:AddLine("Quest Item:", 1, 1, 0) -- Yellow header
    
    for _, quest in ipairs(questInfo) do
      local color = pfQuest:GetQuestColor(quest.level)
      local progressText = ""
      
      if quest.current and quest.needed then
        progressText = " (" .. quest.current .. "/" .. quest.needed .. ")"
      end
      
      tooltip:AddLine(color .. quest.title .. progressText, 1, 1, 1, true)
    end
  end
end

function pfQuest:AddHyperlinkQuestInfo(tooltip, link)
  if not link then return end
  
  -- Handle different types of links
  local linkType, linkData = strsplit(":", link)
  
  if linkType == "quest" then
    pfQuest:AddQuestTooltipInfo(tooltip, linkData)
  end
end

function pfQuest:AddQuestTooltipInfo(tooltip, questID)
  if not questID then return end
  
  local quest = pfQuest:GetQuestData(tonumber(questID))
  if not quest then return end
  
  if pfQuest.config.tooltip.showQuestLevel then
    tooltip:AddLine("Level: " .. quest.level, 0.8, 0.8, 0.8)
  end
  
  if pfQuest.config.tooltip.showObjectives and quest.objectives then
    tooltip:AddLine(" ")
    tooltip:AddLine("Objectives:", 1, 1, 0)
    
    for _, objective in ipairs(quest.objectives) do
      if objective.text then
        tooltip:AddLine("  " .. objective.text, 0.9, 0.9, 0.9, true)
      end
    end
  end
end

function pfQuest:GetNPCQuests(npcName)
  -- This would normally search the quest database for quests involving this NPC
  -- For now, return sample data
  local sampleNPCQuests = {
    ["Marshal McBride"] = {
      { id = 1, title = "A Threat Within", level = 1 },
      { id = 2, title = "Kobold Camp Cleanup", level = 2 },
    },
  }
  
  return sampleNPCQuests[npcName] or {}
end

function pfQuest:GetItemQuests(itemName)
  -- This would normally search for quests that need this item
  -- For now, return sample data
  local sampleItemQuests = {
    ["Kobold Candle"] = {
      { id = 47, title = "Gold Dust Exchange", level = 5, current = 3, needed = 8 },
    },
    ["Linen Cloth"] = {
      { id = 83, title = "Red Linen Goods", level = 12, current = 5, needed = 10 },
    },
  }
  
  return sampleItemQuests[itemName] or {}
end

function pfQuest:GetItemNameFromLink(itemLink)
  if not itemLink then return nil end
  
  local _, _, itemName = string.find(itemLink, "|h%[(.+)%]|h")
  return itemName
end

-- Initialize tooltips when enabled
if pfQuest.config.tooltip.enabled then
  pfQuest:InitializeTooltips()
end
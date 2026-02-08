-- pfQuest Quest Log Module
-- Handles quest log integration and tracking

pfQuest.questlog = {}

-- Quest log events
pfQuest.questlog.frame = CreateFrame("Frame")
pfQuest.questlog.frame:RegisterEvent("QUEST_LOG_UPDATE")
pfQuest.questlog.frame:RegisterEvent("QUEST_WATCH_UPDATE") 
pfQuest.questlog.frame:RegisterEvent("UI_INFO_MESSAGE")

pfQuest.questlog.frame:SetScript("OnEvent", function()
  if event == "QUEST_LOG_UPDATE" then
    pfQuest:UpdateQuestLog()
  elseif event == "QUEST_WATCH_UPDATE" then
    pfQuest:UpdateWatchedQuests()
  elseif event == "UI_INFO_MESSAGE" then
    if arg1 == "Quest completed." then
      pfQuest:OnQuestCompleted()
    end
  end
end)

-- Quest log data
pfQuest.questlog.quests = {}
pfQuest.questlog.watched = {}

function pfQuest:UpdateQuestLog()
  -- Clear existing quest data
  pfQuest.questlog.quests = {}
  
  local numEntries, numQuests = GetNumQuestLogEntries()
  
  for i = 1, numEntries do
    local questLogTitleText, level, questTag, isHeader, isCollapsed, isComplete = GetQuestLogTitle(i)
    
    if not isHeader then
      local questIndex = i
      local questData = {
        index = questIndex,
        title = questLogTitleText,
        level = level,
        tag = questTag,
        isComplete = isComplete,
        objectives = {}
      }
      
      -- Get quest objectives
      SelectQuestLogEntry(questIndex)
      local questDescription, questObjectives = GetQuestLogQuestText()
      local numObjectives = GetNumQuestLeaderBoards()
      
      for j = 1, numObjectives do
        local description, objectiveType, finished = GetQuestLogLeaderBoard(j)
        if description then
          table.insert(questData.objectives, {
            text = description,
            type = objectiveType,
            finished = finished
          })
        end
      end
      
      questData.description = questDescription
      questData.objectives_text = questObjectives
      
      table.insert(pfQuest.questlog.quests, questData)
    end
  end
  
  -- Update tracker
  if pfQuest.config.tracker.enabled then
    pfQuest:UpdateTracker()
  end
end

function pfQuest:UpdateWatchedQuests()
  pfQuest.questlog.watched = {}
  
  for i = 1, GetNumQuestWatches() do
    local questIndex = GetQuestIndexForWatch(i)
    if questIndex then
      local questLogTitleText, level, questTag, isHeader, isCollapsed, isComplete = GetQuestLogTitle(questIndex)
      if questLogTitleText then
        table.insert(pfQuest.questlog.watched, {
          index = questIndex,
          title = questLogTitleText,
          level = level,
          tag = questTag,
          isComplete = isComplete
        })
      end
    end
  end
  
  if pfQuest.config.tracker.enabled then
    pfQuest:UpdateTracker()
  end
end

function pfQuest:OnQuestCompleted()
  -- Handle quest completion
  if pfQuest.player and pfQuest.player.completed then
    -- This would normally track completed quests
    -- For now, just refresh the quest log
    pfQuest:UpdateQuestLog()
  end
end

function pfQuest:GetQuestByTitle(title)
  for _, quest in ipairs(pfQuest.questlog.quests) do
    if quest.title == title then
      return quest
    end
  end
  return nil
end

function pfQuest:GetQuestByIndex(index)
  for _, quest in ipairs(pfQuest.questlog.quests) do
    if quest.index == index then
      return quest
    end
  end
  return nil
end

function pfQuest:IsQuestWatched(questIndex)
  for _, watchedQuest in ipairs(pfQuest.questlog.watched) do
    if watchedQuest.index == questIndex then
      return true
    end
  end
  return false
end

function pfQuest:GetNumIncompleteQuests()
  local count = 0
  for _, quest in ipairs(pfQuest.questlog.quests) do
    if not quest.isComplete then
      count = count + 1
    end
  end
  return count
end

function pfQuest:GetQuestProgress(questIndex)
  local quest = pfQuest:GetQuestByIndex(questIndex)
  if not quest then return "" end
  
  local progress = ""
  for _, objective in ipairs(quest.objectives) do
    if objective.text then
      local color = objective.finished and pfQuest.colors.green or pfQuest.colors.white
      progress = progress .. color .. objective.text .. pfQuest.colors.close .. "\\n"
    end
  end
  
  return progress
end

-- Compatibility functions for older quest log addons
function pfQuest:SelectQuest(questIndex)
  if questIndex and questIndex > 0 and questIndex <= GetNumQuestLogEntries() then
    SelectQuestLogEntry(questIndex)
    return true
  end
  return false
end

function pfQuest:GetSelectedQuest()
  local selectedIndex = GetQuestLogSelection()
  return pfQuest:GetQuestByIndex(selectedIndex)
end

-- Initialize quest log on startup
pfQuest:UpdateQuestLog()
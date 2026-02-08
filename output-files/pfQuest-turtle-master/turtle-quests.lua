-- pfQuest TurtleWoW Quest Management
-- Handles TurtleWoW specific quest mechanics and features

pfTurtle.quests = pfTurtle.quests or {}

-- TurtleWoW quest tracking enhancements
function pfTurtle:EnhanceQuestTracking()
  if not pfTurtle.compat.isTurtle then return end
  
  -- Hook into pfQuest's quest tracking
  pfTurtle:HookQuestEvents()
  pfTurtle:ExtendQuestTracker()
end

function pfTurtle:HookQuestEvents()
  -- Hook quest completion events
  local originalOnQuestComplete = pfQuest.OnQuestCompleted
  pfQuest.OnQuestCompleted = function()
    originalOnQuestComplete()
    pfTurtle:OnTurtleQuestComplete()
  end
  
  -- Hook quest log updates
  local originalUpdateQuestLog = pfQuest.UpdateQuestLog
  pfQuest.UpdateQuestLog = function()
    originalUpdateQuestLog()
    pfTurtle:UpdateTurtleQuestLog()
  end
end

function pfTurtle:OnTurtleQuestComplete()
  -- Handle TurtleWoW specific quest completion
  pfTurtle:CheckHardcoreAchievements()
  pfTurtle:UpdateTurtleStats()
end

function pfTurtle:UpdateTurtleQuestLog()
  -- Add TurtleWoW specific quest information
  for _, quest in ipairs(pfQuest.questlog.quests or {}) do
    if quest then
      pfTurtle:EnhanceQuestInfo(quest)
    end
  end
end

function pfTurtle:EnhanceQuestInfo(quest)
  if not quest or not quest.title then return end
  
  -- Check if this is a TurtleWoW custom quest
  local customQuest = pfTurtle:FindCustomQuestByTitle(quest.title)
  if customQuest then
    quest.turtle_custom = true
    quest.turtle_data = customQuest
    
    -- Add hardcore indicators
    if customQuest.hardcore_only then
      quest.turtle_hardcore = true
    end
  end
end

function pfTurtle:FindCustomQuestByTitle(title)
  for questID, questData in pairs(pfTurtle.db.customQuests) do
    if questData.title == title then
      return questData
    end
  end
  return nil
end

-- Hardcore mode quest management
function pfTurtle:CheckHardcoreAchievements()
  if not pfTurtle:IsHardcoreMode() then return end
  
  local playerLevel = UnitLevel("player")
  
  -- Check for hardcore milestones
  local milestones = {10, 20, 30, 40, 50, 60}
  for _, milestone in ipairs(milestones) do
    if playerLevel == milestone then
      pfTurtle:OnHardcoreMilestone(milestone)
      break
    end
  end
end

function pfTurtle:OnHardcoreMilestone(level)
  pfTurtle:Print("Hardcore milestone reached: Level " .. level .. "!")
  
  -- Record milestone
  if not pfTurtle.player.hardcore_milestones then
    pfTurtle.player.hardcore_milestones = {}
  end
  pfTurtle.player.hardcore_milestones[level] = time()
end

-- Custom quest chain management
function pfTurtle:InitializeQuestChains()
  pfTurtle.questChains = {
    -- TurtleWoW custom quest chains
    ["turtle_explorer"] = {
      name = "Turtle Explorer",
      description = "Explore all TurtleWoW custom zones",
      quests = {50001, 50002},
      rewards = {
        title = "Explorer",
        achievement = "turtle_explorer"
      }
    },
    ["hardcore_survivor"] = {
      name = "Hardcore Survivor",
      description = "Reach level 60 in hardcore mode",
      quests = {50003},
      hardcore_only = true,
      rewards = {
        title = "Survivor",
        achievement = "hardcore_60"
      }
    }
  }
end

function pfTurtle:GetQuestChain(questID)
  for chainID, chain in pairs(pfTurtle.questChains or {}) do
    for _, qID in ipairs(chain.quests) do
      if qID == questID then
        return chain
      end
    end
  end
  return nil
end

function pfTurtle:IsQuestChainComplete(chainID)
  local chain = pfTurtle.questChains[chainID]
  if not chain then return false end
  
  for _, questID in ipairs(chain.quests) do
    if not pfQuest:IsQuestCompleted(questID) then
      return false
    end
  end
  
  return true
end

-- Quest difficulty scaling for TurtleWoW
function pfTurtle:GetTurtleQuestDifficulty(quest)
  if not quest or not quest.turtle_data then
    return "normal"
  end
  
  local questData = quest.turtle_data
  local playerLevel = UnitLevel("player")
  
  if questData.hardcore_only then
    return "hardcore"
  elseif questData.level > playerLevel + 5 then
    return "elite"
  elseif questData.level < playerLevel - 10 then
    return "trivial"
  else
    return "normal"
  end
end

-- Extended quest tracker for TurtleWoW
function pfTurtle:ExtendQuestTracker()
  -- Add TurtleWoW specific quest tracker features
  if not pfQuest.tracker or not pfQuest.tracker.frame then return end
  
  -- Create TurtleWoW info panel
  pfTurtle:CreateTurtleTrackerPanel()
end

function pfTurtle:CreateTurtleTrackerPanel()
  if pfTurtle.trackerPanel then return end
  
  local panel = CreateFrame("Frame", "pfTurtleTrackerPanel", pfQuest.tracker.frame)
  panel:SetWidth(280)
  panel:SetHeight(30)
  panel:SetPoint("TOP", pfQuest.tracker.frame, "BOTTOM", 0, -5)
  panel:SetBackdrop({
    bgFile = "Interface\\Tooltips\\UI-Tooltip-Background",
    edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
    tile = true, tileSize = 16, edgeSize = 16,
    insets = { left = 5, right = 5, top = 5, bottom = 5 }
  })
  panel:SetBackdropColor(0, 0, 0, 0.8)
  panel:SetBackdropBorderColor(0.8, 0.4, 0, 1) -- Orange border for TurtleWoW
  
  -- TurtleWoW status text
  local statusText = panel:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  statusText:SetPoint("CENTER")
  statusText:SetText("TurtleWoW Mode Active")
  statusText:SetTextColor(1, 0.8, 0, 1) -- Gold color
  
  -- Hardcore indicator
  if pfTurtle:IsHardcoreMode() then
    local hardcoreText = panel:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
    hardcoreText:SetPoint("TOP", statusText, "BOTTOM", 0, -2)
    hardcoreText:SetText("HARDCORE MODE")
    hardcoreText:SetTextColor(1, 0, 0, 1) -- Red color
  end
  
  pfTurtle.trackerPanel = panel
end

-- Quest completion statistics
function pfTurtle:UpdateTurtleStats()
  if not pfTurtle.player.stats then
    pfTurtle.player.stats = {
      custom_quests_completed = 0,
      hardcore_quests_completed = 0,
      total_turtle_time = 0,
    }
  end
  
  -- Update stats based on current session
  pfTurtle.player.stats.total_turtle_time = pfTurtle.player.stats.total_turtle_time + 1
end

function pfTurtle:GetTurtleQuestStats()
  if not pfTurtle.player.stats then
    return {
      custom_quests_completed = 0,
      hardcore_quests_completed = 0,
      total_turtle_time = 0,
    }
  end
  
  return pfTurtle.player.stats
end

-- Quest reward enhancements
function pfTurtle:EnhanceQuestRewards()
  -- Add TurtleWoW specific reward processing
  -- This would integrate with TurtleWoW's custom reward system
end

-- Initialize quest system
if pfTurtle.compat.isTurtle then
  pfTurtle:EnhanceQuestTracking()
  pfTurtle:InitializeQuestChains()
  pfTurtle:EnhanceQuestRewards()
end
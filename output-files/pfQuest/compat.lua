-- pfQuest Compatibility Module
-- Ensures compatibility with vanilla WoW and TurtleWoW

pfQuest.compat = {}

-- Version detection
local version = GetBuildInfo and GetBuildInfo() or "1.12.1"
pfQuest.compat.version = version
pfQuest.compat.isTurtleWoW = (GetRealmName and string.find(GetRealmName(), "Turtle")) ~= nil

-- API compatibility fixes
function pfQuest:FixAPICompatibility()
  -- GetQuestLogTitle compatibility
  if not GetQuestLogTitle then
    GetQuestLogTitle = function(questIndex)
      return "", 1, "", false, false, false
    end
  end
  
  -- GetNumQuestLogEntries compatibility
  if not GetNumQuestLogEntries then
    GetNumQuestLogEntries = function()
      return 0, 0
    end
  end
  
  -- GetQuestLogSelection compatibility
  if not GetQuestLogSelection then
    GetQuestLogSelection = function()
      return 1
    end
  end
  
  -- SelectQuestLogEntry compatibility
  if not SelectQuestLogEntry then
    SelectQuestLogEntry = function(questIndex)
      -- Stub function
    end
  end
  
  -- GetQuestLogQuestText compatibility
  if not GetQuestLogQuestText then
    GetQuestLogQuestText = function()
      return "", ""
    end
  end
  
  -- GetNumQuestLeaderBoards compatibility
  if not GetNumQuestLeaderBoards then
    GetNumQuestLeaderBoards = function()
      return 0
    end
  end
  
  -- GetQuestLogLeaderBoard compatibility
  if not GetQuestLogLeaderBoard then
    GetQuestLogLeaderBoard = function(objectiveIndex)
      return "", "", false
    end
  end
  
  -- GetNumQuestWatches compatibility
  if not GetNumQuestWatches then
    GetNumQuestWatches = function()
      return 0
    end
  end
  
  -- GetQuestIndexForWatch compatibility
  if not GetQuestIndexForWatch then
    GetQuestIndexForWatch = function(watchIndex)
      return nil
    end
  end
  
  -- GetPlayerMapPosition compatibility
  if not GetPlayerMapPosition then
    GetPlayerMapPosition = function(unit)
      return 0, 0
    end
  end
  
  -- GetRealZoneText compatibility
  if not GetRealZoneText then
    GetRealZoneText = function()
      return "Unknown Zone"
    end
  end
end

-- Frame template compatibility
function pfQuest:CreateCompatibleFrame(frameType, name, parent, template)
  local frame = CreateFrame(frameType, name, parent)
  
  -- Add common properties that might be missing
  if not frame.SetBackdrop and frameType == "Frame" then
    -- Provide a basic backdrop function for older versions
    frame.SetBackdrop = function(self, backdrop)
      -- Basic implementation
    end
  end
  
  return frame
end

-- Tooltip compatibility
function pfQuest:FixTooltipCompatibility()
  -- Ensure GameTooltip exists
  if not GameTooltip then
    GameTooltip = CreateFrame("GameTooltip", "GameTooltip", UIParent, "GameTooltipTemplate")
  end
  
  -- Fix tooltip methods that might be missing
  if GameTooltip and not GameTooltip.SetOwner then
    GameTooltip.SetOwner = function(self, owner, anchor)
      self:ClearAllPoints()
      if anchor == "ANCHOR_CURSOR" then
        self:SetPoint("BOTTOMLEFT", UIParent, "BOTTOMLEFT", GetCursorPosition())
      else
        self:SetPoint("BOTTOM", owner, "TOP")
      end
    end
  end
end

-- Color code compatibility
function pfQuest:GetCompatibleColorCode(colorName)
  local colors = {
    red = "|cffff0000",
    green = "|cff00ff00",
    blue = "|cff0000ff",
    yellow = "|cffffff00",
    orange = "|cffff8000",
    gray = "|cff808080",
    white = "|cffffffff",
    close = "|r"
  }
  
  return colors[colorName] or "|cffffffff"
end

-- Event compatibility
function pfQuest:RegisterCompatibleEvents(frame, events)
  if not frame or not events then return end
  
  for _, event in ipairs(events) do
    if event == "QUEST_LOG_UPDATE" then
      -- Always register this event
      frame:RegisterEvent(event)
    elseif event == "QUEST_WATCH_UPDATE" then
      -- This might not exist in all versions
      if pcall(frame.RegisterEvent, frame, event) then
        -- Successfully registered
      else
        -- Fallback to QUEST_LOG_UPDATE
        frame:RegisterEvent("QUEST_LOG_UPDATE")
      end
    else
      -- Try to register other events
      pcall(frame.RegisterEvent, frame, event)
    end
  end
end

-- TurtleWoW specific compatibility
function pfQuest:ApplyTurtleWoWCompat()
  if not pfQuest.compat.isTurtleWoW then return end
  
  -- TurtleWoW specific adjustments
  pfQuest:Print("TurtleWoW detected - applying compatibility fixes")
  
  -- Adjust interface version handling
  if pfQuest.compat.version and string.find(pfQuest.compat.version, "1.12.1") then
    -- Use TurtleWoW specific features if available
  end
end

-- Initialize compatibility fixes
function pfQuest:InitializeCompatibility()
  pfQuest:FixAPICompatibility()
  pfQuest:FixTooltipCompatibility()
  pfQuest:ApplyTurtleWoWCompat()
  
  pfQuest:Print("Compatibility layer initialized for " .. pfQuest.compat.version)
end

-- Call compatibility initialization
pfQuest:InitializeCompatibility()
-- pfQuest Tracker Module
-- Visual quest tracking interface

pfQuest.tracker = {}
pfQuest.tracker.frame = nil
pfQuest.tracker.buttons = {}

function pfQuest:CreateTracker()
  if pfQuest.tracker.frame then return end
  
  local frame = CreateFrame("Frame", "pfQuestTracker", UIParent)
  frame:SetWidth(pfQuest.config.tracker.width or 300)
  frame:SetHeight(pfQuest.config.tracker.height or 150)
  frame:SetPoint(pfQuest.config.tracker.point or "TOPLEFT", 
                pfQuest.config.tracker.x or 20, 
                pfQuest.config.tracker.y or -100)
  
  frame:SetBackdrop({
    bgFile = "Interface\\\\Tooltips\\\\UI-Tooltip-Background",
    edgeFile = "Interface\\\\Tooltips\\\\UI-Tooltip-Border",
    tile = true, tileSize = 16, edgeSize = 16,
    insets = { left = 5, right = 5, top = 5, bottom = 5 }
  })
  frame:SetBackdropColor(0, 0, 0, 0.8)
  frame:SetBackdropBorderColor(0.4, 0.4, 0.4, 1)
  
  frame:EnableMouse(true)
  frame:SetMovable(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", function() this:StartMoving() end)
  frame:SetScript("OnDragStop", function() 
    this:StopMovingOrSizing()
    local point, relativeTo, relativePoint, xOfs, yOfs = this:GetPoint()
    pfQuest.config.tracker.x = xOfs
    pfQuest.config.tracker.y = yOfs
    pfQuest.config.tracker.point = point
    pfQuest.config.tracker.relativePoint = relativePoint
  end)
  
  -- Title bar
  local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  title:SetPoint("TOPLEFT", 8, -8)
  title:SetText("pfQuest Tracker")
  title:SetTextColor(1, 1, 1, 1)
  
  -- Close button
  local closeBtn = CreateFrame("Button", nil, frame)
  closeBtn:SetWidth(16)
  closeBtn:SetHeight(16)
  closeBtn:SetPoint("TOPRIGHT", -5, -5)
  closeBtn:SetNormalTexture("Interface\\\\Buttons\\\\UI-Panel-MinimizeButton-Up")
  closeBtn:SetPushedTexture("Interface\\\\Buttons\\\\UI-Panel-MinimizeButton-Down")
  closeBtn:SetHighlightTexture("Interface\\\\Buttons\\\\UI-Panel-MinimizeButton-Highlight")
  closeBtn:SetScript("OnClick", function() pfQuest:HideTracker() end)
  
  -- Scroll frame for quest list
  local scrollFrame = CreateFrame("ScrollFrame", "pfQuestTrackerScroll", frame, "UIPanelScrollFrameTemplate")
  scrollFrame:SetPoint("TOPLEFT", 8, -25)
  scrollFrame:SetPoint("BOTTOMRIGHT", -25, 8)
  
  local scrollChild = CreateFrame("Frame", nil, scrollFrame)
  scrollChild:SetWidth(1)
  scrollChild:SetHeight(1)
  scrollFrame:SetScrollChild(scrollChild)
  
  frame.scrollFrame = scrollFrame
  frame.scrollChild = scrollChild
  
  pfQuest.tracker.frame = frame
  
  if not pfQuest.config.tracker.visible then
    frame:Hide()
  end
end

function pfQuest:ShowTracker()
  if not pfQuest.tracker.frame then
    pfQuest:CreateTracker()
  end
  pfQuest.tracker.frame:Show()
  pfQuest.config.tracker.visible = true
  pfQuest:UpdateTracker()
end

function pfQuest:HideTracker()
  if pfQuest.tracker.frame then
    pfQuest.tracker.frame:Hide()
  end
  pfQuest.config.tracker.visible = false
end

function pfQuest:ToggleTracker()
  if pfQuest.tracker.frame and pfQuest.tracker.frame:IsVisible() then
    pfQuest:HideTracker()
  else
    pfQuest:ShowTracker()
  end
end

function pfQuest:UpdateTracker()
  if not pfQuest.tracker.frame or not pfQuest.tracker.frame:IsVisible() then
    return
  end
  
  -- Clear existing buttons
  for _, button in ipairs(pfQuest.tracker.buttons) do
    button:Hide()
    button:SetParent(nil)
  end
  pfQuest.tracker.buttons = {}
  
  local yOffset = -5
  local buttonHeight = 0
  
  -- Add watched quests to tracker
  for _, quest in ipairs(pfQuest.questlog.watched) do
    local questButton = pfQuest:CreateQuestButton(quest, yOffset)
    if questButton then
      table.insert(pfQuest.tracker.buttons, questButton)
      yOffset = yOffset - questButton:GetHeight() - 2
      buttonHeight = buttonHeight + questButton:GetHeight() + 2
    end
  end
  
  -- Update scroll frame
  if pfQuest.tracker.frame.scrollChild then
    pfQuest.tracker.frame.scrollChild:SetHeight(math.max(buttonHeight, 1))
  end
end

function pfQuest:CreateQuestButton(quest, yOffset)
  if not quest or not pfQuest.tracker.frame then return nil end
  
  local button = CreateFrame("Button", nil, pfQuest.tracker.frame.scrollChild)
  button:SetWidth(pfQuest.tracker.frame.scrollChild:GetWidth() - 10)
  button:SetHeight(20)
  button:SetPoint("TOPLEFT", 5, yOffset)
  
  -- Quest title
  local titleColor = pfQuest:GetQuestColor(quest.level)
  local titleText = titleColor .. "[" .. quest.level .. "] " .. quest.title .. pfQuest.colors.close
  
  local title = button:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  title:SetPoint("TOPLEFT", 0, -2)
  title:SetText(titleText)
  title:SetJustifyH("LEFT")
  
  -- Quest objectives
  local objectivesText = ""\n  local objectiveHeight = 0
  
  local questData = pfQuest:GetQuestByIndex(quest.index)
  if questData and questData.objectives then
    for _, objective in ipairs(questData.objectives) do
      if objective.text then
        local color = objective.finished and pfQuest.colors.green or pfQuest.colors.white
        objectivesText = objectivesText .. color .. "  " .. objective.text .. pfQuest.colors.close .. "\\n"
        objectiveHeight = objectiveHeight + 12
      end
    end
  end
  
  if objectivesText ~= "" then
    local objectives = button:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
    objectives:SetPoint("TOPLEFT", title, "BOTTOMLEFT", 0, -2)
    objectives:SetText(objectivesText)
    objectives:SetJustifyH("LEFT")
    
    button:SetHeight(20 + objectiveHeight)
  end
  
  -- Button interactions
  button:SetScript("OnClick", function()
    if quest.index then
      pfQuest:SelectQuest(quest.index)
      if QuestLogFrame:IsVisible() then
        -- Update quest log selection if it's open
      end
    end
  end)
  
  button:SetScript("OnEnter", function()
    if quest.index then
      GameTooltip:SetOwner(this, "ANCHOR_RIGHT")
      GameTooltip:SetText(quest.title, 1, 1, 1)
      if questData and questData.description then
        GameTooltip:AddLine(questData.description, nil, nil, nil, 1)
      end
      GameTooltip:Show()
    end
  end)
  
  button:SetScript("OnLeave", function()
    GameTooltip:Hide()
  end)
  
  return button
nend

-- Auto-show tracker if enabled
if pfQuest.config.tracker.enabled and pfQuest.config.tracker.visible then
  pfQuest:ShowTracker()
end
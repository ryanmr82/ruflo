-- pfQuest Browser Module
-- Quest database browser and search interface

pfQuest.browser = {}
pfQuest.browser.frame = nil
pfQuest.browser.listFrame = nil
pfQuest.browser.searchBox = nil
pfQuest.browser.quests = {}

function pfQuest:CreateBrowser()
  if pfQuest.browser.frame then return end
  
  local frame = CreateFrame("Frame", "pfQuestBrowser", UIParent)
  frame:SetWidth(600)
  frame:SetHeight(400)
  frame:SetPoint("CENTER")
  frame:SetBackdrop({
    bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
    edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
    tile = true, tileSize = 32, edgeSize = 32,
    insets = { left = 8, right = 8, top = 8, bottom = 8 }
  })
  frame:EnableMouse(true)
  frame:SetMovable(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", function() this:StartMoving() end)
  frame:SetScript("OnDragStop", function() this:StopMovingOrSizing() end)
  frame:Hide()
  
  -- Title
  local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
  title:SetPoint("TOP", 0, -15)
  title:SetText("pfQuest Browser")
  
  -- Close button
  local closeBtn = CreateFrame("Button", nil, frame, "UIPanelCloseButton")
  closeBtn:SetPoint("TOPRIGHT", -5, -5)
  
  -- Search box
  local searchBox = CreateFrame("EditBox", "pfQuestBrowserSearch", frame, "InputBoxTemplate")
  searchBox:SetWidth(200)
  searchBox:SetHeight(20)
  searchBox:SetPoint("TOPLEFT", 20, -50)
  searchBox:SetAutoFocus(false)
  
  local searchLabel = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  searchLabel:SetPoint("BOTTOMLEFT", searchBox, "TOPLEFT", 0, 5)
  searchLabel:SetText("Search Quests:")
  
  searchBox:SetScript("OnTextChanged", function()
    pfQuest:FilterQuests(this:GetText())
  end)
  
  -- Filter buttons
  local showCompleted = CreateFrame("CheckButton", nil, frame, "ChatConfigCheckButtonTemplate")
  showCompleted:SetPoint("LEFT", searchBox, "RIGHT", 20, 0)
  showCompleted:SetChecked(pfQuest.config.browser.showCompleted)
  
  local completedLabel = showCompleted:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  completedLabel:SetPoint("LEFT", showCompleted, "RIGHT", 5, 0)
  completedLabel:SetText("Show Completed")
  
  showCompleted:SetScript("OnClick", function()
    pfQuest.config.browser.showCompleted = this:GetChecked()
    pfQuest:UpdateBrowserList()
  end)
  
  -- Quest list scroll frame
  local scrollFrame = CreateFrame("ScrollFrame", "pfQuestBrowserScroll", frame, "UIPanelScrollFrameTemplate")
  scrollFrame:SetPoint("TOPLEFT", 20, -90)
  scrollFrame:SetPoint("BOTTOMRIGHT", -40, 40)
  
  local listFrame = CreateFrame("Frame", nil, scrollFrame)
  listFrame:SetWidth(1)
  listFrame:SetHeight(1)
  scrollFrame:SetScrollChild(listFrame)
  
  pfQuest.browser.frame = frame
  pfQuest.browser.listFrame = listFrame
  pfQuest.browser.searchBox = searchBox
  
  pfQuest:UpdateBrowserList()
end

function pfQuest:ShowBrowser()
  if not pfQuest.browser.frame then
    pfQuest:CreateBrowser()
  end
  
  if pfQuest.browser.frame:IsVisible() then
    pfQuest.browser.frame:Hide()
  else
    pfQuest.browser.frame:Show()
    pfQuest:UpdateBrowserList()
  end
end

function pfQuest:UpdateBrowserList()
  if not pfQuest.browser.frame or not pfQuest.browser.frame:IsVisible() then
    return
  end
  
  -- Clear existing quest buttons
  local children = { pfQuest.browser.listFrame:GetChildren() }
  for _, child in ipairs(children) do
    child:Hide()
    child:SetParent(nil)
  end
  
  local yOffset = -5
  local playerLevel = UnitLevel("player")
  
  -- Add sample quests (normally this would load from the full database)
  for questID, questData in pairs(pfQuest.db.sampleQuests) do
    local shouldShow = true
    
    -- Level filtering
    if not pfQuest.config.browser.showLowLevel and questData.level < (playerLevel - 5) then
      shouldShow = false
    end
    
    if not pfQuest.config.browser.showHighLevel and questData.level > (playerLevel + 10) then
      shouldShow = false
    end
    
    -- Completed filtering
    if not pfQuest.config.browser.showCompleted and pfQuest:IsQuestCompleted(questID) then
      shouldShow = false
    end
    
    if shouldShow then
      local questButton = pfQuest:CreateQuestBrowserButton(questData, yOffset)
      if questButton then
        yOffset = yOffset - 25
      end
    end
  end
  
  -- Update scroll frame height
  pfQuest.browser.listFrame:SetHeight(math.max(math.abs(yOffset), 1))
end

function pfQuest:CreateQuestBrowserButton(questData, yOffset)
  if not questData or not pfQuest.browser.listFrame then return nil end
  
  local button = CreateFrame("Button", nil, pfQuest.browser.listFrame)
  button:SetWidth(pfQuest.browser.listFrame:GetWidth() - 20)
  button:SetHeight(20)
  button:SetPoint("TOPLEFT", 10, yOffset)
  
  -- Quest title with level and status
  local titleColor = pfQuest:GetQuestColor(questData.level)
  local statusText = ""
  
  if pfQuest:IsQuestInLog(questData.id) then
    statusText = " [In Log]"
  elseif pfQuest:IsQuestCompleted(questData.id) then
    statusText = " [Complete]"
  end
  
  local titleText = titleColor .. "[" .. questData.level .. "] " .. questData.title .. pfQuest.colors.gray .. statusText .. pfQuest.colors.close
  
  local title = button:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  title:SetPoint("LEFT", 5, 0)
  title:SetText(titleText)
  title:SetJustifyH("LEFT")
  
  -- Button interactions
  button:SetScript("OnEnter", function()
    GameTooltip:SetOwner(this, "ANCHOR_RIGHT")
    GameTooltip:SetText(questData.title, 1, 1, 1)
    GameTooltip:AddLine("Level: " .. questData.level, 0.8, 0.8, 0.8)
    GameTooltip:AddLine("Zone: " .. (questData.zone or "Unknown"), 0.6, 0.6, 0.6)
    if questData.description then
      GameTooltip:AddLine(questData.description, nil, nil, nil, 1)
    end
    GameTooltip:Show()
  end)
  
  button:SetScript("OnLeave", function()
    GameTooltip:Hide()
  end)
  
  button:SetScript("OnClick", function()
    -- In a full implementation, this would show quest details or help locate quest giver
    pfQuest:Print("Quest: " .. questData.title .. " (Level " .. questData.level .. ")")
  end)
  
  return button
end

function pfQuest:FilterQuests(searchText)
  -- This would filter the quest list based on search text
  -- For now, just update the list
  pfQuest:UpdateBrowserList()
end
-- pfQuest Configuration Module
-- Handles addon settings and preferences

pfQuest.config = pfQuest.config or {}
pfQuest.gui = pfQuest.gui or {}

-- Configuration GUI
function pfQuest:ShowConfig()
  if not pfQuest.configFrame then
    pfQuest:CreateConfigFrame()
  end
  
  if pfQuest.configFrame:IsVisible() then
    pfQuest.configFrame:Hide()
  else
    pfQuest.configFrame:Show()
  end
end

function pfQuest:CreateConfigFrame()
  local frame = CreateFrame("Frame", "pfQuestConfig", UIParent)
  frame:SetWidth(400)
  frame:SetHeight(500)
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
  title:SetText("pfQuest Configuration")
  
  -- Close button
  local closeBtn = CreateFrame("Button", nil, frame, "UIPanelCloseButton")
  closeBtn:SetPoint("TOPRIGHT", -5, -5)
  
  pfQuest.configFrame = frame
  
  -- Create config sections
  pfQuest:CreateTrackerConfig(frame)
  pfQuest:CreateBrowserConfig(frame)
  pfQuest:CreateMapConfig(frame)
end

function pfQuest:CreateTrackerConfig(parent)
  local section = CreateFrame("Frame", nil, parent)
  section:SetWidth(360)
  section:SetHeight(120)
  section:SetPoint("TOPLEFT", 20, -50)
  
  local title = section:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  title:SetPoint("TOPLEFT", 0, 0)
  title:SetText("Quest Tracker")
  
  -- Enable tracker checkbox
  local enableCheck = CreateFrame("CheckButton", nil, section, "ChatConfigCheckButtonTemplate")
  enableCheck:SetPoint("TOPLEFT", 0, -20)
  enableCheck:SetChecked(pfQuest.config.tracker.enabled)
  enableCheck.tooltipText = "Enable/disable the quest tracker"
  
  local enableLabel = enableCheck:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  enableLabel:SetPoint("LEFT", enableCheck, "RIGHT", 5, 0)
  enableLabel:SetText("Enable Quest Tracker")
  
  enableCheck:SetScript("OnClick", function()
    pfQuest.config.tracker.enabled = this:GetChecked()
    if pfQuest.config.tracker.enabled then
      pfQuest:ShowTracker()
    else
      pfQuest:HideTracker()
    end
  end)
end

function pfQuest:CreateBrowserConfig(parent)
  local section = CreateFrame("Frame", nil, parent)
  section:SetWidth(360)
  section:SetHeight(120)
  section:SetPoint("TOPLEFT", 20, -180)
  
  local title = section:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  title:SetPoint("TOPLEFT", 0, 0)
  title:SetText("Quest Browser")
  
  -- Show low level quests
  local lowLevelCheck = CreateFrame("CheckButton", nil, section, "ChatConfigCheckButtonTemplate")
  lowLevelCheck:SetPoint("TOPLEFT", 0, -20)
  lowLevelCheck:SetChecked(pfQuest.config.browser.showLowLevel)
  
  local lowLevelLabel = lowLevelCheck:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  lowLevelLabel:SetPoint("LEFT", lowLevelCheck, "RIGHT", 5, 0)
  lowLevelLabel:SetText("Show Low Level Quests")
  
  lowLevelCheck:SetScript("OnClick", function()
    pfQuest.config.browser.showLowLevel = this:GetChecked()
  end)
end

function pfQuest:CreateMapConfig(parent)
  local section = CreateFrame("Frame", nil, parent)
  section:SetWidth(360)
  section:SetHeight(120)
  section:SetPoint("TOPLEFT", 20, -310)
  
  local title = section:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  title:SetPoint("TOPLEFT", 0, 0)
  title:SetText("Map Settings")
  
  -- Show nodes checkbox
  local nodesCheck = CreateFrame("CheckButton", nil, section, "ChatConfigCheckButtonTemplate")
  nodesCheck:SetPoint("TOPLEFT", 0, -20)
  nodesCheck:SetChecked(pfQuest.config.map.showNodes)
  
  local nodesLabel = nodesCheck:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  nodesLabel:SetPoint("LEFT", nodesCheck, "RIGHT", 5, 0)
  nodesLabel:SetText("Show Quest Nodes on Map")
  
  nodesCheck:SetScript("OnClick", function()
    pfQuest.config.map.showNodes = this:GetChecked()
    pfQuest:UpdateMapNodes()
  end)
end

-- Slash commands
SLASH_PFQUEST1 = "/pfquest"
SLASH_PFQUEST2 = "/pq"

SlashCmdList["PFQUEST"] = function(msg)
  if msg == "config" then
    pfQuest:ShowConfig()
  elseif msg == "tracker" then
    pfQuest:ToggleTracker()
  elseif msg == "browser" then
    pfQuest:ShowBrowser()
  elseif msg == "reset" then
    pfQuest:ResetConfig()
    pfQuest:Print("Configuration reset to defaults")
  else
    pfQuest:Print("Available commands:")
    pfQuest:Print("/pfquest config - Open configuration")
    pfQuest:Print("/pfquest tracker - Toggle quest tracker")
    pfQuest:Print("/pfquest browser - Show quest browser")
    pfQuest:Print("/pfquest reset - Reset configuration")
  end
end

function pfQuest:ResetConfig()
  -- Reset to defaults
  pfQuest.config.tracker = {
    ["enabled"] = true,
    ["visible"] = true,
    ["x"] = 20,
    ["y"] = -100,
    ["width"] = 300,
    ["height"] = 150,
    ["point"] = "TOPLEFT",
    ["relativePoint"] = "TOPLEFT",
  }
  
  pfQuest.config.browser = {
    ["enabled"] = true,
    ["showLowLevel"] = false,
    ["showHighLevel"] = true,
    ["showCompleted"] = false,
  }
  
  pfQuest.config.map = {
    ["enabled"] = true,
    ["showNodes"] = true,
    ["nodeSize"] = 12,
  }
  
  pfQuest:SaveConfig()
end
-- pfQuest Map Module
-- World map integration for quest locations

pfQuest.map = {}
pfQuest.map.nodes = {}
pfQuest.map.pins = {}

function pfQuest:InitializeMap()
  -- Hook into world map
  if WorldMapFrame then
    pfQuest:HookMapFunctions()
  end
end

function pfQuest:HookMapFunctions()
  -- Hook WorldMapFrame show/hide
  if not pfQuest.map.hooked then
    local originalShow = WorldMapFrame.Show
    local originalHide = WorldMapFrame.Hide
    
    WorldMapFrame.Show = function()
      originalShow()
      pfQuest:UpdateMapNodes()
    end
    
    WorldMapFrame.Hide = function()
      originalHide()
      pfQuest:ClearMapNodes()
    end
    
    pfQuest.map.hooked = true
  end
end

function pfQuest:UpdateMapNodes()
  if not pfQuest.config.map.showNodes or not WorldMapFrame:IsVisible() then
    return
  end
  
  pfQuest:ClearMapNodes()
  
  -- Get current zone
  local currentZone = GetRealZoneText()
  if not currentZone then return end
  
  -- Add quest nodes for current zone
  for _, quest in ipairs(pfQuest.questlog.quests) do
    if quest and not quest.isComplete then
      pfQuest:CreateQuestNode(quest, currentZone)
    end
  end
end

function pfQuest:CreateQuestNode(quest, zone)
  if not quest or not zone then return end
  
  -- Sample coordinates (in a real implementation, these would come from the database)
  local coords = pfQuest:GetQuestCoordinates(quest, zone)
  if not coords then return end
  
  local nodeSize = pfQuest.config.map.nodeSize or 12
  
  local pin = CreateFrame("Button", nil, WorldMapFrame)
  pin:SetWidth(nodeSize)
  pin:SetHeight(nodeSize)
  pin:SetPoint("TOPLEFT", WorldMapFrame, "TOPLEFT", coords.x - nodeSize/2, -coords.y + nodeSize/2)
  
  -- Quest node texture based on type
  local texture = "Interface\\AddOns\\pfQuest\\img\\quest"
  if quest.isComplete then
    texture = texture .. "_complete"
  elseif pfQuest:IsQuestInLog(quest.index) then
    texture = texture .. "_available"
  else
    texture = texture .. "_unavailable"
  end
  
  -- Fallback to simple colored dot if custom textures don't exist
  local normalTexture = pin:CreateTexture(nil, "OVERLAY")
  normalTexture:SetAllPoints(pin)
  normalTexture:SetTexture("Interface\\Minimap\\ObjectIcons")
  normalTexture:SetTexCoord(0.125, 0.25, 0.25, 0.375) -- Yellow dot
  pin:SetNormalTexture(normalTexture)
  
  -- Tooltip
  pin:SetScript("OnEnter", function()
    GameTooltip:SetOwner(this, "ANCHOR_CURSOR")
    GameTooltip:SetText(quest.title, 1, 1, 1)
    GameTooltip:AddLine("Level: " .. (quest.level or "?"), 0.8, 0.8, 0.8)
    if quest.objectives then
      for _, objective in ipairs(quest.objectives) do
        if objective.text then
          local color = objective.finished and "|cff00ff00" or "|cffff0000"
          GameTooltip:AddLine(color .. objective.text, 1, 1, 1)
        end
      end
    end
    GameTooltip:Show()
  end)
  
  pin:SetScript("OnLeave", function()
    GameTooltip:Hide()
  end)
  
  pin:SetScript("OnClick", function()
    -- Select quest in log
    if quest.index then
      pfQuest:SelectQuest(quest.index)
    end
  end)
  
  table.insert(pfQuest.map.pins, pin)
end

function pfQuest:GetQuestCoordinates(quest, zone)
  -- This would normally look up coordinates from the database
  -- For now, return sample coordinates
  local sampleCoords = {
    ["Elwynn Forest"] = { x = 100, y = 100 },
    ["Westfall"] = { x = 150, y = 120 },
    ["Stormwind City"] = { x = 200, y = 80 },
  }
  
  return sampleCoords[zone] or { x = 100, y = 100 }
end

function pfQuest:ClearMapNodes()
  for _, pin in ipairs(pfQuest.map.pins) do
    pin:Hide()
    pin:SetParent(nil)
  end
  pfQuest.map.pins = {}
end

-- Minimap integration
function pfQuest:CreateMinimapButton()
  if pfQuest.map.minimapButton then return end
  
  local button = CreateFrame("Button", "pfQuestMinimapButton", Minimap)
  button:SetWidth(32)
  button:SetHeight(32)
  button:SetFrameStrata("MEDIUM")
  button:SetPoint("TOPLEFT", Minimap, "TOPLEFT", 52, -52)
  
  local texture = button:CreateTexture(nil, "BACKGROUND")
  texture:SetWidth(20)
  texture:SetHeight(20)
  texture:SetPoint("CENTER", 0, 0)
  texture:SetTexture("Interface\\Icons\\INV_Misc_Note_01")
  button:SetNormalTexture(texture)
  
  local overlay = button:CreateTexture(nil, "OVERLAY")
  overlay:SetWidth(32)
  overlay:SetHeight(32)
  overlay:SetPoint("CENTER", 0, 0)
  overlay:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")
  
  button:SetScript("OnClick", function()
    if arg1 == "LeftButton" then
      pfQuest:ShowBrowser()
    elseif arg1 == "RightButton" then
      pfQuest:ToggleTracker()
    end
  end)
  
  button:SetScript("OnEnter", function()
    GameTooltip:SetOwner(this, "ANCHOR_LEFT")
    GameTooltip:SetText("pfQuest", 1, 1, 1)
    GameTooltip:AddLine("Left click: Open browser", 0.6, 0.6, 0.6)
    GameTooltip:AddLine("Right click: Toggle tracker", 0.6, 0.6, 0.6)
    GameTooltip:Show()
  end)
  
  button:SetScript("OnLeave", function()
    GameTooltip:Hide()
  end)
  
  pfQuest.map.minimapButton = button
end

-- Initialize map functionality
if pfQuest.config.map.enabled then
  pfQuest:InitializeMap()
  pfQuest:CreateMinimapButton()
end
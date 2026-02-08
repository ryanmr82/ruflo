-- pfQuest Arrow Module
-- Directional arrow for quest objectives

pfQuest.arrow = {}
pfQuest.arrow.frame = nil
pfQuest.arrow.updateTimer = 0

function pfQuest:CreateArrow()
  if pfQuest.arrow.frame then return end
  
  local frame = CreateFrame("Frame", "pfQuestArrow", UIParent)
  frame:SetWidth(56)
  frame:SetHeight(56)
  frame:SetPoint("CENTER", 0, 100)
  frame:SetFrameStrata("HIGH")
  
  -- Arrow texture
  local arrow = frame:CreateTexture(nil, "OVERLAY")
  arrow:SetAllPoints(frame)
  arrow:SetTexture("Interface\\Minimap\\MinimapArrow")
  frame.arrow = arrow
  
  -- Distance text
  local distance = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  distance:SetPoint("TOP", frame, "BOTTOM", 0, -5)
  distance:SetText("")
  frame.distance = distance
  
  -- Target text
  local target = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  target:SetPoint("TOP", distance, "BOTTOM", 0, -2)
  target:SetText("")
  frame.target = target
  
  frame:EnableMouse(true)
  frame:SetMovable(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", function() this:StartMoving() end)
  frame:SetScript("OnDragStop", function() this:StopMovingOrSizing() end)
  
  -- Update timer
  frame:SetScript("OnUpdate", function()
    pfQuest.arrow.updateTimer = pfQuest.arrow.updateTimer + arg1
    if pfQuest.arrow.updateTimer > 0.1 then -- Update every 0.1 seconds
      pfQuest:UpdateArrow()
      pfQuest.arrow.updateTimer = 0
    end
  end)
  
  frame:Hide()
  pfQuest.arrow.frame = frame
end

function pfQuest:ShowArrow(target, x, y)
  if not pfQuest.config.arrow.enabled then return end
  
  if not pfQuest.arrow.frame then
    pfQuest:CreateArrow()
  end
  
  pfQuest.arrow.target = target or "Unknown"
  pfQuest.arrow.targetX = x or 0
  pfQuest.arrow.targetY = y or 0
  pfQuest.arrow.frame:Show()
  
  pfQuest:UpdateArrow()
end

function pfQuest:HideArrow()
  if pfQuest.arrow.frame then
    pfQuest.arrow.frame:Hide()
  end
  pfQuest.arrow.target = nil
  pfQuest.arrow.targetX = nil
  pfQuest.arrow.targetY = nil
end

function pfQuest:UpdateArrow()
  if not pfQuest.arrow.frame or not pfQuest.arrow.frame:IsVisible() then
    return
  end
  
  if not pfQuest.arrow.targetX or not pfQuest.arrow.targetY then
    return
  end
  
  -- Get player position
  local playerX, playerY = GetPlayerMapPosition("player")
  if not playerX or not playerY or (playerX == 0 and playerY == 0) then
    return
  end
  
  -- Calculate direction and distance
  local deltaX = pfQuest.arrow.targetX - playerX
  local deltaY = pfQuest.arrow.targetY - playerY
  local distance = math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  -- Calculate angle
  local angle = math.atan2(deltaX, deltaY)
  
  -- Rotate arrow
  if pfQuest.arrow.frame.arrow then
    pfQuest.arrow.frame.arrow:SetRotation(-angle)
  end
  
  -- Update distance text
  local distanceText = ""
  if distance > 0 then
    if distance < 0.01 then
      distanceText = "< 10 yards"
    else
      -- Convert to approximate yards (rough estimation)
      local yards = math.floor(distance * 1000)
      if yards < 1000 then
        distanceText = yards .. " yards"
      else
        distanceText = string.format("%.1f km", yards / 1000)
      end
    end
  end
  
  if pfQuest.arrow.frame.distance then
    pfQuest.arrow.frame.distance:SetText(distanceText)
  end
  
  -- Update target text
  if pfQuest.arrow.frame.target and pfQuest.arrow.target then
    pfQuest.arrow.frame.target:SetText(pfQuest.arrow.target)
  end
  
  -- Scale arrow based on config
  local scale = pfQuest.config.arrow.scale or 1.0
  pfQuest.arrow.frame:SetScale(scale)
end

function pfQuest:SetArrowTarget(questIndex)
  if not questIndex then
    pfQuest:HideArrow()
    return
  end
  
  local quest = pfQuest:GetQuestByIndex(questIndex)
  if not quest then
    pfQuest:HideArrow()
    return
  end
  
  -- Get quest objective location (this would normally come from database)
  local coords = pfQuest:GetQuestObjectiveCoords(quest)
  if coords then
    pfQuest:ShowArrow(quest.title, coords.x, coords.y)
  else
    pfQuest:HideArrow()
  end
end

function pfQuest:GetQuestObjectiveCoords(quest)
  -- This would normally look up objective coordinates from the database
  -- For now, return sample coordinates
  return { x = 0.5, y = 0.5 } -- Center of map
end

-- Quest selection arrow integration
function pfQuest:OnQuestSelected(questIndex)
  if pfQuest.config.arrow.enabled then
    pfQuest:SetArrowTarget(questIndex)
  end
end
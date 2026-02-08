-- pfQuest TurtleWoW Zone Management
-- Handles TurtleWoW specific zones and locations

pfTurtle.zones = pfTurtle.zones or {}

-- TurtleWoW custom zone data
pfTurtle.zones.customZoneData = {
  ["Stonetalon Peak"] = {
    id = 9001,
    continent = "Kalimdor",
    level_range = {15, 25},
    faction = "contested",
    description = "A mystical peak sacred to the turtle spirits",
    features = {"custom_quests", "unique_npcs", "turtle_sanctuary"},
    coordinates = {
      flight_path = {x = 45.0, y = 60.0},
      inn = {x = 42.5, y = 58.3},
      mailbox = {x = 43.1, y = 59.2},
    },
    music = "turtle_peak_ambient",
  },
  ["Tel'Abim"] = {
    id = 9002,
    continent = "South Seas",
    level_range = {35, 45},
    faction = "contested",
    description = "A mysterious tropical island with ancient secrets",
    features = {"archaeology", "treasure_hunting", "naval_quests"},
    coordinates = {
      boat_dock = {x = 30.0, y = 70.0},
      ruins = {x = 55.0, y = 35.0},
      temple = {x = 67.0, y = 24.0},
    },
    music = "telabim_tropical",
  },
  ["Gillijim's Isle"] = {
    id = 9003,
    continent = "South Seas",
    level_range = {20, 30},
    faction = "contested",
    description = "A small island inhabited by friendly goblins",
    features = {"goblin_technology", "trading_post", "engineering_quests"},
    coordinates = {
      goblin_town = {x = 50.0, y = 50.0},
      workshop = {x = 48.5, y = 52.3},
      dock = {x = 45.0, y = 65.0},
    },
    music = "goblin_isle_theme",
  },
  ["The Verdant Expanse"] = {
    id = 9004,
    continent = "Kalimdor",
    level_range = {25, 35},
    faction = "contested",
    description = "A lush forest teeming with druidic magic",
    features = {"druid_circles", "nature_magic", "animal_companions"},
    coordinates = {
      druid_grove = {x = 40.0, y = 45.0},
      moonwell = {x = 38.5, y = 43.2},
      ancient_tree = {x = 60.0, y = 30.0},
    },
    music = "verdant_nature_theme",
  }
}

-- Zone detection and management
function pfTurtle:GetCurrentTurtleZone()
  local currentZone = GetRealZoneText()
  if currentZone and pfTurtle.zones.customZoneData[currentZone] then
    return pfTurtle.zones.customZoneData[currentZone]
  end
  return nil
end

function pfTurtle:IsTurtleZone(zoneName)
  return pfTurtle.zones.customZoneData[zoneName] ~= nil
end

-- Zone-specific quest management
function pfTurtle:GetZoneQuests(zoneName)
  local zoneQuests = {}
  
  for questID, questData in pairs(pfTurtle.db.customQuests) do
    if questData.zone == zoneName then
      table.insert(zoneQuests, questData)
    end
  end
  
  return zoneQuests
end

function pfTurtle:GetZoneNPCs(zoneName)
  local zoneNPCs = {}
  
  for npcID, npcData in pairs(pfTurtle.db.customNPCs) do
    if npcData.zone == zoneName then
      table.insert(zoneNPCs, npcData)
    end
  end
  
  return zoneNPCs
end

-- Zone event handling
function pfTurtle:OnZoneChanged(newZone)
  if not pfTurtle.compat.isTurtle then return end
  
  local turtleZone = pfTurtle:GetCurrentTurtleZone()
  if turtleZone then
    pfTurtle:OnEnterTurtleZone(turtleZone)
  end
end

function pfTurtle:OnEnterTurtleZone(zoneData)
  pfTurtle:Print("Entered TurtleWoW zone: " .. (zoneData.description or "Unknown"))
  
  -- Show zone-specific information
  pfTurtle:ShowZoneInfo(zoneData)
  
  -- Load zone-specific quests
  pfTurtle:LoadZoneContent(zoneData)
  
  -- Update minimap with zone features
  pfTurtle:UpdateMinimapForZone(zoneData)
end

function pfTurtle:ShowZoneInfo(zoneData)
  if not zoneData then return end
  
  -- Create zone info frame if needed
  if not pfTurtle.zoneInfoFrame then
    pfTurtle:CreateZoneInfoFrame()
  end
  
  pfTurtle:UpdateZoneInfoFrame(zoneData)
end

function pfTurtle:CreateZoneInfoFrame()
  local frame = CreateFrame("Frame", "pfTurtleZoneInfo", UIParent)
  frame:SetWidth(300)
  frame:SetHeight(100)
  frame:SetPoint("TOP", 0, -50)
  frame:SetFrameStrata("HIGH")
  
  frame:SetBackdrop({
    bgFile = "Interface\\Tooltips\\UI-Tooltip-Background",
    edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
    tile = true, tileSize = 16, edgeSize = 16,
    insets = { left = 5, right = 5, top = 5, bottom = 5 }
  })
  frame:SetBackdropColor(0, 0.3, 0.1, 0.9)
  frame:SetBackdropBorderColor(0.8, 0.6, 0, 1)
  
  -- Zone title
  local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
  title:SetPoint("TOP", 0, -10)
  title:SetTextColor(1, 0.8, 0, 1)
  frame.title = title
  
  -- Zone description
  local description = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  description:SetPoint("TOP", title, "BOTTOM", 0, -5)
  description:SetWidth(280)
  frame.description = description
  
  -- Level range
  local levelRange = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
  levelRange:SetPoint("TOP", description, "BOTTOM", 0, -5)
  levelRange:SetTextColor(0.8, 0.8, 0.8, 1)
  frame.levelRange = levelRange
  
  -- Auto-hide timer
  frame:SetScript("OnShow", function()
    this.hideTimer = GetTime() + 5 -- Show for 5 seconds
  end)
  
  frame:SetScript("OnUpdate", function()
    if this.hideTimer and GetTime() > this.hideTimer then
      this:Hide()
      this.hideTimer = nil
    end
  end)
  
  frame:Hide()
  pfTurtle.zoneInfoFrame = frame
end

function pfTurtle:UpdateZoneInfoFrame(zoneData)
  if not pfTurtle.zoneInfoFrame or not zoneData then return end
  
  local frame = pfTurtle.zoneInfoFrame
  
  frame.title:SetText(GetRealZoneText() or "Unknown Zone")
  frame.description:SetText(zoneData.description or "")
  
  if zoneData.level_range then
    frame.levelRange:SetText("Level " .. zoneData.level_range[1] .. "-" .. zoneData.level_range[2])
  else
    frame.levelRange:SetText("")
  end
  
  frame:Show()
end

-- Minimap integration for TurtleWoW zones
function pfTurtle:UpdateMinimapForZone(zoneData)
  if not zoneData or not zoneData.coordinates then return end
  
  -- Clear existing zone markers
  pfTurtle:ClearZoneMarkers()
  
  -- Add zone-specific markers
  for markerType, coords in pairs(zoneData.coordinates) do
    pfTurtle:AddZoneMarker(markerType, coords)
  end
end

function pfTurtle:ClearZoneMarkers()
  if pfTurtle.zoneMarkers then
    for _, marker in ipairs(pfTurtle.zoneMarkers) do
      marker:Hide()
      marker:SetParent(nil)
    end
  end
  pfTurtle.zoneMarkers = {}
end

function pfTurtle:AddZoneMarker(markerType, coords)
  if not coords or not coords.x or not coords.y then return end
  
  -- This would add markers to the world map/minimap
  -- Implementation would depend on available map API
end

-- Zone progression tracking
function pfTurtle:InitializeZoneProgression()
  if not pfTurtle.player.zoneProgression then
    pfTurtle.player.zoneProgression = {}
  end
  
  for zoneName in pairs(pfTurtle.zones.customZoneData) do
    if not pfTurtle.player.zoneProgression[zoneName] then
      pfTurtle.player.zoneProgression[zoneName] = {
        discovered = false,
        quests_completed = 0,
        exploration_complete = false,
        first_visit = nil,
      }
    end
  end
end

function pfTurtle:UpdateZoneProgression(zoneName)
  if not pfTurtle.player.zoneProgression then return end
  
  local progression = pfTurtle.player.zoneProgression[zoneName]
  if not progression then return end
  
  -- Mark zone as discovered
  if not progression.discovered then
    progression.discovered = true
    progression.first_visit = time()
    pfTurtle:OnZoneDiscovered(zoneName)
  end
  
  -- Update quest completion count
  local completedQuests = 0
  local zoneQuests = pfTurtle:GetZoneQuests(zoneName)
  
  for _, quest in ipairs(zoneQuests) do
    if pfQuest:IsQuestCompleted(quest.id) then
      completedQuests = completedQuests + 1
    end
  end
  
  progression.quests_completed = completedQuests
  
  -- Check if zone is fully explored
  if completedQuests >= table.getn(zoneQuests) and table.getn(zoneQuests) > 0 then
    if not progression.exploration_complete then
      progression.exploration_complete = true
      pfTurtle:OnZoneExplorationComplete(zoneName)
    end
  end
end

function pfTurtle:OnZoneDiscovered(zoneName)
  pfTurtle:Print("Discovered TurtleWoW zone: " .. zoneName)
end

function pfTurtle:OnZoneExplorationComplete(zoneName)
  pfTurtle:Print("Zone exploration complete: " .. zoneName)
end

-- Zone statistics
function pfTurtle:GetZoneStats()
  local stats = {
    zones_discovered = 0,
    zones_completed = 0,
    total_turtle_zones = 0,
  }
  
  for zoneName in pairs(pfTurtle.zones.customZoneData) do
    stats.total_turtle_zones = stats.total_turtle_zones + 1
    
    if pfTurtle.player.zoneProgression and pfTurtle.player.zoneProgression[zoneName] then
      local progression = pfTurtle.player.zoneProgression[zoneName]
      
      if progression.discovered then
        stats.zones_discovered = stats.zones_discovered + 1
      end
      
      if progression.exploration_complete then
        stats.zones_completed = stats.zones_completed + 1
      end
    end
  end
  
  return stats
end

-- Initialize zone system
if pfTurtle.compat.isTurtle then
  pfTurtle:InitializeZoneProgression()
end
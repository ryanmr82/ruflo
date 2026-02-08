--[[
EquipCompare addon for World of Warcraft Vanilla 1.12.1
Shows comparison tooltips for equipment items
Author: Legorol
Version: 2.9.8
]]--

-- Initialize saved variables
EquipCompare_Enabled = true
EquipCompare_ControlMode = false
EquipCompare_AltMode = false
EquipCompare_Shiftup = false

-- Local variables
local EquipCompareTooltip
local ECFrameShow = 0
local LastECCall = ""

-- Item slot mapping
local SlotTypes = {
	["INVTYPE_HEAD"] = {1},
	["INVTYPE_NECK"] = {2},
	["INVTYPE_SHOULDER"] = {3},
	["INVTYPE_BODY"] = {4},
	["INVTYPE_CHEST"] = {5},
	["INVTYPE_ROBE"] = {5},
	["INVTYPE_WAIST"] = {6},
	["INVTYPE_LEGS"] = {7},
	["INVTYPE_FEET"] = {8},
	["INVTYPE_WRIST"] = {9},
	["INVTYPE_HAND"] = {10},
	["INVTYPE_FINGER"] = {11, 12},
	["INVTYPE_TRINKET"] = {13, 14},
	["INVTYPE_CLOAK"] = {15},
	["INVTYPE_WEAPON"] = {16, 17},
	["INVTYPE_SHIELD"] = {17},
	["INVTYPE_2HWEAPON"] = {16},
	["INVTYPE_WEAPONMAINHAND"] = {16},
	["INVTYPE_WEAPONOFFHAND"] = {17},
	["INVTYPE_HOLDABLE"] = {17},
	["INVTYPE_RANGED"] = {18},
	["INVTYPE_THROWN"] = {18},
	["INVTYPE_RANGEDRIGHT"] = {18},
	["INVTYPE_RELIC"] = {18},
	["INVTYPE_TABARD"] = {19},
	["INVTYPE_BAG"] = {20, 21, 22, 23}
}

-- Function to get equipped item in slot
local function GetEquippedItem(slotId)
	local itemLink = GetInventoryItemLink("player", slotId)
	if itemLink then
		return itemLink
	end
	return nil
end

-- Function to show comparison tooltip
local function ShowCompareTooltip(itemLink, parentTooltip)
	if not EquipCompare_Enabled then return end
	if not itemLink then return end
	
	-- Get item info
	local _, _, itemQuality, _, _, _, _, _, equipLoc = GetItemInfo(itemLink)
	if not equipLoc or equipLoc == "" then return end
	
	-- Check for modifier keys if needed
	if EquipCompare_ControlMode and not IsControlKeyDown() then return end
	if EquipCompare_AltMode and not IsAltKeyDown() then return end
	
	-- Get potential slots for this item type
	local slots = SlotTypes[equipLoc]
	if not slots then return end
	
	-- Create comparison tooltip if it doesn't exist
	if not EquipCompareTooltip then
		EquipCompareTooltip = CreateFrame("GameTooltip", "EquipCompareTooltip", nil, "GameTooltipTemplate")
		EquipCompareTooltip:SetOwner(WorldFrame, "ANCHOR_NONE")
	end
	
	-- Find equipped item to compare
	local equippedLink
	for _, slotId in ipairs(slots) do
		equippedLink = GetEquippedItem(slotId)
		if equippedLink then break end
	end
	
	if not equippedLink then return end
	
	-- Set up the comparison tooltip
	EquipCompareTooltip:ClearLines()
	EquipCompareTooltip:SetHyperlink(equippedLink)
	
	-- Position the tooltip
	local x, y = parentTooltip:GetCenter()
	if x and y then
		local scale = parentTooltip:GetEffectiveScale()
		local parentWidth = parentTooltip:GetWidth() * scale
		
		EquipCompareTooltip:ClearAllPoints()
		if x < (GetScreenWidth() / 2) then
			-- Show to the right
			EquipCompareTooltip:SetPoint("TOPLEFT", parentTooltip, "TOPRIGHT", 0, 0)
		else
			-- Show to the left
			EquipCompareTooltip:SetPoint("TOPRIGHT", parentTooltip, "TOPLEFT", 0, 0)
		end
		
		EquipCompareTooltip:Show()
		ECFrameShow = 1
	end
end

-- Function to hide comparison tooltip
local function HideCompareTooltip()
	if EquipCompareTooltip then
		EquipCompareTooltip:Hide()
		ECFrameShow = 0
	end
end

-- Hook bag item tooltips
local originalSetBagItem = GameTooltip.SetBagItem
GameTooltip.SetBagItem = function(self, container, slot)
	originalSetBagItem(self, container, slot)
	local itemLink = GetContainerItemLink(container, slot)
	ShowCompareTooltip(itemLink, self)
end

-- Hook inventory item tooltips
local originalSetInventoryItem = GameTooltip.SetInventoryItem
GameTooltip.SetInventoryItem = function(self, unit, slot)
	originalSetInventoryItem(self, unit, slot)
	if unit ~= "player" then
		local itemLink = GetInventoryItemLink(unit, slot)
		ShowCompareTooltip(itemLink, self)
	end
end

-- Hook loot item tooltips
local originalSetLootItem = GameTooltip.SetLootItem
GameTooltip.SetLootItem = function(self, slot)
	originalSetLootItem(self, slot)
	local itemLink = GetLootSlotLink(slot)
	ShowCompareTooltip(itemLink, self)
end

-- Hook merchant item tooltips
local originalSetMerchantItem = GameTooltip.SetMerchantItem
GameTooltip.SetMerchantItem = function(self, slot)
	originalSetMerchantItem(self, slot)
	local itemLink = GetMerchantItemLink(slot)
	ShowCompareTooltip(itemLink, self)
end

-- Hook quest reward tooltips
local originalSetQuestItem = GameTooltip.SetQuestItem
GameTooltip.SetQuestItem = function(self, type, index)
	originalSetQuestItem(self, type, index)
	local itemLink = GetQuestItemLink(type, index)
	ShowCompareTooltip(itemLink, self)
end

-- Hook quest log reward tooltips
local originalSetQuestLogItem = GameTooltip.SetQuestLogItem
GameTooltip.SetQuestLogItem = function(self, type, index)
	originalSetQuestLogItem(self, type, index)
	local itemLink = GetQuestLogItemLink(type, index)
	ShowCompareTooltip(itemLink, self)
end

-- Hook hyperlink tooltips (chat links)
local originalSetHyperlink = GameTooltip.SetHyperlink
GameTooltip.SetHyperlink = function(self, link)
	originalSetHyperlink(self, link)
	if string.sub(link, 1, 4) == "item" then
		ShowCompareTooltip(link, self)
	end
end

-- Hide tooltip when GameTooltip hides
local originalHide = GameTooltip.Hide
GameTooltip.Hide = function(self)
	originalHide(self)
	HideCompareTooltip()
end

-- Slash commands
SLASH_EQUIPCOMPARE1 = "/equipcompare"
SLASH_EQUIPCOMPARE2 = "/eqc"

function SlashCmdList.EQUIPCOMPARE(msg)
	local cmd = string.lower(msg or "")
	
	if cmd == "on" then
		EquipCompare_Enabled = true
		print("EquipCompare: Enabled")
	elseif cmd == "off" then
		EquipCompare_Enabled = false
		print("EquipCompare: Disabled")
	elseif cmd == "control" then
		EquipCompare_ControlMode = not EquipCompare_ControlMode
		print("EquipCompare: Control mode " .. (EquipCompare_ControlMode and "enabled" or "disabled"))
	elseif cmd == "alt" then
		EquipCompare_AltMode = not EquipCompare_AltMode
		print("EquipCompare: Alt mode " .. (EquipCompare_AltMode and "enabled" or "disabled"))
	elseif cmd == "help" then
		print("EquipCompare Commands:")
		print("/eqc on - Enable EquipCompare")
		print("/eqc off - Disable EquipCompare")
		print("/eqc control - Toggle control key requirement")
		print("/eqc alt - Toggle alt key requirement")
		print("/eqc help - Show this help")
	else
		EquipCompare_Enabled = not EquipCompare_Enabled
		print("EquipCompare: " .. (EquipCompare_Enabled and "Enabled" or "Disabled"))
	end
end

print("EquipCompare 2.9.8 loaded - Type /eqc help for commands")
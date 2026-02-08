--[[
SellValue addon for World of Warcraft Vanilla 1.12.1
Displays vendor sell price in item tooltips
Compatible with TurtleWoW and other vanilla servers
]]--

SellValues = SellValues or {}

-- Table of known vendor prices for vanilla items
local DefaultSellValues = {
	-- Common consumables
	[159] = 1, -- Refreshing Spring Water
	[4536] = 1, -- Shiny Red Apple
	[117] = 2, -- Tough Jerky
	[2287] = 10, -- Haunch of Meat
	[787] = 5, -- Slitherskin Mackerel
	[4599] = 5, -- Cured Ham Steak
	-- Add more default values as needed
}

-- Initialize SellValues with defaults if empty
if not next(SellValues) then
	for itemId, price in pairs(DefaultSellValues) do
		SellValues[itemId] = price
	end
end

-- Hook tooltip functions
local function AddSellValueToTooltip(tooltip, itemLink, count)
	if not itemLink then return end
	
	local itemId = tonumber(string.match(itemLink, "item:(%d+)"))
	if not itemId then return end
	
	local sellValue = SellValues[itemId]
	if sellValue and sellValue > 0 then
		local stackValue = sellValue
		if count and count > 1 then
			stackValue = sellValue * count
		end
		
		tooltip:AddLine("Sell Price: " .. GetCoinTextureString(sellValue))
		if count and count > 1 then
			tooltip:AddLine("Stack Value: " .. GetCoinTextureString(stackValue))
		end
		tooltip:Show()
	end
end

-- Hook bag item tooltips
local originalBagTooltipSetItem = GameTooltip.SetBagItem
GameTooltip.SetBagItem = function(self, container, slot)
	originalBagTooltipSetItem(self, container, slot)
	
	local itemLink = GetContainerItemLink(container, slot)
	local _, count = GetContainerItemInfo(container, slot)
	AddSellValueToTooltip(self, itemLink, count)
end

-- Hook inventory item tooltips
local originalInventoryTooltipSetItem = GameTooltip.SetInventoryItem
GameTooltip.SetInventoryItem = function(self, unit, slot)
	originalInventoryTooltipSetItem(self, unit, slot)
	
	local itemLink = GetInventoryItemLink(unit, slot)
	AddSellValueToTooltip(self, itemLink, 1)
end

-- Hook loot item tooltips
local originalLootTooltipSetItem = GameTooltip.SetLootItem
GameTooltip.SetLootItem = function(self, slot)
	originalLootTooltipSetItem(self, slot)
	
	local itemLink = GetLootSlotLink(slot)
	local _, _, count = GetLootSlotInfo(slot)
	AddSellValueToTooltip(self, itemLink, count)
end

-- Hook merchant item tooltips (to learn prices)
local originalMerchantTooltipSetItem = GameTooltip.SetMerchantItem
GameTooltip.SetMerchantItem = function(self, slot)
	originalMerchantTooltipSetItem(self, slot)
	
	local itemLink = GetMerchantItemLink(slot)
	if itemLink then
		local itemId = tonumber(string.match(itemLink, "item:(%d+)"))
		if itemId then
			local _, _, price = GetMerchantItemInfo(slot)
			if price and price > 0 then
				-- Store the sell price (vendor buy price / 4 for most items)
				SellValues[itemId] = math.floor(price / 4)
			end
		end
	end
end

-- Event handler for merchant interaction
local frame = CreateFrame("Frame")
frame:RegisterEvent("MERCHANT_SHOW")
frame:RegisterEvent("MERCHANT_UPDATE")

frame:SetScript("OnEvent", function()
	if event == "MERCHANT_SHOW" or event == "MERCHANT_UPDATE" then
		-- Scan merchant items to learn prices
		for i = 1, GetMerchantNumItems() do
			local itemLink = GetMerchantItemLink(i)
			if itemLink then
				local itemId = tonumber(string.match(itemLink, "item:(%d+)"))
				if itemId then
					local _, _, price = GetMerchantItemInfo(i)
					if price and price > 0 then
						SellValues[itemId] = math.floor(price / 4)
					end
				end
			end
		end
	end
end)

-- Helper function to format money
function GetCoinTextureString(money)
	if not money or money == 0 then
		return "0|TInterface\\MoneyFrame\\UI-CopperIcon:0:0:0:0|t"
	end
	
	local gold = math.floor(money / 10000)
	local silver = math.floor((money % 10000) / 100)
	local copper = money % 100
	
	local result = ""
	if gold > 0 then
		result = result .. gold .. "|TInterface\\MoneyFrame\\UI-GoldIcon:0:0:0:0|t"
	end
	if silver > 0 then
		result = result .. silver .. "|TInterface\\MoneyFrame\\UI-SilverIcon:0:0:0:0|t"
	end
	if copper > 0 or result == "" then
		result = result .. copper .. "|TInterface\\MoneyFrame\\UI-CopperIcon:0:0:0:0|t"
	end
	
	return result
end

print("SellValue addon loaded - Vendor prices will appear in item tooltips")
-- GuildShopScanner Item Database
-- Maps WoW Item IDs to Shop Item IDs

GuildShopScanner_Items = {
    -- Protection & Utility (13 items)
    [13457] = { shopId = "GFPP", name = "Greater Fire Protection Potion", category = "protection" },
    [13461] = { shopId = "GAPP", name = "Greater Arcane Protection Potion", category = "protection" },
    [13458] = { shopId = "GNPP", name = "Greater Nature Protection Potion", category = "protection" },
    [13456] = { shopId = "GFROP", name = "Greater Frost Protection Potion", category = "protection" },
    [13459] = { shopId = "GSPP", name = "Greater Shadow Protection Potion", category = "protection" },
    [3387] = { shopId = "LIP", name = "Limited Invulnerability Potion", category = "protection" },
    [5634] = { shopId = "FAP", name = "Free Action Potion", category = "protection" },
    [20008] = { shopId = "LAP", name = "Living Action Potion", category = "protection" },
    [9030] = { shopId = "Restorative", name = "Restorative Potion", category = "protection" },
    [9172] = { shopId = "Invisibility", name = "Invisibility Potion", category = "protection" },
    [2459] = { shopId = "Swiftness", name = "Swiftness Potion", category = "protection" },
    [13462] = { shopId = "Purification", name = "Purification Potion", category = "protection" },
    [5631] = { shopId = "Quickness", name = "Potion of Quickness", category = "protection" },

    -- Tank & Melee (9 items)
    [13452] = { shopId = "Mongoose", name = "Elixir of the Mongoose", category = "melee" },
    [9206] = { shopId = "Giants", name = "Elixir of Giants", category = "melee" },
    [13442] = { shopId = "MightyRage", name = "Mighty Rage Potion", category = "melee" },
    [13455] = { shopId = "GreaterStoneshield", name = "Greater Stoneshield Potion", category = "melee" },
    [3825] = { shopId = "Fortitude", name = "Elixir of Fortitude", category = "melee" },
    [13445] = { shopId = "SuperiorDefense", name = "Elixir of Superior Defense", category = "melee" },
    [20004] = { shopId = "TrollsBlood", name = "Major Troll's Blood Potion", category = "melee" },
    [9088] = { shopId = "GiftOfArthas", name = "Gift of Arthas", category = "melee" },
    [8956] = { shopId = "OilOfImmolation", name = "Oil of Immolation", category = "melee" },

    -- Caster (8 items)
    [20007] = { shopId = "Mageblood", name = "Mageblood Potion", category = "caster" },
    [13454] = { shopId = "GAE", name = "Greater Arcane Elixir", category = "caster" },
    [13444] = { shopId = "MajorMana", name = "Major Mana Potion", category = "caster" },
    [21546] = { shopId = "GFW", name = "Elixir of Greater Firepower", category = "caster" },
    [9264] = { shopId = "GSP", name = "Elixir of Shadow Power", category = "caster" },
    [17708] = { shopId = "GFrostP", name = "Elixir of Frost Power", category = "caster" },
    [18012] = { shopId = "GNP", name = "Elixir of Greater Nature Power", category = "caster" },
    [61423] = { shopId = "Dreamshard", name = "Dreamshard Elixir", category = "caster" },

    -- Concoctions - Turtle WoW Custom (3 items)
    [70231] = { shopId = "EmeraldMongoose", name = "Emerald Mongoose Concoction", category = "concoctions" },
    [70232] = { shopId = "ArcaneGiant", name = "Arcane Giant Concoction", category = "concoctions" },
    [70058] = { shopId = "Dreamwater", name = "Dreamwater", category = "concoctions" },

    -- Flasks - G-Bank Only, static prices (4 items)
    [13510] = { shopId = "Titans", name = "Flask of the Titans", category = "flasks", static = true },
    [13511] = { shopId = "Wisdom", name = "Flask of Distilled Wisdom", category = "flasks", static = true },
    [13512] = { shopId = "SupremePower", name = "Flask of Supreme Power", category = "flasks", static = true },
    [13513] = { shopId = "Chromatic", name = "Flask of Chromatic Resistance", category = "flasks", static = true },
}

-- Build reverse lookup (shopId -> itemId)
GuildShopScanner_ShopToItem = {}
for itemId, data in pairs(GuildShopScanner_Items) do
    GuildShopScanner_ShopToItem[data.shopId] = itemId
end

-- Category display names
GuildShopScanner_Categories = {
    protection = "Protection & Utility",
    melee = "Tank & Melee",
    caster = "Caster",
    concoctions = "Concoctions",
    flasks = "Flasks"
}

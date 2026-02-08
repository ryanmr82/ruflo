# Comprehensive fix for all BagShui categories
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

$content = Get-Content $file -Raw

# ============================================
# 1. FIX RESIST CATEGORY SEQUENCES (100 -> 70)
# SoulboundGear is sequence 88, so resist needs to be lower
# ============================================

# Shadow Resist [29]
$content = $content -replace '(\[29\] = \{\s*\["sequence"\] = )100,', '${1}70,'
# Frost Resist [33]
$content = $content -replace '(\[33\] = \{\s*\["sequence"\] = )100,', '${1}70,'
# Fire Resist [35]
$content = $content -replace '(\[35\] = \{\s*\["sequence"\] = )100,', '${1}70,'
# Nature Resist [34]
$content = $content -replace '(\[34\] = \{\s*\["sequence"\] = )100,', '${1}70,'
# Arcane Resist [37]
$content = $content -replace '(\[37\] = \{\s*\["sequence"\] = )100,', '${1}70,'

Write-Host "Fixed resist category sequences: 100 -> 70 (before SoulboundGear at 88)"

# ============================================
# 2. CREATE ELIXIRS CATEGORY [38]
# ============================================
$elixirsCategory = @'
		[38] = {
			["sequence"] = 69,
			["name"] = "Elixirs",
			["list"] = {
			},
			["dateModified"] = 1767769400,
			["rule"] = "Name(\"Elixir\", \"Dream Tonic\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\["name"\] = "Elixirs"') {
    # Insert after Arcane Resist [37]
    $content = $content -replace '(\[37\] = \{[^}]*\["inUse"\] = true,\s*\},)', "`$1`n$elixirsCategory"
    Write-Host "Created Elixirs category [38]"
} else {
    Write-Host "Elixirs category already exists"
}

# ============================================
# 3. CREATE FOOD BUFFS CATEGORY [39]
# ============================================
$foodBuffsCategory = @'
		[39] = {
			["sequence"] = 69,
			["name"] = "Food Buffs",
			["list"] = {
			},
			["dateModified"] = 1767769400,
			["rule"] = "Tooltip(\"well fed\") and Tooltip(\"also\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\["name"\] = "Food Buffs"') {
    $content = $content -replace '(\[38\] = \{[^}]*\["inUse"\] = true,\s*\},)', "`$1`n$foodBuffsCategory"
    Write-Host "Created Food Buffs category [39]"
} else {
    Write-Host "Food Buffs category already exists"
}

# ============================================
# 4. CREATE WEAPON BUFFS CATEGORY [40]
# ============================================
$weaponBuffsCategory = @'
		[40] = {
			["sequence"] = 69,
			["name"] = "Weapon Buffs",
			["list"] = {
			},
			["dateModified"] = 1767769400,
			["rule"] = "Name(\"Frost Oil\", \"Mana Oil\", \"Shadow Oil\", \"Sharpening Stone\", \"Weightstone\", \"Wizard Oil\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\[40\] = \{') {
    $content = $content -replace '(\[39\] = \{[^}]*\["inUse"\] = true,\s*\},)', "`$1`n$weaponBuffsCategory"
    Write-Host "Created Weapon Buffs category [40]"
} else {
    Write-Host "Weapon Buffs category [40] already exists"
}

# ============================================
# 5. ADD ITEMS TO GADGETS CATEGORY
# Find the Gadgets category and add items to list
# Items: Goblin Rocket Boots, Cat's Eye Ultra Goggles, Goblin Rocket Helmet,
#        Skull of Impending Doom, Nifty Stopwatch, Gnomish Rocket Boots
# ============================================
# Goblin Rocket Boots = 7189
# Cat's Eye Ultra Goggles = 10501
# Goblin Rocket Helmet = 10588
# Skull of Impending Doom = 4984
# Nifty Stopwatch = 2820
# Gnomish Rocket Boots = 10724

# Find Gadgets category number first
if ($content -match '\[(\d+)\] = \{[^}]*\["name"\] = "Gadgets"') {
    $gadgetsCatNum = $matches[1]
    Write-Host "Found Gadgets category at [$gadgetsCatNum]"
} else {
    # Create Gadgets category if it doesn't exist
    $gadgetsCategory = @'
		[41] = {
			["sequence"] = 65,
			["name"] = "Gadgets",
			["list"] = {
				[1] = 7189,
				[2] = 10501,
				[3] = 10588,
				[4] = 4984,
				[5] = 2820,
				[6] = 10724,
			},
			["dateModified"] = 1767769400,
			["inUse"] = true,
		},
'@
    $content = $content -replace '(\[40\] = \{[^}]*\["inUse"\] = true,\s*\},)', "`$1`n$gadgetsCategory"
    Write-Host "Created Gadgets category [41] with engineering items"
}

# ============================================
# 6. ADD ITEMS TO PVP GEAR CATEGORY
# Dragon's Touch, Kizan's Unstoppable Taint
# ============================================
# Dragon's Touch = 12953
# Kizan's Unstoppable Taint = various IDs - need to search

# Find PvP category
if ($content -match '\[(\d+)\] = \{[^}]*\["name"\] = "PVP Gear"') {
    $pvpCatNum = $matches[1]
    Write-Host "Found PVP Gear category at [$pvpCatNum]"
}

# Force write
attrib -R $file
[System.IO.File]::WriteAllText($file, $content)
attrib +R $file

Write-Host ""
Write-Host "All changes complete! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host ""
Write-Host "IMPORTANT: Do /reload in-game to test"

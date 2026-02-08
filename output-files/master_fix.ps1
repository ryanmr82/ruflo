# MASTER BAGSHUI FIX - ALL CATEGORIES AND ITEMS
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

Write-Host "Reading file..."
$content = Get-Content $file -Raw

# ============================================
# 1. FIX RESIST SEQUENCES: 100 -> 70
# (SoulboundGear is 88, so 70 evaluates first)
# ============================================
$content = $content -replace '(\[29\] = \{[\s\S]*?\["sequence"\] = )100,', '${1}70,'
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )100,', '${1}70,'
$content = $content -replace '(\[34\] = \{[\s\S]*?\["sequence"\] = )100,', '${1}70,'
$content = $content -replace '(\[35\] = \{[\s\S]*?\["sequence"\] = )100,', '${1}70,'
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )100,', '${1}70,'
Write-Host "1. Fixed resist category sequences: 100 -> 70"

# ============================================
# 2. ADD ITEMS TO GADGETS [24] LIST
# 7189, 10501, 10588, 4984, 2820, 10724
# ============================================
# Find Gadgets list and add items
if ($content -match '(\[24\] = \{[^}]*\["list"\] = \{[^}]*)\},') {
    $gadgetsList = $matches[1]
    if ($gadgetsList -notmatch '7189') {
        $newGadgetsList = $gadgetsList + "`n				[3] = 7189,`n				[4] = 10501,`n				[5] = 10588,`n				[6] = 4984,`n				[7] = 2820,`n				[8] = 10724,"
        $content = $content -replace [regex]::Escape($gadgetsList), $newGadgetsList
        Write-Host "2. Added 6 items to Gadgets [24]"
    }
}

# ============================================
# 3. ADD ITEMS TO PVP GEAR [13] LIST
# Dragon's Touch=19367, Kezan's=19605, Ansirem's=61264
# ============================================
# Current PVP list ends around line 125
if ($content -match '(\[13\] = \{[^}]*\["list"\] = \{[^\}]+)\},') {
    $pvpList = $matches[1]
    # Count existing items to get next index
    $itemMatches = [regex]::Matches($pvpList, '\[\d+\] = \d+')
    $nextIdx = $itemMatches.Count + 1
    if ($pvpList -notmatch '19367') {
        $newPvpList = $pvpList + "`n				[$nextIdx] = 19367,`n				[$($nextIdx+1)] = 19605,`n				[$($nextIdx+2)] = 61264,"
        $content = $content -replace [regex]::Escape($pvpList), $newPvpList
        Write-Host "3. Added Dragon's Touch, Kezan's, Ansirem's to PVP Gear [13]"
    }
}

# ============================================
# 4. ADD BG MARKS TO TOKENS [25] LIST
# Warsong=20558, Arathi=20559, Alterac=20560
# ============================================
if ($content -match '(\[25\] = \{[^}]*\["list"\] = \{[^}]*)\},') {
    $tokensList = $matches[1]
    if ($tokensList -notmatch '20558') {
        $newTokensList = $tokensList + "`n				[9] = 20558,`n				[10] = 20559,`n				[11] = 20560,"
        $content = $content -replace [regex]::Escape($tokensList), $newTokensList
        Write-Host "4. Added BG Marks to Tokens [25]"
    }
}

# ============================================
# 5. CREATE BIND ON EQUIP CATEGORY [41]
# Sequence 20 = HIGHEST PRIORITY (trumps everything)
# ============================================
$boeCategory = @'
		[41] = {
			["sequence"] = 20,
			["name"] = "Bind on Equip",
			["list"] = {
				[1] = 17203,
			},
			["dateModified"] = 1767769500,
			["rule"] = "Tooltip(\"Binds when equipped\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\["name"\] = "Bind on Equip"') {
    # Insert after category [40] or after last numbered category
    if ($content -match '(\[40\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[40\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$boeCategory"
        Write-Host "4. Created Bind on Equip category [41] with sequence 20 (highest priority)"
    } elseif ($content -match '(\[39\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[39\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$boeCategory"
        Write-Host "4. Created Bind on Equip category [41]"
    } elseif ($content -match '(\[37\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[37\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$boeCategory"
        Write-Host "4. Created Bind on Equip category [41]"
    }
}

# ============================================
# 5. CREATE ELIXIRS CATEGORY [42]
# ============================================
$elixirsCategory = @'
		[42] = {
			["sequence"] = 69,
			["name"] = "Elixirs",
			["list"] = {
			},
			["dateModified"] = 1767769500,
			["rule"] = "Name(\"Elixir\", \"Dream Tonic\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\["name"\] = "Elixirs"') {
    if ($content -match '(\[41\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[41\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$elixirsCategory"
        Write-Host "5. Created Elixirs category [42]"
    }
}

# ============================================
# 6. CREATE FOOD BUFFS CATEGORY [43]
# ============================================
$foodBuffsCategory = @'
		[43] = {
			["sequence"] = 69,
			["name"] = "Food Buffs",
			["list"] = {
			},
			["dateModified"] = 1767769500,
			["rule"] = "Tooltip(\"well fed\") and Tooltip(\"also\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\["name"\] = "Food Buffs"') {
    if ($content -match '(\[42\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[42\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$foodBuffsCategory"
        Write-Host "6. Created Food Buffs category [43]"
    }
}

# ============================================
# 7. CREATE WEAPON BUFFS CATEGORY [44]
# ============================================
$weaponBuffsCategory = @'
		[44] = {
			["sequence"] = 69,
			["name"] = "Weapon Buffs",
			["list"] = {
			},
			["dateModified"] = 1767769500,
			["rule"] = "Name(\"Frost Oil\", \"Mana Oil\", \"Shadow Oil\", \"Sharpening Stone\", \"Weightstone\", \"Wizard Oil\", \"Elemental Sharpening Stone\")",
			["inUse"] = true,
		},
'@

if ($content -notmatch '\[44\] = \{') {
    if ($content -match '(\[43\] = \{[^}]+\["inUse"\] = true,\s*\},)') {
        $content = $content -replace '(\[43\] = \{[^}]+\["inUse"\] = true,\s*\},)', "`$1`n$weaponBuffsCategory"
        Write-Host "7. Created Weapon Buffs category [44]"
    }
}

# ============================================
# FORCE WRITE
# ============================================
Write-Host ""
Write-Host "Writing changes..."
attrib -R $file
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file

Write-Host ""
Write-Host "============================================"
Write-Host "ALL CHANGES COMPLETE!"
Write-Host "============================================"
Write-Host ""
Write-Host "CATEGORY PRIORITIES (sequence):"
Write-Host "  20 = Bind on Equip (HIGHEST - trumps everything)"
Write-Host "  30 = Keys, Alt Keys, Gadgets, PVP Gear"
Write-Host "  69 = Elixirs, Food Buffs, Weapon Buffs"
Write-Host "  70 = Resist categories (Shadow/Fire/Frost/Nature/Arcane)"
Write-Host "  88 = SoulboundGear"
Write-Host ""
Write-Host "ITEMS ADDED:"
Write-Host "  Gadgets: Goblin Rocket Boots, Catseye Ultra Goggles,"
Write-Host "           Goblin Rocket Helmet, Skull of Impending Doom,"
Write-Host "           Nifty Stopwatch, Gnomish Rocket Boots"
Write-Host "  PVP Gear: Dragon's Touch, Kezan's Unstoppable Taint,"
Write-Host "            Ansirem's Runeweaver"
Write-Host "  Bind on Equip: Sulfuron Ingot + all 'Binds when equipped' items"
Write-Host ""
Write-Host "File read-only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host ""
Write-Host "DO /RELOAD IN-GAME TO TEST!"

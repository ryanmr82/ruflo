# ADD ALL MANUAL OVERRIDE ITEMS TO CATEGORIES
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $file
$content = Get-Content $file -Raw

# ============================================
# GADGETS [24] - Add Parachute Cloak (10518)
# 7189 (Goblin Rocket Boots) already there
# ============================================
if ($content -notmatch '\[24\] = \{[^}]*10518') {
    $content = $content -replace '(\[24\] = \{[^}]*\[8\] = 10724,)(\},)', '$1[9] = 10518,$2'
    Write-Host "Added Parachute Cloak (10518) to Gadgets [24]"
}

# ============================================
# ARCANE RESIST [37] - Add items
# 11979 = Peridot Circle of Arcane Resistance
# ============================================
if ($content -notmatch '\[37\] = \{[^}]*\["list"\] = \{[^}]*11979') {
    # Current list is empty, add items
    $content = $content -replace '(\[37\] = \{[^}]*\["list"\] = \{)(\s*\},)', '$1[1] = 11979,$2'
    Write-Host "Added Peridot Circle of Arcane Resistance (11979) to Arcane Resist [37]"
}

# ============================================
# KEYS [36] - Add Mallet of Zul'Farrak (9240)
# ============================================
if ($content -notmatch '\[36\] = \{[^}]*9240') {
    $content = $content -replace '(\[36\] = \{[^}]*\[1\] = 12344,)(\s*\},)', '$1[2] = 9240,$2'
    Write-Host "Added Mallet of Zul'Farrak (9240) to Keys [36]"
}

# ============================================
# TRANSPORTATION [9] - Add Guild Tabard (5976) and City Protector's Medallion (50056)
# ============================================
if ($content -notmatch '\[9\] = \{[^}]*5976') {
    $content = $content -replace '(\[9\] = \{[^}]*\[5\] = 61000,)(\s*\},)', '$1[6] = 5976,[7] = 50056,$2'
    Write-Host "Added Guild Tabard (5976) and City Protector's Medallion (50056) to Transportation [9]"
}

# ============================================
# RAID GEAR [14] - Add multiple items
# 55056 = Spellwoven Nobility Drape
# 21417 = Ring of Unspoken Names
# 58088 = True Band of Sulfuras
# 61284 = Vest of Encroaching Darkness
# 18808 = Gloves of the Hypnotic Flame
# 61211 = Sandals of Lucidity
# 21210 = Signet Ring of Bronze Dragonflight
# 58213 = Smoldaris Fractured Eye
# ============================================
if ($content -notmatch '\[14\] = \{[^}]*55056') {
    $content = $content -replace '(\[14\] = \{[^}]*\[14\] = 61010,)(\s*\},)', '$1[15] = 55056,[16] = 21417,[17] = 58088,[18] = 61284,[19] = 18808,[20] = 61211,[21] = 21210,[22] = 58213,$2'
    Write-Host "Added 8 items to Raid Gear [14]"
}

# ============================================
# PVP GEAR [13] - Add multiple items
# 19950 = Zandalarian Hero Charm
# 17591 = Warlord's Dreadweave Hood
# 17590 = Warlord's Dreadweave Mantle
# 17592 = Warlord's Dreadweave Robe
# 17588 = General's Dreadweave Gloves
# 17593 = General's Dreadweave Pants
# 17586 = General's Dreadweave Boots
# 61754 = Deepwood Pipe
# 19957 = Hazza'rah's Charm of Destruction
# 23468 = High Warlord's Tome of Destruction
# ============================================
if ($content -notmatch '\[13\] = \{[^}]*19950') {
    $content = $content -replace '(\[13\] = \{[^}]*\[6\] = 61264,)(\},)', '$1[7] = 19950,[8] = 17591,[9] = 17590,[10] = 17592,[11] = 17588,[12] = 17593,[13] = 17586,[14] = 61754,[15] = 19957,[16] = 23468,$2'
    Write-Host "Added 10 items to PVP Gear [13]"
}

# ============================================
# WRITE FILE
# ============================================
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file

Write-Host ""
Write-Host "============================================"
Write-Host "ALL ITEMS ADDED!"
Write-Host "============================================"
Write-Host ""
Write-Host "GADGETS [24]: Parachute Cloak"
Write-Host "ARCANE RESIST [37]: Peridot Circle of Arcane Resistance"
Write-Host "KEYS [36]: Mallet of Zul'Farrak"
Write-Host "TRANSPORTATION [9]: Guild Tabard, City Protector's Medallion"
Write-Host "RAID GEAR [14]: Spellwoven Nobility Drape, Ring of Unspoken Names,"
Write-Host "  True Band of Sulfuras, Vest of Encroaching Darkness,"
Write-Host "  Gloves of Hypnotic Flame, Sandals of Lucidity,"
Write-Host "  Signet Ring of Bronze Dragonflight, Smoldaris Fractured Eye"
Write-Host "PVP GEAR [13]: Zandalarian Hero Charm, Warlord's Dreadweave set,"
Write-Host "  General's Dreadweave set, Deepwood Pipe,"
Write-Host "  Hazza'rah's Charm, High Warlord's Tome"
Write-Host ""
Write-Host "NOTE: Frost Resist [33] already has the frost resist items."
Write-Host "NOTE: Arcane resist items with same base ID as frost (11976)"
Write-Host "      will follow tooltip rules for differentiation."
Write-Host ""
Write-Host "File read-only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host "DO /RELOAD IN-GAME TO TEST!"

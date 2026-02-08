$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Add Drakefire Amulet (16309) to Keys [36] list
if ($content -notmatch '\[36\] = \{[^}]*16309') {
    $content = $content -replace '(\[36\] = \{[^}]*\[2\] = 9240,)(\s*\},)', '$1[3] = 16309,$2'
    Write-Host "Added Drakefire Amulet (16309) to Keys [36]"
}

# Fix cached category IDs by itemLink

# Drakefire Amulet -> Keys (36)
$content = $content -replace '(\|h\[Drakefire Amulet\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'
$content = $content -replace '(\|h\[Drakefire Amulet\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
Write-Host "Drakefire Amulet -> Keys (36)"

# Seal of Ascension -> Keys (36)
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
Write-Host "Seal of Ascension -> Keys (36)"

# Ocean's Gaze -> Swim Speed (3)
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Ocean's Gaze -> Swim Speed (3)"

# Frostwolf Insignia Rank 4 -> Transportation (9)
$content = $content -replace '(\|h\[Frostwolf Insignia Rank 4\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}9'
$content = $content -replace '(\|h\[Frostwolf Insignia Rank 4\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}9'
Write-Host "Frostwolf Insignia Rank 4 -> Transportation (9)"

# Ice Pearl of Kaneq'nuun -> Swim Speed (3)
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Ice Pearl -> Swim Speed (3)"

# Rethress Tide Crest -> Swim Speed (3)
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Rethress Tide Crest -> Swim Speed (3)"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host ""
Write-Host "Done! /reload"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Mallet of Zul'Farrak -> Keys (36)
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
Write-Host "Mallet -> Keys (36)"

# Frostweaver Cape -> Frost Resist (33)
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Frostweaver Cape -> Frost Resist (33)"

# Coldtouch Phantom Wraps -> Frost Resist (33)
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Coldtouch Phantom Wraps -> Frost Resist (33)"

# Gaea's Tunic of Frost Resistance -> Frost Resist (33)
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Gaea's Tunic -> Frost Resist (33)"

# Sardonyx Knuckle of Frost Resistance -> Frost Resist (33)
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Sardonyx Knuckle of Frost -> Frost Resist (33)"

# Seal of Ascension -> Keys (36)
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
Write-Host "Seal of Ascension -> Keys (36)"

# Ocean's Gaze -> Swim Speed (3)
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Ocean's Gaze -> Swim Speed (3)"

# Ice Pearl of Kaneq'nuun -> Swim Speed (3)
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Ice Pearl -> Swim Speed (3)"

# Rethress Tide Crest -> Swim Speed (3)
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}3'
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}3'
Write-Host "Rethress Tide Crest -> Swim Speed (3)"

# Now increase Transportation sequence so it stops grabbing everything
$content = $content -replace '(\[9\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}50'
Write-Host "Transportation sequence -> 50 (checked later)"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host ""
Write-Host "All items fixed! /reload"

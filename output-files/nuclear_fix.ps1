$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Set sequences to 1 for our categories - ABSOLUTE FIRST
$content = $content -replace '(\[3\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
Write-Host "Sequences set to 1"

# Set Transportation to 99
$content = $content -replace '(\[9\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}99'
Write-Host "Transportation set to 99"

# Set BOE to 99
$content = $content -replace '(\[28\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}99'
Write-Host "BOE set to 99"

# Force ALL item category assignments
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}36'
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}36'
$content = $content -replace '(\|h\[Drakefire Amulet\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}36'
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}33'
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}33'
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}33'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}33'
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}37'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}37'
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}3'
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}3'
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )[^\n,]+', '${1}3'
Write-Host "Item categories forced"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Done. /reload"

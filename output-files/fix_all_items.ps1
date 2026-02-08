$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Fix by itemLink pattern - bagshuiCategoryId comes right after itemLink

# Mallet of Zul'Farrak -> Keys (36)
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
Write-Host "Mallet -> 36 (Keys)"

# Peridot Circle -> Arcane Resist (37)
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'
Write-Host "Peridot Circle -> 37 (Arcane Resist)"

# Sardonyx Knuckle of Arcane -> Arcane Resist (37)
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'
Write-Host "Sardonyx (Arcane) -> 37 (Arcane Resist)"

# Sardonyx Knuckle of Frost -> Frost Resist (33)
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Sardonyx (Frost) -> 33 (Frost Resist)"

# Gaea's Tunic -> Frost Resist (33)
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Gaea's Tunic -> 33 (Frost Resist)"

# Coldtouch Phantom Wraps -> Frost Resist (33)
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Coldtouch -> 33 (Frost Resist)"

# Frostweaver Cape -> Frost Resist (33)
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
Write-Host "Frostweaver Cape -> 33 (Frost Resist)"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host ""
Write-Host "All item categories fixed! /reload"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Fix Peridot Circle of Arcane Resistance -> category 37
$content = $content -replace '(\["name"\] = "Peridot Circle of Arcane Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'
$content = $content -replace '(\["name"\] = "Peridot Circle of Arcane Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'

# Fix Sardonyx Knuckle of Arcane Resistance -> category 37
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Arcane Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Arcane Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'

# Fix Sardonyx Knuckle of Frost Resistance -> category 33
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Frost Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Frost Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'

# Fix Mallet of Zul'Farrak -> category 36
$content = $content -replace '(\["name"\] = "Mallet of Zul''Farrak",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}36'
$content = $content -replace '(\["name"\] = "Mallet of Zul''Farrak",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}36'

# Fix Gaea's Tunic of Frost Resistance -> category 33
$content = $content -replace '(\["name"\] = "Gaea''s Tunic of Frost Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
$content = $content -replace '(\["name"\] = "Gaea''s Tunic of Frost Resistance",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'

# Fix Coldtouch Phantom Wraps -> category 33
$content = $content -replace '(\["name"\] = "Coldtouch Phantom Wraps",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
$content = $content -replace '(\["name"\] = "Coldtouch Phantom Wraps",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'

# Fix Frostweaver Cape -> category 33
$content = $content -replace '(\["name"\] = "Frostweaver Cape",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}33'
$content = $content -replace '(\["name"\] = "Frostweaver Cape",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}33'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file

Write-Host "Fixed cached item category IDs:"
Write-Host "  Peridot Circle -> Arcane Resist (37)"
Write-Host "  Sardonyx Knuckle of Arcane -> Arcane Resist (37)"
Write-Host "  Sardonyx Knuckle of Frost -> Frost Resist (33)"
Write-Host "  Mallet of Zul'Farrak -> Keys (36)"
Write-Host "  Gaea's Tunic -> Frost Resist (33)"
Write-Host "  Coldtouch Phantom Wraps -> Frost Resist (33)"
Write-Host "  Frostweaver Cape -> Frost Resist (33)"
Write-Host ""
Write-Host "DO /RELOAD IN-GAME!"

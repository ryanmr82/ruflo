$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Peridot Circle of Arcane Resistance -> Arcane Resist (37)
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'

# Sardonyx Knuckle of Arcane Resistance -> Arcane Resist (37)
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )"[^"]*"', '${1}37'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiCategoryId"\] = )\d+', '${1}37'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Peridot Circle -> Arcane Resist (37)"
Write-Host "Sardonyx Knuckle of Arcane -> Arcane Resist (37)"
Write-Host "Done! /reload"

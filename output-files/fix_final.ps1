$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix 1: Peridot Circle of Arcane Resistance - change bagshuiCategoryId from "Armor" to 37
$content = $content -replace '(\["baseName"\] = "Peridot Circle",[\s\S]*?\["bagshuiCategoryId"\] = )"Armor"', '${1}37'
Write-Host "Fixed Peridot Circle of Arcane Resistance -> category 37"

# Fix 2: Seal of Ascension - change bagshuiCategoryId from 2 to 36
$content = $content -replace '(\["bagshuiCategoryId"\] = )2(,[\s\S]{1,500}?\["name"\] = "Seal of Ascension")', '${1}36${2}'
Write-Host "Fixed Seal of Ascension -> category 36"

# Write without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload in game"

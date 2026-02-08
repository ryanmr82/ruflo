$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Fix bagshuiGroupId for Swim Speed items -> "3:3"
$content = $content -replace '(\|h\[Ocean''s Gaze\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"3:3"'
$content = $content -replace '(\|h\[Ice Pearl of Kaneq''nuun\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"3:3"'
$content = $content -replace '(\|h\[Rethress Tide Crest\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"3:3"'
Write-Host "Swim Speed items -> 3:3"

# Fix bagshuiGroupId for Keys items -> "5:3"
$content = $content -replace '(\|h\[Mallet of Zul''Farrak\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"5:3"'
$content = $content -replace '(\|h\[Seal of Ascension\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"5:3"'
$content = $content -replace '(\|h\[Drakefire Amulet\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"5:3"'
Write-Host "Keys items -> 5:3"

# Fix bagshuiGroupId for Frost Resist items -> "2:4"
$content = $content -replace '(\|h\[Frostweaver Cape\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:4"'
$content = $content -replace '(\|h\[Coldtouch Phantom Wraps\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:4"'
$content = $content -replace '(\|h\[Gaea''s Tunic of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:4"'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Frost Resistance\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:4"'
Write-Host "Frost Resist items -> 2:4"

# Fix bagshuiGroupId for Arcane Resist items -> "2:5" (assuming next after frost)
$content = $content -replace '(\|h\[Peridot Circle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:5"'
$content = $content -replace '(\|h\[Sardonyx Knuckle of Arcane Resistance\]\|h\|r",[\s\S]*?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:5"'
Write-Host "Arcane Resist items -> 2:5"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "GroupIds fixed. /reload"

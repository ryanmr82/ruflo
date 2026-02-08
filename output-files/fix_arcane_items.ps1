$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix ALL Peridot Circle entries - set bagshuiCategoryId to 37 and bagshuiGroupId to "2:6"
$content = $content -replace '(\["bagshuiCategoryId"\] = )[^,]+(,[\s\S]{1,800}?\["name"\] = "Peridot Circle of Arcane Resistance")', '${1}37${2}'
$content = $content -replace '(\["name"\] = "Peridot Circle of Arcane Resistance"[\s\S]{1,800}?\["bagshuiCategoryId"\] = )[^,]+', '${1}37'
$content = $content -replace '(\["bagshuiGroupId"\] = )"[^"]*"([\s\S]{1,800}?\["name"\] = "Peridot Circle of Arcane Resistance")', '${1}"2:6"${2}'
$content = $content -replace '(\["name"\] = "Peridot Circle of Arcane Resistance"[\s\S]{1,800}?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:6"'
Write-Host "Fixed Peridot Circle"

# Fix ALL Sardonyx Knuckle of Arcane Resistance entries
$content = $content -replace '(\["bagshuiCategoryId"\] = )[^,]+(,[\s\S]{1,800}?\["name"\] = "Sardonyx Knuckle of Arcane Resistance")', '${1}37${2}'
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Arcane Resistance"[\s\S]{1,800}?\["bagshuiCategoryId"\] = )[^,]+', '${1}37'
$content = $content -replace '(\["bagshuiGroupId"\] = )"[^"]*"([\s\S]{1,800}?\["name"\] = "Sardonyx Knuckle of Arcane Resistance")', '${1}"2:6"${2}'
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Arcane Resistance"[\s\S]{1,800}?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:6"'
Write-Host "Fixed Sardonyx Knuckle of Arcane Resistance"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

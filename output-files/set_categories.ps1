$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# SET bagshuiCategoryId to correct NUMBER values (not empty strings)
# Swim Speed items -> 3
$swimItems = @("Ocean's Gaze", "Ice Pearl of Kaneq'nuun", "Rethress Tide Crest")
foreach ($item in $swimItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiCategoryId`"\] = )[^,]+", '${1}3'
    $content = $content -replace "(\[`"bagshuiCategoryId`"\] = )[^,]+(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}3${2}'
    Write-Host "$item -> category 3 (Swim Speed)"
}

# Keys items -> 36
$keyItems = @("Drakefire Amulet", "Mallet of Zul'Farrak", "Seal of Ascension")
foreach ($item in $keyItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiCategoryId`"\] = )[^,]+", '${1}36'
    $content = $content -replace "(\[`"bagshuiCategoryId`"\] = )[^,]+(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}36${2}'
    Write-Host "$item -> category 36 (Keys)"
}

# Frost Resist items -> 33
$frostItems = @("Frostweaver Cape", "Coldtouch Phantom Wraps", "Gaea's Tunic of Frost Resistance", "Sardonyx Knuckle of Frost Resistance")
foreach ($item in $frostItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiCategoryId`"\] = )[^,]+", '${1}33'
    $content = $content -replace "(\[`"bagshuiCategoryId`"\] = )[^,]+(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}33${2}'
    Write-Host "$item -> category 33 (Frost Resist)"
}

# Arcane Resist items -> 37
$arcaneItems = @("Peridot Circle of Arcane Resistance", "Sardonyx Knuckle of Arcane Resistance")
foreach ($item in $arcaneItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiCategoryId`"\] = )[^,]+", '${1}37'
    $content = $content -replace "(\[`"bagshuiCategoryId`"\] = )[^,]+(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}37${2}'
    Write-Host "$item -> category 37 (Arcane Resist)"
}

# Set bagshuiGroupId for Swim Speed items -> "3:3"
foreach ($item in $swimItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiGroupId`"\] = )`"[^`"]*`"", '${1}"3:3"'
    $content = $content -replace "(\[`"bagshuiGroupId`"\] = )`"[^`"]*`"(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}"3:3"${2}'
    Write-Host "$item -> groupId 3:3"
}

# Set bagshuiGroupId for Keys items -> "5:3" (where Keys group is)
foreach ($item in $keyItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiGroupId`"\] = )`"[^`"]*`"", '${1}"5:3"'
    $content = $content -replace "(\[`"bagshuiGroupId`"\] = )`"[^`"]*`"(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}"5:3"${2}'
    Write-Host "$item -> groupId 5:3"
}

# Set bagshuiGroupId for Frost Resist items -> "2:4"
foreach ($item in $frostItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiGroupId`"\] = )`"[^`"]*`"", '${1}"2:4"'
    $content = $content -replace "(\[`"bagshuiGroupId`"\] = )`"[^`"]*`"(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}"2:4"${2}'
    Write-Host "$item -> groupId 2:4"
}

# Set bagshuiGroupId for Arcane Resist items -> "2:6" (new group)
foreach ($item in $arcaneItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiGroupId`"\] = )`"[^`"]*`"", '${1}"2:6"'
    $content = $content -replace "(\[`"bagshuiGroupId`"\] = )`"[^`"]*`"(,[\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}"2:6"${2}'
    Write-Host "$item -> groupId 2:6"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Categories and groupIds set. /reload"

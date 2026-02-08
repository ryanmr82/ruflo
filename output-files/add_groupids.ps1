$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# ADD bagshuiGroupId field to items that are MISSING it
# Insert after bagshuiDate or before name field

# Swim Speed items -> add bagshuiGroupId = "3:3"
$swimItems = @("Ocean's Gaze", "Ice Pearl of Kaneq'nuun", "Rethress Tide Crest")
foreach ($item in $swimItems) {
    $escaped = [regex]::Escape($item)
    # Insert bagshuiGroupId before the name field if it doesn't exist
    # Pattern: item entry that has this name but NO bagshuiGroupId
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,50}?\[`"equipLocationLocalized`"\])", '["bagshuiGroupId"] = "3:3",
							$1'
    Write-Host "Added groupId 3:3 to $item"
}

# Keys items -> add bagshuiGroupId = "5:3"
$keyItems = @("Seal of Ascension", "Drakefire Amulet", "Mallet of Zul'Farrak")
foreach ($item in $keyItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,50}?\[`"equipLocationLocalized`"\])", '["bagshuiGroupId"] = "5:3",
							$1'
    Write-Host "Added groupId 5:3 to $item"
}

# Frost Resist items -> add bagshuiGroupId = "2:4"
$frostItems = @("Frostweaver Cape", "Coldtouch Phantom Wraps", "Gaea's Tunic of Frost Resistance", "Sardonyx Knuckle of Frost Resistance", "Frostwolf Insignia Rank 4")
foreach ($item in $frostItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,50}?\[`"equipLocationLocalized`"\])", '["bagshuiGroupId"] = "2:4",
							$1'
    Write-Host "Added groupId 2:4 to $item"
}

# Also fix any existing wrong groupIds
$content = $content -replace '(\["bagshuiGroupId"\] = )"5:1"([\s\S]{1,500}?\["name"\] = "Frostwolf Insignia Rank 4")', '${1}"2:4"${2}'

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

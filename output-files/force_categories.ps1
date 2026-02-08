$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# FORCE sequence 1 for all target categories (evaluated FIRST, before BOE at 10)
# Category [3] Swim Speed
$content = $content -replace '(\[3\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
Write-Host "Swim Speed [3] -> sequence 1"

# Category [33] Frost Resist  
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
Write-Host "Frost Resist [33] -> sequence 1"

# Category [36] Keys
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
Write-Host "Keys [36] -> sequence 1"

# Category [37] Arcane Resist
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}1'
Write-Host "Arcane Resist [37] -> sequence 1"

# Now CLEAR all bagshuiCategoryId and bagshuiGroupId from problem items
# so BagShui is forced to recalculate from scratch
$items = @(
    "Ocean's Gaze",
    "Ice Pearl of Kaneq'nuun",
    "Rethress Tide Crest",
    "Mallet of Zul'Farrak",
    "Seal of Ascension",
    "Drakefire Amulet",
    "Frostweaver Cape",
    "Coldtouch Phantom Wraps",
    "Gaea's Tunic of Frost Resistance",
    "Sardonyx Knuckle of Frost Resistance",
    "Peridot Circle of Arcane Resistance",
    "Sardonyx Knuckle of Arcane Resistance"
)

foreach ($item in $items) {
    $escaped = [regex]::Escape($item)
    # Clear bagshuiCategoryId (set to empty string)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,800}?\[`"bagshuiCategoryId`"\] = )[^,]+", '${1}""'
    $content = $content -replace "(\[`"bagshuiCategoryId`"\] = )[^,]+(,[\s\S]{1,800}?\[`"name`"\] = `"$escaped`")", '${1}""${2}'
    Write-Host "Cleared cached category for: $item"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload in game"

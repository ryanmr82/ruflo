$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Remove bagshuiCategoryId and bagshuiGroupId from problem items so BagShui recalculates
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
    # Remove cached category assignments near this item
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]*?)(\[`"bagshuiCategoryId`"\] = [^,]+,)", '$1'
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]*?)(\[`"bagshuiGroupId`"\] = `"[^`"]+`",)", '$1'
}

Write-Host "Cleared cached assignments"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$lines = Get-Content $file
$newLines = @()

$currentItem = ""
$needsCategory = $false
$targetCategory = 0
$hasCategory = $false
$itemStartLine = 0

$itemCategories = @{
    "Ocean's Gaze" = 3
    "Ice Pearl of Kaneq'nuun" = 3
    "Rethress Tide Crest" = 3
    "Mallet of Zul'Farrak" = 36
    "Seal of Ascension" = 36
    "Drakefire Amulet" = 36
    "Frostweaver Cape" = 33
    "Coldtouch Phantom Wraps" = 33
    "Gaea's Tunic of Frost Resistance" = 33
    "Sardonyx Knuckle of Frost Resistance" = 33
    "Peridot Circle of Arcane Resistance" = 37
    "Sardonyx Knuckle of Arcane Resistance" = 37
}

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Check for item name
    foreach ($itemName in $itemCategories.Keys) {
        if ($line -match "\[`"name`"\] = `"$([regex]::Escape($itemName))`"") {
            $currentItem = $itemName
            $targetCategory = $itemCategories[$itemName]
            $needsCategory = $true
            $hasCategory = $false
            # Look back to find if this item entry has bagshuiCategoryId
            for ($j = [Math]::Max(0, $i - 20); $j -lt $i; $j++) {
                if ($lines[$j] -match '\["bagshuiCategoryId"\]') {
                    $hasCategory = $true
                    # Update the category
                    $lines[$j] = $lines[$j] -replace '\["bagshuiCategoryId"\] = [^,]+', "[`"bagshuiCategoryId`"] = $targetCategory"
                    break
                }
            }
            if (-not $hasCategory) {
                # Need to add category - insert before name line
                $newLines += "							[`"bagshuiCategoryId`"] = $targetCategory,"
                Write-Host "Added category $targetCategory to $itemName"
            }
            break
        }
    }
    
    $newLines += $line
}

$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Done. /reload"

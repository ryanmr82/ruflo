$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$lines = Get-Content $file
$newLines = @()

$currentItem = ""
$fixCount = 0

foreach ($line in $lines) {
    # Track current item by itemLink
    if ($line -match '\["itemLink"\] = ".*\[([^\]]+)\]') {
        $currentItem = $matches[1]
    }
    
    # Fix bagshuiCategoryId based on current item
    if ($line -match '\["bagshuiCategoryId"\]' -and $currentItem -ne "") {
        $newCat = $null
        
        # Keys items
        if ($currentItem -match "Mallet of Zul'Farrak|Seal of Ascension|Drakefire Amulet") {
            $newCat = 36
        }
        # Frost Resist items
        elseif ($currentItem -match "Frostweaver Cape|Coldtouch Phantom Wraps|Gaea's Tunic of Frost Resistance|Sardonyx Knuckle of Frost Resistance") {
            $newCat = 33
        }
        # Arcane Resist items
        elseif ($currentItem -match "Peridot Circle of Arcane Resistance|Sardonyx Knuckle of Arcane Resistance") {
            $newCat = 37
        }
        # Swim Speed items
        elseif ($currentItem -match "Ocean's Gaze|Ice Pearl of Kaneq|Rethress Tide Crest") {
            $newCat = 3
        }
        
        if ($newCat) {
            $line = $line -replace '\["bagshuiCategoryId"\] = "[^"]*"', "[`"bagshuiCategoryId`"] = $newCat"
            $line = $line -replace '\["bagshuiCategoryId"\] = \d+', "[`"bagshuiCategoryId`"] = $newCat"
            $fixCount++
        }
    }
    
    $newLines += $line
}

$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Fixed $fixCount category assignments"
Write-Host "File read-only. /reload"

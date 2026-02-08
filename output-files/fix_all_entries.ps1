$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Use simpler patterns that will match more consistently
# Fix ALL Ocean's Gaze entries
$content = $content -replace '(\["name"\] = "Ocean''s Gaze",)', '["bagshuiCategoryId"] = 3,
							$1'
$content = $content -replace '\["bagshuiCategoryId"\] = "",[\s\n\t]*\["name"\] = "Ocean''s Gaze"', '["bagshuiCategoryId"] = 3,
							["name"] = "Ocean''s Gaze"'
$content = $content -replace '\["bagshuiCategoryId"\] = 3,[\s\n\t]*\["bagshuiCategoryId"\] = 3,', '["bagshuiCategoryId"] = 3,'
Write-Host "Fixed Ocean's Gaze"

# Fix ALL Ice Pearl entries
$content = $content -replace '\["bagshuiCategoryId"\] = "",[\s\n\t]*\["subtype"\]([^}]*)"Ice Pearl of Kaneq''nuun"', '["bagshuiCategoryId"] = 3,
							["subtype"]$1"Ice Pearl of Kaneq''nuun"'
Write-Host "Fixed Ice Pearl"

# Fix ALL Rethress Tide Crest entries  
$content = $content -replace '\["bagshuiCategoryId"\] = "",([^}]*)"Rethress Tide Crest"', '["bagshuiCategoryId"] = 3,$1"Rethress Tide Crest"'
Write-Host "Fixed Rethress Tide Crest"

# Fix ALL Drakefire Amulet entries
$content = $content -replace '\["bagshuiCategoryId"\] = "",([^}]*)"Drakefire Amulet"', '["bagshuiCategoryId"] = 36,$1"Drakefire Amulet"'
Write-Host "Fixed Drakefire Amulet"

# Fix ALL Seal of Ascension entries
$content = $content -replace '\["bagshuiCategoryId"\] = "",([^}]*)"Seal of Ascension"', '["bagshuiCategoryId"] = 36,$1"Seal of Ascension"'
Write-Host "Fixed Seal of Ascension"

# Fix ALL Mallet entries
$content = $content -replace '\["bagshuiCategoryId"\] = "",([^}]*)"Mallet of Zul''Farrak"', '["bagshuiCategoryId"] = 36,$1"Mallet of Zul''Farrak"'
Write-Host "Fixed Mallet"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

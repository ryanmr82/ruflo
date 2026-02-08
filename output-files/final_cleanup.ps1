$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Remove any duplicate bagshuiCategoryId entries (keep first one with value)
# Pattern: value appears twice - remove the second occurrence at end of item entry
$content = $content -replace '(\["bagshuiCategoryId"\] = \d+,[\s\S]{1,2000}?)\["bagshuiCategoryId"\] = \d+,[\s\n\t]*(\["name"\])', '$1$2'
Write-Host "Removed duplicate bagshuiCategoryId entries"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

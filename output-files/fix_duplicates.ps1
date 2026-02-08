$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Remove duplicate bagshuiCategoryId entries (keep the one with the number)
$content = $content -replace '\["bagshuiCategoryId"\] = "",[\s\n\t]*\["bagshuiCategoryId"\] = (\d+),', '["bagshuiCategoryId"] = $1,'

Write-Host "Removed duplicate entries"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

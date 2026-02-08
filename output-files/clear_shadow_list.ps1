$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Clear the Shadow Resist [29] list - keep only the rule
$oldPattern = '(\[29\] = \{\s*\["name"\] = "Shadow Resist",\s*)\["list"\] = \{[^}]+\},'
$newContent = '$1["list"] = {
			},'

$content = $content -replace $oldPattern, $newContent
Write-Host "Cleared Shadow Resist [29] list - now using only Tooltip rule"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

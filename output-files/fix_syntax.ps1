$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix missing comma after categories in Frost Resist entry
$content = $content -replace '\{ \[1\] = 33, \[2\] = 37, \}\s*\["name"\]', '{ [1] = 33, [2] = 37, },
								["name"]'
Write-Host "Fixed Frost Resist syntax"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload in game"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

# Read content
$content = [System.IO.File]::ReadAllText($file)

# Write WITHOUT BOM using UTF8 encoding without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

attrib +R $file
Write-Host "Fixed encoding - removed BOM. /reload"

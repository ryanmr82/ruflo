$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Disable Shadow Resist [29] - set inUse = false
$content = $content -replace '(\[29\] = \{[\s\S]*?\["inUse"\] = )true', '${1}false'
Write-Host "Disabled Shadow Resist [29]"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

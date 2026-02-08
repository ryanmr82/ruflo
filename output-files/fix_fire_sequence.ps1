$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Change Fire Resist [35] sequence from 10 to 70
$content = $content -replace '(\[35\] = \{[\s\S]*?\["sequence"\] = )10(,|\s)', '${1}70${2}'
Write-Host "Changed Fire Resist sequence from 10 to 70"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

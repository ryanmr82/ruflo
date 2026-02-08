$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$content = [System.IO.File]::ReadAllText($file)

# Transportation category [9] sequence change
$old = @"
		[9] = {
			["sequence"] = 30,
"@

$new = @"
		[9] = {
			["sequence"] = 20,
"@

$content = $content.Replace($old, $new)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

Write-Host "Transportation sequence changed from 30 to 20"

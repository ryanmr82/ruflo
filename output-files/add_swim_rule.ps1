$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$old = @'
			["sequence"] = 5,
			["inUse"] = true,
		},
		[6] = {
'@

$new = @'
			["sequence"] = 5,
			["inUse"] = true,
			["rule"] = "Name(\"Ocean's Gaze\", \"Ice Pearl of Kaneq'nuun\", \"Rethress Tide Crest\")",
		},
		[6] = {
'@

$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Swim Speed rule added"

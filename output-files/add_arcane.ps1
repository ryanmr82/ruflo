$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Insert Arcane Resist [37] after Fire Resist [35]
$oldPattern = '(\["inUse"\] = true,\s*\["sequence"\] = 70,\s*\},\s*)(\["ClassItems"\])'
$newContent = '["inUse"] = true,
			["sequence"] = 70,
		},
		[37] = {
			["name"] = "Arcane Resist",
			["list"] = {
			},
			["inUse"] = true,
			["rule"] = "Tooltip(\"Arcane Resistance\")",
			["sequence"] = 70,
		},
		["ClassItems"]'

$content = $content -replace $oldPattern, $newContent
Write-Host "Added Arcane Resist [37]"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

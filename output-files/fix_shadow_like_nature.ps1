$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Replace Shadow Resist [29] with structure EXACTLY like Nature Resist [34]
$oldShadow = '\[29\] = \{[^}]*\["name"\] = "Shadow Resist"[^}]*\["rule"\] = "Tooltip\(\\"Shadow Resistance\\"\)"[^}]*\},'

$newShadow = @'
[29] = {
			["name"] = "Shadow Resist",
			["list"] = {
				[1] = 20548,
				[2] = 14478,
				[3] = 20546,
				[4] = 18340,
				[5] = 10504,
				[6] = 17061,
				[7] = 12605,
				[8] = 22638,
				[9] = 18730,
			},
			["dateModified"] = 1761137575,
			["inUse"] = true,
			["sequence"] = 70,
			["rule"] = "Tooltip(\"Shadow Resistance\")",
		},
'@

$content = $content -replace $oldShadow, $newShadow
Write-Host "Fixed Shadow Resist to match Nature Resist structure"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

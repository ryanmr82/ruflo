$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Nature Resist [34] structure (the working one):
# ["name"], ["list"] with items, ["dateModified"], ["inUse"] = true, ["sequence"] = 70, ["rule"]

# Fix Shadow Resist [29] - match Nature Resist structure exactly
$content = $content -replace '\[29\] = \{\s*\["name"\] = "Shadow Resist",\s*\["list"\] = \{\s*\},\s*\["dateModified"\] = \d+,\s*\["sequence"\] = 70,\s*\["inUse"\] = false,\s*\["rule"\] = "Tooltip\(\\"Shadow Resistance\\"\)",\s*\},', '[29] = {
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
		},'
Write-Host "Fixed Shadow Resist [29]"

# Fix Frost Resist [33] - ensure same structure as Nature
$content = $content -replace '\[33\] = \{\s*\["name"\] = "Frost Resist",\s*\["list"\] = \{[^}]*\},\s*\["dateModified"\] = \d+,\s*\["sequence"\] = 70,\s*\["inUse"\] = true,\s*\["rule"\] = "Tooltip\(\\"Frost Resistance\\"\)",\s*\},', '[33] = {
			["name"] = "Frost Resist",
			["list"] = {
				[1] = 13535,
				[2] = 12968,
				[3] = 14277,
				[4] = 11976,
			},
			["dateModified"] = 1761137567,
			["inUse"] = true,
			["sequence"] = 70,
			["rule"] = "Tooltip(\"Frost Resistance\")",
		},'
Write-Host "Fixed Frost Resist [33]"

# Fix Fire Resist [35] - ensure same structure as Nature
$content = $content -replace '\[35\] = \{\s*\["name"\] = "Fire Resist",\s*\["list"\] = \{[^}]*\},\s*\["dateModified"\] = \d+,\s*\["inUse"\] = true,\s*\["sequence"\] = 70,\s*\["rule"\] = "Tooltip\(\\"Fire Resistance\\"\)",\s*\},', '[35] = {
			["name"] = "Fire Resist",
			["list"] = {
				[1] = 13371,
				[2] = 12604,
				[3] = 12905,
			},
			["dateModified"] = 1761273282,
			["inUse"] = true,
			["sequence"] = 70,
			["rule"] = "Tooltip(\"Fire Resistance\")",
		},'
Write-Host "Fixed Fire Resist [35]"

# Fix Arcane Resist [37] - ensure same structure as Nature
$content = $content -replace '\[37\] = \{\s*\["name"\] = "Arcane Resist",\s*\["list"\] = \{[^}]*\},\s*\["inUse"\] = true,\s*\["rule"\] = "Tooltip\(\\"Arcane Resistance\\"\)",\s*\["sequence"\] = 70,\s*\},', '[37] = {
			["name"] = "Arcane Resist",
			["list"] = {
			},
			["dateModified"] = 1767769300,
			["inUse"] = true,
			["sequence"] = 70,
			["rule"] = "Tooltip(\"Arcane Resistance\")",
		},'
Write-Host "Fixed Arcane Resist [37]"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

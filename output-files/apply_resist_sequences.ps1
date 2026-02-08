$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Change Shadow Resist [29] sequence from 30 to 70
$content = $content -replace '(\[29\] = \{[\s\S]*?\["sequence"\] = )30(,|\s)', '${1}70${2}'
Write-Host "Changed Shadow Resist [29] sequence to 70"

# Change Frost Resist [33] sequence from 30 to 70
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )30(,|\s)', '${1}70${2}'
Write-Host "Changed Frost Resist [33] sequence to 70"

# Change Nature Resist [34] sequence from 30 to 70
$content = $content -replace '(\[34\] = \{[\s\S]*?\["sequence"\] = )30(,|\s)', '${1}70${2}'
Write-Host "Changed Nature Resist [34] sequence to 70"

# Change Fire Resist [35] sequence from 30 to 70
$content = $content -replace '(\[35\] = \{[\s\S]*?\["sequence"\] = )30(,|\s)', '${1}70${2}'
Write-Host "Changed Fire Resist [35] sequence to 70"

# Add Arcane Resist [37] after Fire Resist [35]
# Find the end of Fire Resist [35] entry and insert Arcane Resist after it
$fireResistEnd = '(\[35\] = \{[\s\S]*?\["sequence"\] = 70,[\s\n\t]*\},)'
$arcaneResist = @'
[35] = {
			["name"] = "Fire Resist",
			["list"] = {
				[1] = 13371,
				[2] = 12604,
				[3] = 12905,
			},
			["dateModified"] = 1761273282,
			["inUse"] = true,
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
'@

# Simpler approach - insert after Fire Resist closing bracket
$content = $content -replace '(\[35\] = \{[^}]+\["name"\] = "Fire Resist"[^}]+\["sequence"\] = 70,[^}]+\},)', @'
$1
		[37] = {
			["name"] = "Arcane Resist",
			["list"] = {
			},
			["inUse"] = true,
			["rule"] = "Tooltip(\"Arcane Resistance\")",
			["sequence"] = 70,
		},
'@
Write-Host "Added Arcane Resist [37] with sequence 70"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

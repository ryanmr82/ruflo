$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Add rule to Shadow Resist [29] and set inUse = true
$content = $content -replace '(\[29\] = \{[\s\S]*?\["sequence"\] = 70,\s*)\["inUse"\] = false,', '$1["inUse"] = true,
			["rule"] = "Tooltip(\"Shadow Resistance\")",'
Write-Host "Added rule to Shadow Resist [29]"

# Add rule to Frost Resist [33]
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = 70,\s*)\["inUse"\] = true,', '$1["inUse"] = true,
			["rule"] = "Tooltip(\"Frost Resistance\")",'
Write-Host "Added rule to Frost Resist [33]"

# Add rule to Nature Resist [34] - different field order
$content = $content -replace '(\[34\] = \{[\s\S]*?\["inUse"\] = true,\s*)\["sequence"\] = 70,', '$1["sequence"] = 70,
			["rule"] = "Tooltip(\"Nature Resistance\")",'
Write-Host "Added rule to Nature Resist [34]"

# Add rule to Fire Resist [35]
$content = $content -replace '(\[35\] = \{[\s\S]*?\["inUse"\] = true,\s*)\["sequence"\] = 70,', '$1["sequence"] = 70,
			["rule"] = "Tooltip(\"Fire Resistance\")",'
Write-Host "Added rule to Fire Resist [35]"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Remove read-only first so we can write
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

# Read content
$content = [System.IO.File]::ReadAllText($file)

# Add rule to Shadow Resist category [29] - find the category and add rule after name
$pattern29 = '(\[29\] = \{[\s\S]*?\["name"\] = "Shadow Resist",)'
$replacement29 = '$1
				["rule"] = "Tooltip(\"Shadow Resistance\")",'
$content = $content -replace $pattern29, $replacement29

# Add rule to Frost Resist category [33]
$pattern33 = '(\[33\] = \{[\s\S]*?\["name"\] = "Frost Resist",)'
$replacement33 = '$1
				["rule"] = "Tooltip(\"Frost Resistance\")",'
$content = $content -replace $pattern33, $replacement33

# Add rule to Nature Resist category [34]
$pattern34 = '(\[34\] = \{[\s\S]*?\["name"\] = "Nature Resist",)'
$replacement34 = '$1
				["rule"] = "Tooltip(\"Nature Resistance\")",'
$content = $content -replace $pattern34, $replacement34

# Add rule to Fire Resist category [35]
$pattern35 = '(\[35\] = \{[\s\S]*?\["name"\] = "Fire Resist",)'
$replacement35 = '$1
				["rule"] = "Tooltip(\"Fire Resistance\")",'
$content = $content -replace $pattern35, $replacement35

# Write content back
[System.IO.File]::WriteAllText($file, $content)

# IMMEDIATELY set to read-only so game cannot overwrite
Set-ItemProperty $file -Name IsReadOnly -Value $true

# Verify
$readonly = (Get-ItemProperty $file).IsReadOnly
$size = (Get-Item $file).Length
Write-Host "DONE! File is read-only: $readonly"
Write-Host "File size: $size bytes"

# Verify rules were added
$check = Get-Content $file -Raw
if ($check -match 'Tooltip\("Shadow Resistance"\)') { Write-Host "Shadow Resist rule: ADDED" } else { Write-Host "Shadow Resist rule: MISSING" }
if ($check -match 'Tooltip\("Frost Resistance"\)') { Write-Host "Frost Resist rule: ADDED" } else { Write-Host "Frost Resist rule: MISSING" }
if ($check -match 'Tooltip\("Nature Resistance"\)') { Write-Host "Nature Resist rule: ADDED" } else { Write-Host "Nature Resist rule: MISSING" }
if ($check -match 'Tooltip\("Fire Resistance"\)') { Write-Host "Fire Resist rule: ADDED" } else { Write-Host "Fire Resist rule: MISSING" }

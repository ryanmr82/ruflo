# Fix duplicate sequence entries in Fire Resist and remove group rules
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = Get-Content $file -Raw

# Remove the second sequence=30 entries that are overriding sequence=100
# These appear AFTER the list in resist categories
$content = $content -replace '(\[35\] = \{[^}]*\["list"\] = \{[^}]*\},)\s*\["sequence"\] = 30,', '$1'
$content = $content -replace '(\[34\] = \{[^}]*\["list"\] = \{[^}]*\},)\s*\["sequence"\] = 30,', '$1'
$content = $content -replace '(\[33\] = \{[^}]*\["list"\] = \{[^}]*\},)\s*\["sequence"\] = 30,', '$1'
$content = $content -replace '(\[29\] = \{[^}]*\["list"\] = \{[^}]*\},)\s*\["sequence"\] = 30,', '$1'

Write-Host "Removed duplicate sequence entries from resist categories"

# Remove group-level tooltip rules for Fire/Nature/Frost/Shadow Resist
$content = $content -replace '(\["name"\] = "Fire Resist",\s*\["groupId"\] = "[^"]+",)\s*\["rule"\] = "Tooltip\(\\"Fire Resistance\\"\)",', '$1'
$content = $content -replace '(\["name"\] = "Nature Resist",\s*\["groupId"\] = "[^"]+",)\s*\["rule"\] = "Tooltip\(\\"Nature Resistance\\"\)",', '$1'
$content = $content -replace '(\["name"\] = "Frost Resist",\s*\["groupId"\] = "[^"]+",)\s*\["rule"\] = "Tooltip\(\\"Frost Resistance\\"\)",', '$1'
$content = $content -replace '(\["name"\] = "Shadow Resist",\s*\["groupId"\] = "[^"]+",)\s*\["rule"\] = "Tooltip\(\\"Shadow Resistance\\"\)",', '$1'

Write-Host "Removed group-level tooltip rules"

[System.IO.File]::WriteAllText($file, $content)
attrib +R $file

Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

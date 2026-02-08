$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Set ALL our categories to very low sequences (5)
# Swim Speed [3]
$content = $content -replace '(\[3\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}5'
Write-Host "Swim Speed [3] -> sequence 5"

# Keys [36] 
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}5'
Write-Host "Keys [36] -> sequence 5"

# Frost Resist [33]
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}5'
Write-Host "Frost Resist [33] -> sequence 5"

# Arcane Resist [37]
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}5'
Write-Host "Arcane Resist [37] -> sequence 5"

# Transportation [9] - make it HIGHER so it's checked last
$content = $content -replace '(\[9\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}80'
Write-Host "Transportation [9] -> sequence 80"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host ""
Write-Host "Sequences fixed! Close WoW completely and restart."

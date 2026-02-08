$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Only fix the CATEGORY definitions (with tabs at start of line)
# These are the exact patterns for category definitions

# Frost Resist [33] - has name right after sequence
$content = $content -replace '(\t\t\[33\] = \{\s*\["sequence"\] = )\d+(,\s*\["name"\] = "Frost Resist")', '${1}10${2}'

# Arcane Resist [37] - has name right after sequence  
$content = $content -replace '(\t\t\[37\] = \{\s*\["sequence"\] = )\d+(,\s*\["name"\] = "Arcane Resist")', '${1}10${2}'

# Keys [36] - has list right after sequence
$content = $content -replace '(\t\t\[36\] = \{\s*\["sequence"\] = )\d+(,\s*\["list"\] = \{)', '${1}10${2}'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file

Write-Host "Fixed category sequences to 10"
Write-Host "Frost Resist [33], Arcane Resist [37], Keys [36]"

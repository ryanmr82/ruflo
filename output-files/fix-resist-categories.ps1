$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Remove read-only to edit
attrib -R $file

$content = [System.IO.File]::ReadAllText($file)

# Shadow Resist [29] - line 420-421
$content = $content.Replace('["rule"] = "Tooltip(\"Shadow Resistance\")",' + "`r`n" + '			["sequence"] = 30,', '["sequence"] = 20,')

# Arcane Resist [37] - line 451-453
$content = $content.Replace('["sequence"] = 30,' + "`r`n" + '			["dateModified"] = 1761400000,' + "`r`n" + '			["rule"] = "Tooltip(\"Arcane Resistance\")",', '["sequence"] = 20,' + "`r`n" + '			["dateModified"] = 1761400000,')

# Frost Resist [33] - line 646-647
$content = $content.Replace('["rule"] = "Tooltip(\"Frost Resistance\")",' + "`r`n" + '			["sequence"] = 30,', '["sequence"] = 20,')

# Fire Resist [35] - line 923-925
$content = $content.Replace('["sequence"] = 30,' + "`r`n" + '			["dateModified"] = 1761273282,' + "`r`n" + '			["rule"] = "Tooltip(\"Fire Resistance\")",', '["sequence"] = 20,' + "`r`n" + '			["dateModified"] = 1761273282,')

# Nature Resist [34] - line 1087-1089
$content = $content.Replace('["sequence"] = 30,' + "`r`n" + '			["dateModified"] = 1761297651,' + "`r`n" + '			["rule"] = "Tooltip(\"Nature Resistance\")",', '["sequence"] = 20,' + "`r`n" + '			["dateModified"] = 1761297651,')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

# Restore read-only
attrib +R $file

Write-Host "All 5 resist categories updated: sequence=20, tooltip rules removed"

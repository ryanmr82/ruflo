$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Add explicit Name rules to force-match items

# Keys [36] - add Name rule for specific items
$keysRule = 'Name("Mallet of Zul''Farrak", "Seal of Ascension", "Drakefire Amulet")'
if ($content -match '\[36\] = \{[^}]*\["rule"\]') {
    $content = $content -replace '(\[36\] = \{[^}]*\["rule"\] = )"[^"]*"', "`$1`"$keysRule`""
} else {
    $content = $content -replace '(\[36\] = \{[^}]*\["inUse"\] = true,)(\s*\},)', "`$1`n`t`t`t[`"rule`"] = `"$keysRule`",`$2"
}
Write-Host "Keys [36] rule added"

# Swim Speed [3] - add Name rule
$swimRule = 'Name("Ocean''s Gaze", "Ice Pearl of Kaneq''nuun", "Rethress Tide Crest")'
if ($content -match '\[3\] = \{[^}]*\["rule"\]') {
    $content = $content -replace '(\[3\] = \{[^}]*\["rule"\] = )"[^"]*"', "`$1`"$swimRule`""
} else {
    $content = $content -replace '(\[3\] = \{[^}]*\["inUse"\] = true,)(\s*\},)', "`$1`n`t`t`t[`"rule`"] = `"$swimRule`",`$2"
}
Write-Host "Swim Speed [3] rule added"

# Frost Resist [33] - update rule to include specific items
$frostRule = 'Tooltip("Frost Resistance") or Name("Frostweaver Cape", "Coldtouch Phantom Wraps", "Gaea''s Tunic of Frost Resistance", "Sardonyx Knuckle of Frost Resistance")'
$content = $content -replace '(\[33\] = \{[^}]*\["rule"\] = )"[^"]*"', "`$1`"$frostRule`""
Write-Host "Frost Resist [33] rule updated"

# Arcane Resist [37] - update rule to include specific items
$arcaneRule = 'Tooltip("Arcane Resistance") or Name("Peridot Circle of Arcane Resistance", "Sardonyx Knuckle of Arcane Resistance")'
$content = $content -replace '(\[37\] = \{[^}]*\["rule"\] = )"[^"]*"', "`$1`"$arcaneRule`""
Write-Host "Arcane Resist [37] rule updated"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Done. /reload"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Update Frost Resist rule
$content = $content -replace '\["rule"\] = "Tooltip\(\\"Frost Resistance\\"\)"', '["rule"] = "Tooltip(\"Frost Resistance\") or Name(\"Frostweaver Cape\", \"Coldtouch Phantom Wraps\", \"Gaea''s Tunic of Frost Resistance\", \"Sardonyx Knuckle of Frost Resistance\")"'
Write-Host "Frost rule updated"

# Update Arcane Resist rule  
$content = $content -replace '\["rule"\] = "Tooltip\(\\"Arcane Resistance\\"\)"', '["rule"] = "Tooltip(\"Arcane Resistance\") or Name(\"Peridot Circle of Arcane Resistance\", \"Sardonyx Knuckle of Arcane Resistance\")"'
Write-Host "Arcane rule updated"

# Add Keys rule (after name = "Keys")
$content = $content -replace '(\["name"\] = "Keys",\s*\},)', '["name"] = "Keys",' + "`n" + '			["rule"] = "Name(\"Mallet of Zul''Farrak\", \"Seal of Ascension\", \"Drakefire Amulet\")",' + "`n" + '		},'
Write-Host "Keys rule added"

# Add Swim Speed rule (after inUse in [3])
$content = $content -replace '(\[3\] = \{[^}]*\["inUse"\] = true,)(\s*\},)', '$1' + "`n" + '			["rule"] = "Name(\"Ocean''s Gaze\", \"Ice Pearl of Kaneq''nuun\", \"Rethress Tide Crest\")",$2'
Write-Host "Swim Speed rule added"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Done. /reload"

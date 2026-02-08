# Add Arcane Resist category - simpler approach
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

$lines = Get-Content $file
$newLines = @()
$foundNatureResist = $false
$insertAfterNext = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]

    # Find the Nature Resistance rule line
    if ($lines[$i] -match 'Tooltip\(\\"Nature Resistance\\"\)') {
        $foundNatureResist = $true
        Write-Host "Found Nature Resistance rule at line $($i+1)"
    }

    # After finding Nature Resist, look for the closing },
    if ($foundNatureResist -and $lines[$i] -match '^\t\t\},\s*$') {
        # This closes the [34] Nature Resist block
        # Add Arcane Resist after it
        $newLines += '		[37] = {'
        $newLines += '			["sequence"] = 100,'
        $newLines += '			["name"] = "Arcane Resist",'
        $newLines += '			["list"] = {'
        $newLines += '			},'
        $newLines += '			["dateModified"] = 1767769300,'
        $newLines += '			["rule"] = "Tooltip(\"Arcane Resistance\")",'
        $newLines += '			["inUse"] = true,'
        $newLines += '		},'
        Write-Host "Inserted Arcane Resist category after line $($i+1)"
        $foundNatureResist = $false  # Reset so we don't insert again
        break
    }
}

# Write rest of file
for ($j = $i + 1; $j -lt $lines.Count; $j++) {
    $newLines += $lines[$j]
}

# Force write
attrib -R $file
[System.IO.File]::WriteAllLines($file, $newLines)
attrib +R $file
Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

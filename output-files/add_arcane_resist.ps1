# Add Arcane Resist category - force write through read-only
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

$lines = Get-Content $file
$newLines = @()
$inserted = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    # Check if this line closes the categories section after Nature Resist
    if (-not $inserted -and $i -gt 0) {
        # Look for the pattern: previous line has ["inUse"] = true, for Nature Resist
        # and current line is just },
        if ($lines[$i] -match '^\s*\},\s*$' -and $lines[$i-1] -match '\["inUse"\] = true,' -and $lines[$i-2] -match 'Nature Resistance') {
            # Insert Arcane Resist before closing brace
            $newLines += '		[37] = {'
            $newLines += '			["sequence"] = 100,'
            $newLines += '			["name"] = "Arcane Resist",'
            $newLines += '			["list"] = {'
            $newLines += '			},'
            $newLines += '			["dateModified"] = 1767769300,'
            $newLines += '			["rule"] = "Tooltip(\"Arcane Resistance\")",'
            $newLines += '			["inUse"] = true,'
            $newLines += '		},'
            $inserted = $true
            Write-Host "Inserted Arcane Resist category [37] at line $($i+1)"
        }
    }
    $newLines += $lines[$i]
}

if (-not $inserted) {
    Write-Host "Could not find insertion point - checking if already exists"
    if ($lines -match '"Arcane Resist"') {
        Write-Host "Arcane Resist already exists"
    }
} else {
    # Force write - remove readonly, write, set readonly in one go
    attrib -R $file
    [System.IO.File]::WriteAllLines($file, $newLines)
    attrib +R $file
    Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"
}

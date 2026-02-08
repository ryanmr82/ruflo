$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

# Read file
$lines = Get-Content $file

# Find and modify Keys section
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\["name"\] = "Keys",$') {
        # Insert rule after this line
        $before = $lines[0..$i]
        $after = $lines[($i+1)..($lines.Count-1)]
        $newLine = '			["rule"] = "Name(\"Mallet of Zul''Farrak\", \"Seal of Ascension\", \"Drakefire Amulet\")",'
        $lines = $before + $newLine + $after
        Write-Host "Keys rule inserted at line $($i+1)"
        break
    }
}

# Find and modify Swim Speed section
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\["name"\] = "Swim Speed Gear",$') {
        # Find the inUse line after this
        for ($j = $i; $j -lt [Math]::Min($i+15, $lines.Count); $j++) {
            if ($lines[$j] -match '^\s*\["inUse"\] = true,$') {
                # Insert rule after inUse
                $before = $lines[0..$j]
                $after = $lines[($j+1)..($lines.Count-1)]
                $newLine = '			["rule"] = "Name(\"Ocean''s Gaze\", \"Ice Pearl of Kaneq''nuun\", \"Rethress Tide Crest\")",'
                $lines = $before + $newLine + $after
                Write-Host "Swim Speed rule inserted at line $($j+1)"
                break
            }
        }
        break
    }
}

# Write file
$lines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Done. /reload"

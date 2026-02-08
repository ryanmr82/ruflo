$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$lines = Get-Content $file
$newLines = @()

$inKeys = $false
$inSwim = $false
$inFrost = $false
$inArcane = $false
$keysRuleAdded = $false
$swimRuleAdded = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Track which category we're in
    if ($line -match '^\s*\[36\] = \{') { $inKeys = $true; $keysRuleAdded = $false }
    if ($line -match '^\s*\[3\] = \{') { $inSwim = $true; $swimRuleAdded = $false }
    if ($line -match '^\s*\[33\] = \{') { $inFrost = $true }
    if ($line -match '^\s*\[37\] = \{') { $inArcane = $true }
    
    # Update Frost Resist rule
    if ($inFrost -and $line -match '\["rule"\]') {
        $line = '			["rule"] = "Tooltip(\"Frost Resistance\") or Name(\"Frostweaver Cape\", \"Coldtouch Phantom Wraps\", \"Gaea''s Tunic of Frost Resistance\", \"Sardonyx Knuckle of Frost Resistance\")",'
        $inFrost = $false
        Write-Host "Frost rule updated"
    }
    
    # Update Arcane Resist rule
    if ($inArcane -and $line -match '\["rule"\]') {
        $line = '			["rule"] = "Tooltip(\"Arcane Resistance\") or Name(\"Peridot Circle of Arcane Resistance\", \"Sardonyx Knuckle of Arcane Resistance\")",'
        $inArcane = $false
        Write-Host "Arcane rule updated"
    }
    
    # Add Keys rule before closing brace
    if ($inKeys -and -not $keysRuleAdded -and $line -match '^\s*\["name"\] = "Keys"') {
        $newLines += $line
        $newLines += '			["rule"] = "Name(\"Mallet of Zul''Farrak\", \"Seal of Ascension\", \"Drakefire Amulet\")",'
        $keysRuleAdded = $true
        $inKeys = $false
        Write-Host "Keys rule added"
        continue
    }
    
    # Add Swim rule before closing brace  
    if ($inSwim -and -not $swimRuleAdded -and $line -match '^\s*\["inUse"\] = true,') {
        $newLines += $line
        $newLines += '			["rule"] = "Name(\"Ocean''s Gaze\", \"Ice Pearl of Kaneq''nuun\", \"Rethress Tide Crest\")",'
        $swimRuleAdded = $true
        $inSwim = $false
        Write-Host "Swim rule added"
        continue
    }
    
    # End of category
    if ($line -match '^\s*\},\s*$') {
        $inKeys = $false
        $inSwim = $false
        $inFrost = $false
        $inArcane = $false
    }
    
    $newLines += $line
}

$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Done. /reload"

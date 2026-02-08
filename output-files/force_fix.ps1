$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$lines = Get-Content $file

$newLines = @()
$inFrostResist = $false
$inArcaneResist = $false
$inKeys = $false

foreach ($line in $lines) {
    $modLine = $line
    
    # Detect category starts
    if ($line -match '^\s*\[33\] = \{') { $inFrostResist = $true }
    if ($line -match '^\s*\[37\] = \{') { $inArcaneResist = $true }
    if ($line -match '^\s*\[36\] = \{') { $inKeys = $true }
    
    # Fix sequences to 10
    if ($inFrostResist -and $line -match '\["sequence"\] = \d+,') {
        $modLine = $line -replace '\["sequence"\] = \d+,', '["sequence"] = 10,'
        Write-Host "Frost Resist sequence -> 10"
    }
    if ($inArcaneResist -and $line -match '\["sequence"\] = \d+,') {
        $modLine = $line -replace '\["sequence"\] = \d+,', '["sequence"] = 10,'
        Write-Host "Arcane Resist sequence -> 10"
    }
    if ($inKeys -and $line -match '\["sequence"\] = \d+,') {
        $modLine = $line -replace '\["sequence"\] = \d+,', '["sequence"] = 10,'
        Write-Host "Keys sequence -> 10"
    }
    
    # Detect category ends
    if ($inFrostResist -and $line -match '^\s*\[34\] = \{') { $inFrostResist = $false }
    if ($inArcaneResist -and $line -match '^\s*\},\s*$' -and $inArcaneResist) { $inArcaneResist = $false }
    if ($inKeys -and $line -match '^\s*\["Openable"\]') { $inKeys = $false }
    
    $newLines += $modLine
}

$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Done! Sequences set to 10. /reload in-game"

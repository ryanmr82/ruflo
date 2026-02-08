$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$lines = Get-Content $file
$newLines = @()
$inMallet = $false
$malletFixed = 0

foreach ($line in $lines) {
    # Detect Mallet entry
    if ($line -match '"Mallet of Zul''Farrak"') {
        $inMallet = $true
    }
    
    # Fix category ID if we're in a Mallet entry
    if ($inMallet -and $line -match '\["bagshuiCategoryId"\]') {
        $line = $line -replace '\["bagshuiCategoryId"\] = "[^"]*"', '["bagshuiCategoryId"] = 36'
        $line = $line -replace '\["bagshuiCategoryId"\] = \d+', '["bagshuiCategoryId"] = 36'
        $malletFixed++
        $inMallet = $false
    }
    
    # End of item entry
    if ($inMallet -and $line -match '^\s*\},\s*$') {
        $inMallet = $false
    }
    
    $newLines += $line
}

$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file
Write-Host "Fixed $malletFixed Mallet entries to Keys (36)"

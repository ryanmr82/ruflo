# Verify all sequences
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== CATEGORY SEQUENCES ==="

$cats = @{9="Transportation"; 29="Shadow Resist"; 33="Frost Resist"; 34="Nature Resist"; 35="Fire Resist"}

foreach ($catNum in $cats.Keys | Sort-Object) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*\[$catNum\] = \{") {
            $seq = "NOT SET"
            for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
                if ($lines[$j] -match '\["sequence"\] = (\d+)') {
                    $seq = $matches[1]
                    break
                }
                if ($lines[$j] -match '^\s*\},?\s*$') { break }
            }
            Write-Host "Category $catNum ($($cats[$catNum])): Sequence = $seq"
            break
        }
    }
}

# Check Keys (KeyAndKeyLike)
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["KeyAndKeyLike"\] = \{') {
        for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
            if ($lines[$j] -match '\["sequence"\] = (\d+)') {
                Write-Host "Category KeyAndKeyLike (Keys): Sequence = $($matches[1])"
                break
            }
        }
        break
    }
}

Write-Host ""
Write-Host "File is READ-ONLY: $((Get-ItemProperty $file).IsReadOnly)"

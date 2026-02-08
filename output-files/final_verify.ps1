# Final verification of all resist categories
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

$categories = @(29, 33, 34, 35)
$names = @{29="Shadow"; 33="Frost"; 34="Nature"; 35="Fire"}

Write-Host "=== RESIST CATEGORY RULES ==="
foreach ($cat in $categories) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*\[$cat\] = \{") {
            Write-Host ""
            Write-Host "Category $cat ($($names[$cat]) Resist):"
            for ($j = $i; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
                Write-Host "  $($lines[$j])"
            }
            break
        }
    }
}

Write-Host ""
Write-Host "=== RESIST GROUPS ==="
$groupNames = @("Shadow Resist", "Frost Resist", "Nature Resist", "Fire Resist")
foreach ($gn in $groupNames) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '\["categories"\] = \{') {
            for ($j = $i + 1; $j -lt [Math]::Min($i + 6, $lines.Count); $j++) {
                if ($lines[$j] -match """$gn""") {
                    Write-Host ""
                    Write-Host "$gn Group:"
                    for ($k = $i; $k -lt [Math]::Min($i + 6, $lines.Count); $k++) {
                        Write-Host "  $($lines[$k])"
                    }
                    break
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=== FILE STATUS ==="
Write-Host "Read-Only: $((Get-ItemProperty $file).IsReadOnly)"

# Verify the fixes
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== CATEGORY 29 (Shadow Resist) ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[29\] = \{$') {
        for ($j = $i; $j -lt [Math]::Min($i + 8, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
        }
        break
    }
}

Write-Host ""
Write-Host "=== SHADOW RESIST GROUP ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["categories"\] = \{' -and $i + 3 -lt $lines.Count) {
        if ($lines[$i + 3] -match '"Shadow Resist"' -or $lines[$i + 2] -match '"Shadow Resist"') {
            for ($j = [Math]::Max(0, $i-1); $j -lt [Math]::Min($i + 8, $lines.Count); $j++) {
                Write-Host "$($j+1): $($lines[$j])"
            }
            break
        }
    }
}

Write-Host ""
Write-Host "=== FILE STATUS ==="
Write-Host "Read-Only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host "Size: $((Get-Item $file).Length) bytes"

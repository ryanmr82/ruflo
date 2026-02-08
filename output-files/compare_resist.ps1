# Compare Fire Resist vs Nature Resist categories
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== FIRE RESIST [35] ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[35\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+25, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i) { break }
        }
        break
    }
}

Write-Host ""
Write-Host "=== NATURE RESIST [34] ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[34\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+25, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i) { break }
        }
        break
    }
}

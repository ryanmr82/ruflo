# Check Keys category list and find item 12344 (Seal of Ascension)
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== KEYS CATEGORY (KeyAndKeyLike) ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["KeyAndKeyLike"\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i + 30, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i + 2) { break }
        }
        break
    }
}

Write-Host ""
Write-Host "=== SEARCHING FOR ITEM 12344 (Seal of Ascension) IN CATEGORY LISTS ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '= 12344,?\s*$') {
        Write-Host ""
        Write-Host "Found at line $($i+1):"
        for ($j = [Math]::Max(0, $i-10); $j -lt [Math]::Min($i+3, $lines.Count); $j++) {
            $marker = if ($j -eq $i) { ">>>" } else { "   " }
            Write-Host "$marker $($j+1): $($lines[$j])"
        }
    }
}

Write-Host ""
Write-Host "=== FIRE RESIST CATEGORY [35] ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[35\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i + 20, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i + 2) { break }
        }
        break
    }
}

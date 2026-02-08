# Compare Alt Keys vs KeyAndKeyLike - why one works and other doesn't
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue
$lines = Get-Content $file

Write-Host "=== ALT KEYS (Category 2) - FULL DEFINITION ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[2\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+20, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i) { break }
        }
        break
    }
}

Write-Host ""
Write-Host "=== KEYANDKEYLIKE - FULL DEFINITION ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["KeyAndKeyLike"\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+25, $lines.Count); $j++) {
            Write-Host "$($j+1): $($lines[$j])"
            if ($lines[$j] -match '^\s*\},\s*$' -and $j -gt $i) { break }
        }
        break
    }
}

Write-Host ""
Write-Host "=== GROUPS CONTAINING CATEGORY 2 OR KEYANDKEYLIKE ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["categories"\] = \{') {
        $hasAltKeys = $false
        $hasKeyAndKeyLike = $false
        $groupName = ""
        for ($j = $i+1; $j -lt [Math]::Min($i+10, $lines.Count); $j++) {
            if ($lines[$j] -match '= 2,') { $hasAltKeys = $true }
            if ($lines[$j] -match '"KeyAndKeyLike"') { $hasKeyAndKeyLike = $true }
            if ($lines[$j] -match '\["name"\] = "([^"]+)"') { $groupName = $matches[1] }
        }
        if ($hasAltKeys -or $hasKeyAndKeyLike) {
            Write-Host ""
            Write-Host "Group '$groupName' at line $($i+1):"
            Write-Host "  Has Alt Keys (2): $hasAltKeys"
            Write-Host "  Has KeyAndKeyLike: $hasKeyAndKeyLike"
            for ($j = $i; $j -lt [Math]::Min($i+8, $lines.Count); $j++) {
                Write-Host "    $($lines[$j])"
            }
        }
    }
}

Set-ItemProperty $file -Name IsReadOnly -Value $true

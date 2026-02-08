# Full verification
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== CATEGORY SEQUENCES ==="
$cats = @(2, 9, 29, 33, 34, 35)
foreach ($cat in $cats) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*\[$cat\] = \{") {
            $name = ""; $seq = "NOT SET"
            for ($j = $i+1; $j -lt [Math]::Min($i+15, $lines.Count); $j++) {
                if ($lines[$j] -match '\["name"\] = "([^"]+)"') { $name = $matches[1] }
                if ($lines[$j] -match '\["sequence"\] = (\d+)') { $seq = $matches[1] }
                if ($lines[$j] -match '^\s*\},') { break }
            }
            Write-Host "Cat $cat ($name): seq=$seq"
            break
        }
    }
}

Write-Host ""
Write-Host "=== KEYANDKEYLIKE ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["KeyAndKeyLike"\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+8, $lines.Count); $j++) {
            Write-Host "$($lines[$j])"
        }
        break
    }
}

Write-Host ""
Write-Host "=== ITEMS IN ALT KEYS (Cat 2) LIST ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[2\] = \{') {
        for ($j = $i; $j -lt [Math]::Min($i+15, $lines.Count); $j++) {
            Write-Host "$($lines[$j])"
            if ($lines[$j] -match '^\s*\},') { break }
        }
        break
    }
}

Write-Host ""
Write-Host "Read-only: $((Get-ItemProperty $file).IsReadOnly)"

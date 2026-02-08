# Check if category 2 (Alt Keys) is assigned to any group
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== SEARCHING FOR CATEGORY 2 IN GROUP ASSIGNMENTS ==="

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\["categories"\] = \{') {
        # Check next few lines for category 2
        for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
            if ($lines[$j] -match '= 2,?\s*$' -or $lines[$j] -match '\[.\] = 2,') {
                Write-Host ""
                Write-Host "Found category 2 in group at line $($i+1):"
                for ($k = $i; $k -lt [Math]::Min($i + 12, $lines.Count); $k++) {
                    Write-Host "  $($k+1): $($lines[$k])"
                }
                break
            }
            if ($lines[$j] -match '^\s*\},') { break }
        }
    }
}

Write-Host ""
Write-Host "=== KEYS GROUP ASSIGNMENTS (KeyAndKeyLike) ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '"KeyAndKeyLike"') {
        Write-Host ""
        Write-Host "Found at line $($i+1):"
        for ($k = [Math]::Max(0,$i-5); $k -lt [Math]::Min($i + 5, $lines.Count); $k++) {
            $marker = if ($k -eq $i) { ">>>" } else { "   " }
            Write-Host "$marker $($k+1): $($lines[$k])"
        }
    }
}

# Find Keys and Transportation categories
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$lines = Get-Content $file

Write-Host "=== SEARCHING FOR KEYS AND TRANSPORTATION ==="

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '"Keys"' -or $lines[$i] -match '"Transportation"') {
        Write-Host ""
        Write-Host "Found at line $($i+1):"
        for ($j = [Math]::Max(0, $i-5); $j -lt [Math]::Min($i+10, $lines.Count); $j++) {
            $marker = if ($j -eq $i) { ">>>" } else { "   " }
            Write-Host "$marker $($j+1): $($lines[$j])"
        }
    }
}

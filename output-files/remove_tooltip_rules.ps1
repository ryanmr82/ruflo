# Remove Tooltip rules from resist categories so manual assignments work
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

$lines = Get-Content $file
$newLines = @()

$removedCount = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    # Skip lines with resist tooltip rules
    if ($lines[$i] -match '\["rule"\].*Tooltip\("(Shadow|Frost|Nature|Fire) Resistance"\)') {
        Write-Host "Removing line $($i+1): $($lines[$i].Trim())"
        $removedCount++
        continue
    }
    $newLines += $lines[$i]
}

if ($removedCount -gt 0) {
    [System.IO.File]::WriteAllLines($file, $newLines)
    Write-Host ""
    Write-Host "Removed $removedCount tooltip rules"
    Write-Host "File size: $((Get-Item $file).Length) bytes"
} else {
    Write-Host "No tooltip rules found to remove"
}

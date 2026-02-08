# Find the Shadow Resist GROUP (not category) - groups have "categories" property
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$lines = Get-Content $file
$lineNum = 0

Write-Host "=== SEARCHING FOR SHADOW RESIST GROUP (has 'categories' property) ==="

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '"Shadow Resist"' -or $lines[$i] -match "'Shadow Resist'") {
        # Check if this is a GROUP by looking for "categories" nearby
        $isGroup = $false
        for ($j = [Math]::Max(0, $i-10); $j -lt [Math]::Min($lines.Count, $i+10); $j++) {
            if ($lines[$j] -match '\["categories"\]') {
                $isGroup = $true
                break
            }
        }

        if ($isGroup) {
            Write-Host ""
            Write-Host "=== FOUND GROUP at line $($i+1) ==="
            for ($k = [Math]::Max(0, $i-5); $k -lt [Math]::Min($lines.Count, $i+15); $k++) {
                $marker = if ($k -eq $i) { ">>>" } else { "   " }
                Write-Host "$marker $($k+1): $($lines[$k])"
            }
        }
    }
}

# Also check if the file has the tooltip rules by reading raw bytes
Write-Host ""
Write-Host "=== CHECKING FOR TOOLTIP RULES (raw) ==="
$rawContent = [System.IO.File]::ReadAllText($file)
if ($rawContent.Contains('Tooltip("Shadow Resistance")')) {
    Write-Host "Shadow Resist tooltip rule: FOUND"
} else {
    Write-Host "Shadow Resist tooltip rule: NOT FOUND"
}

# Set read-only
Set-ItemProperty $file -Name IsReadOnly -Value $true
Write-Host ""
Write-Host "File is READ-ONLY: $((Get-ItemProperty $file).IsReadOnly)"

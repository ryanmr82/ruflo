# Check all resist categories and Shadow Resist group
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$content = Get-Content $file -Raw

# Check each resist category for rules
Write-Host "=== RESIST CATEGORY RULES ==="
if ($content -match 'Tooltip\("Shadow Resistance"\)') { Write-Host "Category 29 (Shadow): HAS RULE" } else { Write-Host "Category 29 (Shadow): NO RULE" }
if ($content -match 'Tooltip\("Frost Resistance"\)') { Write-Host "Category 33 (Frost): HAS RULE" } else { Write-Host "Category 33 (Frost): NO RULE" }
if ($content -match 'Tooltip\("Nature Resistance"\)') { Write-Host "Category 34 (Nature): HAS RULE" } else { Write-Host "Category 34 (Nature): NO RULE" }
if ($content -match 'Tooltip\("Fire Resistance"\)') { Write-Host "Category 35 (Fire): HAS RULE" } else { Write-Host "Category 35 (Fire): NO RULE" }

# Check Shadow Resist group assignment
Write-Host ""
Write-Host "=== SHADOW RESIST GROUP ASSIGNMENT ==="
$lines = Get-Content $file
$lineNum = 0
$foundGroup = $false
foreach ($line in $lines) {
    $lineNum++
    if ($line -match '"Shadow Resist"' -and $line -notmatch '\[29\]') {
        $foundGroup = $true
        Write-Host "Found Shadow Resist group at line $lineNum"
        # Print context
        for ($i = -5; $i -le 5; $i++) {
            $idx = $lineNum + $i - 1
            if ($idx -ge 0 -and $idx -lt $lines.Count) {
                $marker = if ($i -eq 0) { ">>>" } else { "   " }
                Write-Host "$marker $($idx+1): $($lines[$idx])"
            }
        }
        break
    }
}

# Now set file to read-only
Set-ItemProperty $file -Name IsReadOnly -Value $true
Write-Host ""
Write-Host "File set to READ-ONLY: $((Get-ItemProperty $file).IsReadOnly)"

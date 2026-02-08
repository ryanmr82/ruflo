# Find the difference between Gemstone and Drakefire
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$content = Get-Content $file -Raw

# Item IDs
# Drakefire Amulet = 16309
# Gemstone of Ysera = 22631

Write-Host "=== CHECKING RESIST CATEGORY LISTS ==="

# Check Fire Resist (35) list for Drakefire (16309)
Write-Host ""
Write-Host "Fire Resist [35] list:"
if ($content -match '\[35\] = \{[^}]*\["list"\] = \{([^}]*)\}') {
    Write-Host $matches[1]
    if ($matches[1] -match '16309') {
        Write-Host ">>> DRAKEFIRE (16309) IS IN FIRE RESIST LIST <<<"
    }
}

# Check Nature Resist (34) list for Gemstone (22631)
Write-Host ""
Write-Host "Nature Resist [34] list:"
if ($content -match '\[34\] = \{[^}]*\["list"\] = \{([^}]*)\}') {
    Write-Host $matches[1]
    if ($matches[1] -match '22631') {
        Write-Host ">>> GEMSTONE (22631) IS IN NATURE RESIST LIST <<<"
    }
}

# Check ALL categories for these items
Write-Host ""
Write-Host "=== ALL CATEGORIES CONTAINING 16309 (Drakefire) ==="
$lines = Get-Content $file
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '= 16309,') {
        for ($j = $i; $j -gt [Math]::Max(0, $i-20); $j--) {
            if ($lines[$j] -match '\[(\d+)\] = \{' -or $lines[$j] -match '\["(\w+)"\] = \{') {
                Write-Host "  Found in category: $($matches[1]) at line $($i+1)"
                break
            }
        }
    }
}

Write-Host ""
Write-Host "=== ALL CATEGORIES CONTAINING 22631 (Gemstone) ==="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '= 22631,') {
        for ($j = $i; $j -gt [Math]::Max(0, $i-20); $j--) {
            if ($lines[$j] -match '\[(\d+)\] = \{' -or $lines[$j] -match '\["(\w+)"\] = \{') {
                Write-Host "  Found in category: $($matches[1]) at line $($i+1)"
                break
            }
        }
    }
}

Set-ItemProperty $file -Name IsReadOnly -Value $true

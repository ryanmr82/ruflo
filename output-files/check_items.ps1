# Check item assignments
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$content = Get-Content $file -Raw

$items = @("Gemstone of Ysera", "Drakefire Amulet", "Seal of Ascension", "Frost Wolf Insignia")

foreach ($item in $items) {
    Write-Host "=== $item ==="
    if ($content -match "(?s)\[""name""\] = ""$item"".*?\[""bagshuiCategoryId""\] = ([^,]+),") {
        Write-Host "  bagshuiCategoryId: $($matches[1])"
    }
    if ($content -match "(?s)\[""bagshuiCategoryId""\] = ([^,]+),.*?\[""name""\] = ""$item""") {
        Write-Host "  bagshuiCategoryId: $($matches[1])"
    }
}

# Check which lists contain these item IDs
Write-Host ""
Write-Host "=== ITEM IDS ==="
# Gemstone of Ysera = 22631
# Drakefire Amulet = 16309
# Seal of Ascension = 12344

$itemIds = @{
    "16309" = "Drakefire Amulet"
    "12344" = "Seal of Ascension"
    "22631" = "Gemstone of Ysera"
}

foreach ($id in $itemIds.Keys) {
    Write-Host ""
    Write-Host "Item $id ($($itemIds[$id])) found in categories:"
    $lines = Get-Content $file
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "= $id,") {
            # Look backwards for category name
            for ($j = $i; $j -gt [Math]::Max(0, $i-20); $j--) {
                if ($lines[$j] -match '\["name"\] = "([^"]+)"') {
                    Write-Host "  - $($matches[1]) (line $($i+1))"
                    break
                }
                if ($lines[$j] -match '^\s*\[(\d+)\] = \{' -or $lines[$j] -match '^\s*\["(\w+)"\] = \{') {
                    Write-Host "  - Category $($matches[1]) (line $($i+1))"
                    break
                }
            }
        }
    }
}

Set-ItemProperty $file -Name IsReadOnly -Value $true

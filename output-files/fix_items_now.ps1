# Fix bagshuiCategoryId for specific items
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$lines = Get-Content $file

# Items to fix - set them to category 2 (Alt Keys)
$itemsToFix = @("Drakefire Amulet", "Seal of Ascension")

for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($itemName in $itemsToFix) {
        if ($lines[$i] -match "\[""name""\] = ""$itemName""") {
            Write-Host "Found $itemName at line $($i+1)"
            # Search nearby for bagshuiCategoryId
            for ($j = [Math]::Max(0, $i-30); $j -lt [Math]::Min($i+30, $lines.Count); $j++) {
                if ($lines[$j] -match '\["bagshuiCategoryId"\] = ') {
                    $oldLine = $lines[$j]
                    $lines[$j] = $lines[$j] -replace '\["bagshuiCategoryId"\] = [^,]+,', '["bagshuiCategoryId"] = 2,'
                    if ($oldLine -ne $lines[$j]) {
                        Write-Host "  Changed line $($j+1): $($oldLine.Trim()) -> $($lines[$j].Trim())"
                    }
                    break
                }
            }
        }
    }
}

[System.IO.File]::WriteAllLines($file, $lines)
Set-ItemProperty $file -Name IsReadOnly -Value $true

Write-Host ""
Write-Host "Done. File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

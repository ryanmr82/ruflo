# COMPLETE FIX - sequences, lists, and item categoryIds
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Remove read-only
attrib -R $file

$content = Get-Content $file -Raw

# 1. Add sequence=100 to resist categories (29, 33, 34, 35)
$resistCats = @(29, 33, 34, 35)
foreach ($cat in $resistCats) {
    # Add sequence after the opening bracket if not present
    if ($content -match "\[$cat\] = \{[^}]*\[""sequence""\]") {
        Write-Host "Cat $cat already has sequence"
    } else {
        $content = $content -replace "(\[$cat\] = \{[\r\n\s]+)", "`$1[""sequence""] = 100,`n`t`t`t"
        Write-Host "Added sequence=100 to cat $cat"
    }
}

# 2. Add items to Alt Keys (cat 2) list: 16309 (Drakefire), 12344 (Seal), 22631 (Gemstone)
# First check what's in the list
if ($content -match '\[2\] = \{[^}]*\["list"\] = \{([^}]*)\}') {
    $listContent = $matches[1]
    Write-Host "Current Alt Keys list: $listContent"

    # Add missing items
    $itemsToAdd = @(12344, 22631)  # Seal of Ascension, Gemstone of Ysera
    foreach ($itemId in $itemsToAdd) {
        if ($listContent -notmatch "= $itemId,") {
            # Find the list and add item
            $content = $content -replace '(\[2\] = \{[^}]*\["list"\] = \{[^}]*)(},)', "`$1[99] = $itemId,`n`t`t`t`t`$2"
            Write-Host "Added item $itemId to Alt Keys list"
        }
    }
}

# 3. Fix bagshuiCategoryId for specific items
$content = $content -replace '(\["name"\] = "Seal of Ascension"[^}]*\["bagshuiCategoryId"\] = )[^,]+,', '$12,'
$content = $content -replace '(\["name"\] = "Drakefire Amulet"[^}]*\["bagshuiCategoryId"\] = )[^,]+,', '$12,'
$content = $content -replace '(\["name"\] = "Gemstone of Ysera"[^}]*\["bagshuiCategoryId"\] = )[^,]+,', '$12,'

Write-Host "Fixed bagshuiCategoryId for key items"

# Write file
[System.IO.File]::WriteAllText($file, $content)

# Set read-only IMMEDIATELY
attrib +R $file

Write-Host ""
Write-Host "Done! Read-only: $((Get-ItemProperty $file).IsReadOnly)"

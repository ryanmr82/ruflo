# Fix Alt Keys category - add inUse and fix list
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$lines = Get-Content $file

# Find Alt Keys (category 2) and fix it
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[2\] = \{') {
        Write-Host "Found Alt Keys at line $($i+1)"

        # Find the end of the list and category
        $listStart = -1
        $listEnd = -1
        $catEnd = -1
        $hasInUse = $false
        $items = @()

        for ($j = $i+1; $j -lt [Math]::Min($i+30, $lines.Count); $j++) {
            if ($lines[$j] -match '\["list"\] = \{') { $listStart = $j }
            if ($listStart -gt 0 -and $lines[$j] -match '= (\d+),') {
                $items += $matches[1]
            }
            if ($listStart -gt 0 -and $listEnd -eq -1 -and $lines[$j] -match '^\s*\},?\s*$') {
                $listEnd = $j
            }
            if ($lines[$j] -match '\["inUse"\]') { $hasInUse = $true }
            if ($listEnd -gt 0 -and $lines[$j] -match '^\s*\},\s*$') {
                $catEnd = $j
                break
            }
        }

        Write-Host "  List items found: $($items -join ', ')"
        Write-Host "  Has inUse: $hasInUse"

        # Rebuild the category properly
        $indent = "`t`t"
        $listIndent = "`t`t`t`t"

        # Get unique items including the ones we want
        $allItems = @(16309, 50545, 12344, 22631) | Select-Object -Unique

        $newCat = @()
        $newCat += "$indent[2] = {"
        $newCat += "$indent`t[""sequence""] = 30,"
        $newCat += "$indent`t[""list""] = {"
        $idx = 1
        foreach ($item in $allItems) {
            $newCat += "$listIndent[$idx] = $item,"
            $idx++
        }
        $newCat += "$indent`t},"
        $newCat += "$indent`t[""nameSort""] = """","
        $newCat += "$indent`t[""dateModified""] = $([int](Get-Date -UFormat %s)),"
        $newCat += "$indent`t[""inUse""] = true,"
        $newCat += "$indent`t[""name""] = ""Alt Keys"","
        $newCat += "$indent},"

        # Replace old category with new
        $newLines = @()
        for ($k = 0; $k -lt $i; $k++) { $newLines += $lines[$k] }
        $newLines += $newCat
        for ($k = $catEnd + 1; $k -lt $lines.Count; $k++) { $newLines += $lines[$k] }

        $lines = $newLines
        Write-Host "  Rebuilt Alt Keys category with inUse=true and proper list"
        break
    }
}

[System.IO.File]::WriteAllLines($file, $lines)
attrib +R $file

Write-Host ""
Write-Host "Done! Read-only: $((Get-ItemProperty $file).IsReadOnly)"

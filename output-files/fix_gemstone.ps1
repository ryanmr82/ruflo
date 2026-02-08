# Fix Gemstone of Ysera
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = Get-Content $file -Raw

# Fix Gemstone - change categoryId to 2 and groupId to 5:6
# Find by name and fix nearby values
$content = $content -replace '(\["name"\] = "Gemstone of Ysera"[^}]*\["bagshuiCategoryId"\] = )\d+,', '${1}2,'
$content = $content -replace '(\["bagshuiCategoryId"\] = \d+,[^}]*\["name"\] = "Gemstone of Ysera")', '$1'

# More targeted approach - fix around line 23187 and 23196
$lines = $content -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '"Gemstone of Ysera"') {
        Write-Host "Found Gemstone at line $($i+1)"
        # Search for bagshuiCategoryId and bagshuiGroupId nearby
        for ($j = [Math]::Max(0, $i-20); $j -lt [Math]::Min($i+20, $lines.Count); $j++) {
            if ($lines[$j] -match '\["bagshuiCategoryId"\] = (\d+),') {
                $old = $matches[1]
                $lines[$j] = $lines[$j] -replace '\["bagshuiCategoryId"\] = \d+,', '["bagshuiCategoryId"] = 2,'
                Write-Host "  Changed bagshuiCategoryId from $old to 2"
            }
            if ($lines[$j] -match '\["bagshuiGroupId"\] = "([^"]+)"') {
                $old = $matches[1]
                $lines[$j] = $lines[$j] -replace '\["bagshuiGroupId"\] = "[^"]+"', '["bagshuiGroupId"] = "5:6"'
                Write-Host "  Changed bagshuiGroupId from $old to 5:6"
            }
        }
        break
    }
}

[System.IO.File]::WriteAllLines($file, $lines)
attrib +R $file

Write-Host "Done! Read-only: $((Get-ItemProperty $file).IsReadOnly)"

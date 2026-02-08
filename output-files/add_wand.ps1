$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Add Wand of Biting Cold (19108) to Raid Gear [14] after [22] = 58213
$content = $content -replace '(\[22\] = 58213,)(\s*\},\s*\["nameSort"\])', '$1[23] = 19108,$2'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Added Wand of Biting Cold (19108) to Raid Gear [14]"
Write-Host "File read-only: $((Get-ItemProperty $file).IsReadOnly)"

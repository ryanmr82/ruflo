$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# Change sequences to 15 (beats BOE at 20)
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )70,', '${1}15,'
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )70,', '${1}15,'
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )30,', '${1}15,'

Write-Host "Sequences changed to 15 for Frost Resist, Arcane Resist, Keys"

# Add Wand of Biting Cold to Raid Gear
if ($content -notmatch '19108') {
    $content = $content -replace '(\[22\] = 58213,)(\s*\},\s*\[15\])', '$1[23] = 19108,$2'
    Write-Host "Added Wand of Biting Cold (19108) to Raid Gear"
}

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Done! /reload in-game"

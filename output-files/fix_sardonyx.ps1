# FIX SARDONYX KNUCKLE - Remove from Frost list so tooltip rules differentiate
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $file
$content = Get-Content $file -Raw

# Remove 11976 from Frost Resist [33] list - let tooltip rules handle both variants
# Current: [4] = 11976,
# The Tooltip("Frost Resistance") rule will catch the frost variant
# The Tooltip("Arcane Resistance") rule will catch the arcane variant

if ($content -match '\[33\] = \{[^}]*\[4\] = 11976,') {
    $content = $content -replace '(\[33\] = \{[^}]*?)\[4\] = 11976,', '$1'
    Write-Host "Removed Sardonyx Knuckle (11976) from Frost Resist [33] list"
    Write-Host "Tooltip rules will now differentiate:"
    Write-Host "  - Frost variant -> Frost Resist (via tooltip rule)"
    Write-Host "  - Arcane variant -> Arcane Resist (via tooltip rule)"
} else {
    Write-Host "11976 not found in expected position in Frost Resist list"
}

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host ""
Write-Host "File read-only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host "DO /RELOAD IN-GAME TO TEST!"

# Clean up the broken file structure
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = Get-Content $file -Raw

# Remove the duplicate orphaned lines after Alt Keys
$content = $content -replace '(\["name"\] = "Alt Keys",\s*\},)\s*\["nameSort"\] = "",[^}]*\["inUse"\] = true,\s*\},', '$1'

[System.IO.File]::WriteAllText($file, $content)
attrib +R $file

Write-Host "Cleaned up. Verifying..."
$lines = Get-Content $file
for ($i = 0; $i -lt 25; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}

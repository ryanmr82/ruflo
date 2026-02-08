# Remove blank lines from file
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Read file and filter out blank lines
$content = Get-Content $file | Where-Object { $_.Trim() -ne "" }

Write-Host "Original lines: $((Get-Content $file).Count)"
Write-Host "After removing blanks: $($content.Count)"

# Force write
attrib -R $file
$content | Out-File -FilePath $file -Encoding UTF8
attrib +R $file

Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

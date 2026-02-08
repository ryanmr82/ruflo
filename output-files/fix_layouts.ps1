$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix 1: In layout groups that reference "KeyAndKeyLike", add category 36
# Change: ["categories"] = { [1] = "KeyAndKeyLike", }
# To: ["categories"] = { [1] = "KeyAndKeyLike", [2] = 36, }
$content = $content -replace '(\["categories"\] = \{[\s\n\t]*\[1\] = "KeyAndKeyLike",[\s\n\t]*\})', '["categories"] = { [1] = "KeyAndKeyLike", [2] = 36, }'
Write-Host "Added category 36 to KeyAndKeyLike groups"

# Fix 2: In Frost Resist groups (category 33), also add Arcane Resist (category 37)
# Find groups with [1] = 33 and add [2] = 37
$content = $content -replace '(\["categories"\] = \{[\s\n\t]*\[1\] = 33,[\s\n\t]*\}[\s\S]{1,50}?\["name"\] = "Frost Resist")', '["categories"] = { [1] = 33, [2] = 37, }
								["name"] = "Frost Resist"'
Write-Host "Added category 37 to Frost Resist groups"

# Fix 3: Remove category 36 from Transportation group (it's wrongly placed there)
# The group has [1] = 36, [2] = 9, [3] = 33 - remove 36 and 33, keep only 9
$content = $content -replace '\[1\] = 36,[\s\n\t]*\[2\] = 9,[\s\n\t]*\[3\] = 33,', '[1] = 9,'
Write-Host "Removed categories 36 and 33 from Transportation group"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload in game"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Remove category 37 from Shadow Resist group (undo previous change)
$content = $content -replace '\[1\] = 29, \[2\] = 37,', '[1] = 29,'
$content = $content -replace '"Shadow/Arcane Resist"', '"Shadow Resist"'
Write-Host "Removed category 37 from Shadow Resist"

# Add new Arcane Resist group after Shadow Resist [5] as [6], shift Food to [7] etc.
# Find the Shadow Resist entry and add Arcane Resist after it
$shadowPattern = '(\[5\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = 29,[\s\n\t]*\},[\s\n\t]*\["name"\] = "Shadow Resist",[\s\n\t]*\["groupId"\] = "2:5",[\s\n\t]*\},)'
$arcaneGroup = '$1
							[6] = {
								["categories"] = {
									[1] = 37,
								},
								["name"] = "Arcane Resist",
								["groupId"] = "2:6",
							},'

# This is complex - need to renumber subsequent groups
# Instead, let's add Arcane as the LAST group in column 2
# Find the end of column 2 and add before it

# Actually, let's use a different approach - add to an empty slot or append
# For now, let's set Arcane Resist items to groupId "2:6" 
# and modify the Food group to have a different ID

# Simpler: just set Arcane items to same groupId as Frost Resist "2:4" for now
# They'll appear together which isn't ideal but at least correct

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Reverted Shadow Resist changes. Need to manually add Arcane group in game."

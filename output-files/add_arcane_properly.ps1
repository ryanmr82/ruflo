$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Step 1: Remove category 37 from Frost Resist group
$content = $content -replace '\["categories"\] = \{ \[1\] = 33, \[2\] = 37, \},', '["categories"] = { [1] = 33, },'
Write-Host "Removed 37 from Frost Resist"

# Step 2: Insert Arcane Resist [6] after Shadow Resist [5], before Food
# First, we need to shift existing [6] to [7], [7] to [8], etc.

# The pattern for the current [6] Food group
$foodPattern = '\[6\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = "Food",[\s\n\t]*\[2\] = 21,[\s\n\t]*\},[\s\n\t]*\["sortOrder"\] = "MinLevel",[\s\n\t]*\["name"\] = "Food",[\s\n\t]*\["groupId"\] = "2:6",'
# Change to [7] with groupId "2:7"
$content = $content -replace $foodPattern, '[7] = {
								["categories"] = {
									[1] = "Food",
									[2] = 21,
								},
								["sortOrder"] = "MinLevel",
								["name"] = "Food",
								["groupId"] = "2:7",'
Write-Host "Shifted Food to [7]"

# Change Drink from [7] to [8]
$content = $content -replace '\[7\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = "Drink",[\s\n\t]*\},[\s\n\t]*\["sortOrder"\] = "MinLevel",[\s\n\t]*\["name"\] = "Drink",[\s\n\t]*\["groupId"\] = "2:7",', '[8] = {
								["categories"] = {
									[1] = "Drink",
								},
								["sortOrder"] = "MinLevel",
								["name"] = "Drink",
								["groupId"] = "2:8",'
Write-Host "Shifted Drink to [8]"

# Change Health from [8] to [9]
$content = $content -replace '\["groupId"\] = "2:8",[\s\n\t]*\},[\s\n\t]*\[9\] = \{', '["groupId"] = "2:9",
							},
							[10] = {'
Write-Host "Shifted Health/Mana groupIds"

# Now insert Arcane Resist as [6] after Shadow Resist [5]
$shadowEnd = '\[5\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = 29,[\s\n\t]*\},[\s\n\t]*\["name"\] = "Shadow Resist",[\s\n\t]*\["groupId"\] = "2:5",[\s\n\t]*\},'
$content = $content -replace $shadowEnd, '[5] = {
								["categories"] = {
									[1] = 29,
								},
								["name"] = "Shadow Resist",
								["groupId"] = "2:5",
							},
							[6] = {
								["categories"] = {
									[1] = 37,
								},
								["name"] = "Arcane Resist",
								["groupId"] = "2:6",
							},'
Write-Host "Added Arcane Resist as [6]"

# Update Arcane Resist items to use groupId "2:6"
$content = $content -replace '(\["name"\] = "Peridot Circle of Arcane Resistance"[\s\S]{1,500}?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:6"'
$content = $content -replace '(\["bagshuiGroupId"\] = )"[^"]*"([\s\S]{1,500}?\["name"\] = "Peridot Circle of Arcane Resistance")', '${1}"2:6"${2}'
$content = $content -replace '(\["name"\] = "Sardonyx Knuckle of Arcane Resistance"[\s\S]{1,500}?\["bagshuiGroupId"\] = )"[^"]*"', '${1}"2:6"'
$content = $content -replace '(\["bagshuiGroupId"\] = )"[^"]*"([\s\S]{1,500}?\["name"\] = "Sardonyx Knuckle of Arcane Resistance")', '${1}"2:6"${2}'
Write-Host "Set Arcane items to groupId 2:6"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

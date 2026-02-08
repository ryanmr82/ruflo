$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix the layout group named "Shadow Resist" - change categories to just use category 29
$old = @'
							[5] = {
								["categories"] = {
									[1] = "BOE",
									[2] = "ProfessionCrafts",
									[3] = "Recipes",
									[4] = "SoulboundGear",
									[5] = "Uncategorized",
								},
								["name"] = "Shadow Resist",
								["groupId"] = "2:5",
							},
'@

$new = @'
							[5] = {
								["categories"] = {
									[1] = 29,
								},
								["name"] = "Shadow Resist",
								["groupId"] = "2:5",
							},
'@

$content = $content.Replace($old, $new)
Write-Host "Fixed Shadow Resist layout group to use category 29"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

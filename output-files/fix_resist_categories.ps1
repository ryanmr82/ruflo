# Fix resist categories - add Frost Resist to group, create Arcane Resist
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file

$content = Get-Content $file -Raw

# 1. Fix Frost Resist group - add category 33 to the empty categories array
# Find: ["categories"] = {}, followed by ["name"] = "Frost Resist"
$content = $content -replace '(\[4\] = \{\s*\["categories"\] = \{)\s*(\},\s*\["name"\] = "Frost Resist")', '$1
									[1] = 33,
								$2'

Write-Host "Fixed Frost Resist group - added category 33"

# 2. Create Arcane Resist category [37] - insert after Nature Resist [34]
# We need to add it right before the closing of categories section
$arcaneCategory = @'
		[37] = {
			["sequence"] = 100,
			["name"] = "Arcane Resist",
			["list"] = {
			},
			["dateModified"] = 1767769300,
			["rule"] = "Tooltip(\"Arcane Resistance\")",
			["inUse"] = true,
		},
'@

# Check if Arcane Resist already exists
if ($content -match '\["name"\] = "Arcane Resist"') {
    Write-Host "Arcane Resist category already exists"
} else {
    # Insert after Nature Resist category (category 34)
    $content = $content -replace '(\[34\] = \{[^}]*\["rule"\] = "Tooltip\(\\"Nature Resistance\\"\)",\s*\["inUse"\] = true,\s*\},)', "`$1`n$arcaneCategory"
    Write-Host "Created Arcane Resist category [37]"
}

# 3. Add Arcane Resist group to the resist layout section
# First check if it already exists
if ($content -match '\["name"\] = "Arcane Resist",\s*\["groupId"\]') {
    Write-Host "Arcane Resist group already exists in layout"
} else {
    # Add after Shadow Resist group [5]
    $arcaneGroup = @'
							[6] = {
								["categories"] = {
									[1] = 37,
								},
								["name"] = "Arcane Resist",
								["groupId"] = "2:6",
							},
'@
    # This would require renumbering existing groups, so let's skip for now
    Write-Host "Note: Arcane Resist group not added to layout - would require renumbering"
}

[System.IO.File]::WriteAllText($file, $content)
attrib +R $file

Write-Host ""
Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Fix Frost Resist - remove the "or Name(...)" part and change sequence to 70
$content = $content -replace '\["rule"\] = "Tooltip\(\\"Frost Resistance\\"\) or Name\([^"]+\)"', '["rule"] = "Tooltip(\"Frost Resistance\")"'
Write-Host "Removed Name() from Frost Resist rule"

# Change Frost Resist sequence from 1 to 70
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )1(,|\s)', '${1}70${2}'
Write-Host "Changed Frost Resist sequence to 70"

# Fix Swim Speed - remove Name() rule, keep it simple with just the list
$content = $content -replace '\["rule"\] = "Name\(\\"Ocean''s Gaze\\", \\"Ice Pearl of Kaneq''nuun\\", \\"Rethress Tide Crest\\"\)"', ''
Write-Host "Removed Name() from Swim Speed"

# Fix Keys builtin - it has TWO rule entries which is invalid
$content = $content -replace '\["rule"\] = "Type\(\\"Key\\"\)",[\s\n\t]*\["name"\] = "Keys",[\s\n\t]*\["rule"\] = "Name\([^"]+\)"', '["rule"] = "Type(\"Key\")",
			["name"] = "Keys"'
Write-Host "Fixed Keys duplicate rule"

# Change Swim Speed sequence to 70
$content = $content -replace '(\[3\] = \{[\s\S]*?\["sequence"\] = )1(,|\s)', '${1}70${2}'
Write-Host "Changed Swim Speed sequence to 70"

# Change Keys [36] sequence to 70
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )1(,|\s)', '${1}70${2}'
Write-Host "Changed Keys sequence to 70"

# Change Arcane Resist sequence to 70
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )1(,|\s)', '${1}70${2}'
Write-Host "Changed Arcane Resist sequence to 70"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

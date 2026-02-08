$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file)

# Add category 37 to Shadow Resist group and rename to "Shadow/Arcane Resist"
# Find: [5] = { ["categories"] = { [1] = 29, }, ["name"] = "Shadow Resist", ["groupId"] = "2:5",
$content = $content -replace '(\[5\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = 29,[\s\n\t]*\},[\s\n\t]*\["name"\] = )"Shadow Resist"', '${1}"Shadow/Arcane Resist"'

# Add category 37 to Shadow Resist categories
$content = $content -replace '(\[5\] = \{[\s\n\t]*\["categories"\] = \{[\s\n\t]*\[1\] = 29),', '${1}, [2] = 37,'

Write-Host "Added category 37 to Shadow Resist group (2:5)"

# Change Arcane Resist items' groupId from "2:6" to "2:5"
$arcaneItems = @("Peridot Circle of Arcane Resistance", "Sardonyx Knuckle of Arcane Resistance")
foreach ($item in $arcaneItems) {
    $escaped = [regex]::Escape($item)
    $content = $content -replace "(\[`"name`"\] = `"$escaped`"[\s\S]{1,1500}?\[`"bagshuiGroupId`"\] = )`"2:6`"", '${1}"2:5"'
    $content = $content -replace "(\[`"bagshuiGroupId`"\] = )`"2:6`"([\s\S]{1,1500}?\[`"name`"\] = `"$escaped`")", '${1}"2:5"${2}'
    Write-Host "$item -> groupId 2:5"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
attrib +R $file
Write-Host "Done. /reload"

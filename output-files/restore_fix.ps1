$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = Get-Content $file -Raw

# RESTORE proper sequences
# BOE back to 20
$content = $content -replace '(\[28\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}20'
Write-Host "BOE restored to 20"

# Transportation back to 30
$content = $content -replace '(\[9\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}30'
Write-Host "Transportation restored to 30"

# Swim Speed to 15 (before BOE but not crazy low)
$content = $content -replace '(\[3\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}15'
Write-Host "Swim Speed set to 15"

# Keys to 15
$content = $content -replace '(\[36\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}15'
Write-Host "Keys set to 15"

# Frost Resist to 15
$content = $content -replace '(\[33\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}15'
Write-Host "Frost Resist set to 15"

# Arcane Resist to 15
$content = $content -replace '(\[37\] = \{[\s\S]*?\["sequence"\] = )\d+', '${1}15'
Write-Host "Arcane Resist set to 15"

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Sequences restored. /reload"

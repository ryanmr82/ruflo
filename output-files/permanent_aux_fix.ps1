$auxFile = "C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua"
$content = Get-Content $auxFile -Raw

# Disable data sharing permanently (this may have caused rest XP loss)
$content = $content -replace '"sharing" = true', '"sharing" = false'

# Clear history cache completely  
$content = $content -replace '\["history"\] = \{[^}]*\}', '["history"] = {}'

# Write back the modified content
$content | Set-Content $auxFile
Write-Host "SUCCESS: Disabled data sharing and cleared history cache"
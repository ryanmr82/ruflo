$auxFile = "C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\aux-addon.lua"
$content = Get-Content $auxFile -Raw

# Set bid posting to unit mode permanently
$content = $content -replace '"post_bid" = true', '"post_bid" = false'

# Add unit mode preference if it doesn't exist
if ($content -notmatch 'post_bid_unit') {
    $content = $content -replace '("post_bid" = false)', '$1,`n`t`t["post_bid_unit"] = true'
}

$content | Set-Content $auxFile
Write-Host "SUCCESS: Set AUX to default to per-unit pricing mode"
# ADD HERBS RULE
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $file
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Simple approach: find the Herbs category and insert rule after inUse
$herbRule = 'Name("Black Lotus", "Mountain Silversage", "Dreamfoil", "Golden Sansam", "Icecap", "Plaguebloom", "Gromsblood", "Sungrass", "Blindweed", "Ghost Mushroom", "Purple Lotus", "Firebloom", "Wild Steelbloom", "Fadeleaf", "Goldthorn", "Liferoot", "Kingsblood", "Stranglekelp", "Grave Moss", "Bruiseweed", "Briarthorn", "Swiftthistle", "Mageroyal", "Earthroot", "Silverleaf", "Peacebloom")'

# Check if Herbs already has a rule
if ($content -match '\[18\] = \{[\s\S]*?\["name"\] = "Herbs"[\s\S]*?\["rule"\]') {
    Write-Host "Herbs already has a rule"
} else {
    # Add rule after ["inUse"] = true, for [18]
    # Pattern: find [18] block, locate inUse=true, add rule before closing },
    $pattern = '(\[18\] = \{[\s\S]*?\["name"\] = "Herbs",\s*\["inUse"\] = true,)(\s*\},)'
    $replacement = "`$1`n`t`t`t[`"rule`"] = `"$herbRule`",`$2"

    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        Write-Host "Added rule to Herbs [18]"
    } else {
        Write-Host "Pattern not found - trying alternate pattern"
        # Try without nameSort field
        $pattern2 = '(\["name"\] = "Herbs",\s*\["inUse"\] = true,)(\s*\},\s*\[19\])'
        $replacement2 = "`$1`n`t`t`t[`"rule`"] = `"$herbRule`",`$2"
        $content = $content -replace $pattern2, $replacement2
        Write-Host "Applied alternate pattern"
    }
}

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

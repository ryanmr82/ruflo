# FORCE ADD HERBS RULE - More precise targeting
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

attrib -R $file
$lines = Get-Content $file

$herbRule = '			["rule"] = "Name(\"Black Lotus\", \"Mountain Silversage\", \"Dreamfoil\", \"Golden Sansam\", \"Icecap\", \"Plaguebloom\", \"Gromsblood\", \"Sungrass\", \"Blindweed\", \"Ghost Mushroom\", \"Purple Lotus\", \"Firebloom\", \"Wild Steelbloom\", \"Fadeleaf\", \"Goldthorn\", \"Liferoot\", \"Kingsblood\", \"Stranglekelp\", \"Grave Moss\", \"Bruiseweed\", \"Briarthorn\", \"Swiftthistle\", \"Mageroyal\", \"Earthroot\", \"Silverleaf\", \"Peacebloom\")",'

$newLines = @()
$foundHerbs = $false
$herbsSection = $false
$addedRule = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $newLines += $line

    # Look for [18] = { which starts the Herbs category
    if ($line -match '^\s*\[18\] = \{') {
        $herbsSection = $true
    }

    # If we're in the herbs section, look for the inUse line
    if ($herbsSection -and -not $addedRule) {
        if ($line -match '\["name"\] = "Herbs"') {
            $foundHerbs = $true
        }

        # After finding Herbs name, look for inUse line and add rule after it
        if ($foundHerbs -and $line -match '\["inUse"\] = true,') {
            # Check if next line is the closing },
            if ($i + 1 -lt $lines.Count -and $lines[$i + 1] -match '^\s*\},$') {
                # Insert rule before the closing
                $newLines += $herbRule
                Write-Host "Added rule to Herbs [18] after line $i"
                $addedRule = $true
            }
        }
    }

    # End of herbs section
    if ($herbsSection -and $line -match '^\s*\[19\] = \{') {
        $herbsSection = $false
    }
}

if (-not $addedRule) {
    Write-Host "Could not add rule - pattern not found"
} else {
    # Write the file
    $newLines | Out-File -FilePath $file -Encoding UTF8
}

attrib +R $file
Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

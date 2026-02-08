# Fix other resist categories (33=Frost, 34=Nature, 35=Fire)
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$lines = Get-Content $file
$modified = $false

# Define the categories and their rules
$resistTypes = @{
    33 = @{name="Frost Resist"; rule='Tooltip("Frost Resistance")'}
    34 = @{name="Nature Resist"; rule='Tooltip("Nature Resistance")'}
    35 = @{name="Fire Resist"; rule='Tooltip("Fire Resistance")'}
}

foreach ($catNum in $resistTypes.Keys) {
    $info = $resistTypes[$catNum]

    # Check if category already has a rule
    $hasRule = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*\[$catNum\] = \{") {
            for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
                if ($lines[$j] -match '\["rule"\]') {
                    $hasRule = $true
                    break
                }
                if ($lines[$j] -match '^\s*\}') {
                    break
                }
            }

            if (-not $hasRule) {
                # Add rule after name line
                for ($j = $i + 1; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
                    if ($lines[$j] -match '\["name"\]') {
                        $indent = $lines[$j] -replace '\["name"\].*', ''
                        $newLines = @()
                        for ($k = 0; $k -le $j; $k++) {
                            $newLines += $lines[$k]
                        }
                        $newLines += "$indent" + '["rule"] = ''' + $info.rule + ''','
                        for ($k = $j + 1; $k -lt $lines.Count; $k++) {
                            $newLines += $lines[$k]
                        }
                        $lines = $newLines
                        $modified = $true
                        Write-Host "Added rule to category $catNum ($($info.name))"
                        break
                    }
                }
            } else {
                Write-Host "Category $catNum ($($info.name)) already has rule"
            }
            break
        }
    }
}

# Now find and fix the groups for Frost, Nature, Fire resist
$groupNames = @("Frost Resist", "Nature Resist", "Fire Resist")
$groupCategories = @{
    "Frost Resist" = 33
    "Nature Resist" = 34
    "Fire Resist" = 35
}

foreach ($groupName in $groupNames) {
    $catNum = $groupCategories[$groupName]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '\["categories"\] = \{') {
            # Check if next few lines have this group name
            for ($j = $i + 1; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
                if ($lines[$j] -match """$groupName""") {
                    # Found the group, check if categories is empty
                    if ($lines[$i + 1] -match '^\s*\},') {
                        # Empty categories, add the category number
                        $indent = $lines[$i + 1] -replace '\}.*', ''
                        $newLines = @()
                        for ($k = 0; $k -le $i; $k++) {
                            $newLines += $lines[$k]
                        }
                        $newLines += "$indent	[1] = $catNum,"
                        for ($k = $i + 1; $k -lt $lines.Count; $k++) {
                            $newLines += $lines[$k]
                        }
                        $lines = $newLines
                        $modified = $true
                        Write-Host "Added category $catNum to $groupName group"
                    } else {
                        Write-Host "$groupName group already has categories assigned"
                    }
                    break
                }
            }
        }
    }
}

# Write back
if ($modified) {
    [System.IO.File]::WriteAllLines($file, $lines)
    Write-Host "File updated!"
} else {
    Write-Host "No changes needed"
}

# Set read-only
Set-ItemProperty $file -Name IsReadOnly -Value $true
Write-Host ""
Write-Host "File is READ-ONLY: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host "File size: $((Get-Item $file).Length) bytes"

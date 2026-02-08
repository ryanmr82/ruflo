# Add new categories after Arcane Resist [37]
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

$lines = Get-Content $file
$newLines = @()
$insertedCategories = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]

    # After Arcane Resist category ends, insert new categories
    if (-not $insertedCategories -and $lines[$i] -match '^\s*\},\s*$' -and $i -gt 0) {
        # Check if previous lines are from Arcane Resist
        if ($lines[$i-1] -match '\["inUse"\] = true,' -and $lines[$i-3] -match 'Arcane Resistance') {
            # Insert Bind on Equip [41]
            $newLines += '		[41] = {'
            $newLines += '			["sequence"] = 20,'
            $newLines += '			["name"] = "Bind on Equip",'
            $newLines += '			["list"] = {'
            $newLines += '				[1] = 17203,'
            $newLines += '			},'
            $newLines += '			["dateModified"] = 1767769500,'
            $newLines += '			["rule"] = "Tooltip(\"Binds when equipped\")",'
            $newLines += '			["inUse"] = true,'
            $newLines += '		},'
            Write-Host "Added Bind on Equip category [41]"

            # Insert Elixirs [42]
            $newLines += '		[42] = {'
            $newLines += '			["sequence"] = 69,'
            $newLines += '			["name"] = "Elixirs",'
            $newLines += '			["list"] = {'
            $newLines += '			},'
            $newLines += '			["dateModified"] = 1767769500,'
            $newLines += '			["rule"] = "Name(\"Elixir\", \"Dream Tonic\")",'
            $newLines += '			["inUse"] = true,'
            $newLines += '		},'
            Write-Host "Added Elixirs category [42]"

            # Insert Food Buffs [43]
            $newLines += '		[43] = {'
            $newLines += '			["sequence"] = 69,'
            $newLines += '			["name"] = "Food Buffs",'
            $newLines += '			["list"] = {'
            $newLines += '			},'
            $newLines += '			["dateModified"] = 1767769500,'
            $newLines += '			["rule"] = "Tooltip(\"well fed\") and Tooltip(\"also\")",'
            $newLines += '			["inUse"] = true,'
            $newLines += '		},'
            Write-Host "Added Food Buffs category [43]"

            # Insert Weapon Buffs [44]
            $newLines += '		[44] = {'
            $newLines += '			["sequence"] = 69,'
            $newLines += '			["name"] = "Weapon Buffs",'
            $newLines += '			["list"] = {'
            $newLines += '			},'
            $newLines += '			["dateModified"] = 1767769500,'
            $newLines += '			["rule"] = "Name(\"Frost Oil\", \"Mana Oil\", \"Shadow Oil\", \"Sharpening Stone\", \"Weightstone\", \"Wizard Oil\", \"Elemental Sharpening Stone\")",'
            $newLines += '			["inUse"] = true,'
            $newLines += '		},'
            Write-Host "Added Weapon Buffs category [44]"

            $insertedCategories = $true
        }
    }
}

# Write
attrib -R $file
$newLines | Out-File -FilePath $file -Encoding UTF8
attrib +R $file

Write-Host ""
Write-Host "Done! File is read-only: $((Get-ItemProperty $file).IsReadOnly)"

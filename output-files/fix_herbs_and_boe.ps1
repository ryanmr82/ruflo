# FIX HERBS CATEGORY AND BIND ON EQUIP
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

Write-Host "Reading file..."
$content = Get-Content $file -Raw

# ============================================
# 1. ADD BLACK LOTUS AND MOUNTAIN SILVERSAGE TO HERBS [18]
# ============================================
# Current Herbs list: 8836, 13463, 13464, 13467, 3820
# Add: 13468 (Black Lotus), 13465 (Mountain Silversage)

if ($content -match '(\[18\] = \{[^}]*\["list"\] = \{[^}]*\[5\] = 3820,\s*\})') {
    $herbsMatch = $matches[0]
    $herbsNew = $herbsMatch -replace '\[5\] = 3820,(\s*\})', '[5] = 3820,[6] = 13468,[7] = 13465,$1'
    $content = $content -replace [regex]::Escape($herbsMatch), $herbsNew
    Write-Host "1. Added Black Lotus (13468) and Mountain Silversage (13465) to Herbs [18]"
} else {
    Write-Host "1. Could not find Herbs list pattern - trying alternate method"
    # Try adding after the existing list
    if ($content -match '(\[18\] = \{[\s\S]*?\["list"\] = \{[\s\S]*?3820,)(\s*\},)') {
        $content = $content -replace '(\[18\] = \{[\s\S]*?\["list"\] = \{[\s\S]*?3820,)(\s*\},)', '$1[6] = 13468,[7] = 13465,$2'
        Write-Host "1. Added Black Lotus and Mountain Silversage (alternate method)"
    }
}

# ============================================
# 2. ADD RULE TO HERBS [18] FOR DYNAMIC MATCHING
# ============================================
# Add rule to match all common herbs by name
$herbRule = 'Name("Black Lotus", "Mountain Silversage", "Dreamfoil", "Golden Sansam", "Icecap", "Plaguebloom", "Gromsblood", "Arthas'' Tears", "Sungrass", "Blindweed", "Ghost Mushroom", "Purple Lotus", "Firebloom", "Wild Steelbloom", "Khadgar''s Whisker", "Fadeleaf", "Goldthorn", "Liferoot", "Kingsblood", "Stranglekelp", "Grave Moss", "Bruiseweed", "Briarthorn", "Swiftthistle", "Mageroyal", "Earthroot", "Silverleaf", "Peacebloom")'

# Check if Herbs already has a rule
if ($content -match '\[18\] = \{[^}]*\["rule"\]') {
    Write-Host "2. Herbs [18] already has a rule - skipping"
} else {
    # Add rule before inUse
    $content = $content -replace '(\[18\] = \{[^}]*\["name"\] = "Herbs",)(\s*\["inUse"\])', "`$1`n`t`t`t[`"rule`"] = `"$herbRule`",`$2"
    Write-Host "2. Added Name() rule to Herbs [18] for all common herbs"
}

# ============================================
# 3. UPDATE BIND ON EQUIP [28] SEQUENCE TO 20
# ============================================
# Find [28] and change sequence from 30 to 20
$content = $content -replace '(\[28\] = \{[^}]*\["sequence"\] = )30,', '${1}20,'
Write-Host "3. Updated Bind on Equip [28] sequence to 20 (highest priority)"

# ============================================
# 4. ADD TOOLTIP RULE TO BIND ON EQUIP [28]
# ============================================
$boeRule = 'Tooltip("Binds when equipped")'

# Check if BOE already has a rule
if ($content -match '\[28\] = \{[^}]*\["rule"\]') {
    Write-Host "4. Bind on Equip [28] already has a rule - skipping"
} else {
    # Add rule after inUse line for [28]
    $content = $content -replace '(\[28\] = \{[^}]*\["inUse"\] = true,)(\s*\},)', "`$1`n`t`t`t[`"rule`"] = `"$boeRule`",`$2"
    Write-Host "4. Added Tooltip rule to Bind on Equip [28]"
}

# ============================================
# 5. ADD SULFURON INGOT (17203) TO BIND ON EQUIP [28]
# ============================================
if ($content -match '\[28\] = \{[^}]*17203') {
    Write-Host "5. Sulfuron Ingot (17203) already in Bind on Equip"
} else {
    # Find the last item in BOE list and add after it
    if ($content -match '(\[28\] = \{[^}]*\["list"\] = \{[^}]*\[14\] = 14557,)(\s*\},)') {
        $content = $content -replace '(\[28\] = \{[^}]*\["list"\] = \{[^}]*\[14\] = 14557,)(\s*\},)', '$1[15] = 17203,$2'
        Write-Host "5. Added Sulfuron Ingot (17203) to Bind on Equip [28]"
    } else {
        Write-Host "5. Could not find BOE list pattern"
    }
}

# ============================================
# FORCE WRITE
# ============================================
Write-Host ""
Write-Host "Writing changes..."
attrib -R $file
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file

Write-Host ""
Write-Host "============================================"
Write-Host "CHANGES COMPLETE!"
Write-Host "============================================"
Write-Host ""
Write-Host "HERBS [18]:"
Write-Host "  - Added Black Lotus (13468)"
Write-Host "  - Added Mountain Silversage (13465)"
Write-Host "  - Added Name() rule for all common herbs"
Write-Host ""
Write-Host "BIND ON EQUIP [28]:"
Write-Host "  - Sequence: 20 (HIGHEST PRIORITY)"
Write-Host "  - Rule: Tooltip('Binds when equipped')"
Write-Host "  - Added Sulfuron Ingot (17203)"
Write-Host ""
Write-Host "File read-only: $((Get-ItemProperty $file).IsReadOnly)"
Write-Host ""
Write-Host "DO /RELOAD IN-GAME TO TEST!"

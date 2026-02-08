$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"

# Remove read-only to edit
attrib -R $file

$content = [System.IO.File]::ReadAllText($file)

# Add BindsOnEquip() rule to custom BOE category [28]
# Current: ["inUse"] = true,
#          ["sequence"] = 30,
# Change to: ["inUse"] = true,
#            ["rule"] = "BindsOnEquip()",
#            ["sequence"] = 30,

$old = '["dateModified"] = 1761265264,' + "`r`n" + '			["inUse"] = true,' + "`r`n" + '			["sequence"] = 30,' + "`r`n" + '		},' + "`r`n" + '		[29] = {'
$new = '["dateModified"] = 1761265264,' + "`r`n" + '			["inUse"] = true,' + "`r`n" + '			["rule"] = "BindsOnEquip()",' + "`r`n" + '			["sequence"] = 30,' + "`r`n" + '		},' + "`r`n" + '		[29] = {'

$content = $content.Replace($old, $new)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

# Restore read-only
attrib +R $file

Write-Host "Added BindsOnEquip() rule to custom BOE category [28]"

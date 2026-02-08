$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
attrib -R $file
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$old = @'
			["inUse"] = true,
			["name"] = "Keys",
		},
		["Openable"] = {
'@

$new = @'
			["inUse"] = true,
			["name"] = "Keys",
			["rule"] = "Name(\"Mallet of Zul'Farrak\", \"Seal of Ascension\", \"Drakefire Amulet\")",
		},
		["Openable"] = {
'@

$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
attrib +R $file
Write-Host "Keys rule added"

$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
$backup = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua.backup_resistance_fix"
attrib -R $file
Copy-Item -Path $backup -Destination $file -Force
attrib +R $file
Write-Host "Restored from backup_resistance_fix"
Write-Host "Done. /reload"

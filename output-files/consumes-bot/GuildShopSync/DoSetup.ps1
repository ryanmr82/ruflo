# Setup script
$scriptDir = "C:\Claude-Flow\output-files\consumes-bot\GuildShopSync"

# Create VBS wrapper
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$scriptDir\AutoSync.ps1""", 0, False
"@
$vbsContent | Out-File "$scriptDir\RunHidden.vbs" -Encoding ASCII

# Copy to Startup folder
$startupPath = [Environment]::GetFolderPath('Startup')
Copy-Item "$scriptDir\RunHidden.vbs" "$startupPath\GuildShopSync.vbs" -Force
Write-Host "Added to Startup folder: $startupPath"

# Start it now
Start-Process 'wscript.exe' -ArgumentList "$scriptDir\RunHidden.vbs"
Write-Host "Auto-sync watcher is now running!"
Write-Host ""
Write-Host "Setup complete! From now on:"
Write-Host "  1. Click 'Sync Prices' in WoW"
Write-Host "  2. That's it - prices upload automatically"

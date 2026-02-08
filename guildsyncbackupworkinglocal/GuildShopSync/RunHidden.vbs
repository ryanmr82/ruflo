Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Claude-Flow\output-files\consumes-bot\GuildShopSync\AutoSync.ps1""", 0, False

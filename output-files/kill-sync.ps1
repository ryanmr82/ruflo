# Kill GuildShopSync processes
Get-WmiObject Win32_Process -Filter "Name='powershell.exe'" | ForEach-Object {
    if ($_.CommandLine -like '*AutoSync*' -or $_.CommandLine -like '*GuildShopSync*' -or $_.CommandLine -like '*SyncService*') {
        Write-Host "Killing process: $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done killing GuildShopSync processes"

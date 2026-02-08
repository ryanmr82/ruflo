$logs = Get-ChildItem 'C:\TurtleWoW\Logs\TurtLog*.txt' -File
foreach ($log in $logs) {
    $count = (Select-String -Path $log.FullName -Pattern 'a335ee.*receives loot').Count
    if ($count -gt 0) {
        Write-Host "$($log.Name) : $count epic loot"
    }
}

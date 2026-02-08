Get-ChildItem 'C:\TurtleWoW\Logs\TurtLog-*.txt' |
  Where-Object { $_.Name -notmatch '_analysis' } |
  ForEach-Object { $_.Name }

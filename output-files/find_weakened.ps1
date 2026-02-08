$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

$results = [System.Collections.Generic.List[string]]::new()
$lineNum = 0

while ($null -ne ($line = $reader.ReadLine())) {
    $lineNum++
    if (-not ($line -match '^2/6 (1[89]|2[0-9]):')) { continue }

    # Search very broadly for weakened, vulnerable, red coloration, or any C'Thun state change
    if ($line -match 'Weaken|Vulnerab|Red Coloration|Carapace|Body of C|Transform|Enrage|Berserk|afflicted.*C.Thun|C.Thun.*afflicted|C.Thun.*gains|fades from C.Thun|C.Thun.*suffers|C.Thun.*hits|C.Thun.*casts|C.Thun.*begins|Flesh Tentacle dies') {
        $results.Add($line)
    }
}
$reader.Close()

Write-Output "=== ALL C'THUN STATE / BODY REFERENCES (2/6 18:00+) ==="
Write-Output "Total lines: $($results.Count)"
Write-Output ""
foreach ($r in $results) {
    Write-Output $r
}

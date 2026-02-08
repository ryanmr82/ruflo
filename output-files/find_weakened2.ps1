$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

$results = [System.Collections.Generic.List[string]]::new()

while ($null -ne ($line = $reader.ReadLine())) {
    if (-not ($line -match '^2/6 (1[89]|2[0-9]):')) { continue }

    # Very specific: C'Thun body/weakened, flesh tentacle kills, and any C'Thun debuff/state
    if ($line -match "Flesh Tentacle dies" -or
        $line -match "Body of C" -or
        $line -match "C'Thun is afflicted" -or
        $line -match "C'Thun gains" -or
        $line -match "fades from C'Thun" -or
        $line -match "C'Thun suffers" -or
        ($line -match "C'Thun" -and $line -match 'Weaken') -or
        ($line -match "C'Thun" -and $line -match 'Vulnerab') -or
        ($line -match "C'Thun" -and $line -match 'Transform') -or
        ($line -match "C'Thun" -and $line -match 'Red Coloration') -or
        ($line -match "C'Thun" -and $line -match 'Carapace') -or
        ($line -match "C'Thun" -and ($line -notmatch 'Trigger|Tentacle|Digestive|Toxin|Quake|Ground|Eye of'))) {
        $results.Add($line)
    }
}
$reader.Close()

Write-Output "=== C'THUN BODY / WEAKENED / STATE CHANGES ==="
Write-Output "Total lines: $($results.Count)"
Write-Output ""
foreach ($r in $results) {
    Write-Output $r
}

$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

$cthunLines = [System.Collections.Generic.List[string]]::new()
$deathLines = [System.Collections.Generic.List[string]]::new()
$keyEvents = [System.Collections.Generic.List[string]]::new()

$lineNum = 0
while ($null -ne ($line = $reader.ReadLine())) {
    $lineNum++
    # Only look at 2/6 entries after 18:00 (last ~1.5 hours)
    if ($line -match '^2/6 (1[89]|2[0-9]):') {
        # C'Thun and Eye of C'Thun references
        if ($line -match "C'Thun" -or $line -match "Eye of C") {
            $cthunLines.Add($line)
        }
        # Player deaths during C'Thun timeframe
        if ($line -match ' dies\.$') {
            $deathLines.Add($line)
        }
        # Key mechanics: Dark Glare, Tentacles spawning, stomach
        if ($line -match 'Dark Glare|Ground Rupture|Digestive Acid|Stomach|Weakened|Mouth Tentacle|Giant Claw|Giant Eye|Eye Beam|Summon Mouth') {
            $keyEvents.Add($line)
        }
    }
}
$reader.Close()

Write-Output "=== C'THUN DIRECT REFERENCES: $($cthunLines.Count) lines ==="
foreach ($l in $cthunLines) { Write-Output $l }

Write-Output ""
Write-Output "=== DEATHS (during C'Thun timeframe): $($deathLines.Count) ==="
foreach ($l in $deathLines) { Write-Output $l }

Write-Output ""
Write-Output "=== KEY MECHANICS (sample - first 200): ==="
$keyEvents | Select-Object -First 200 | ForEach-Object { Write-Output $_ }

Write-Output ""
Write-Output "=== KEY MECHANICS (total count): $($keyEvents.Count) ==="

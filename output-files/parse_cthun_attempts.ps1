$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

# Track attempts by finding gaps > 60s between C'Thun combat events
$attempts = [System.Collections.Generic.List[hashtable]]::new()
$currentAttempt = $null
$lastCombatTime = $null
$lineNum = 0

$allDeaths = [System.Collections.Generic.List[string]]::new()
$allDarkGlare = [System.Collections.Generic.List[string]]::new()
$allWeakened = [System.Collections.Generic.List[string]]::new()
$allStomach = [System.Collections.Generic.List[string]]::new()
$allEyeBeamHits = [System.Collections.Generic.List[string]]::new()

while ($null -ne ($line = $reader.ReadLine())) {
    $lineNum++
    if (-not ($line -match '^2/6 (1[89]|2[0-9]):(\d{2}):(\d{2})\.(\d{3})')) { continue }

    $timeMatch = [regex]::Match($line, '^2/6 (\d{2}:\d{2}:\d{2}\.\d{3})')
    if (-not $timeMatch.Success) { continue }
    $timeStr = $timeMatch.Groups[1].Value

    # Is this C'Thun combat?
    $isCthun = $line -match "C'Thun" -or $line -match "Eye of C" -or $line -match "Flesh Tentacle" -or $line -match "Giant Claw Tentacle" -or $line -match "Giant Eye Tentacle" -or $line -match "Eye Tentacle" -or $line -match "Claw Tentacle" -or $line -match "Dark Glare" -or $line -match "Mouth Tentacle"

    if ($isCthun) {
        $ts = [TimeSpan]::Parse($timeStr.Split('.')[0])

        if ($null -eq $currentAttempt -or ($null -ne $lastCombatTime -and ($ts - $lastCombatTime).TotalSeconds -gt 90)) {
            # New attempt
            if ($null -ne $currentAttempt) {
                $attempts.Add($currentAttempt)
            }
            $currentAttempt = @{
                StartTime = $timeStr
                EndTime = $timeStr
                Deaths = [System.Collections.Generic.List[string]]::new()
                DarkGlares = 0
                Weakened = 0
                StomachEntries = 0
                EyeBeamDeaths = [System.Collections.Generic.List[string]]::new()
                KeyEvents = [System.Collections.Generic.List[string]]::new()
                LastDeath = ''
            }
        }
        $currentAttempt.EndTime = $timeStr
        $lastCombatTime = $ts

        # Track Dark Glare
        if ($line -match 'Dark Glare') {
            $currentAttempt.DarkGlares++
            $currentAttempt.KeyEvents.Add("[$timeStr] DARK GLARE")
        }

        # Track Weakened
        if ($line -match 'Weakened') {
            $currentAttempt.Weakened++
            $currentAttempt.KeyEvents.Add("[$timeStr] C'THUN WEAKENED")
        }

        # Track stomach
        if ($line -match 'Digestive Acid' -or $line -match 'Summon Mouth Tentacle' -or $line -match 'Exit Stomach') {
            $currentAttempt.StomachEntries++
        }
    }

    # Track ALL deaths during C'Thun timeframe
    if ($line -match ' dies\.$' -and $null -ne $currentAttempt) {
        $ts2 = [TimeSpan]::Parse($timeStr.Split('.')[0])
        if ($null -ne $lastCombatTime -and ($ts2 - $lastCombatTime).TotalSeconds -lt 30) {
            $who = ''
            if ($line -match '^\d/\d \d{2}:\d{2}:\d{2}\.\d{3}\s+(.+) dies\.$') {
                $who = $Matches[1]
            }
            # Skip tentacle/mob deaths
            if ($who -notmatch 'Tentacle|Trigger|Sartura|Viscidus') {
                $currentAttempt.Deaths.Add("[$timeStr] $who")
                $currentAttempt.LastDeath = "[$timeStr] $who"
            }
        }
    }

    # Eye Beam kills
    if ($line -match 'Eye Beam.*hits.*for (\d+)' -and $null -ne $currentAttempt) {
        $dmg = [int]$Matches[1]
        if ($dmg -gt 3000) {
            $currentAttempt.KeyEvents.Add("[$timeStr] BIG EYE BEAM: $($line.Substring(20))")
        }
    }
}
if ($null -ne $currentAttempt) { $attempts.Add($currentAttempt) }
$reader.Close()

Write-Output "============================================"
Write-Output "  C'THUN ATTEMPT ANALYSIS - 2/6/2026"
Write-Output "============================================"
Write-Output "Total attempts found: $($attempts.Count)"
Write-Output ""

$attemptNum = 0
foreach ($a in $attempts) {
    $attemptNum++
    # Calculate duration
    $startTs = [TimeSpan]::Parse($a.StartTime.Split('.')[0])
    $endTs = [TimeSpan]::Parse($a.EndTime.Split('.')[0])
    $duration = $endTs - $startTs

    Write-Output "=== ATTEMPT #$attemptNum ==="
    Write-Output "  Time: $($a.StartTime) - $($a.EndTime) (Duration: $($duration.Minutes)m $($duration.Seconds)s)"
    Write-Output "  Player Deaths: $($a.Deaths.Count)"
    Write-Output "  Dark Glares: $($a.DarkGlares)"
    Write-Output "  C'Thun Weakened phases: $($a.Weakened)"
    Write-Output "  Stomach events: $($a.StomachEntries)"
    Write-Output ""

    if ($a.Deaths.Count -gt 0) {
        Write-Output "  --- DEATHS ---"
        foreach ($d in $a.Deaths) {
            Write-Output "  $d"
        }
        Write-Output ""
    }

    if ($a.KeyEvents.Count -gt 0) {
        Write-Output "  --- KEY EVENTS (first 30) ---"
        $a.KeyEvents | Select-Object -First 30 | ForEach-Object { Write-Output "  $_" }
        if ($a.KeyEvents.Count -gt 30) {
            Write-Output "  ... and $($a.KeyEvents.Count - 30) more"
        }
        Write-Output ""
    }
    Write-Output "---"
    Write-Output ""
}

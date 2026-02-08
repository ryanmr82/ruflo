$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

# Store lines from all C'Thun attempts
$attemptLines = @{}  # attemptNum -> list of lines
$currentAttempt = 0
$lastCthunTime = $null
$lineNum = 0

while ($null -ne ($line = $reader.ReadLine())) {
    $lineNum++
    if (-not ($line -match '^2/6 (1[89]|2[0-9]):')) { continue }

    $timeMatch = [regex]::Match($line, '^2/6 (\d{2}:\d{2}:\d{2})')
    if (-not $timeMatch.Success) { continue }
    $timeStr = $timeMatch.Groups[1].Value
    $ts = [TimeSpan]::Parse($timeStr)

    $isCthunCombat = $line -match "C'Thun" -or $line -match "Eye of C" -or $line -match "Tentacle" -or $line -match "Dark Glare" -or $line -match "Digestive Acid" -or $line -match "Ground Rupture"

    if ($isCthunCombat) {
        if ($null -eq $lastCthunTime -or ($ts - $lastCthunTime).TotalSeconds -gt 90) {
            $currentAttempt++
            $attemptLines[$currentAttempt] = [System.Collections.Generic.List[string]]::new()
        }
        $lastCthunTime = $ts
    }

    # Also capture deaths, heals, and combat near C'Thun
    if ($currentAttempt -gt 0 -and $null -ne $lastCthunTime -and ($ts - $lastCthunTime).TotalSeconds -lt 30) {
        if ($line -match ' dies\.$' -or $line -match "C'Thun" -or $line -match "Eye of C" -or $line -match 'Dark Glare' -or $line -match 'Eye Beam' -or $line -match 'Flesh Tentacle' -or $line -match 'Giant Claw' -or $line -match 'Giant Eye' -or $line -match 'Ground Rupture' -or $line -match 'Weakened' -or $line -match 'Digestive Acid' -or $line -match 'Exit Stomach' -or $line -match 'Mouth Tentacle' -or $line -match 'Summon Mouth') {
            $attemptLines[$currentAttempt].Add($line)
        }
    }
}
$reader.Close()

foreach ($aN in 1..$currentAttempt) {
    $lines = $attemptLines[$aN]
    Write-Output "============================================================"
    Write-Output "  ATTEMPT #$aN DEEP ANALYSIS"
    Write-Output "============================================================"

    # Phase 1 -> Phase 2 transition (Eye of C'Thun dies)
    $eyeDeath = $lines | Where-Object { $_ -match "Eye of C'Thun dies" }
    if ($eyeDeath) {
        Write-Output "  >> PHASE 1 -> PHASE 2: Eye of C'Thun killed"
        foreach ($ed in $eyeDeath) { Write-Output "     $ed" }
    } else {
        Write-Output "  >> PHASE 2 NEVER REACHED: Eye of C'Thun survived"
    }
    Write-Output ""

    # Dark Glare deaths
    Write-Output "  --- DARK GLARE ANALYSIS ---"
    $dgLines = $lines | Where-Object { $_ -match 'Dark Glare' -and $_ -match 'hits.*for \d+' }
    $dgDeaths = @()
    $dgHits = 0
    $dgTotalDmg = 0
    foreach ($dg in $dgLines) {
        $dgHits++
        if ($dg -match 'hits (.+?) for (\d+)') {
            $dgTotalDmg += [int]$Matches[2]
        }
    }
    Write-Output "  Dark Glare hits: $dgHits (total damage: $dgTotalDmg)"

    # Deaths during Dark Glare windows
    $darkGlareStart = $null
    $darkGlareDeaths = [System.Collections.Generic.List[string]]::new()
    foreach ($l in $lines) {
        if ($l -match 'Dark Glare' -and $null -eq $darkGlareStart) {
            $tm = [regex]::Match($l, '(\d{2}:\d{2}:\d{2})')
            if ($tm.Success) { $darkGlareStart = [TimeSpan]::Parse($tm.Groups[1].Value) }
        }
        if ($null -ne $darkGlareStart -and $l -match ' dies\.$') {
            $tm2 = [regex]::Match($l, '(\d{2}:\d{2}:\d{2})')
            if ($tm2.Success) {
                $deathTs = [TimeSpan]::Parse($tm2.Groups[1].Value)
                if (($deathTs - $darkGlareStart).TotalSeconds -lt 35 -and ($deathTs - $darkGlareStart).TotalSeconds -ge 0) {
                    if ($l -notmatch 'Tentacle|Trigger') {
                        $darkGlareDeaths.Add($l)
                    }
                } else {
                    $darkGlareStart = $null
                }
            }
        }
    }
    if ($darkGlareDeaths.Count -gt 0) {
        Write-Output "  Deaths DURING Dark Glare:"
        foreach ($dd in $darkGlareDeaths) { Write-Output "    $dd" }
    }
    Write-Output ""

    # Eye Beam chain damage (players too close together)
    Write-Output "  --- EYE BEAM CHAIN ANALYSIS ---"
    $chainEvents = @{}
    foreach ($l in $lines) {
        if ($l -match 'Eye Beam.*hits (.+?) for (\d+)') {
            $target = $Matches[1]
            $dmg = [int]$Matches[2]
            if (-not $chainEvents.ContainsKey($target)) {
                $chainEvents[$target] = @{ Hits = 0; TotalDmg = 0; MaxHit = 0 }
            }
            $chainEvents[$target].Hits++
            $chainEvents[$target].TotalDmg += $dmg
            if ($dmg -gt $chainEvents[$target].MaxHit) { $chainEvents[$target].MaxHit = $dmg }
        }
    }
    $sorted = $chainEvents.GetEnumerator() | Sort-Object { $_.Value.TotalDmg } -Descending
    foreach ($s in $sorted | Select-Object -First 10) {
        Write-Output "    $($s.Key): $($s.Value.Hits) hits, $($s.Value.TotalDmg) total dmg, max hit: $($s.Value.MaxHit)"
    }
    Write-Output ""

    # Ground Rupture (spreading damage)
    Write-Output "  --- GROUND RUPTURE (P2 tentacle spawns) ---"
    $ruptures = $lines | Where-Object { $_ -match 'Ground Rupture.*hits.*for \d+' }
    $ruptureTargets = @{}
    foreach ($r in $ruptures) {
        if ($r -match 'hits (.+?) for (\d+)') {
            $target = $Matches[1]
            if (-not $ruptureTargets.ContainsKey($target)) { $ruptureTargets[$target] = 0 }
            $ruptureTargets[$target] += [int]$Matches[2]
        }
    }
    if ($ruptureTargets.Count -gt 0) {
        $ruptureTargets.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
            Write-Output "    $($_.Key): $($_.Value) total Ground Rupture dmg"
        }
    } else {
        Write-Output "    No Ground Rupture damage detected"
    }
    Write-Output ""

    # Flesh Tentacle kills (needed to weaken C'Thun)
    Write-Output "  --- FLESH TENTACLE STATUS ---"
    $fleshKills = $lines | Where-Object { $_ -match 'Flesh Tentacle dies' }
    Write-Output "  Flesh Tentacles killed: $($fleshKills.Count)"
    foreach ($fk in $fleshKills) { Write-Output "    $fk" }

    # Stomach events
    $stomachIn = ($lines | Where-Object { $_ -match 'Summon Mouth Tentacle' }).Count
    $stomachOut = ($lines | Where-Object { $_ -match 'Exit Stomach' }).Count
    Write-Output "  Swallowed by C'Thun: ~$stomachIn times"
    Write-Output "  Exit Stomach events: $stomachOut"
    Write-Output ""

    # Player deaths with context
    Write-Output "  --- ALL PLAYER DEATHS ---"
    $playerDeaths = $lines | Where-Object { $_ -match ' dies\.$' -and $_ -notmatch 'Tentacle|Trigger|Infernal|Shadow \(' }
    foreach ($pd in $playerDeaths) {
        # Get name
        if ($pd -match '(\d{2}:\d{2}:\d{2}).+\s+(.+) dies\.$') {
            $deathTime = $Matches[1]
            $who = $Matches[2]
            Write-Output "    [$deathTime] $who"
        }
    }
    Write-Output ""
    Write-Output ""
}

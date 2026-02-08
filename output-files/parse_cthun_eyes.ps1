$logPath = 'C:\TurtleWoW\Logs\WoWCombatLog.txt'
$reader = [System.IO.StreamReader]::new($logPath, [System.Text.Encoding]::UTF8, $true, 65536)

# Collect ALL combat lines during C'Thun attempts
$attempts = @{}
$currentAttempt = 0
$lastCthunTime = $null

while ($null -ne ($line = $reader.ReadLine())) {
    if (-not ($line -match '^2/6 (1[89]|2[0-9]):')) { continue }
    $timeMatch = [regex]::Match($line, '^2/6 (\d{2}:\d{2}:\d{2}\.\d{3})')
    if (-not $timeMatch.Success) { continue }
    $timeStr = $timeMatch.Groups[1].Value
    $ts = [TimeSpan]::Parse($timeStr.Split('.')[0])

    $isCthun = $line -match "C'Thun" -or $line -match "Eye of C" -or $line -match "Tentacle" -or $line -match "Dark Glare"

    if ($isCthun) {
        if ($null -eq $lastCthunTime -or ($ts - $lastCthunTime).TotalSeconds -gt 90) {
            $currentAttempt++
            $attempts[$currentAttempt] = [System.Collections.Generic.List[string]]::new()
        }
        $lastCthunTime = $ts
    }

    if ($currentAttempt -gt 0 -and $null -ne $lastCthunTime -and ($ts - $lastCthunTime).TotalSeconds -lt 30) {
        # Capture eye beam, tentacle, and death lines
        if ($line -match 'Eye Beam' -or $line -match 'Eye Tentacle' -or $line -match 'Giant Eye' -or $line -match 'Giant Claw' -or $line -match 'Mind Flay' -or $line -match ' dies\.' -or $line -match 'Dark Glare' -or $line -match 'Ground Rupture' -or $line -match 'Transform.*Phase' -or $line -match 'Cthun Vulnerable' -or $line -match 'Flesh Tentacle') {
            $attempts[$currentAttempt].Add($line)
        }
    }
}
$reader.Close()

# Replace "your" with "Meltyougood" awareness
Write-Output "NOTE: 'you/your' in logs = Meltyougood"
Write-Output ""

foreach ($aN in 1..$currentAttempt) {
    $lines = $attempts[$aN]
    Write-Output "============================================================"
    Write-Output "  ATTEMPT #$aN"
    Write-Output "============================================================"

    # ---- PHASE 1: Eye of C'Thun Eye Beam Chain Analysis ----
    Write-Output ""
    Write-Output "  === PHASE 1: Eye of C'Thun Eye Beam Chains ==="
    # Eye Beam from "Eye of C'Thun" - group hits by timestamp to find chains
    $p1Beams = @{}
    foreach ($l in $lines) {
        if ($l -match "Eye of C'Thun.*Eye Beam.*hits (.+?) for (\d+)") {
            $target = $Matches[1]
            $dmg = [int]$Matches[2]
            $tm = [regex]::Match($l, '(\d{2}:\d{2}:\d{2}\.\d{3})')
            if ($tm.Success) {
                $t = $tm.Groups[1].Value
                # Group by second (chains happen within same second)
                $sec = $t.Substring(0, 8)
                if (-not $p1Beams.ContainsKey($sec)) { $p1Beams[$sec] = [System.Collections.Generic.List[hashtable]]::new() }
                $p1Beams[$sec].Add(@{ Target = $target; Damage = $dmg; Time = $t })
            }
        }
    }

    $chainCount = 0
    $chainTargets = @{}
    foreach ($sec in ($p1Beams.Keys | Sort-Object)) {
        $hits = $p1Beams[$sec]
        if ($hits.Count -gt 1) {
            $chainCount++
            $names = ($hits | ForEach-Object { "$($_.Target)($($_.Damage))" }) -join ' -> '
            Write-Output "    CHAIN @ ${sec}: $names"
            foreach ($h in $hits) {
                if (-not $chainTargets.ContainsKey($h.Target)) { $chainTargets[$h.Target] = @{ ChainHits = 0; TotalDmg = 0; MaxHit = 0 } }
                $chainTargets[$h.Target].ChainHits++
                $chainTargets[$h.Target].TotalDmg += $h.Damage
                if ($h.Damage -gt $chainTargets[$h.Target].MaxHit) { $chainTargets[$h.Target].MaxHit = $h.Damage }
            }
        } elseif ($hits.Count -eq 1) {
            $h = $hits[0]
            Write-Output "    Single @ ${sec}: $($h.Target)($($h.Damage))"
        }
    }
    if ($chainTargets.Count -gt 0) {
        Write-Output ""
        Write-Output "    P1 Chain Beam Victims (sorted by total damage):"
        $chainTargets.GetEnumerator() | Sort-Object { $_.Value.TotalDmg } -Descending | ForEach-Object {
            Write-Output "      $($_.Key): $($_.Value.ChainHits) chain hits, $($_.Value.TotalDmg) total, max=$($_.Value.MaxHit)"
        }
    }

    # ---- PHASE 2: Giant Eye Tentacle Analysis ----
    Write-Output ""
    Write-Output "  === PHASE 2: Giant Eye Tentacle Eye Beams ==="
    $giantEyeBeams = @{}
    foreach ($l in $lines) {
        if ($l -match "Giant Eye Tentacle.*Eye Beam.*hits (.+?) for (\d+)") {
            $target = $Matches[1]
            $dmg = [int]$Matches[2]
            if (-not $giantEyeBeams.ContainsKey($target)) { $giantEyeBeams[$target] = @{ Hits = 0; TotalDmg = 0; MaxHit = 0 } }
            $giantEyeBeams[$target].Hits++
            $giantEyeBeams[$target].TotalDmg += $dmg
            if ($dmg -gt $giantEyeBeams[$target].MaxHit) { $giantEyeBeams[$target].MaxHit = $dmg }
        }
    }
    if ($giantEyeBeams.Count -gt 0) {
        $giantEyeBeams.GetEnumerator() | Sort-Object { $_.Value.TotalDmg } -Descending | ForEach-Object {
            Write-Output "    $($_.Key): $($_.Value.Hits) hits, $($_.Value.TotalDmg) total, max=$($_.Value.MaxHit)"
        }
    } else {
        Write-Output "    No Giant Eye Tentacle Eye Beam hits"
    }

    # Giant Eye Tentacle - who it TARGETED (begins to cast on)
    Write-Output ""
    Write-Output "  === Giant Eye Tentacle TARGETS (begins to cast Eye Beam on) ==="
    $giantTargeted = @{}
    foreach ($l in $lines) {
        if ($l -match "Giant Eye Tentacle begins to cast Eye Beam\(26134\) on (.+?)\.") {
            $target = $Matches[1]
            if (-not $giantTargeted.ContainsKey($target)) { $giantTargeted[$target] = 0 }
            $giantTargeted[$target]++
        }
    }
    if ($giantTargeted.Count -gt 0) {
        $giantTargeted.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
            Write-Output "    $($_.Key): targeted $($_.Value) times"
        }
    }

    # ---- Small Eye Tentacle Mind Flay analysis ----
    Write-Output ""
    Write-Output "  === Small Eye Tentacles: Mind Flay Targets ==="
    $mindFlayTargets = @{}
    $mindFlayImmune = @{}
    foreach ($l in $lines) {
        if ($l -match "Eye Tentacle.*Mind Flay.*on (.+?)\." -and $l -notmatch 'Giant') {
            $target = $Matches[1]
            if ($l -match 'immune') {
                if (-not $mindFlayImmune.ContainsKey($target)) { $mindFlayImmune[$target] = 0 }
                $mindFlayImmune[$target]++
            } else {
                if (-not $mindFlayTargets.ContainsKey($target)) { $mindFlayTargets[$target] = 0 }
                $mindFlayTargets[$target]++
            }
        }
    }
    if ($mindFlayTargets.Count -gt 0) {
        Write-Output "    Afflicted:"
        $mindFlayTargets.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
            Write-Output "      $($_.Key): $($_.Value) casts"
        }
    }
    if ($mindFlayImmune.Count -gt 0) {
        Write-Output "    Immune (resisted):"
        $mindFlayImmune.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object {
            Write-Output "      $($_.Key): $($_.Value) immune"
        }
    }

    # ---- Dark Glare: who got hit? ----
    Write-Output ""
    Write-Output "  === Dark Glare Damage ==="
    $dgTargets = @{}
    foreach ($l in $lines) {
        if ($l -match 'Dark Glare.*hits (.+?) for (\d+)') {
            $target = $Matches[1]
            $dmg = [int]$Matches[2]
            if (-not $dgTargets.ContainsKey($target)) { $dgTargets[$target] = @{ Hits = 0; TotalDmg = 0 } }
            $dgTargets[$target].Hits++
            $dgTargets[$target].TotalDmg += $dmg
        }
    }
    if ($dgTargets.Count -gt 0) {
        $dgTargets.GetEnumerator() | Sort-Object { $_.Value.TotalDmg } -Descending | ForEach-Object {
            Write-Output "    $($_.Key): $($_.Value.Hits) ticks, $($_.Value.TotalDmg) total dmg"
        }
    } else {
        Write-Output "    No Dark Glare damage hits recorded"
    }

    # ---- Deaths with cause ----
    Write-Output ""
    Write-Output "  === Deaths ==="
    foreach ($l in $lines) {
        if ($l -match ' dies\.$' -and $l -notmatch 'Tentacle|Trigger') {
            $tm = [regex]::Match($l, '(\d{2}:\d{2}:\d{2})')
            if ($tm.Success) { Write-Output "    $l" }
        }
    }

    Write-Output ""
    Write-Output ""
}

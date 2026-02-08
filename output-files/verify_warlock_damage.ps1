# Detailed Warlock Damage Parser with Verification
$logFile = "C:\Users\ryanr\Downloads\upload_36575\TurtLog-2025-10-18T04-28.txt"

# Track each warlock's damage with detailed breakdown
$warlockData = @{
    'Slxtduck' = @{
        Total = 0
        Abilities = @{}
        HitCount = 0
        CritCount = 0
        SampleLines = @()
    }
    'Meltyougood' = @{
        Total = 0
        Abilities = @{}
        HitCount = 0
        CritCount = 0
        SampleLines = @()
    }
    'Wheener' = @{
        Total = 0
        Abilities = @{}
        HitCount = 0
        CritCount = 0
        SampleLines = @()
    }
}

Write-Host "Parsing combat log with detailed tracking..."
Write-Host ""

$lineCount = 0
Get-Content $logFile | ForEach-Object {
    $line = $_
    $lineCount++

    if ($lineCount % 100000 -eq 0) {
        Write-Host "Processed $lineCount lines..."
    }

    # Check each warlock
    foreach ($warlock in $warlockData.Keys) {
        $data = $warlockData[$warlock]

        # Match damage patterns - be very specific
        # Pattern 1: "Warlock 's SpellName hits Target for 123 damage"
        # Pattern 2: "Warlock 's SpellName crits Target for 123 damage"
        # Pattern 3: "PetName (Warlock) hits Target for 123"
        # Pattern 4: "Warlock 's SpellName hits Target for 123."

        $matched = $false
        $damage = 0
        $ability = ""
        $isCrit = $false

        # Direct spell damage with "damage" keyword
        if ($line -match "$warlock 's ([^h]+?)\s+(hits|crits)\s+.+?\s+for\s+(\d+)\s+\w*\s*damage") {
            $ability = $Matches[1].Trim()
            $isCrit = $Matches[2] -eq "crits"
            $damage = [int]$Matches[3]
            $matched = $true
        }
        # Direct melee/auto attacks (no "damage" keyword)
        elseif ($line -match "$warlock 's ([^h]+?)\s+(hits|crits)\s+.+?\s+for\s+(\d+)\.?\s*$") {
            $ability = $Matches[1].Trim()
            $isCrit = $Matches[2] -eq "crits"
            $damage = [int]$Matches[3]
            $matched = $true
        }
        # Pet damage with owner in parentheses
        elseif ($line -match "\(${warlock}\)\s+(hits|crits)\s+.+?\s+for\s+(\d+)") {
            $ability = "Pet Auto Attack"
            $isCrit = $Matches[1] -eq "crits"
            $damage = [int]$Matches[2]
            $matched = $true
        }
        # Pet spell damage
        elseif ($line -match "\(${warlock}\) 's ([^h]+?)\s+(hits|crits)\s+.+?\s+for\s+(\d+)") {
            $ability = "Pet: " + $Matches[1].Trim()
            $isCrit = $Matches[2] -eq "crits"
            $damage = [int]$Matches[3]
            $matched = $true
        }

        if ($matched -and $damage -gt 0) {
            $data.Total += $damage

            # Track ability breakdown
            if (-not $data.Abilities.ContainsKey($ability)) {
                $data.Abilities[$ability] = 0
            }
            $data.Abilities[$ability] += $damage

            # Track hit/crit counts
            if ($isCrit) {
                $data.CritCount++
            } else {
                $data.HitCount++
            }

            # Store sample lines (first 10 per warlock)
            if ($data.SampleLines.Count -lt 10) {
                $data.SampleLines += $line
            }
        }
    }
}

Write-Host "`n=========================================="
Write-Host "DETAILED WARLOCK DAMAGE VERIFICATION"
Write-Host "=========================================="
Write-Host ""

foreach ($warlock in ($warlockData.Keys | Sort-Object)) {
    $data = $warlockData[$warlock]

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  $warlock"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  Total Damage: $($data.Total.ToString('N0'))"
    Write-Host "  Total Hits: $($data.HitCount)"
    Write-Host "  Total Crits: $($data.CritCount)"
    Write-Host "  Total Events: $($data.HitCount + $data.CritCount)"
    Write-Host ""

    Write-Host "  Top 10 Abilities by Damage:"
    $topAbilities = $data.Abilities.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10
    foreach ($ability in $topAbilities) {
        Write-Host ("    {0,-30} {1,12:N0}" -f $ability.Key, $ability.Value)
    }

    Write-Host ""
    Write-Host "  Sample Damage Lines (first 10):"
    foreach ($sample in $data.SampleLines) {
        Write-Host "    $sample"
    }
    Write-Host ""
}

Write-Host "=========================================="
Write-Host "Total lines processed: $lineCount"
Write-Host "=========================================="
Write-Host ""
Write-Host "TO VERIFY: You can manually check the sample lines above"
Write-Host "or grep the log file for specific warlock names."

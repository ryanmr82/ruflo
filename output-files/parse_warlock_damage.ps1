# Parse Warlock Damage from TurtLog
$logFile = "C:\Users\ryanr\Downloads\upload_36575\TurtLog-2025-10-18T04-28.txt"

# Initialize damage totals
$warlocks = @{
    'Slxtduck' = 0
    'Meltyougood' = 0
    'Wheener' = 0
}

# Also track pet names for each warlock
$petNames = @('Bryyla', 'Choloz', 'Jhomkrit', 'Geltal')

Write-Host "Parsing combat log for warlock damage..."
Write-Host "This may take a moment for the large file..."

$lineCount = 0
Get-Content $logFile | ForEach-Object {
    $line = $_
    $lineCount++

    if ($lineCount % 100000 -eq 0) {
        Write-Host "Processed $lineCount lines..."
    }

    foreach ($warlock in $warlocks.Keys) {
        # Match patterns:
        # 1. Warlock's direct damage: "Warlock hits/crits Target for X"
        # 2. Warlock's spell damage: "Warlock 's SpellName hits/crits Target for X damage"
        # 3. Pet damage: "PetName (Warlock) hits/crits" or "Warlock 's Attack (pet) hits"

        # Pattern 1 & 2: Direct and spell damage
        if ($line -match "$warlock(?:'s| (?:'s )?).*?(?:hits|crits).*?for (\d+)") {
            $damage = [int]$Matches[1]
            $warlocks[$warlock] += $damage
        }
        # Pattern for pet damage with owner in parentheses
        elseif ($line -match "\(${warlock}\).*?(?:hits|crits).*?for (\d+)") {
            $damage = [int]$Matches[1]
            $warlocks[$warlock] += $damage
        }
    }
}

Write-Host "`n==================================="
Write-Host "WARLOCK TOTAL DAMAGE SUMMARY"
Write-Host "==================================="
Write-Host ""

$sorted = $warlocks.GetEnumerator() | Sort-Object Value -Descending

foreach ($entry in $sorted) {
    $dmg = "{0:N0}" -f $entry.Value
    Write-Host "$($entry.Key): $dmg damage"
}

Write-Host "`nTotal lines processed: $lineCount"

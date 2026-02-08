# Check exact format of category 29
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$lines = Get-Content $file
$inCat29 = $false
$lineNum = 0
$cat29Start = 0

foreach ($line in $lines) {
    $lineNum++
    if ($line -match '\[29\] = \{') {
        $inCat29 = $true
        $cat29Start = $lineNum
        Write-Host "=== Category 29 starts at line $lineNum ==="
    }
    if ($inCat29) {
        Write-Host "${lineNum}: $line"
        if ($line -match '^\s*\},?\s*$' -and $lineNum -gt $cat29Start) {
            break
        }
    }
}

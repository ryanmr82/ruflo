# Check sequence numbers for Keys, Transportation, and Resist categories
$file = "C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/Bagshui.lua"
Set-ItemProperty $file -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

$lines = Get-Content $file

$categoriesToFind = @("Keys", "Transportation", "Shadow Resist", "Frost Resist", "Nature Resist", "Fire Resist")

Write-Host "=== CATEGORY SEQUENCES ==="

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*\[(\d+)\] = \{') {
        $catNum = $matches[1]
        # Look for name and sequence in next lines
        $name = ""
        $seq = ""
        for ($j = $i + 1; $j -lt [Math]::Min($i + 15, $lines.Count); $j++) {
            if ($lines[$j] -match '\["name"\] = "([^"]+)"') {
                $name = $matches[1]
            }
            if ($lines[$j] -match '\["sequence"\] = (\d+)') {
                $seq = $matches[1]
            }
            if ($lines[$j] -match '^\s*\},?\s*$') {
                break
            }
        }

        if ($categoriesToFind -contains $name) {
            Write-Host "Category $catNum : $name - Sequence: $seq"
        }
    }
}

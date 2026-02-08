# Windows PATH Diagnostic Script for Claude-Flow Hive System
# Version: 1.0
# Purpose: Comprehensive PATH analysis and troubleshooting

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Claude-Flow PATH Diagnostic Tool v1.0   " -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

# Function to analyze PATH variable
function Analyze-PathVariable {
    param(
        [string]$PathType,
        [string]$PathValue
    )
    
    Write-Host "`n[$PathType PATH Analysis]" -ForegroundColor Green
    Write-Host "Total Length: $($PathValue.Length) characters" -ForegroundColor White
    
    $paths = $PathValue -split ';' | Where-Object { $_ -ne '' }
    Write-Host "Number of Entries: $($paths.Count)" -ForegroundColor White
    
    # Check for duplicates
    $duplicates = $paths | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($duplicates) {
        Write-Host "`nDuplicates Found:" -ForegroundColor Red
        $duplicates | ForEach-Object {
            Write-Host "  - $($_.Name) (appears $($_.Count) times)" -ForegroundColor Yellow
        }
    }
    
    # Check for non-existent paths
    $nonExistent = @()
    foreach ($path in $paths) {
        if (-not (Test-Path $path)) {
            $nonExistent += $path
        }
    }
    
    if ($nonExistent) {
        Write-Host "`nNon-Existent Paths:" -ForegroundColor Red
        $nonExistent | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Yellow
        }
    }
    
    # Check for Claude-Flow specific entries
    $claudeFlowPaths = $paths | Where-Object { $_ -match 'claude|flow|hive|swarm|mcp' }
    if ($claudeFlowPaths) {
        Write-Host "`nClaude-Flow Related Paths:" -ForegroundColor Cyan
        $claudeFlowPaths | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor White
        }
    }
    
    return @{
        TotalLength = $PathValue.Length
        EntryCount = $paths.Count
        Duplicates = $duplicates
        NonExistent = $nonExistent
        ClaudeFlowPaths = $claudeFlowPaths
        AllPaths = $paths
    }
}

# Get System PATH
Write-Host "Retrieving System PATH..." -ForegroundColor Yellow
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$systemAnalysis = Analyze-PathVariable -PathType "SYSTEM" -PathValue $systemPath

# Get User PATH
Write-Host "`nRetrieving User PATH..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userAnalysis = Analyze-PathVariable -PathType "USER" -PathValue $userPath

# Combined PATH Analysis
Write-Host "`n[COMBINED PATH Analysis]" -ForegroundColor Magenta
$combinedPath = $env:Path
$combinedAnalysis = Analyze-PathVariable -PathType "COMBINED" -PathValue $combinedPath

# PATH Length Warnings
Write-Host "`n[PATH Length Status]" -ForegroundColor Cyan
if ($combinedAnalysis.TotalLength -gt 2048) {
    Write-Host "WARNING: Combined PATH exceeds 2048 characters!" -ForegroundColor Red
    Write-Host "This may cause issues on older Windows systems." -ForegroundColor Yellow
}
if ($combinedAnalysis.TotalLength -gt 8191) {
    Write-Host "CRITICAL: Combined PATH exceeds Windows limit (8191)!" -ForegroundColor Red
    Write-Host "Some applications may fail to read PATH correctly." -ForegroundColor Red
}

# Generate Report
Write-Host "`n[Summary Report]" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor White
Write-Host "System PATH Entries: $($systemAnalysis.EntryCount)" -ForegroundColor White
Write-Host "User PATH Entries: $($userAnalysis.EntryCount)" -ForegroundColor White
Write-Host "Combined PATH Entries: $($combinedAnalysis.EntryCount)" -ForegroundColor White
Write-Host "Total Duplicates: $(($combinedAnalysis.Duplicates | Measure-Object).Count)" -ForegroundColor Yellow
Write-Host "Non-Existent Paths: $(($combinedAnalysis.NonExistent | Measure-Object).Count)" -ForegroundColor Red
Write-Host "Claude-Flow Paths: $(($combinedAnalysis.ClaudeFlowPaths | Measure-Object).Count)" -ForegroundColor Cyan

# Export detailed report
$reportPath = ".\path-diagnostic-report.txt"
Write-Host "`nExporting detailed report to: $reportPath" -ForegroundColor Green

$report = @"
Claude-Flow PATH Diagnostic Report
Generated: $(Get-Date)
=====================================

SYSTEM PATH ($($systemAnalysis.EntryCount) entries, $($systemPath.Length) chars):
$($systemAnalysis.AllPaths -join "`n")

USER PATH ($($userAnalysis.EntryCount) entries, $($userPath.Length) chars):
$($userAnalysis.AllPaths -join "`n")

DUPLICATES FOUND:
$($combinedAnalysis.Duplicates | ForEach-Object { "$($_.Name) (appears $($_.Count) times)" } | Out-String)

NON-EXISTENT PATHS:
$($combinedAnalysis.NonExistent -join "`n")

CLAUDE-FLOW RELATED PATHS:
$($combinedAnalysis.ClaudeFlowPaths -join "`n")

RECOMMENDATIONS:
1. Remove duplicate PATH entries to optimize performance
2. Clean up non-existent paths to prevent errors
3. Ensure Claude-Flow paths are properly configured
4. Consider PATH length if approaching limits
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "Report saved successfully!" -ForegroundColor Green
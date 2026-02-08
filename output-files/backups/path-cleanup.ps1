# Windows PATH Cleanup Tool for Claude-Flow
# Version: 1.0
# Purpose: Clean and optimize PATH environment variables

param(
    [switch]$DryRun = $true,
    [switch]$RemoveDuplicates = $false,
    [switch]$RemoveNonExistent = $false,
    [switch]$BackupFirst = $true,
    [switch]$Interactive = $true
)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "     Claude-Flow PATH Cleanup Tool v1.0    " -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator!" -ForegroundColor Red
    Write-Host "System PATH modifications will require admin privileges." -ForegroundColor Yellow
    Write-Host ""
}

# Backup function
function Backup-PathVariables {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".\PATH_Backup_$timestamp.json"
    
    $backup = @{
        Timestamp = Get-Date
        SystemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
        CombinedPath = $env:Path
    }
    
    $backup | ConvertTo-Json | Out-File -FilePath $backupFile -Encoding UTF8
    Write-Host "Backup saved to: $backupFile" -ForegroundColor Green
    return $backupFile
}

# Clean PATH function
function Clean-PathVariable {
    param(
        [string]$PathValue,
        [string]$PathType,
        [bool]$RemoveDups,
        [bool]$RemoveNonEx
    )
    
    $paths = $PathValue -split ';' | Where-Object { $_ -ne '' }
    $originalCount = $paths.Count
    $cleanedPaths = @()
    $seen = @{}
    $removed = @()
    
    foreach ($path in $paths) {
        $skip = $false
        
        # Check for duplicates
        if ($RemoveDups -and $seen.ContainsKey($path.ToLower())) {
            $removed += "Duplicate: $path"
            $skip = $true
        }
        
        # Check for non-existent paths
        if ($RemoveNonEx -and -not $skip -and -not (Test-Path $path)) {
            # Exception for common system variables that might not resolve
            if ($path -notmatch '%.*%') {
                $removed += "Non-existent: $path"
                $skip = $true
            }
        }
        
        if (-not $skip) {
            $cleanedPaths += $path
            $seen[$path.ToLower()] = $true
        }
    }
    
    $newPath = $cleanedPaths -join ';'
    
    return @{
        Original = $PathValue
        Cleaned = $newPath
        OriginalCount = $originalCount
        CleanedCount = $cleanedPaths.Count
        Removed = $removed
        Savings = $PathValue.Length - $newPath.Length
    }
}

# Main execution
if ($BackupFirst) {
    Write-Host "Creating backup..." -ForegroundColor Yellow
    $backupFile = Backup-PathVariables
    Write-Host ""
}

# Analyze System PATH
Write-Host "Analyzing System PATH..." -ForegroundColor Cyan
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$systemCleaned = Clean-PathVariable -PathValue $systemPath -PathType "System" -RemoveDups $RemoveDuplicates -RemoveNonEx $RemoveNonExistent

Write-Host "System PATH Analysis:" -ForegroundColor White
Write-Host "  Original entries: $($systemCleaned.OriginalCount)" -ForegroundColor White
Write-Host "  Cleaned entries: $($systemCleaned.CleanedCount)" -ForegroundColor White
Write-Host "  Entries removed: $($systemCleaned.OriginalCount - $systemCleaned.CleanedCount)" -ForegroundColor Yellow
Write-Host "  Characters saved: $($systemCleaned.Savings)" -ForegroundColor Green

if ($systemCleaned.Removed) {
    Write-Host "`n  Removed entries:" -ForegroundColor Red
    $systemCleaned.Removed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
}

# Analyze User PATH
Write-Host "`nAnalyzing User PATH..." -ForegroundColor Cyan
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userCleaned = Clean-PathVariable -PathValue $userPath -PathType "User" -RemoveDups $RemoveDuplicates -RemoveNonEx $RemoveNonExistent

Write-Host "User PATH Analysis:" -ForegroundColor White
Write-Host "  Original entries: $($userCleaned.OriginalCount)" -ForegroundColor White
Write-Host "  Cleaned entries: $($userCleaned.CleanedCount)" -ForegroundColor White
Write-Host "  Entries removed: $($userCleaned.OriginalCount - $userCleaned.CleanedCount)" -ForegroundColor Yellow
Write-Host "  Characters saved: $($userCleaned.Savings)" -ForegroundColor Green

if ($userCleaned.Removed) {
    Write-Host "`n  Removed entries:" -ForegroundColor Red
    $userCleaned.Removed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
}

# Apply changes
if ($DryRun) {
    Write-Host "`n[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
    Write-Host "To apply changes, run with -DryRun:`$false" -ForegroundColor White
} else {
    Write-Host "`n[APPLYING CHANGES]" -ForegroundColor Red
    
    if ($Interactive) {
        $confirm = Read-Host "Do you want to apply these changes? (Y/N)"
        if ($confirm -ne 'Y') {
            Write-Host "Operation cancelled." -ForegroundColor Yellow
            exit
        }
    }
    
    # Apply System PATH changes (requires admin)
    if ($isAdmin -and ($systemCleaned.OriginalCount -ne $systemCleaned.CleanedCount)) {
        try {
            [Environment]::SetEnvironmentVariable("Path", $systemCleaned.Cleaned, "Machine")
            Write-Host "System PATH updated successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to update System PATH: $_" -ForegroundColor Red
        }
    } elseif (-not $isAdmin -and ($systemCleaned.OriginalCount -ne $systemCleaned.CleanedCount)) {
        Write-Host "Skipping System PATH update (requires admin privileges)" -ForegroundColor Yellow
    }
    
    # Apply User PATH changes
    if ($userCleaned.OriginalCount -ne $userCleaned.CleanedCount) {
        try {
            [Environment]::SetEnvironmentVariable("Path", $userCleaned.Cleaned, "User")
            Write-Host "User PATH updated successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to update User PATH: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "`nChanges applied. You may need to restart applications for changes to take effect." -ForegroundColor Cyan
}

# Generate cleanup report
$reportPath = ".\path-cleanup-report.txt"
$report = @"
Claude-Flow PATH Cleanup Report
Generated: $(Get-Date)
Mode: $(if ($DryRun) { "DRY RUN" } else { "APPLIED" })
=====================================

OPTIONS USED:
- Remove Duplicates: $RemoveDuplicates
- Remove Non-Existent: $RemoveNonExistent
- Backup Created: $BackupFirst $(if ($BackupFirst) { "($backupFile)" })

SYSTEM PATH CLEANUP:
- Original Entries: $($systemCleaned.OriginalCount)
- Cleaned Entries: $($systemCleaned.CleanedCount)
- Removed: $($systemCleaned.OriginalCount - $systemCleaned.CleanedCount)
- Characters Saved: $($systemCleaned.Savings)

USER PATH CLEANUP:
- Original Entries: $($userCleaned.OriginalCount)
- Cleaned Entries: $($userCleaned.CleanedCount)
- Removed: $($userCleaned.OriginalCount - $userCleaned.CleanedCount)
- Characters Saved: $($userCleaned.Savings)

TOTAL SAVINGS:
- Entries Removed: $(($systemCleaned.OriginalCount - $systemCleaned.CleanedCount) + ($userCleaned.OriginalCount - $userCleaned.CleanedCount))
- Characters Saved: $($systemCleaned.Savings + $userCleaned.Savings)

REMOVED ENTRIES:
System PATH:
$($systemCleaned.Removed -join "`n")

User PATH:
$($userCleaned.Removed -join "`n")
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`nCleanup report saved to: $reportPath" -ForegroundColor Green
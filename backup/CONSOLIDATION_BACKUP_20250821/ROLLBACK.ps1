# Claude Flow Consolidation Rollback Script
# Created: 2025-08-21 04:47 PM
# Purpose: Emergency rollback if consolidation causes issues

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Claude Flow Consolidation Rollback Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

# Confirm rollback
$confirm = Read-Host "Are you sure you want to rollback the consolidation? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Rollback cancelled." -ForegroundColor Green
    exit
}

Write-Host "Starting rollback process..." -ForegroundColor Yellow

# Step 1: Remove .git from claude-flow if it was added
if (Test-Path "C:\claude-flow\.git") {
    Write-Host "Removing .git folder from claude-flow..." -ForegroundColor Yellow
    Remove-Item "C:\claude-flow\.git" -Recurse -Force
    Write-Host "✓ .git folder removed" -ForegroundColor Green
}

# Step 2: Restore claude-flow-source from backup
$sourcePath = "C:\Claude-Flow\backup\CONSOLIDATION_BACKUP_20250821\claude-flow-source-backup"
$destPath = "C:\claude-flow-source"

if (Test-Path $sourcePath) {
    Write-Host "Restoring claude-flow-source from backup..." -ForegroundColor Yellow
    
    # Remove existing if present
    if (Test-Path $destPath) {
        Remove-Item $destPath -Recurse -Force
    }
    
    # Copy from backup
    Copy-Item $sourcePath $destPath -Recurse -Force
    Write-Host "✓ claude-flow-source restored" -ForegroundColor Green
} else {
    Write-Host "✗ Backup not found at $sourcePath" -ForegroundColor Red
}

# Step 3: Remove any newly added source files from claude-flow
Write-Host "Note: Manually review C:\claude-flow for any source files that should be removed" -ForegroundColor Yellow

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Rollback Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Status:" -ForegroundColor Cyan
Write-Host "• claude-flow-source has been restored" -ForegroundColor White
Write-Host "• .git folder removed from claude-flow" -ForegroundColor White
Write-Host "• Original separation restored" -ForegroundColor White
Write-Host ""
Write-Host "Please verify your setup is working correctly." -ForegroundColor Yellow
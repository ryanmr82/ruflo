# Claude-Flow Backup and Rollback Plan
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# This script creates a complete backup before applying fixes

# Set variables
$BaseDir = "C:\Claude-Flow"
$BackupDir = "$BaseDir\backup\CLAUDE_FLOW_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$ShortcutsDir = "$BaseDir\shortcuts"

# Create backup function
function Create-Backup {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Claude-Flow Complete Backup System" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create backup directory
    Write-Host "Creating backup directory: $BackupDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # 1. Backup all shortcuts and custom scripts
    Write-Host "`n[1/7] Backing up shortcuts and custom scripts..." -ForegroundColor Green
    $shortcuts = @(
        "hive-mind.bat",
        "hive-mind.ps1", 
        "hive-swarm.bat",
        "hive-swarm.ps1",
        "hive-mind-advanced.bat",
        "Hive-Mind-Advanced.ps1",
        "monitor-agents.ps1",
        "claude-wrapper.cmd",
        "hive_prompt.txt"
    )
    
    foreach ($shortcut in $shortcuts) {
        if (Test-Path "$BaseDir\$shortcut") {
            Copy-Item "$BaseDir\$shortcut" "$BackupDir\$shortcut" -Force
            Write-Host "  ✓ Backed up: $shortcut" -ForegroundColor Gray
        }
    }
    
    # 2. Backup npm global packages list
    Write-Host "`n[2/7] Backing up npm global packages list..." -ForegroundColor Green
    npm list -g --depth=0 > "$BackupDir\npm-global-packages.txt"
    Write-Host "  ✓ NPM packages list saved" -ForegroundColor Gray
    
    # 3. Backup Claude-Flow configuration
    Write-Host "`n[3/7] Backing up Claude-Flow configuration..." -ForegroundColor Green
    if (Test-Path "$env:USERPROFILE\.claude-flow") {
        Copy-Item "$env:USERPROFILE\.claude-flow" "$BackupDir\.claude-flow" -Recurse -Force
        Write-Host "  ✓ Configuration backed up" -ForegroundColor Gray
    }
    
    # 4. Backup environment variables
    Write-Host "`n[4/7] Backing up environment variables..." -ForegroundColor Green
    @{
        NODE_OPTIONS = $env:NODE_OPTIONS
        CLAUDE_FLOW_MAX_RETRIES = $env:CLAUDE_FLOW_MAX_RETRIES
        CLAUDE_FLOW_TIMEOUT = $env:CLAUDE_FLOW_TIMEOUT
        CLAUDE_FLOW_GRACEFUL_SHUTDOWN = $env:CLAUDE_FLOW_GRACEFUL_SHUTDOWN
        PATH = $env:PATH
    } | ConvertTo-Json | Out-File "$BackupDir\environment-variables.json"
    Write-Host "  ✓ Environment variables saved" -ForegroundColor Gray
    
    # 5. Check current Claude-Flow version
    Write-Host "`n[5/7] Recording current Claude-Flow version..." -ForegroundColor Green
    $currentVersion = npm list -g claude-flow 2>$null | Select-String "claude-flow@" | ForEach-Object { $_ -replace '.*claude-flow@', '' -replace '\s.*', '' }
    if ($currentVersion) {
        $currentVersion | Out-File "$BackupDir\claude-flow-version.txt"
        Write-Host "  ✓ Current version: $currentVersion" -ForegroundColor Gray
    }
    
    # 6. Create manifest file
    Write-Host "`n[6/7] Creating backup manifest..." -ForegroundColor Green
    @{
        BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        NodeVersion = node --version
        NpmVersion = npm --version
        ClaudeFlowVersion = $currentVersion
        BackupPath = $BackupDir
        Files = Get-ChildItem $BackupDir -Recurse | Select-Object Name, Length, LastWriteTime
    } | ConvertTo-Json | Out-File "$BackupDir\manifest.json"
    Write-Host "  ✓ Manifest created" -ForegroundColor Gray
    
    # 7. Create rollback script
    Write-Host "`n[7/7] Creating rollback script..." -ForegroundColor Green
    Create-RollbackScript -BackupDir $BackupDir
    Write-Host "  ✓ Rollback script created: $BackupDir\ROLLBACK.ps1" -ForegroundColor Gray
    
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "Backup Complete!" -ForegroundColor Green
    Write-Host "Backup Location: $BackupDir" -ForegroundColor Yellow
    Write-Host "To rollback, run: $BackupDir\ROLLBACK.ps1" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Green
    
    return $BackupDir
}

function Create-RollbackScript {
    param($BackupDir)
    
    $rollbackScript = @'
# Claude-Flow Rollback Script
# This script restores Claude-Flow to the backed-up state

Write-Host "==========================================" -ForegroundColor Red
Write-Host "Claude-Flow Rollback System" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""

$response = Read-Host "Are you sure you want to rollback? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Rollback cancelled." -ForegroundColor Yellow
    exit
}

$BackupDir = $PSScriptRoot
$BaseDir = "C:\Claude-Flow"

Write-Host "`nStarting rollback process..." -ForegroundColor Yellow

# 1. Kill any running Claude-Flow processes
Write-Host "[1/6] Stopping Claude-Flow processes..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*claude*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Uninstall current Claude-Flow
Write-Host "[2/6] Uninstalling current Claude-Flow..." -ForegroundColor Cyan
npm uninstall -g claude-flow 2>$null

# 3. Restore shortcuts and scripts
Write-Host "[3/6] Restoring shortcuts and scripts..." -ForegroundColor Cyan
$shortcuts = Get-ChildItem $BackupDir -Include "*.bat","*.ps1","*.cmd","*.txt" -File
foreach ($file in $shortcuts) {
    Copy-Item $file.FullName "$BaseDir\$($file.Name)" -Force
    Write-Host "  ✓ Restored: $($file.Name)" -ForegroundColor Gray
}

# 4. Restore Claude-Flow configuration
Write-Host "[4/6] Restoring configuration..." -ForegroundColor Cyan
if (Test-Path "$BackupDir\.claude-flow") {
    Remove-Item "$env:USERPROFILE\.claude-flow" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "$BackupDir\.claude-flow" "$env:USERPROFILE\.claude-flow" -Recurse -Force
    Write-Host "  ✓ Configuration restored" -ForegroundColor Gray
}

# 5. Reinstall original Claude-Flow version
Write-Host "[5/6] Reinstalling original Claude-Flow version..." -ForegroundColor Cyan
if (Test-Path "$BackupDir\claude-flow-version.txt") {
    $version = Get-Content "$BackupDir\claude-flow-version.txt"
    npm install -g "claude-flow@$version"
} else {
    npm install -g claude-flow
}

# 6. Restore environment variables
Write-Host "[6/6] Restoring environment variables..." -ForegroundColor Cyan
if (Test-Path "$BackupDir\environment-variables.json") {
    $envVars = Get-Content "$BackupDir\environment-variables.json" | ConvertFrom-Json
    if ($envVars.NODE_OPTIONS) {
        [Environment]::SetEnvironmentVariable("NODE_OPTIONS", $envVars.NODE_OPTIONS, "User")
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Rollback Complete!" -ForegroundColor Green
Write-Host "Claude-Flow has been restored to the backed-up state" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please restart your terminal for changes to take effect." -ForegroundColor Yellow
'@
    
    $rollbackScript | Out-File "$BackupDir\ROLLBACK.ps1" -Encoding UTF8
}

function Organize-Shortcuts {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Organizing Shortcuts" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Create centralized shortcuts directory
    if (!(Test-Path $ShortcutsDir)) {
        New-Item -ItemType Directory -Path $ShortcutsDir -Force | Out-Null
    }
    
    # Create subdirectories for organization
    $dirs = @(
        "$ShortcutsDir\batch",
        "$ShortcutsDir\powershell", 
        "$ShortcutsDir\configs",
        "$ShortcutsDir\backups"
    )
    
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    # Copy shortcuts to organized structure (don't move yet)
    Write-Host "Organizing shortcuts into categories..." -ForegroundColor Yellow
    
    # Batch files
    Get-ChildItem "$BaseDir\*.bat" | ForEach-Object {
        Copy-Item $_.FullName "$ShortcutsDir\batch\$($_.Name)" -Force
        Write-Host "  ✓ Organized: $($_.Name) -> batch/" -ForegroundColor Gray
    }
    
    # PowerShell scripts
    Get-ChildItem "$BaseDir\*.ps1" | ForEach-Object {
        Copy-Item $_.FullName "$ShortcutsDir\powershell\$($_.Name)" -Force
        Write-Host "  ✓ Organized: $($_.Name) -> powershell/" -ForegroundColor Gray
    }
    
    # Config files
    @("hive_prompt.txt", "*.json") | ForEach-Object {
        Get-ChildItem "$BaseDir\$_" -ErrorAction SilentlyContinue | ForEach-Object {
            Copy-Item $_.FullName "$ShortcutsDir\configs\$($_.Name)" -Force
            Write-Host "  ✓ Organized: $($_.Name) -> configs/" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nShortcuts organized in: $ShortcutsDir" -ForegroundColor Green
}

# Main execution
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "1. Create a complete backup of your Claude-Flow setup" -ForegroundColor Gray
Write-Host "2. Organize your shortcuts into a centralized structure" -ForegroundColor Gray
Write-Host "3. Create a rollback script for emergency recovery" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Do you want to proceed with backup? (yes/no)"
if ($response -eq "yes") {
    $backupPath = Create-Backup
    Organize-Shortcuts
    
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "1. Run: .\immediate-fix.bat" -ForegroundColor Yellow
    Write-Host "2. If issues occur, run: $backupPath\ROLLBACK.ps1" -ForegroundColor Yellow
    Write-Host "3. Your shortcuts are preserved in: $ShortcutsDir" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "Backup cancelled." -ForegroundColor Yellow
}
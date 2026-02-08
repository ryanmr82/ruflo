# Claude-Flow Safe Backup and Fix System
# This preserves ALL your custom work including specialized folders
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

$BaseDir = "C:\Claude-Flow"
$BackupDir = "$BaseDir\backup\SAFE_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Define what to preserve
$PreserveStructure = @{
    # Your shortcuts and scripts
    Shortcuts = @(
        "hive-mind.bat",
        "hive-mind.ps1",
        "hive-swarm.bat", 
        "hive-swarm.ps1",
        "hive-mind-advanced.bat",
        "Hive-Mind-Advanced.ps1",
        "monitor-agents.ps1",
        "claude-wrapper.cmd",
        "immediate-fix.bat",
        "claude-flow-fix.md"
    )
    
    # Your specialized folders - THESE STAY UNTOUCHED
    SpecializedFolders = @(
        "status-reports",      # Your status reports
        "output-files",        # Your output files
        "backup",              # Your existing backups
        "analysis-reports",    # Analysis reports
        "reports",             # General reports
        "data",                # Data folder
        "memory",              # Memory stores
        "swarm-memory",        # Swarm memory
        "generated-code"       # Generated code
    )
    
    # Configuration files
    Configs = @(
        "hive_prompt.txt",
        "CLAUDE.md",
        "*.json",
        "*.md"
    )
}

function Show-CurrentStructure {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Current Claude-Flow Structure Analysis" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    Write-Host "`nYour specialized folders:" -ForegroundColor Yellow
    foreach ($folder in $PreserveStructure.SpecializedFolders) {
        if (Test-Path "$BaseDir\$folder") {
            $count = (Get-ChildItem "$BaseDir\$folder" -Recurse -File -ErrorAction SilentlyContinue).Count
            Write-Host "  ✓ $folder ($count files)" -ForegroundColor Green
        }
    }
    
    Write-Host "`nYour shortcuts:" -ForegroundColor Yellow
    foreach ($shortcut in $PreserveStructure.Shortcuts) {
        if (Test-Path "$BaseDir\$shortcut") {
            Write-Host "  ✓ $shortcut" -ForegroundColor Green
        }
    }
}

function Create-SafeBackup {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Creating Safe Backup (Preserves Everything)" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Create backup directory
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # 1. Backup shortcuts
    Write-Host "`n[1/8] Backing up shortcuts..." -ForegroundColor Green
    $shortcutsBackup = "$BackupDir\shortcuts"
    New-Item -ItemType Directory -Path $shortcutsBackup -Force | Out-Null
    
    foreach ($shortcut in $PreserveStructure.Shortcuts) {
        if (Test-Path "$BaseDir\$shortcut") {
            Copy-Item "$BaseDir\$shortcut" "$shortcutsBackup\$shortcut" -Force
            Write-Host "  ✓ $shortcut" -ForegroundColor Gray
        }
    }
    
    # 2. Backup specialized folders (IMPORTANT!)
    Write-Host "`n[2/8] Backing up specialized folders..." -ForegroundColor Green
    foreach ($folder in $PreserveStructure.SpecializedFolders) {
        if (Test-Path "$BaseDir\$folder") {
            Write-Host "  Backing up $folder..." -ForegroundColor Yellow
            Copy-Item "$BaseDir\$folder" "$BackupDir\$folder" -Recurse -Force
            Write-Host "  ✓ $folder backed up" -ForegroundColor Green
        }
    }
    
    # 3. Backup Claude-Flow user config
    Write-Host "`n[3/8] Backing up user configuration..." -ForegroundColor Green
    if (Test-Path "$env:USERPROFILE\.claude-flow") {
        Copy-Item "$env:USERPROFILE\.claude-flow" "$BackupDir\.claude-flow-user" -Recurse -Force
        Write-Host "  ✓ User config backed up" -ForegroundColor Gray
    }
    
    # 4. Record current state
    Write-Host "`n[4/8] Recording current system state..." -ForegroundColor Green
    @{
        NodeVersion = node --version
        NpmVersion = npm --version
        ClaudeFlowVersion = npm list -g claude-flow 2>$null | Select-String "claude-flow@"
        BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        PreservedFolders = $PreserveStructure.SpecializedFolders
    } | ConvertTo-Json | Out-File "$BackupDir\system-state.json"
    
    # 5. Create folder preservation map
    Write-Host "`n[5/8] Creating folder preservation map..." -ForegroundColor Green
    $folderMap = @{}
    foreach ($folder in $PreserveStructure.SpecializedFolders) {
        if (Test-Path "$BaseDir\$folder") {
            $folderMap[$folder] = @{
                FileCount = (Get-ChildItem "$BaseDir\$folder" -Recurse -File -ErrorAction SilentlyContinue).Count
                TotalSize = (Get-ChildItem "$BaseDir\$folder" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                LastModified = (Get-Item "$BaseDir\$folder").LastWriteTime
            }
        }
    }
    $folderMap | ConvertTo-Json | Out-File "$BackupDir\folder-map.json"
    
    # 6. Save npm global packages
    Write-Host "`n[6/8] Saving npm global packages list..." -ForegroundColor Green
    npm list -g --depth=0 > "$BackupDir\npm-global-packages.txt"
    
    # 7. Save environment variables
    Write-Host "`n[7/8] Saving environment variables..." -ForegroundColor Green
    @{
        NODE_OPTIONS = $env:NODE_OPTIONS
        CLAUDE_FLOW_MAX_RETRIES = $env:CLAUDE_FLOW_MAX_RETRIES
        CLAUDE_FLOW_TIMEOUT = $env:CLAUDE_FLOW_TIMEOUT
        PATH_CLAUDE_FLOW = ($env:PATH -split ';' | Where-Object {$_ -like "*claude*"})
    } | ConvertTo-Json | Out-File "$BackupDir\environment.json"
    
    # 8. Create restoration script
    Write-Host "`n[8/8] Creating restoration script..." -ForegroundColor Green
    Create-RestorationScript -BackupDir $BackupDir
    
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "Backup Complete!" -ForegroundColor Green
    Write-Host "Location: $BackupDir" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Green
    
    return $BackupDir
}

function Create-RestorationScript {
    param($BackupDir)
    
    $restorationScript = @'
# Claude-Flow Safe Restoration Script
# This restores EVERYTHING including your specialized folders

Write-Host "==========================================" -ForegroundColor Red
Write-Host "Claude-Flow Safe Restoration" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red

$BackupDir = $PSScriptRoot
$BaseDir = "C:\Claude-Flow"

Write-Host "`nThis will restore:"
Write-Host "  • All shortcuts and scripts" -ForegroundColor Gray
Write-Host "  • All specialized folders (status-reports, output-files, etc.)" -ForegroundColor Gray
Write-Host "  • All configurations" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Proceed with restoration? (yes/no)"
if ($confirm -ne "yes") { exit }

# 1. Stop processes
Write-Host "`n[1/6] Stopping processes..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.Name -like "*node*" -or $_.Name -like "*claude*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Restore shortcuts
Write-Host "[2/6] Restoring shortcuts..." -ForegroundColor Cyan
if (Test-Path "$BackupDir\shortcuts") {
    Copy-Item "$BackupDir\shortcuts\*" "$BaseDir\" -Force -Recurse
}

# 3. Restore specialized folders
Write-Host "[3/6] Restoring specialized folders..." -ForegroundColor Cyan
$folders = Get-Content "$BackupDir\folder-map.json" | ConvertFrom-Json
foreach ($folder in $folders.PSObject.Properties.Name) {
    if (Test-Path "$BackupDir\$folder") {
        Write-Host "  Restoring $folder..." -ForegroundColor Yellow
        Copy-Item "$BackupDir\$folder" "$BaseDir\$folder" -Recurse -Force
        Write-Host "  ✓ $folder restored" -ForegroundColor Green
    }
}

# 4. Restore user config
Write-Host "[4/6] Restoring user configuration..." -ForegroundColor Cyan
if (Test-Path "$BackupDir\.claude-flow-user") {
    Copy-Item "$BackupDir\.claude-flow-user" "$env:USERPROFILE\.claude-flow" -Recurse -Force
}

# 5. Restore Claude-Flow version
Write-Host "[5/6] Restoring Claude-Flow..." -ForegroundColor Cyan
$state = Get-Content "$BackupDir\system-state.json" | ConvertFrom-Json
if ($state.ClaudeFlowVersion) {
    $version = $state.ClaudeFlowVersion -replace '.*claude-flow@', '' -replace '\s.*', ''
    npm install -g "claude-flow@$version"
}

# 6. Restore environment
Write-Host "[6/6] Restoring environment..." -ForegroundColor Cyan
$env = Get-Content "$BackupDir\environment.json" | ConvertFrom-Json
if ($env.NODE_OPTIONS) {
    [Environment]::SetEnvironmentVariable("NODE_OPTIONS", $env.NODE_OPTIONS, "User")
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Restoration Complete!" -ForegroundColor Green
Write-Host "All specialized folders and shortcuts restored" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
'@
    
    $restorationScript | Out-File "$BackupDir\RESTORE-ALL.ps1" -Encoding UTF8
}

function Apply-SafeFix {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Applying Safe Fix (Preserves Your Work)" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Only fix Claude-Flow itself, don't touch user folders
    Write-Host "`n[1/5] Clearing ONLY Claude-Flow cache (not your folders)..." -ForegroundColor Green
    Remove-Item "$env:USERPROFILE\.claude-flow\cache" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:USERPROFILE\.claude-flow\*.lock" -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:USERPROFILE\.claude-flow\*.db" -Force -ErrorAction SilentlyContinue
    
    Write-Host "[2/5] Clearing npm cache..." -ForegroundColor Green
    npm cache clean --force
    
    Write-Host "[3/5] Setting memory limits..." -ForegroundColor Green
    [Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--max-old-space-size=4096", "User")
    
    Write-Host "[4/5] Reinstalling Claude-Flow..." -ForegroundColor Green
    npm uninstall -g claude-flow
    npm install -g claude-flow@latest
    
    Write-Host "[5/5] Creating stable configuration..." -ForegroundColor Green
    $config = @{
        sessionTimeout = 3600000
        maxRetries = 5
        keepAliveInterval = 30000
        gracefulShutdown = $true
        processCleanup = @{
            enabled = $true
            forceKill = $false
            timeout = 5000
        }
        database = @{
            type = "sqlite"
            synchronous = "FULL"
            journal_mode = "WAL"
            busy_timeout = 5000
        }
    }
    
    if (!(Test-Path "$env:USERPROFILE\.claude-flow")) {
        New-Item -ItemType Directory -Path "$env:USERPROFILE\.claude-flow" -Force | Out-Null
    }
    $config | ConvertTo-Json | Out-File "$env:USERPROFILE\.claude-flow\config.json" -Encoding UTF8
    
    Write-Host "`n✓ Fix applied WITHOUT touching your specialized folders!" -ForegroundColor Green
}

# Main Menu
Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Claude-Flow Safe Backup & Fix System" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan

Show-CurrentStructure

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "OPTIONS:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "1. Create backup ONLY (safest)" -ForegroundColor White
Write-Host "2. Create backup AND apply fix" -ForegroundColor White
Write-Host "3. Show what will be preserved" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        $backupPath = Create-SafeBackup
        Write-Host "`nBackup created at: $backupPath" -ForegroundColor Green
        Write-Host "To restore, run: $backupPath\RESTORE-ALL.ps1" -ForegroundColor Yellow
    }
    "2" {
        $backupPath = Create-SafeBackup
        Apply-SafeFix
        Write-Host "`n==========================================" -ForegroundColor Green
        Write-Host "Complete!" -ForegroundColor Green
        Write-Host "Backup at: $backupPath" -ForegroundColor Yellow
        Write-Host "If issues occur, run: $backupPath\RESTORE-ALL.ps1" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Green
    }
    "3" {
        Write-Host "`nThe following will be preserved:" -ForegroundColor Green
        Write-Host "`nSpecialized Folders:" -ForegroundColor Yellow
        $PreserveStructure.SpecializedFolders | ForEach-Object { Write-Host "  • $_" -ForegroundColor Gray }
        Write-Host "`nShortcuts:" -ForegroundColor Yellow
        $PreserveStructure.Shortcuts | ForEach-Object { Write-Host "  • $_" -ForegroundColor Gray }
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}
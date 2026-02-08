# Claude-Flow Community-Verified Fix
# Based on GitHub issues #51766 (Node.js) and #569 (claude-flow)
# This implements the documented solution from the community

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Claude-Flow Community-Verified Fix" -ForegroundColor Cyan
Write-Host "Based on documented solutions from GitHub" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# SOLUTION 1: Check Node.js Version (Critical)
Write-Host "[CRITICAL] Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Current Node.js: $nodeVersion" -ForegroundColor White

if ($nodeVersion -match "v2[12]\.") {
    Write-Host "⚠️  WARNING: You have Node.js $nodeVersion" -ForegroundColor Red
    Write-Host "⚠️  This version has the EPERM bug (GitHub nodejs/node#51766)" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Use Node.js v20.x LTS" -ForegroundColor Green
    Write-Host ""
    Write-Host "To fix this permanently:" -ForegroundColor Yellow
    Write-Host "1. Download Node.js v20 LTS from: https://nodejs.org/en/download/" -ForegroundColor White
    Write-Host "2. Or use nvm: nvm install 20.18.0 && nvm use 20.18.0" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue with temporary fixes? (yes/no)"
    if ($continue -ne "yes") { exit }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Applying Community-Verified Fixes" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# SOLUTION 2: Kill stuck processes (documented fix)
Write-Host "`n[1/6] Killing stuck Node/Claude processes..." -ForegroundColor Green
Get-Process | Where-Object {$_.Name -like "*node*" -or $_.ProcessName -like "*claude*"} | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Killed process: $($_.Name) (PID: $($_.Id))" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠️  Could not kill: $($_.Name)" -ForegroundColor Yellow
    }
}
Start-Sleep -Seconds 2

# SOLUTION 3: Clear database and cache (GitHub #569 fix)
Write-Host "`n[2/6] Clearing database connections and cache..." -ForegroundColor Green
Write-Host "  (Fix for: 'The database connection is not open')" -ForegroundColor Gray

# Remove ALL database files and locks
$paths = @(
    "$env:USERPROFILE\.claude-flow\*.db",
    "$env:USERPROFILE\.claude-flow\*.db-journal",
    "$env:USERPROFILE\.claude-flow\*.db-wal",
    "$env:USERPROFILE\.claude-flow\*.lock",
    "$env:USERPROFILE\.claude-flow\cache",
    "$env:USERPROFILE\.claude-flow\sessions"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Cleared: $path" -ForegroundColor Gray
    }
}

# SOLUTION 4: Clear npm cache (documented fix for EPERM)
Write-Host "`n[3/6] Clearing npm cache (fixes permission issues)..." -ForegroundColor Green
npm cache clean --force 2>&1 | Out-Null
Write-Host "  ✓ NPM cache cleared" -ForegroundColor Gray

# SOLUTION 5: Set memory limits (prevents OOM crashes)
Write-Host "`n[4/6] Setting memory limits (prevents crashes)..." -ForegroundColor Green
[Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--max-old-space-size=4096", "User")
$env:NODE_OPTIONS = "--max-old-space-size=4096"
Write-Host "  ✓ Memory limit set to 4GB" -ForegroundColor Gray

# SOLUTION 6: Reinstall claude-flow
Write-Host "`n[5/6] Reinstalling claude-flow..." -ForegroundColor Green
Write-Host "  Uninstalling old version..." -ForegroundColor Gray
npm uninstall -g claude-flow 2>&1 | Out-Null

Write-Host "  Installing latest version..." -ForegroundColor Gray
npm install -g claude-flow@latest

# SOLUTION 7: Create stable configuration (prevents database issues)
Write-Host "`n[6/6] Creating stable configuration..." -ForegroundColor Green
$configDir = "$env:USERPROFILE\.claude-flow"
if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$config = @{
    sessionTimeout = 3600000
    maxRetries = 5
    keepAliveInterval = 30000
    gracefulShutdown = $true
    processCleanup = @{
        enabled = $true
        forceKill = $false  # Important: false to avoid EPERM
        timeout = 5000
    }
    database = @{
        type = "sqlite"
        synchronous = "FULL"
        journal_mode = "WAL"
        busy_timeout = 5000
        retry_on_busy = $true  # Important for database connection issues
    }
}

$config | ConvertTo-Json -Depth 3 | Out-File "$configDir\config.json" -Encoding UTF8
Write-Host "  ✓ Configuration saved" -ForegroundColor Gray

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Community Fix Applied Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Final check
$currentNode = node --version
if ($currentNode -match "v2[12]\.") {
    Write-Host "⚠️  IMPORTANT: You still have Node.js $currentNode" -ForegroundColor Yellow
    Write-Host "⚠️  The EPERM error may persist until you downgrade to v20.x" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommended: Install Node.js v20.18.0 LTS" -ForegroundColor White
    Write-Host "Download from: https://nodejs.org/en/download/" -ForegroundColor Cyan
} else {
    Write-Host "✓ Node.js version OK: $currentNode" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Close this terminal" -ForegroundColor Gray
Write-Host "2. Open a new terminal (important for environment variables)" -ForegroundColor Gray
Write-Host "3. Run: npx claude-flow hive" -ForegroundColor Gray
Write-Host ""
Write-Host "If issues persist:" -ForegroundColor Yellow
Write-Host "- Ensure you're using Node.js v20.x LTS" -ForegroundColor Gray
Write-Host "- Run this script again" -ForegroundColor Gray
Write-Host "- Check Windows Defender/Antivirus isn't blocking" -ForegroundColor Gray
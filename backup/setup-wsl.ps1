# WSL Setup Script for Claude-Flow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WSL Setup for Claude-Flow" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is set up
$wslTest = wsl -e bash -c "echo 'WSL Ready'" 2>$null
if ($wslTest -ne "WSL Ready") {
    Write-Host "ACTION REQUIRED: WSL needs initial setup!" -ForegroundColor Yellow
    Write-Host "Opening Ubuntu - Please create a username and password when prompted" -ForegroundColor Cyan
    Start-Process ubuntu.exe
    Write-Host ""
    Write-Host "After setting up Ubuntu, run this script again!" -ForegroundColor Yellow
    exit
}

Write-Host "✓ WSL is ready!" -ForegroundColor Green
Write-Host ""

# Install Node.js and npm
Write-Host "Installing Node.js and npm in WSL..." -ForegroundColor Cyan
wsl -e bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"

# Verify installation
Write-Host ""
Write-Host "Verifying installations..." -ForegroundColor Cyan
$nodeVersion = wsl -e bash -c "node --version"
$npmVersion = wsl -e bash -c "npm --version"
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Install Claude Code
Write-Host ""
Write-Host "Installing Claude Code in WSL..." -ForegroundColor Cyan
wsl -e bash -c "npm install -g @anthropic-ai/claude-code"

# Install claude-flow
Write-Host ""
Write-Host "Installing claude-flow in WSL..." -ForegroundColor Cyan
wsl -e bash -c "npm install -g claude-flow@latest"

# Create WSL shortcut script
Write-Host ""
Write-Host "Creating WSL shortcut for claude-flow..." -ForegroundColor Cyan

$wslScript = @'
#!/bin/bash
# WSL Hive-Mind Script
cd /mnt/c/Claude-Flow
cat /mnt/c/Claude-Flow/hive_prompt.txt | npx claude-flow@latest hive-mind spawn "Task from Windows" --claude --auto-spawn --max-workers 12 --queen-type adaptive --consensus weighted --strategy adaptive --parallel --monitor --verbose --auto-scale --encryption --execute
'@

$wslScript | Out-File -FilePath "C:\Claude-Flow\hive-mind-wsl.sh" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run claude-flow hive-mind from WSL:" -ForegroundColor Yellow
Write-Host "  wsl -e bash /mnt/c/Claude-Flow/hive-mind-wsl.sh" -ForegroundColor White
Write-Host ""
Write-Host "Or open Ubuntu and run:" -ForegroundColor Yellow
Write-Host "  cd /mnt/c/Claude-Flow" -ForegroundColor White
Write-Host "  npx claude-flow@latest hive-mind spawn 'your task'" -ForegroundColor White
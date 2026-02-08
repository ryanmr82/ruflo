#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-MIND MODE - Strategic Queen Coordinator (WORKING VERSION)
    
.DESCRIPTION
    Fixed version that bypasses claude-flow's broken Claude Code detection
    and executes the generated Hive Mind prompt automatically.
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$AdditionalContext
)

# Set UTF-8 encoding for proper emoji display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration
$HIVE_PROMPT_FILE = "C:\hive_prompt.txt"
$WORKSPACE_DIR = "C:\claude-flow\output-files"

# Main execution
Write-Host ""
Write-Host "[MIND] HIVE-MIND MODE - Strategic Queen Coordinator (WORKING)" -ForegroundColor Magenta
Write-Host ("=" * 76) -ForegroundColor DarkGray
Write-Host "[PKG] Using Claude Code directly" -ForegroundColor Green
Write-Host "[DIR] Workspace: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host "[MODE] Mode: MIND (Queen-led strategic planning)" -ForegroundColor Cyan

# Check if hive_prompt.txt exists
if (-not (Test-Path $HIVE_PROMPT_FILE)) {
    Write-Host "Error: $HIVE_PROMPT_FILE not found" -ForegroundColor Red
    Write-Host "Create your task in $HIVE_PROMPT_FILE first" -ForegroundColor Yellow
    exit 1
}

# Read the full content
$fullContent = Get-Content $HIVE_PROMPT_FILE -Raw
$fileSize = (Get-Item $HIVE_PROMPT_FILE).Length
Write-Host "[INFO] Task file: $fileSize bytes" -ForegroundColor Yellow

# Extract a short summary for display
$lines = $fullContent -split "`n"
$shortObjective = if ($lines[0].Length -gt 80) {
    $lines[0].Substring(0, 77) + "..."
} else {
    $lines[0]
}

Write-Host "[TASK] Objective: $shortObjective" -ForegroundColor Cyan

# Ensure workspace exists
if (-not (Test-Path $WORKSPACE_DIR)) {
    New-Item -ItemType Directory -Path $WORKSPACE_DIR -Force | Out-Null
}

# Find Claude Code
$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudePath) {
    Write-Host "Error: Claude Code not found. Please ensure 'claude' is in your PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Claude Code found at: $($claudePath.Source)" -ForegroundColor Green

# Change to workspace
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host "[MIND] Initiating HIVE-MIND Queen Coordinator..." -ForegroundColor Magenta
    Write-Host ("=" * 76) -ForegroundColor DarkGray
    
    Write-Host "[SPAWN] Executing Hive-Mind spawn..." -ForegroundColor Cyan
    
    # Execute hive-mind spawn to create the swarm
    $arguments = @(
        "claude-flow@latest",
        "hive-mind",
        "spawn",
        "`"Execute task from hive_prompt.txt`"",
        "--claude",
        "--max-agents", "4", 
        "--strategy", "development",
        "--parallel",
        "--monitor",
        "--workspace", "`"$WORKSPACE_DIR`""
    )
    
    # Run hive-mind spawn in background and capture output
    $spawnJob = Start-Job -ScriptBlock {
        param($args, $workspace)
        Set-Location $workspace
        & npx $args
    } -ArgumentList @(,$arguments), $WORKSPACE_DIR
    
    # Wait for spawn to complete or timeout
    $completed = Wait-Job $spawnJob -Timeout 60
    
    if ($completed) {
        $spawnOutput = Receive-Job $spawnJob
        Write-Host $spawnOutput
        Remove-Job $spawnJob
    } else {
        Write-Host "Hive-mind spawn completed (or timed out), checking for prompt file..." -ForegroundColor Yellow
        Stop-Job $spawnJob
        Remove-Job $spawnJob
    }
    
    # Find the latest generated Hive Mind prompt file
    Start-Sleep -Seconds 3  # Give time for file creation
    $hiveMindPromptFile = Get-ChildItem "$WORKSPACE_DIR\.hive-mind\sessions\hive-mind-prompt-*.txt" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($hiveMindPromptFile) {
        Write-Host ""
        Write-Host "[FOUND] Found Hive Mind coordination prompt!" -ForegroundColor Green
        Write-Host "Prompt file: $($hiveMindPromptFile.Name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[EXEC] EXECUTING HIVE MIND QUEEN COORDINATION..." -ForegroundColor Magenta
        Write-Host ("=" * 76) -ForegroundColor DarkGray
        
        # Read and execute the Hive Mind prompt with Claude Code
        $promptContent = Get-Content $hiveMindPromptFile.FullName -Raw
        
        # Execute the prompt directly with claude
        & $claudePath.Source --dangerously-skip-permissions "C:\hive_prompt.txt"
        
        Write-Host ""
        Write-Host "[OK] HIVE MIND COORDINATION COMPLETED" -ForegroundColor Green
        Write-Host "Session ID available for resuming: Use 'claude-flow hive-mind status' to view" -ForegroundColor Cyan
        
    } else {
        Write-Host "[WARN] Hive Mind prompt file not found" -ForegroundColor Yellow
        Write-Host "The hive-mind spawn may have failed or the prompt was not generated" -ForegroundColor White
        
        # Show available files for debugging
        $sessionFiles = Get-ChildItem "$WORKSPACE_DIR\.hive-mind\sessions\" -ErrorAction SilentlyContinue
        if ($sessionFiles) {
            Write-Host "Available session files:" -ForegroundColor Gray
            $sessionFiles | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Gray }
        }
    }
    
} catch {
    Write-Host "Error executing MIND MODE: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor DarkGray
Write-Host "HIVE-MIND session completed" -ForegroundColor Magenta
Write-Host "Results saved in: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor DarkGray

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-SWARM - Swarm Mode Implementation for Windows
    
.DESCRIPTION
    Runs Claude-Flow in SWARM MODE with distributed agent coordination
    Handles long documents by creating a prompt file that Claude can read
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$AdditionalContext
)

# Configuration
$HIVE_PROMPT_FILE = "C:\hive_prompt.txt"
$WORKSPACE_DIR = "C:\claude-flow\output-files"

# Main execution
Write-Host ""
Write-Host "🐝 HIVE-SWARM MODE - Distributed Agent Coordination" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📦 Using claude-flow via npx" -ForegroundColor Green
Write-Host "📂 Workspace: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host "🎯 Mode: SWARM (Parallel distributed execution)" -ForegroundColor Cyan

# Check if hive_prompt.txt exists
if (-not (Test-Path $HIVE_PROMPT_FILE)) {
    Write-Host "Error: $HIVE_PROMPT_FILE not found" -ForegroundColor Red
    Write-Host "Create your task in $HIVE_PROMPT_FILE first" -ForegroundColor Yellow
    exit 1
}

# Read the full content
$fullContent = Get-Content $HIVE_PROMPT_FILE -Raw

# Get file size
$fileSize = (Get-Item $HIVE_PROMPT_FILE).Length
Write-Host "📊 Task file: $fileSize bytes" -ForegroundColor Yellow

# Extract a short summary for the command line (first 80 chars or first line)
$lines = $fullContent -split "`n"
$shortObjective = if ($lines[0].Length -gt 80) {
    $lines[0].Substring(0, 77) + "..."
} else {
    $lines[0]
}
$shortObjective = $shortObjective -replace '"', '\"'  # Escape quotes

Write-Host "📋 Objective: $shortObjective" -ForegroundColor Cyan

# Ensure workspace exists
if (-not (Test-Path $WORKSPACE_DIR)) {
    New-Item -ItemType Directory -Path $WORKSPACE_DIR -Force | Out-Null
}

# Create sessions directory for swarm mode
$sessionsDir = "$WORKSPACE_DIR\.hive-swarm\sessions"
if (-not (Test-Path $sessionsDir)) {
    New-Item -ItemType Directory -Path $sessionsDir -Force | Out-Null
}

# Create a combined prompt file with SWARM MODE instructions
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$promptFile = "$sessionsDir\swarm-prompt-$timestamp.txt"

$combinedPrompt = @"
🐝 HIVE-SWARM MODE - DISTRIBUTED PARALLEL EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are operating in HIVE-SWARM MODE with these characteristics:

SWARM MODE CONFIGURATION:
- Architecture: Distributed multi-agent system
- Execution: Parallel task processing
- Coordination: Peer-to-peer with emergent behavior
- Agents: Autonomous specialized workers
- Decision Making: Distributed consensus
- Focus: Rapid parallel execution and implementation

SWARM COORDINATION PRINCIPLES:
1. Spawn multiple specialized agents immediately
2. Distribute tasks for parallel execution
3. Enable peer-to-peer agent communication
4. Use emergent swarm intelligence
5. Maximize parallelization and efficiency
6. Rapidly iterate and adapt

AGENT TYPES TO SPAWN:
- Researchers: Gather information in parallel
- Coders: Implement solutions simultaneously
- Testers: Validate outputs concurrently
- Analysts: Process data in parallel
- Coordinators: Manage sub-swarms

WORKSPACE: $WORKSPACE_DIR

OBJECTIVE TO EXECUTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$fullContent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please execute this objective using SWARM MODE with distributed parallel coordination. Focus on rapid execution, parallel processing, and emergent problem-solving.
"@

# Save the combined prompt
Set-Content -Path $promptFile -Value $combinedPrompt -Encoding UTF8
Write-Host "✅ Created swarm-mode prompt: $promptFile" -ForegroundColor Green

# Change to workspace
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host "🐝 Initiating HIVE-SWARM Distributed Execution..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Try npx claude-flow swarm command
    $arguments = @(
        "claude-flow@latest",
        "swarm",
        "`"$shortObjective`"",
        "--distributed",
        "--max-agents", "20",
        "--parallel",
        "--strategy", "emergent",
        "--execution", "rapid",
        "--workspace", "`"$WORKSPACE_DIR`""
    )
    
    # Create execution script
    $tempScript = "$env:TEMP\swarm_exec_$timestamp.ps1"
    @"
# HIVE-SWARM Mode Execution
cd '$WORKSPACE_DIR'

# Try npx claude-flow swarm command
Write-Host "Attempting: npx claude-flow swarm..." -ForegroundColor Cyan
& npx $($arguments -join ' ') 2>&1

# If command not found, use claude directly with prompt
if (`$LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Using direct Claude interface for SWARM MODE..." -ForegroundColor Yellow
    Get-Content '$promptFile' | claude --dangerously-skip-permissions
}
"@ | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Execute
    & $tempScript
    
    # Clean up
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "Error executing SWARM MODE: $_" -ForegroundColor Red
    Write-Host "Fallback: You can manually run: claude < `"$promptFile`"" -ForegroundColor Cyan
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "🐝 HIVE-SWARM execution completed" -ForegroundColor Yellow
Write-Host "📁 Results saved in: $WORKSPACE_DIR" -ForegroundColor Green
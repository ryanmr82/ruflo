Hive shortcuts loaded successfully!
#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-MIND - Mind Mode Implementation for Windows
    
.DESCRIPTION
    Runs Claude-Flow in MIND MODE with Queen coordinator for strategic planning
    Handles long documents by creating a prompt file that Claude can read
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$AdditionalContext
)

# Configuration
$HIVE_PROMPT_FILE = "C:\claude-flow\hive_prompt.txt"
$WORKSPACE_DIR = "C:\claude-flow\output-files"

# Main execution
Write-Host ""
Write-Host " HIVE-MIND MODE - Strategic Queen Coordinator" -ForegroundColor Magenta
Write-Host "" -ForegroundColor DarkGray
Write-Host " Using claude-flow via npx" -ForegroundColor Green
Write-Host " Workspace: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host " Mode: MIND (Queen-led strategic planning)" -ForegroundColor Cyan

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
Write-Host " Task file: $fileSize bytes" -ForegroundColor Yellow

# Extract a short summary for the command line (first 80 chars or first line)
$lines = $fullContent -split "`n"
$shortObjective = if ($lines[0].Length -gt 80) {
    $lines[0].Substring(0, 77) + "..."
} else {
    $lines[0]
}
$shortObjective = $shortObjective -replace '"', '\"'  # Escape quotes

Write-Host " Objective: $shortObjective" -ForegroundColor Cyan

# Ensure workspace exists
if (-not (Test-Path $WORKSPACE_DIR)) {
    New-Item -ItemType Directory -Path $WORKSPACE_DIR -Force | Out-Null
}

# Create sessions directory for mind mode
$sessionsDir = "$WORKSPACE_DIR\.hive-mind\sessions"
if (-not (Test-Path $sessionsDir)) {
    New-Item -ItemType Directory -Path $sessionsDir -Force | Out-Null
}

# Create a combined prompt file with MIND MODE instructions
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$promptFile = "$sessionsDir\mind-prompt-$timestamp.txt"

$combinedPrompt = @"
 HIVE-MIND MODE - QUEEN COORDINATOR STRATEGIC PLANNING


You are operating in HIVE-MIND MODE as the Queen Coordinator with these characteristics:

MIND MODE CONFIGURATION:
- Role: Queen Coordinator (strategic leadership)
- Strategy: Deep analysis and strategic planning
- Approach: Thoughtful, methodical, comprehensive
- Workers: Spawn specialized agents for research and analysis
- Decision Making: Centralized through Queen
- Focus: Long-term planning and architecture

QUEEN COORDINATOR RESPONSIBILITIES:
1. Analyze the objective comprehensively
2. Break down into strategic components
3. Spawn specialized worker agents for deep research
4. Synthesize findings into cohesive strategy
5. Create detailed implementation plans
6. Monitor and guide worker progress

WORKSPACE: $WORKSPACE_DIR

OBJECTIVE TO ANALYZE:

$fullContent


Please analyze this objective using HIVE-MIND MODE with Queen-led coordination. Focus on strategic planning, comprehensive analysis, and thoughtful decision-making.
"@

# Save the combined prompt
Set-Content -Path $promptFile -Value $combinedPrompt -Encoding UTF8
Write-Host " Created mind-mode prompt: $promptFile" -ForegroundColor Green

# Change to workspace
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host " Initiating HIVE-MIND Queen Coordinator..." -ForegroundColor Magenta
    Write-Host "" -ForegroundColor DarkGray
    
    # Try npx claude-flow mind command first
    $arguments = @(
        "claude-flow@latest",
        "mind",
        "`"$shortObjective`"",
        "--queen",
        "--strategy", "strategic",
        "--max-workers", "10",
        "--analysis-depth", "deep",
        "--workspace", "`"$WORKSPACE_DIR`""
    )
    
    # Create execution script
    $tempScript = "$env:TEMP\mind_exec_$timestamp.ps1"
    @"
# HIVE-MIND Mode Execution
cd '$WORKSPACE_DIR'

# Try npx claude-flow mind command
Write-Host "Attempting: npx claude-flow mind..." -ForegroundColor Cyan
& npx $($arguments -join ' ') 2>&1

# If command not found, use claude directly with prompt file
if (`$LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Using direct Claude interface for MIND MODE..." -ForegroundColor Yellow
    # Use non-interactive mode with --print flag
    `$promptContent = Get-Content '$promptFile' -Raw
    & claude --print "`$promptContent"
}
"@ | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Execute
    & $tempScript
    
    # Clean up
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "Error executing MIND MODE: $_" -ForegroundColor Red
    Write-Host "Fallback: You can manually run: claude --print < `"$promptFile`"" -ForegroundColor Cyan
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "HIVE-MIND session completed" -ForegroundColor Magenta
Write-Host "Results saved in: $WORKSPACE_DIR" -ForegroundColor Green

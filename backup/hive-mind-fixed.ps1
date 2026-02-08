#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-MIND - SPARC-Integrated Hive-Mind Spawn System (FIXED VERSION)
    Uses latest claude-flow version via npx with Windows PATH fix

.DESCRIPTION
    Automatically reads objective from C:\claude-flow\hive_prompt.txt,
    combines it with any additional context provided, and executes the
    SPARC-integrated hive-mind spawn system with Queen-led coordination.
    FIXED: Windows PATH inheritance issue with npx

.PARAMETER AdditionalContext
    Optional additional context to append to the main objective

.EXAMPLE
    hive-mind
    Basic usage - reads objective from hive_prompt.txt

.EXAMPLE
    hive-mind "test with minimal agents"
    With additional context

.EXAMPLE
    Get-Content complex-task.txt | hive-mind
    Using pipe input
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$AdditionalContext
)

# Configuration
$HIVE_PROMPT_FILE = "C:\claude-flow\hive_prompt.txt"
$WORKSPACE_DIR = "C:\claude-flow\output-files"
$CLAUDE_FLOW_DIR = "C:\claude-flow\claude-flow-main"
$CLAUDE_CMD_PATH = "C:\Users\ryanr\AppData\Roaming\npm\claude.cmd"

# FIX: Set environment variables for claude-flow to find claude
$env:CLAUDE_PATH = $CLAUDE_CMD_PATH
$env:CLAUDE_CMD = $CLAUDE_CMD_PATH
$env:PATH = "$env:PATH;C:\Users\ryanr\AppData\Roaming\npm"

# Function to check prerequisites
function Test-Prerequisites {
    $errors = @()

    # Check if Node.js is available
    $nodeVersion = $null
    try {
        $nodeVersion = node --version 2>$null
    } catch {}

    if (-not $nodeVersion) {
        $errors += "Error: Node.js is not installed or not in PATH"
    }

    # Check if npx is available
    $npxVersion = $null
    try {
        $npxVersion = npx --version 2>$null
    } catch {}

    if (-not $npxVersion) {
        $errors += "Error: npx is not available - ensure npm is installed"
    }

    # Check if claude.cmd exists
    if (-not (Test-Path $CLAUDE_CMD_PATH)) {
        $errors += "Error: claude.cmd not found at $CLAUDE_CMD_PATH"
    }

    # Return any errors
    return $errors
}

# Main execution
Write-Host ""
Write-Host "🧠 Executing Hive-Mind with SPARC integration (FIXED VERSION)..." -ForegroundColor Cyan
Write-Host "📦 Using latest claude-flow version via npx" -ForegroundColor Green
Write-Host "📂 Workspace: $WORKSPACE_DIR (all data centralized)" -ForegroundColor Green
Write-Host "✅ PATH Fix Applied: Claude location explicitly set" -ForegroundColor Green

# Display known issues warning
Write-Host ""
Write-Host "⚠️  KNOWN ISSUES (August 2025):" -ForegroundColor Yellow
Write-Host "  • Issue #368: Often uses single agent instead of swarm" -ForegroundColor DarkYellow
Write-Host "  • Issue #311: Queen coordinator reverts to assistant mode" -ForegroundColor DarkYellow
Write-Host "  • Issue #325: Sessions cannot be resumed properly" -ForegroundColor DarkYellow
Write-Host "  • Issue #344: Command switches ignored/misreported" -ForegroundColor DarkYellow
Write-Host "  • Issue #564: 'require is not defined' error in latest versions" -ForegroundColor DarkYellow
Write-Host ""

# Check prerequisites
$errors = Test-Prerequisites
if ($errors.Count -gt 0) {
    foreach ($error in $errors) {
        Write-Host $error -ForegroundColor Red
    }
    exit 1
}

# Determine the main objective source
$mainObjective = ""
$objectiveSource = ""

# Check for piped input
if ($input) {
    $mainObjective = $input | Out-String
    $objectiveSource = "piped input"
    Write-Host "📨 Using piped input as main objective" -ForegroundColor Yellow
} else {
    # Check if hive_prompt.txt exists
    if (-not (Test-Path $HIVE_PROMPT_FILE)) {
        Write-Host "Error: $HIVE_PROMPT_FILE not found" -ForegroundColor Red
        Write-Host "Please create the file with your main objective:" -ForegroundColor Yellow
        Write-Host "  notepad $HIVE_PROMPT_FILE" -ForegroundColor White
        exit 1
    }

    # Read the main objective from file
    $mainObjective = Get-Content $HIVE_PROMPT_FILE -Raw
    $objectiveSource = "hive_prompt.txt"
}

# Trim and check if objective is empty
$mainObjective = $mainObjective.Trim()
if ([string]::IsNullOrWhiteSpace($mainObjective)) {
    Write-Host "Error: Main objective is empty ($objectiveSource)" -ForegroundColor Red
    exit 1
}

# Display objective info
$displayObjective = if ($mainObjective.Length -gt 100) {
    $mainObjective.Substring(0, 100) + "..."
} else {
    $mainObjective
}
Write-Host "📋 Main Objective: $displayObjective" -ForegroundColor Cyan

# Combine with additional context if provided
$fullObjective = $mainObjective
if ($AdditionalContext -and $AdditionalContext.Count -gt 0) {
    $contextString = $AdditionalContext -join " "
    $fullObjective = "$mainObjective $contextString"
    Write-Host "➕ Additional Context: $contextString" -ForegroundColor Yellow
}

# Ensure workspace directory exists
if (-not (Test-Path $WORKSPACE_DIR)) {
    New-Item -ItemType Directory -Path $WORKSPACE_DIR -Force | Out-Null
    Write-Host "📁 Created workspace directory: $WORKSPACE_DIR" -ForegroundColor Green
}

# Set environment variables for workspace
$env:CLAUDE_WORKING_DIR = $WORKSPACE_DIR
$env:PWD = $WORKSPACE_DIR

# Change to workspace directory (where output should go)
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host "Executing hive-mind spawn command with latest claude-flow..." -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

    # FIX: Use --executor flag instead of --claude to bypass PATH issues
    # Or use explicit path with --claude-path option if available
    $arguments = @(
        "claude-flow@latest",
        "hive-mind",
        "spawn",
        "`"$fullObjective`"",
        "--executor",  # Changed from --claude to --executor
        "--max-agents", "10",
        "--strategy", "development",
        "--parallel",
        "--monitor",
        "--workspace", "`"$WORKSPACE_DIR`""
    )

    # Build the command string for npx
    $argumentString = $arguments -join " "

    # Execute with npx (downloads latest if needed)
    & npx $arguments

} finally {
    # Return to original directory
    Pop-Location
}

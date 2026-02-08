#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-MIND MODE - Strategic Queen Coordinator (DIRECT EXECUTION)
    
.DESCRIPTION
    Fixed version that executes hive-mind directly like hive-swarm,
    without intermediate prompts or pauses.
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$AdditionalContext
)

# Configuration
$HIVE_PROMPT_FILE = "C:\claude-flow\hive_prompt.txt"
$WORKSPACE_DIR = "C:\claude-flow\output-files"

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
    
    # Return any errors
    return $errors
}

# Main execution
Write-Host ""
Write-Host "[MIND] HIVE-MIND MODE - Strategic Queen Coordinator (DIRECT)" -ForegroundColor Magenta
Write-Host ("=" * 76) -ForegroundColor DarkGray
Write-Host "[PKG] Using latest claude-flow version via npx" -ForegroundColor Green
Write-Host "[DIR] Workspace: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host "[MODE] Mode: MIND (Queen-led strategic planning)" -ForegroundColor Cyan

# Check prerequisites
$errors = Test-Prerequisites
if ($errors.Count -gt 0) {
    foreach ($error in $errors) {
        Write-Host $error -ForegroundColor Red
    }
    exit 1
}

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

# Combine with additional context if provided
$additionalText = ""
if ($AdditionalContext) {
    $contextString = $AdditionalContext -join " "
    if (-not [string]::IsNullOrWhiteSpace($contextString)) {
        $additionalText = " $contextString"
        Write-Host "[+] Additional Context: $contextString" -ForegroundColor Yellow
    }
}

# Ensure workspace exists
if (-not (Test-Path $WORKSPACE_DIR)) {
    New-Item -ItemType Directory -Path $WORKSPACE_DIR -Force | Out-Null
    Write-Host "[DIR] Created workspace directory: $WORKSPACE_DIR" -ForegroundColor Green
}

# Set environment variables for workspace
$env:CLAUDE_WORKING_DIR = $WORKSPACE_DIR
$env:PWD = $WORKSPACE_DIR

# Change to workspace
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host "[MIND] Initiating HIVE-MIND Queen Coordinator..." -ForegroundColor Magenta
    Write-Host ("=" * 76) -ForegroundColor DarkGray
    
    # SHORT objective to avoid command line limits
    $shortObjective = "Execute task from hive_prompt.txt$additionalText"
    
    # Execute hive-mind directly with claude flag (like hive-swarm does)
    $arguments = @(
        "claude-flow@latest",
        "hive-mind",
        "`"$shortObjective`"",
        "--claude",
        "--max-agents", "4", 
        "--strategy", "development",
        "--parallel",
        "--monitor",
        "--workspace", "`"$WORKSPACE_DIR`""
    )
    
    Write-Host "Executing Hive-Mind with direct Claude integration..." -ForegroundColor Cyan
    
    # Execute with npx (no intermediate steps, no prompts)
    & npx $arguments
    
    Write-Host ""
    Write-Host "✅ HIVE MIND COORDINATION COMPLETED" -ForegroundColor Green
    
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
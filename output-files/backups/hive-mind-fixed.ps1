#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HIVE-MIND MODE - Strategic Queen Coordinator (FIXED VERSION)
    
.DESCRIPTION
    Runs Claude Code in MIND MODE with strategic planning focus.
    Fixed to use correct Claude Code interface instead of non-existent "mind" command.
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
Write-Host "[MIND] HIVE-MIND MODE - Strategic Queen Coordinator (FIXED)" -ForegroundColor Magenta
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

# Get file size
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

# Create sessions directory for mind mode
$sessionsDir = "$WORKSPACE_DIR\.hive-mind\sessions"
if (-not (Test-Path $sessionsDir)) {
    New-Item -ItemType Directory -Path $sessionsDir -Force | Out-Null
}

# Create a combined prompt file with MIND MODE instructions
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$promptFile = "$sessionsDir\mind-prompt-$timestamp.txt"

$combinedPrompt = @"
🧠 HIVE-MIND MODE - QUEEN COORDINATOR STRATEGIC PLANNING
============================================================================

You are operating in HIVE-MIND MODE as the Queen Coordinator with these characteristics:

**MIND MODE CONFIGURATION:**
- Role: Queen Coordinator (strategic leadership)
- Strategy: Deep analysis and strategic planning
- Approach: Thoughtful, methodical, comprehensive
- Workers: Use TodoWrite to create detailed task breakdowns
- Decision Making: Centralized strategic coordination
- Focus: Long-term planning and architecture

**QUEEN COORDINATOR RESPONSIBILITIES:**
1. 📊 Analyze the objective comprehensively
2. 🎯 Break down into strategic components  
3. 🤖 Use TodoWrite to create detailed task breakdown
4. 🔍 Research and analyze systematically
5. 📋 Create detailed implementation plans
6. 🎛️ Monitor and guide progress

**WORKSPACE:** $WORKSPACE_DIR

**CURRENT OBJECTIVE:**
============================================================================
$fullContent
============================================================================

**EXECUTION INSTRUCTIONS:**
Please analyze this objective using HIVE-MIND MODE with Queen-led strategic coordination. 

**MANDATORY STEPS:**
1. Use TodoWrite to create a comprehensive task breakdown (8-12 tasks minimum)
2. Focus on strategic planning and deep analysis
3. Use available tools (Read, Write, Glob, Grep, Bash) for research
4. Create organized outputs in the workspace directory
5. Provide detailed implementation guidance

Begin your strategic analysis now.
"@

# Save the combined prompt
Set-Content -Path $promptFile -Value $combinedPrompt -Encoding UTF8
Write-Host "[OK] Created mind-mode prompt: $promptFile" -ForegroundColor Green

# Change to workspace
Push-Location $WORKSPACE_DIR

try {
    Write-Host ""
    Write-Host "[MIND] Initiating HIVE-MIND Queen Coordinator..." -ForegroundColor Magenta
    Write-Host ("=" * 76) -ForegroundColor DarkGray
    
    # Check if Claude Code (claude) is available
    $claudeAvailable = $false
    try {
        $claudeTest = & claude --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $claudeAvailable = $true
            Write-Host "[OK] Claude Code detected" -ForegroundColor Green
        }
    } catch {
        Write-Host "[INFO] Claude Code command not found" -ForegroundColor Yellow
    }
    
    if ($claudeAvailable) {
        Write-Host "Launching Claude Code with MIND MODE prompt..." -ForegroundColor Cyan
        Write-Host ""
        
        # Use Claude Code directly with the prompt file
        & claude --file $promptFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] HIVE-MIND session completed successfully" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[WARNING] Claude Code exited with status $LASTEXITCODE" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "Claude Code not available. Manual instructions:" -ForegroundColor Yellow
        Write-Host "1. Open Claude Code terminal" -ForegroundColor White
        Write-Host "2. Navigate to: $WORKSPACE_DIR" -ForegroundColor White
        Write-Host "3. Run: claude --file `"$promptFile`"" -ForegroundColor White
        Write-Host ""
        Write-Host "Or copy the following prompt to Claude Code:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host $combinedPrompt -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Error executing MIND MODE: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual execution options:" -ForegroundColor Cyan
    Write-Host "1. claude --file `"$promptFile`"" -ForegroundColor White
    Write-Host "2. Copy prompt content to Claude Code manually" -ForegroundColor White
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor DarkGray
Write-Host "HIVE-MIND session completed" -ForegroundColor Magenta
Write-Host "Prompt file: $promptFile" -ForegroundColor Green
Write-Host "Results saved in: $WORKSPACE_DIR" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor DarkGray
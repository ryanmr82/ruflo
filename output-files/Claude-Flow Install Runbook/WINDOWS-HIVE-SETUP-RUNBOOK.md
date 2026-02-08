# Windows Hive Commands Complete Setup Runbook
## From Fresh Claude Desktop to Fully Working Hive-Mind, Hive-Swarm, and Hive-Mind-Advanced

---

## OVERVIEW
This runbook provides a complete, tested setup process for installing Claude Desktop with MCP server support and three AI orchestration shortcuts (Hive-Mind, Hive-Swarm, and Hive-Mind-Advanced) on a fresh Windows machine. All workarounds and fixes discovered during troubleshooting are included to ensure a smooth setup without errors.

### What You'll Have When Complete:
- Claude Desktop with MCP filesystem server configured
- Claude Code CLI properly installed
- Claude-Flow with working shortcuts
- Three PowerShell shortcuts: `hive-mind`, `hive-swarm`, `hive-mind-advanced`
- All shortcuts working from any terminal or command prompt

---

## SYSTEM PREREQUISITES

RUN THESE COMMANDS IN TERMINAL AND RESTART TERMINAL WHEN DONE:
Complete installation sequence for PowerShell (run as Administrator):

  winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements

  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

  winget install Git.Git --accept-package-agreements --accept-source-agreements

  winget install Microsoft.PowerShell --accept-package-agreements --accept-source-agreements

  refreshenv

  python -m pip install --upgrade pip

  npm install -g @modelcontextprotocol/server-filesystem

  npm install -g @anthropic-ai/claude-code

  npm install -g claude-flow@latest

  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

  [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path",
  [EnvironmentVariableTarget]::User) + ";C:\Claude-Flow;C:\Users\$env:USERNAME\AppData\Roaming\npm;C:\Program
  Files\Python312;C:\Program Files\Python312\Scripts", [EnvironmentVariableTarget]::User)

  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path","Machine")

  node --version

  python --version

  git --version

  npm --version

  Write-Host "All prerequisites installed. Restart terminal for full PATH updates." -ForegroundColor Green

### Operating System Requirements
- **Windows 10** (version 1903 or later) OR **Windows 11**
- **64-bit architecture** required
- **Administrator privileges** for installation steps

### Required Software Prerequisites

#### 1. PowerShell
```powershell
# Check PowerShell version (need 5.1 or higher, 7+ recommended)
$PSVersionTable.PSVersion

# If version is below 5.1, update Windows
# For PowerShell 7+ (recommended), install from:
# https://github.com/PowerShell/PowerShell/releases
```

#### 2. Node.js and npm
- **Version Required**: Node.js 20.0.0 or higher
- **Download**: https://nodejs.org/
- **Includes**: npm (Node Package Manager)
```powershell
# After installation, verify:
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

#### 3. Git for Windows (Recommended)
- **Download**: https://git-scm.com/download/win
- **Purpose**: Version control and some claude-flow features
- **Includes**: Git Bash (useful for Unix-like commands)
```powershell
# Verify installation:
git --version
```

#### 4. Python (Optional but Recommended)
- **Version**: Python 3.8 or higher
- **Download**: https://www.python.org/downloads/
- **Purpose**: Some claude-flow analysis features may use Python
```powershell
# Verify installation:
python --version
```

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended for large AI operations)
- **Disk Space**: At least 10GB free space in C:\ drive
- **Internet**: Stable connection for package downloads and AI operations
- **Permissions**: Ability to:
  - Install software
  - Modify system PATH
  - Create directories in C:\
  - Run PowerShell scripts

### Pre-Setup Checklist
```powershell
# Run this diagnostic script to check prerequisites
Write-Host "Checking System Prerequisites..." -ForegroundColor Cyan

# Check Windows version
$os = Get-WmiObject -Class Win32_OperatingSystem
Write-Host "OS: $($os.Caption) - Version $($os.Version)"

# Check PowerShell version
Write-Host "PowerShell: $($PSVersionTable.PSVersion)"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if ($isAdmin) {
    Write-Host "Administrator: Yes" -ForegroundColor Green
} else {
    Write-Host "Administrator: No - Some steps may require admin rights" -ForegroundColor Yellow
}

# Check Node.js
try {
    $nodeVer = node --version
    Write-Host "Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "Node.js: Not installed" -ForegroundColor Red
}

# Check npm
try {
    $npmVer = npm --version
    Write-Host "npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "npm: Not installed" -ForegroundColor Red
}

# Check Git
try {
    $gitVer = git --version
    Write-Host "Git: $gitVer" -ForegroundColor Green
} catch {
    Write-Host "Git: Not installed (optional)" -ForegroundColor Yellow
}

# Check Python
try {
    $pythonVer = python --version 2>&1
    Write-Host "Python: $pythonVer" -ForegroundColor Green
} catch {
    Write-Host "Python: Not installed (optional)" -ForegroundColor Yellow
}

# Check disk space
$disk = Get-PSDrive C
$freeGB = [math]::Round($disk.Free / 1GB, 2)
if ($freeGB -gt 10) {
    Write-Host "Disk Space: ${freeGB}GB free" -ForegroundColor Green
} else {
    Write-Host "Disk Space: ${freeGB}GB free - May be insufficient" -ForegroundColor Yellow
}

Write-Host "`nPrerequisite check complete!" -ForegroundColor Cyan
```

### Fixing Common Prerequisites Issues

#### If PowerShell Scripts Are Blocked:
```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force
```

#### If npm Commands Fail:
```powershell
# Clear npm cache
npm cache clean --force

# Set npm registry (if behind corporate proxy)
npm config set registry https://registry.npmjs.org/
```

#### If Node.js Version Is Too Old:
```powershell
# Uninstall old version via Control Panel
# Download latest LTS from https://nodejs.org/
# Install with "Add to PATH" option checked
```

---

## FILES TO COPY FROM SOURCE MACHINE

### Required Files and Their Locations:

1. **PowerShell Scripts (3 files)**
   - Source: `C:\Claude-Flow\hive-mind.ps1`
   - Source: `C:\Claude-Flow\hive-swarm.ps1`
   - Source: `C:\Claude-Flow\hive-mind-advanced.ps1`

2. **Batch Files (3 files)**
   - Source: `C:\Claude-Flow\hive-mind.bat`
   - Source: `C:\Claude-Flow\hive-swarm.bat`
   - Source: `C:\Claude-Flow\hive-mind-advanced.bat`

3. **Hive Prompt File**
   - Source: `C:\hive_prompt.txt`
   - This contains your AI task objectives

### File Copy Instructions:
```powershell
# Run on source machine to create transfer package
$transferDir = "C:\HiveTransfer"
New-Item -ItemType Directory -Path $transferDir -Force

# Copy all required files
Copy-Item "C:\Claude-Flow\hive-*.ps1" -Destination $transferDir\
Copy-Item "C:\Claude-Flow\hive-*.bat" -Destination $transferDir\
Copy-Item "C:\hive_prompt.txt" -Destination $transferDir\

Write-Host "Files ready for transfer in: $transferDir"
```

---

## PHASE 1: CLAUDE DESKTOP AND MCP SERVER SETUP

### Step 1.1: Install Claude Desktop
```powershell
# Download Claude Desktop from:
# https://claude.ai/download

# After installation, Claude Desktop will be at:
# C:\Users\[USERNAME]\AppData\Local\Programs\Claude\Claude.exe
```

### Step 1.2: Install Node.js (Required for MCP)
```powershell
# Download and install Node.js 20.x or higher from:
# https://nodejs.org/

# Verify installation:
node --version
npm --version
```

### Step 1.3: Install MCP Filesystem Server
```powershell
# Install the MCP filesystem server globally
npm install -g @modelcontextprotocol/server-filesystem

# Verify installation - should show the package
npm list -g @modelcontextprotocol/server-filesystem
```

### Step 1.4: Configure Claude Desktop for MCP
```powershell
# The Claude Desktop config file is located at:
# C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json

# Create or update this file with the following content:
```

**IMPORTANT: Create/Edit `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\"
      ]
    }
  }
}
```

### Step 1.5: Restart Claude Desktop
```powershell
# Close Claude Desktop completely (check system tray)
# Restart Claude Desktop
# You should see MCP icon in Claude interface
```

---

## PHASE 2: CLAUDE CODE CLI INSTALLATION

### Step 2.1: Install Claude Code CLI (Correct Package)

**CRITICAL LESSON LEARNED**: There are two different "claude" packages. We need BOTH:
1. The main Claude CLI (usually comes with Claude Desktop)
2. The @anthropic-ai/claude-code package (for programmatic integration)

```powershell
# Install the claude-code package that claude-flow needs
npm install -g @anthropic-ai/claude-code

# Verify installation
npm list -g @anthropic-ai/claude-code

# This should show version 1.0.80 or higher
```

### Step 2.2: Verify Claude Commands
```powershell
# Check where claude commands are installed
where.exe claude

# You should see multiple locations:
# C:\Users\[USERNAME]\.local\bin\claude.exe (main Claude CLI)
# C:\Users\[USERNAME]\AppData\Roaming\npm\claude.cmd (claude-code)
```

---

## PHASE 3: CLAUDE-FLOW SETUP AND WORKSPACE CONFIGURATION

### Step 3.1: Create Centralized Directory Structure

**CRITICAL WORKSPACE SETUP**: All AI operations will be centralized in `C:\Claude-Flow\output-files` to prevent file clutter across your system.

```powershell
# Create the centralized workspace structure
New-Item -ItemType Directory -Path "C:\Claude-Flow" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\bin" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\.hive-mind" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\.hive-mind\sessions" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\reports" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\generated-code" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\data" -Force

Write-Host "Centralized workspace created at C:\Claude-Flow\output-files" -ForegroundColor Green
```

### Step 3.2: Install and Initialize Claude-Flow with SPARC
```powershell
# Change to Claude-Flow directory
cd C:\Claude-Flow

# Install claude-flow globally (using @latest to avoid alpha bugs)
npm install -g claude-flow@latest

# Initialize claude-flow with SPARC methodology and monitoring
npx claude-flow@latest init --monitoring

# This creates:
# - CLAUDE.md (SPARC context file)
# - .claude/commands directory
# - Initial configuration
```

### Step 3.3: Configure SPARC and Workspace Settings

**Create CLAUDE.md with workspace configuration:**
```powershell
# Create CLAUDE.md with SPARC context and workspace rules
@"
# Claude-Flow AI Orchestration System

## Workspace Configuration
- **PRIMARY WORKSPACE**: C:\Claude-Flow\output-files
- **ALL outputs must be saved to**: C:\Claude-Flow\output-files
- **Session files location**: C:\Claude-Flow\output-files\.hive-mind\sessions
- **Reports location**: C:\Claude-Flow\output-files\reports
- **Generated code location**: C:\Claude-Flow\output-files\generated-code

## SPARC Methodology
This system uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) for all development tasks.

### Available SPARC Modes:
- **sparc_specification**: Define requirements and specifications
- **sparc_pseudocode**: Create logical flow and algorithms
- **sparc_architecture**: Design system architecture
- **sparc_refinement**: Optimize and refine implementation
- **sparc_completion**: Finalize and complete the task

## System Commands
- hive-swarm: Production-ready swarm orchestration (stable)
- hive-mind: Experimental Queen-led coordination
- hive-mind-advanced: Intelligent agent selection with latest features

## Important Rules
1. ALWAYS save outputs to C:\Claude-Flow\output-files
2. NEVER scatter files across the system
3. Use relative paths from workspace when possible
4. Clean up temporary files after operations
5. Maintain organized subdirectories for different output types

## Active Configuration
- Node.js Version: 20.x or higher
- Claude-Flow Version: @latest
- Workspace: C:\Claude-Flow\output-files
- Hive Prompt: C:\hive_prompt.txt
"@ | Out-File -FilePath "C:\Claude-Flow\CLAUDE.md" -Encoding UTF8

Write-Host "CLAUDE.md created with SPARC configuration" -ForegroundColor Green
```

### Step 3.4: Set Environment Variables for Workspace
```powershell
# Set environment variables to ensure workspace is always used
[Environment]::SetEnvironmentVariable("CLAUDE_FLOW_WORKSPACE", "C:\Claude-Flow\output-files", [EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable("CLAUDE_FLOW_HOME", "C:\Claude-Flow", [EnvironmentVariableTarget]::User)

# Update current session
$env:CLAUDE_FLOW_WORKSPACE = "C:\Claude-Flow\output-files"
$env:CLAUDE_FLOW_HOME = "C:\Claude-Flow"

Write-Host "Workspace environment variables set" -ForegroundColor Green
```

### Step 3.5: Initialize SPARC Modes
```powershell
# Initialize all SPARC development modes
cd C:\Claude-Flow

# Initialize SPARC modes (this enables all 17 SPARC modes)
npx claude-flow@latest sparc init

# List available SPARC modes
npx claude-flow@latest sparc list

# You should see modes like:
# - sparc_specification
# - sparc_pseudocode  
# - sparc_architecture
# - sparc_refinement
# - sparc_completion
# And 12+ more specialized modes
```

### Step 3.6: Configure Git to Ignore Output Files (Optional but Recommended)
```powershell
# If using git, create .gitignore to prevent output clutter in repos
@"
# Claude-Flow outputs
output-files/
.hive-mind/sessions/
*.log
*.tmp
reports/
generated-code/
data/

# But track configuration
!CLAUDE.md
!hive-*.ps1
!hive-*.bat
"@ | Out-File -FilePath "C:\Claude-Flow\.gitignore" -Encoding UTF8

Write-Host ".gitignore configured for clean repository" -ForegroundColor Green
```

### Step 3.7: Copy Shortcut Files
```powershell
# Copy the files from your transfer directory to Claude-Flow
Copy-Item "C:\HiveTransfer\hive-*.ps1" -Destination "C:\Claude-Flow\"
Copy-Item "C:\HiveTransfer\hive-*.bat" -Destination "C:\Claude-Flow\"
Copy-Item "C:\HiveTransfer\hive_prompt.txt" -Destination "C:\"

# Verify files are in place
Get-ChildItem C:\Claude-Flow\hive-*
Get-Item C:\hive_prompt.txt
```

---

## PHASE 4: PATH CONFIGURATION

### Step 4.1: Add Claude-Flow to System PATH

**CRITICAL FIX**: The shortcuts need to be accessible from anywhere.

```powershell
# Add C:\Claude-Flow to system PATH permanently
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User) + ";C:\Claude-Flow",
    [EnvironmentVariableTarget]::User
)

# Also add npm global path if not already there
$npmPath = "$env:USERPROFILE\AppData\Roaming\npm"
if ($env:PATH -notlike "*$npmPath*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User) + ";$npmPath",
        [EnvironmentVariableTarget]::User
    )
}

# Refresh current session PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```

### Step 4.2: Set Execution Policy for PowerShell Scripts
```powershell
# Allow PowerShell scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

---

## PHASE 5: CRITICAL WORKAROUNDS IMPLEMENTATION

### Understanding the Workarounds (IMPORTANT!)

**The Problem We Solved:**
- claude-flow (both @latest and @alpha) has a bug in detecting Claude Code CLI
- It creates the necessary prompt files but fails to execute Claude
- Our scripts work around this by:
  1. Running claude-flow in a background job
  2. Letting it timeout/fail after creating the prompt
  3. Manually executing Claude with the prompt

**Why Our Scripts Work:**
- They bypass claude-flow's broken Claude detection
- They use claude-flow ONLY to generate the swarm configuration
- They execute Claude directly using the generated prompts

### Verify the Workarounds are in Place:

```powershell
# Check that hive-mind.ps1 contains the bypass code
Select-String -Path "C:\Claude-Flow\hive-mind.ps1" -Pattern "Start-Job|dangerously-skip-permissions"

# Should show lines containing the background job execution and Claude bypass
```

---

## PHASE 6: TESTING AND VALIDATION

### Step 6.1: Test Basic Components
```powershell
# Test Node.js
node --version

# Test npm
npm --version

# Test Claude CLI
claude --version

# Test claude-flow
npx claude-flow@latest --help
```

### Step 6.2: Test Each Shortcut
```powershell
# First, create a test objective
"Test the AI orchestration system" | Out-File -FilePath C:\hive_prompt.txt

# Test Hive-Swarm (most stable)
hive-swarm

# Test Hive-Mind (experimental)
hive-mind

# Test Hive-Mind-Advanced (with intelligent agent selection)
hive-mind-advanced
```

### Step 6.3: Verify Output
```powershell
# Check that output files are being created
Get-ChildItem "C:\Claude-Flow\output-files\.hive-mind\sessions\*.txt" | Select-Object -Last 5

# Should show recently created prompt files
```

---

## PHASE 7: TROUBLESHOOTING GUIDE

### If "command not found" errors:
```powershell
# Restart your terminal/PowerShell after PATH changes
# Or manually refresh:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```

### If "Claude Code CLI not found" error still appears:
This is EXPECTED! The scripts are designed to work around this error.
- The error appears but the scripts continue working
- Check that prompt files are created in `.hive-mind\sessions\`
- The script will execute Claude directly after the error

### If scripts don't run:
```powershell
# Check execution policy
Get-ExecutionPolicy -Scope CurrentUser

# Should be RemoteSigned or Unrestricted
# If not, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### If MCP server doesn't work in Claude:
1. Verify the config file path: `C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json`
2. Ensure the JSON syntax is exactly correct
3. Completely quit Claude Desktop (including system tray) and restart
4. Look for MCP indicator in Claude interface

---

## COMMAND REFERENCE

### Hive-Swarm (Production-Ready)
```powershell
# Basic usage
hive-swarm

# With additional context
hive-swarm "Focus on performance"
```
- Uses local claude-flow binary
- Most stable option
- Optimal for production tasks

### Hive-Mind (Experimental)
```powershell
# Basic usage
hive-mind

# With additional context
hive-mind "Use TypeScript"
```
- Queen-led coordination
- Good for testing approaches
- May have known issues

### Hive-Mind-Advanced (Intelligent)
```powershell
# Basic usage
hive-mind-advanced

# With context and parameters
hive-mind-advanced "Build API" "sparc" 15
```
- Automatically selects appropriate agents based on task
- Pulls latest claude-flow version
- Includes advanced features like weighted consensus
- Supports 22+ specialized agent types

---

## FINAL VALIDATION CHECKLIST

### Core Setup
- [ ] Claude Desktop installed and running
- [ ] MCP filesystem server installed via npm
- [ ] claude_desktop_config.json configured correctly
- [ ] MCP indicator visible in Claude Desktop
- [ ] @anthropic-ai/claude-code package installed
- [ ] claude-flow@latest installed

### Workspace & SPARC Configuration
- [ ] C:\Claude-Flow\output-files directory structure created
- [ ] CLAUDE.md file created with workspace rules
- [ ] SPARC modes initialized (verify with `npx claude-flow@latest sparc list`)
- [ ] Environment variables set (CLAUDE_FLOW_WORKSPACE, CLAUDE_FLOW_HOME)
- [ ] All outputs going to C:\Claude-Flow\output-files (no scattered files)

### Scripts & Execution
- [ ] All 6 script files in C:\Claude-Flow
- [ ] hive_prompt.txt exists at C:\
- [ ] C:\Claude-Flow added to PATH
- [ ] PowerShell execution policy set
- [ ] All three shortcuts working (hive-swarm, hive-mind, hive-mind-advanced)

---

## KEY INSIGHTS & LESSONS LEARNED

1. **Two Different Claude Packages**: The main Claude CLI and @anthropic-ai/claude-code serve different purposes. Both are needed.

2. **PATH Order Matters**: The npm claude-code must come before the .local/bin claude in PATH for detection to work properly.

3. **The @alpha Bug**: Both @latest and @alpha versions of claude-flow have broken Claude detection. Our workaround bypasses this entirely.

4. **Background Job Execution**: Running claude-flow in a background job allows it to fail gracefully while still creating needed files.

5. **Direct Claude Execution**: Using `& $claudePath.Source --dangerously-skip-permissions` bypasses all detection issues.

6. **Prompt File Location**: Generated prompts are always in `.\hive-mind\sessions\hive-mind-prompt-*.txt`

7. **Workspace Centralization**: All AI operations MUST output to `C:\Claude-Flow\output-files` to prevent system clutter. The CLAUDE.md file enforces this.

8. **SPARC Initialization**: Running `npx claude-flow@latest init --monitoring` and `sparc init` enables all 17 SPARC development modes for structured AI workflows.

---

## WORKSPACE MANAGEMENT BEST PRACTICES

### Preventing File Clutter
1. **Always use the workspace**: The scripts are configured to use `C:\Claude-Flow\output-files`
2. **Check output location**: Before running commands, verify they're using `--workspace "C:\Claude-Flow\output-files"`
3. **Regular cleanup**: Periodically clean old session files from `.hive-mind\sessions\`
4. **Use subdirectories**: Organize outputs in subdirectories (reports/, generated-code/, data/)

### Directory Structure Explanation
```
C:\Claude-Flow\
├── output-files\           # ALL AI outputs go here
│   ├── .hive-mind\        
│   │   └── sessions\      # Temporary prompt files
│   ├── reports\           # Analysis and reports
│   ├── generated-code\    # Code generated by AI
│   └── data\              # Data files and results
├── hive-*.ps1             # PowerShell scripts
├── hive-*.bat             # Batch launchers
├── CLAUDE.md              # SPARC context and rules
└── bin\                   # Binary files

C:\hive_prompt.txt         # Your task objectives (kept at root for easy access)
```

### SPARC Mode Usage
```powershell
# Use SPARC modes for structured development
npx claude-flow@latest sparc specification "Design a REST API"
npx claude-flow@latest sparc architecture "Plan microservices"
npx claude-flow@latest sparc completion "Finalize the implementation"

# All SPARC outputs automatically go to output-files/
```

---

## QUICK SETUP SCRIPT

Save this as `setup-hive-complete.ps1` and run on new machine after copying files:

```powershell
# Complete setup script for new machine with SPARC and workspace configuration
# Run AFTER copying the 6 script files and hive_prompt.txt

Write-Host "Starting Complete Hive Setup with SPARC..." -ForegroundColor Cyan

# Install required packages
Write-Host "Installing required packages..." -ForegroundColor Yellow
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @anthropic-ai/claude-code
npm install -g claude-flow@latest

# Create complete directory structure
Write-Host "Creating workspace directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "C:\Claude-Flow" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\bin" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\.hive-mind\sessions" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\reports" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\generated-code" -Force
New-Item -ItemType Directory -Path "C:\Claude-Flow\output-files\data" -Force

# Set environment variables for workspace
Write-Host "Setting workspace environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("CLAUDE_FLOW_WORKSPACE", "C:\Claude-Flow\output-files", [EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable("CLAUDE_FLOW_HOME", "C:\Claude-Flow", [EnvironmentVariableTarget]::User)

# Add to PATH
Write-Host "Updating PATH..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User) + ";C:\Claude-Flow;$env:USERPROFILE\AppData\Roaming\npm",
    [EnvironmentVariableTarget]::User
)

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Initialize Claude-Flow with SPARC
Write-Host "Initializing Claude-Flow with SPARC..." -ForegroundColor Yellow
cd C:\Claude-Flow
npx claude-flow@latest init --monitoring
npx claude-flow@latest sparc init

# Create CLAUDE.md with workspace rules
Write-Host "Creating CLAUDE.md configuration..." -ForegroundColor Yellow
@"
# Claude-Flow AI Orchestration System

## Workspace Configuration
- PRIMARY WORKSPACE: C:\Claude-Flow\output-files
- ALL outputs must be saved to: C:\Claude-Flow\output-files
- Session files: C:\Claude-Flow\output-files\.hive-mind\sessions
- Reports: C:\Claude-Flow\output-files\reports
- Generated code: C:\Claude-Flow\output-files\generated-code

## SPARC Methodology Enabled
All 17 SPARC modes are available for structured development.

## Important Rules
1. ALWAYS save outputs to C:\Claude-Flow\output-files
2. NEVER scatter files across the system
3. Maintain organized subdirectories
"@ | Out-File -FilePath "C:\Claude-Flow\CLAUDE.md" -Encoding UTF8

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "Restart your terminal and test with: hive-swarm" -ForegroundColor Green
Write-Host "Workspace configured at: C:\Claude-Flow\output-files" -ForegroundColor Cyan
Write-Host "SPARC modes available - run: npx claude-flow@latest sparc list" -ForegroundColor Cyan
```

---

## SUPPORT & MAINTENANCE

### Updating Claude-Flow
```powershell
# To get latest features
npm update -g claude-flow@latest
```

### Viewing Logs
```powershell
# Check recent session files
Get-ChildItem "C:\Claude-Flow\output-files\.hive-mind\sessions\" | Sort-Object LastWriteTime -Descending | Select-Object -First 10
```

### Changing Objectives
```powershell
# Edit the hive_prompt.txt file
notepad C:\hive_prompt.txt
```

---

## Author Notes
This runbook consolidates all discoveries from extensive troubleshooting. The key insight is that claude-flow's Claude detection is broken, but the tool still works perfectly for generating swarm configurations. Our scripts leverage this by using claude-flow for configuration generation only, then executing Claude directly. This approach ensures reliability while maintaining access to all advanced features.

Last Updated: 2025-01-13
Tested on: Windows 10/11 with Claude Desktop, Node.js 20.x, npm 10.x
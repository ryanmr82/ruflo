# HIVE SHORTCUTS GUIDE FOR WINDOWS - SPARC-INTEGRATED AI ORCHESTRATION
Last Updated: 2025_08_12_03_15_AM
Platform: Windows with PowerShell

================================================================================
## QUICK START
================================================================================

### INSTALLATION STATUS: ✅ COMPLETE
The hive shortcuts have been installed and are ready to use from any location.

### USAGE FROM ANYWHERE:
```powershell
# From any directory in Windows Terminal/PowerShell:
hive-swarm                               # Run optimal swarm
hive-swarm "additional context"          # With extra context
Get-Content file.txt | hive-swarm        # With piped input

hive-mind                                # Run hive-mind (testing)
hive-mind "additional context"           # With extra context
```

### FIRST TIME SETUP:
1. Reload PowerShell profile (only needed once after installation):
   ```powershell
   . $PROFILE
   ```
   Or simply restart Windows Terminal/PowerShell

2. Create your objective file:
   ```powershell
   notepad C:\claude-flow\hive_prompt.txt
   # Add your main objective/task description
   ```

================================================================================
## HIVE-SWARM COMMAND (OPTIMAL - PRODUCTION READY)
================================================================================

**Shortcut Command:** `hive-swarm`
**Shortcut Command with Args:** `hive-swarm "additional context"`
**Location:** Available globally from any directory

### WHAT THE SHORTCUT DOES:
Automatically reads your objective from C:\claude-flow\hive_prompt.txt, 
combines it with any additional context you provide, and executes the SPARC-integrated 
swarm orchestration with optimal parameters.

### FULL RAW COMMAND (What the shortcut executes):
```powershell
cd C:\claude-flow\claude-flow-main
node .\bin\claude-flow.js swarm "$(Get-Content C:\claude-flow\hive_prompt.txt -Raw)" `
    --claude `
    --max-agents 10 `
    --strategy development `
    --parallel `
    --monitor `
    --workspace "C:\claude-flow\output-files"
```

### PARAMETERS INCLUDED:
• --claude          : Enhanced Claude Code integration for better agent coordination
• --max-agents 10   : Deploy up to 10 specialized AI agents (community-proven optimal)
• --strategy development : Use development strategy (best for technical tasks)
• --parallel        : Execute agents in parallel for maximum speed
• --monitor         : Enable real-time progress tracking and monitoring
• --workspace       : Force all data to centralized workspace location

### TECHNICAL CONFIGURATION:
• Execution Method: node .\bin\claude-flow.js (SPARC-integrated)
• Working Directory: C:\claude-flow\claude-flow-main (where SPARC is initialized)
• Objective Source: C:\claude-flow\hive_prompt.txt (automatic loading)
• Workspace Path: C:\claude-flow\output-files (all data centralized)
• Error Handling: Checks for SPARC init, Node.js, and hive_prompt.txt existence

### WHEN TO USE:
• Primary choice for ALL production work - most reliable execution
• Complex technical tasks requiring systematic approach
• Time-sensitive projects requiring immediate results
• Single-execution tasks without session management needs
• Any task benefiting from systematic SPARC methodology

### ADVANTAGES:
• SPARC integration provides structured, phase-based development
• Claude flag ensures optimal Claude Code integration
• Officially recommended approach ("recommended for most tasks")
• Fewer bugs and more stable than hive-mind
• Community-tested with proven results
• Direct execution without session complexity

### USAGE EXAMPLES:
```powershell
# Basic usage - reads objective from hive_prompt.txt
hive-swarm

# With additional context
hive-swarm "focus on performance optimization"

# Multiple context items
hive-swarm "use TypeScript and include comprehensive tests"

# Using pipe feature - send command output as objective
Get-Content C:\path\to\detailed-prompt.md | hive-swarm

# Pipe Windows Event Log errors
Get-EventLog -LogName Application -EntryType Error -Newest 50 | hive-swarm "analyze and fix"

# Chain commands and pipe to Hive
Get-Process | Where-Object {$_.CPU -gt 100} | hive-swarm "optimize these processes"

# Send multiple files
Get-Content file1.txt, file2.txt, file3.txt | hive-swarm "consolidate and analyze"
```

================================================================================
## HIVE-MIND COMMAND (TESTING/COMPARISON - KNOWN ISSUES)
================================================================================

**Shortcut Command:** `hive-mind`
**Shortcut Command with Args:** `hive-mind "additional context"`
**Location:** Available globally from any directory

### WHAT THE SHORTCUT DOES:
Automatically reads your objective from C:\claude-flow\hive_prompt.txt,
combines it with any additional context you provide, and executes the SPARC-integrated
hive-mind spawn system with Queen-led coordination (currently has known bugs).

### FULL RAW COMMAND (What the shortcut executes):
```powershell
cd C:\claude-flow\claude-flow-main
node .\bin\claude-flow.js hive-mind spawn "$(Get-Content C:\claude-flow\hive_prompt.txt -Raw)" `
    --claude `
    --max-agents 10 `
    --strategy development `
    --parallel `
    --monitor `
    --workspace "C:\claude-flow\output-files"
```

### PARAMETERS INCLUDED:
• --claude          : Generates Claude Code spawn commands with coordination (REQUIRED)
• --max-agents 10   : Deploy up to 10 specialized AI agents (when working)
• --strategy development : Use development strategy (when functional)
• --parallel        : Execute agents in parallel (when bugs resolved)
• --monitor         : Enable progress tracking (partially functional)
• --workspace       : Force all data to centralized workspace location

### TECHNICAL CONFIGURATION:
• Execution Method: node .\bin\claude-flow.js (SPARC-integrated)
• Working Directory: C:\claude-flow\claude-flow-main (where SPARC is initialized)
• Objective Source: C:\claude-flow\hive_prompt.txt (automatic loading)
• Workspace Path: C:\claude-flow\output-files (all data centralized)
• Error Handling: Checks for SPARC init, Node.js, and hive_prompt.txt existence
• Warning Display: Shows known issues message before execution

### CURRENT KNOWN ISSUES (August 2025):
• Issue #368: Often uses single agent instead of swarm
• Issue #311: Queen coordinator reverts to assistant mode
• Issue #325: Sessions cannot be resumed properly
• Issue #344: Command switches ignored/misreported
• Issue #564: "require is not defined" error in latest versions

### WHEN TO USE:
• Testing and comparison against hive-swarm performance
• Experimenting with hive-mind features despite bugs
• Future production use when bugs are resolved
• NOT recommended for critical production work currently

### WHY NOT OPTIMAL CURRENTLY:
• Multiple active bugs affecting core functionality
• Session management unreliable (cannot resume)
• Agent spawning problems (often single agent only)
• Coordinator persistence failures
• Parameter configuration issues

### THEORETICAL ADVANTAGES (When Working):
• Persistent session management for long projects
• Queen-led coordination architecture
• Resumable workflows and state management
• Complex multi-agent coordination
• Session-based memory persistence

### USAGE EXAMPLES:
```powershell
# Basic usage - reads objective from hive_prompt.txt
hive-mind

# With additional context
hive-mind "test with minimal agents"

# Comparison testing
hive-mind "same task as swarm for comparison"

# Using pipe feature - send command output as objective
Get-Content C:\path\to\complex-task.txt | hive-mind

# Pipe service status
Get-Service | Where-Object {$_.Status -eq "Stopped"} | hive-mind "analyze why stopped"

# Send configuration files for analysis
Get-Content C:\Windows\System32\drivers\etc\hosts | hive-mind "optimize configuration"
```

================================================================================
## COMPARISON BETWEEN SHORTCUTS
================================================================================

FEATURE COMPARISON:

hive-swarm (OPTIMAL):
  • Stability:           Production-ready
  • SPARC Integration:   Full integration
  • --claude Flag:       Included (optimal)
  • Execution Speed:     Fast (direct node execution)
  • Reliability:         Highly reliable
  • Session Management:  Single execution
  • Agent Coordination:  Works as expected
  • Queen Architecture:  Not used
  • Parallel Execution:  Fully functional
  • Parameter Recognition: All parameters work
  • Recommended Use:     Production work

hive-mind (TESTING):
  • Stability:           Multiple bugs (5 active)
  • SPARC Integration:   Full integration
  • --claude Flag:       Required for spawn
  • Execution Speed:     Fast (when working)
  • Reliability:         Known issues
  • Session Management:  Broken currently
  • Agent Coordination:  Often single agent
  • Queen Architecture:  Broken (reverts)
  • Parallel Execution:  Partially working
  • Parameter Recognition: Some ignored
  • Recommended Use:     Testing only

================================================================================
## WINDOWS-SPECIFIC FILE LOCATIONS AND STRUCTURE
================================================================================

INSTALLATION LOCATIONS:
• PowerShell Scripts: C:\claude-flow\
  - C:\claude-flow\hive-swarm.ps1 (main swarm script)
  - C:\claude-flow\hive-mind.ps1 (main mind script)
  - C:\claude-flow\install-hive-shortcuts.ps1 (installation script)
  - C:\claude-flow\hive_prompt.txt (your objective file)

• PowerShell Profile Functions:
  - Location: $PROFILE (typically C:\Users\[username]\Documents\PowerShell\profile.ps1)
  - Contains: hive-swarm and hive-mind functions for global access

CLAUDE-FLOW LOCATION:
All Claude-Flow files are at: C:\claude-flow\claude-flow-main\
• C:\claude-flow\claude-flow-main\bin\claude-flow.js (main executable)
• C:\claude-flow\claude-flow-main\.roo\ (SPARC methodology files)
• C:\claude-flow\claude-flow-main\.roomodes (SPARC mode configurations)
• C:\claude-flow\claude-flow-main\.claude\ (agent configurations)

WORKSPACE STRUCTURE:
C:\claude-flow\output-files\
• All operational data and output stored here
• Keeps your project directories clean
• Easy to find all generated content

================================================================================
## PREREQUISITE SETUP
================================================================================

### REQUIRED COMPONENTS (Check Status):

1. Node.js Installation:
   ```powershell
   node --version  # Should show v18.0.0 or higher
   ```
   If not installed, download from: https://nodejs.org/

2. Claude-Flow Installation:
   Location: C:\claude-flow\claude-flow-main\
   Status: ✅ Already installed with SPARC

3. Create/Edit Objective File:
   ```powershell
   notepad C:\claude-flow\hive_prompt.txt
   # Add your main objective/task description
   ```

4. Verify Setup:
   ```powershell
   # Check if shortcuts are available
   Get-Command hive-swarm
   Get-Command hive-mind
   
   # Test basic execution
   hive-swarm
   ```

================================================================================
## PIPE FEATURE FOR WINDOWS
================================================================================

### OVERVIEW:
Both shortcuts support PowerShell pipeline input, allowing you to send command output,
file contents, or analysis results directly to Hive as the primary objective.
When piped input is detected, it REPLACES the content from hive_prompt.txt.

### HOW IT WORKS:
```powershell
# Standard usage (reads from hive_prompt.txt):
hive-swarm

# Piped usage (replaces hive_prompt.txt content):
"New objective" | hive-swarm

# Piped with additional context:
Get-Content analysis.txt | hive-swarm "fix these issues with priority on security"
```

### WINDOWS-SPECIFIC PIPE EXAMPLES:

**Send Files Directly:**
```powershell
# Send a specific prompt file
Get-Content C:\Projects\complex-prompt.md | hive-swarm

# Send multiple files
Get-Content file1.txt, file2.txt, file3.txt | hive-swarm "analyze and consolidate"

# Send all text files in a directory
Get-Content C:\Logs\*.txt | hive-swarm "find patterns"
```

**Windows System Analysis:**
```powershell
# Send Event Log errors
Get-EventLog -LogName System -EntryType Error -Newest 100 | hive-swarm "diagnose"

# Send service information
Get-Service | Where-Object {$_.Status -eq "Stopped"} | hive-swarm "why stopped?"

# Send process information
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 | hive-swarm "optimize"

# Send Windows Defender logs
Get-MpThreatDetection | hive-swarm "analyze security threats"
```

**Configuration Management:**
```powershell
# Analyze IIS configuration
Get-IISAppPool | hive-swarm "optimize application pool settings"

# Review firewall rules
Get-NetFirewallRule | Where-Object {$_.Enabled -eq $true} | hive-swarm "audit rules"

# Check scheduled tasks
Get-ScheduledTask | Where-Object {$_.State -eq "Ready"} | hive-swarm "review automation"
```

**Code and Script Analysis:**
```powershell
# Send PowerShell script for review
Get-Content script.ps1 | hive-swarm "add error handling and optimize"

# Send batch file for enhancement
Get-Content deploy.bat | hive-swarm "convert to PowerShell with safety checks"

# Send JSON configuration
Get-Content config.json | ConvertFrom-Json | ConvertTo-Json | hive-swarm "validate and optimize"
```

**Real-time Monitoring:**
```powershell
# Send recent security events
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4625} -MaxEvents 50 | hive-swarm "analyze failed logins"

# Send performance counters
Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 60 | hive-swarm "analyze CPU usage"

# Send network statistics
Get-NetTCPConnection | Where-Object {$_.State -eq "Established"} | hive-swarm "analyze connections"
```

### PIPE FEATURE BENEFITS:
• Dynamic Objectives: Send real-time data without editing files
• Large Content: Pipe content too large for command line arguments
• Chaining: Combine multiple PowerShell commands with pipes
• Automation: Script complex analysis workflows
• Flexibility: Mix piped input with additional context arguments

================================================================================
## IMPLEMENTATION DETAILS
================================================================================

### WINDOWS IMPLEMENTATION SPECIFICS:

**PowerShell Functions (in $PROFILE):**
• Global functions: hive-swarm and hive-mind
• Handle argument passing and piped input
• Call the respective .ps1 scripts in C:\claude-flow\

**PowerShell Scripts (C:\claude-flow\):**
• hive-swarm.ps1: Main swarm execution script
• hive-mind.ps1: Main hive-mind execution script
• Both scripts perform:
  1. Set environment variables if needed
  2. Check prerequisites (Node.js, claude-flow, etc.)
  3. Handle piped input via $input automatic variable
  4. Read from hive_prompt.txt if no piped input
  5. Combine with command-line arguments
  6. Change to claude-flow directory
  7. Execute node with claude-flow.js and parameters
  8. Return to original directory

### ERROR HANDLING:
• Missing Claude-Flow: "Error: Claude-Flow not found at C:\claude-flow\claude-flow-main"
• Missing Node.js: "Error: Node.js is not installed or not in PATH"
• Missing Objective: "Error: C:\claude-flow\hive_prompt.txt not found"
• All errors cause immediate exit with status code 1

================================================================================
## VISUAL FEEDBACK
================================================================================

### HIVE-SWARM OUTPUT:
```
🚀 Executing OPTIMAL Hive-Swarm with SPARC integration...
📁 Claude-Flow Directory: C:\claude-flow\claude-flow-main
📂 Workspace: C:\claude-flow\output-files (all data centralized)
📋 Main Objective: [first 100 chars of objective]...
➕ Additional Context: [your additional context if provided]
```

### HIVE-MIND OUTPUT:
```
🧠 Executing Hive-Mind with SPARC integration (testing/comparison)...
📁 Claude-Flow Directory: C:\claude-flow\claude-flow-main
📂 Workspace: C:\claude-flow\output-files (all data centralized)
⚠️  Note: Using hive-mind spawn (may have known issues, for testing/comparison)
📋 Main Objective: [first 100 chars of objective]...
➕ Additional Context: [your additional context if provided]

⚠️  KNOWN ISSUES (August 2025):
  • Issue #368: Often uses single agent instead of swarm
  • Issue #311: Queen coordinator reverts to assistant mode
  • Issue #325: Sessions cannot be resumed properly
  • Issue #344: Command switches ignored/misreported
  • Issue #564: 'require is not defined' error in latest versions
```

================================================================================
## RECOMMENDATIONS
================================================================================

### FOR PRODUCTION WORK:
Always use `hive-swarm` - it's stable, reliable, and includes all optimal 
parameters with SPARC integration and Claude Code enhancement.

### FOR TESTING/COMPARISON:
Use `hive-mind` only when you want to test the hive-mind architecture or 
compare its performance against swarm, understanding it has active bugs.

### PERFORMANCE TIPS:
• Keep objectives in hive_prompt.txt under 2000 characters
• Use additional context for temporary modifications
• Monitor system resources when using max agents
• Start with fewer agents for simple tasks
• Use --parallel for independent subtasks
• Close unnecessary applications to free memory for agents

### WINDOWS-SPECIFIC TIPS:
• Run PowerShell as Administrator for system-level tasks
• Use Windows Terminal for better Unicode support (emojis)
• Consider Windows Defender exclusions for workspace folder
• Use Task Manager to monitor Node.js processes

================================================================================
## TROUBLESHOOTING
================================================================================

### COMMON WINDOWS ISSUES:

1. "Cannot be loaded because running scripts is disabled":
   ```powershell
   # Run as Administrator:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. "hive-swarm is not recognized as a cmdlet":
   ```powershell
   # Reload profile:
   . $PROFILE
   # Or restart PowerShell/Windows Terminal
   ```

3. "Node.js not found":
   • Install Node.js from https://nodejs.org/
   • Restart PowerShell after installation
   • Verify with: node --version

4. "Access denied" errors:
   • Run PowerShell as Administrator
   • Check file permissions on C:\claude-flow\

5. Unicode/Emoji display issues:
   • Use Windows Terminal instead of PowerShell ISE
   • Install Windows Terminal from Microsoft Store

6. "File not found" for claude-flow.js:
   • Verify installation at C:\claude-flow\claude-flow-main\
   • Check if bin\claude-flow.js exists
   • May need to run: npm install in claude-flow-main directory

================================================================================
## QUICK REFERENCE
================================================================================

### ESSENTIAL COMMANDS:
```powershell
# Install/Update shortcuts (run once):
. C:\claude-flow\install-hive-shortcuts.ps1

# Reload profile (after installation):
. $PROFILE

# Create/Edit objective:
notepad C:\claude-flow\hive_prompt.txt

# Run commands from anywhere:
hive-swarm                              # Production ready
hive-swarm "additional context"         # With context
Get-Content file.txt | hive-swarm       # With piped input

hive-mind                               # Testing only
hive-mind "additional context"          # With context
```

### KEY PATHS:
• Scripts: C:\claude-flow\*.ps1
• Objective: C:\claude-flow\hive_prompt.txt
• Claude-Flow: C:\claude-flow\claude-flow-main\
• Workspace: C:\claude-flow\output-files\
• Profile: $PROFILE (run to see path)

================================================================================
END OF WINDOWS GUIDE
================================================================================
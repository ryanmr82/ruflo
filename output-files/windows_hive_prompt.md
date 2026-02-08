# HIVE MIND SESSION INSTRUCTIONS - WINDOWS

## INITIAL GREETING
Ask the user what the user needs help with.

## ONCE THE USER PROVIDES A TASK, FOLLOW THESE CRITICAL INSTRUCTIONS:

### 1. ABSOLUTE REQUIREMENTS - NO ASSUMPTIONS
- **DO NOT** make assumptions
- **ALWAYS** be certain about what you analyze
- **DO NOT** guess anything
- **DO NOT** use words like "probably" or "likely"
- **ALWAYS** be certain
- **DO NOT** extrapolate
- **DO NOT** elucidate
- **ALWAYS** make sure you follow instructions exactly and if you feel there is something inefficient about the instructions, provide recommendations to ensure that best practice standards are implemented. Provide feedback and ask the user for permission in case the user is not as educated as they should be on a given topic.

### 2. PARALLEL EXECUTION & EFFICIENCY
- **ALWAYS** use concurrent/parallel execution when possible (BatchTool, multiple operations in one message). Make sure any batch tools that are created (if they are for one-time usage) are placed in a centralized folder location. Always place them in the same centralized folder location. If they're not needed in the future and they're one-time use things, then you can put them in the TEMP folder (`%TEMP%` or `C:\Users\%USERNAME%\AppData\Local\Temp`) since they will eventually get auto-cleared. The goal here is to avoid accumulating clutter over time.
- **NEVER** execute operations sequentially that could be done in parallel
- Maximize performance through parallel coordination

### 3. SYSTEM AWARENESS & CONTEXT
- **ALWAYS** check and read `C:\Claude-Flow\CLAUDE.md` at session start for project-specific rules (if it exists)
- **REVIEW** recent status reports in `C:\Claude-Flow\status-reports\` before starting work (if the folder exists)
- **CHECK** for running services and their status before making changes (use `sc query` or `Get-Service` in PowerShell)
- **UNDERSTAND** the system state before proceeding

### 4. FILE ORGANIZATION - NO CLUTTER
- **ALWAYS** make sure you back up anything to the correct centralized backup locations
- **ANALYZE** and determine what the correct backup centralized locations are for backups
  - Security has a centralized location
  - Other areas have centralized locations too
- **DO NOT** create clutters of files in various directories where it doesn't make sense
- **DO NOT** create content in the `%TEMP%` folder unless it makes sense for it to be in the temp folder
  - Example: System-critical files or configuration files should never be placed in temp folders which get cleared
- **DO NOT** create content in project folders unless it makes sense to make that update there
- **ANY BACKUPS** you make:
  - Always look for existing centralized backup folders for the given task at hand
  - If doing something new or making an upgrade in a project folder, create a backup folder within that project directory
  - If a backup folder doesn't exist, create the backup folder and put everything in there
  - We want things clean and no clutter while you're doing work

### 5. RESEARCH & BEST PRACTICES
- **ALWAYS** research things online in addition to using your internal knowledge
- **LEAN ON** industry best practices, user guides, credible community sources
- **DO NOT** reinvent the wheel - avoid reinventing the wheel
- **IF YOU RUN INTO** troubleshooting issues:
  - Absolutely do not reinvent the wheel
  - Go investigate online for troubleshooting help guides
  - Look at areas like git repos, Reddit, Stack Overflow, Microsoft documentation, and other areas where there are good ideas
  - Lean on community solutions to perform tasks more efficiently with less troubleshooting trial and error
  - Most likely somebody has already figured it out in the community. If there is a proven solution that has been validated in the community, then you can download it and try to repurpose it and install it and try it out vs. reinventing the wheel. Make sure that you follow any of the guides that come with that solution, as well as the troubleshooting guides.

### 6. TESTING & VERIFICATION
- **ALWAYS** test changes after implementation
- **VERIFY** services restart properly (if applicable)
- **CHECK** logs for errors after changes (Event Viewer, application logs, etc.)
- **NEVER** assume something worked - always verify
- If a solution requires a service or application to be restarted to apply changes, ensure you restart it properly
- For Windows services, use `net stop` and `net start` or `Restart-Service` in PowerShell
- For applications that cache configurations, ensure they're reloaded or restarted to reflect changes

### 7. COMMUNICATION STYLE
- **BE** concise and direct - avoid unnecessary preambles
- **SHOW** actual commands and output AND describe them
- **USE** clear headers to organize responses
- **PROVIDE** both the technical details and explanations

### 8. ERROR RECOVERY
- When something fails, **CHECK LOGS FIRST** (Event Viewer, application logs, debug output)
- **DOCUMENT** failed approaches in status report
- **CREATE** rollback plans before major changes
- **USE** Windows System Restore points or backups when appropriate

### 9. GIT PRACTICES
- **ONLY** commit when explicitly asked
- **USE** descriptive commit messages
- **NEVER** commit sensitive information

### 10. WINDOWS-SPECIFIC AWARENESS
- **UNDERSTAND** Windows file path conventions (use backslashes, be aware of spaces in paths)
- **KNOW** about Windows permissions and UAC (User Account Control)
- **BE AWARE** of PowerShell vs Command Prompt differences
- **UNDERSTAND** Windows services and their dependencies
- **KNOW** about Windows Registry implications when applicable

### 11. SERVICE DEPENDENCIES
- **UNDERSTAND** which services depend on each other
- **KNOW** critical Windows services
- **CHECK** service status before and after changes using `sc query` or PowerShell cmdlets
- **BE AWARE** of application dependencies and DLL requirements

### 12. SECURITY PRACTICES
- **NEVER** expose passwords, keys, or sensitive data in files or logs
- **ALWAYS** check file permissions after creating files (use `icacls` or File Properties)
- **BE AWARE** of what's publicly accessible vs internal
- **FOLLOW** Windows security best practices (least privilege, proper ACLs)

### 13. STATUS REPORT REQUIREMENTS
**WHEN YOU ARE DONE** performing any task, you **ALWAYS** create a markdown file which is a readout of what you've done:

- **LOCATION**: The file will always go in `C:\Claude-Flow\status-reports\` (create the folder if it doesn't exist)
- **CONTENT**: Make sure it's quite detailed and includes:
  - What was accomplished
  - Lessons learned
  - Things that didn't work (so you don't repeat something in a new session that didn't work)
  - Commands used (PowerShell, CMD, or other tools)
  - Files modified including their full file paths
  - Services or applications affected
  - Rollback procedures if applicable
  
- **FILE NAMING CONVENTION**: 
  - Format: `YYYY_MM_DD_HH_MM_AM-PM_TIMEZONE_Topic_Description.md`
  - Example: `2025_08_21_03_45_PM_EST_Windows_Configuration_Update.md`
  - Always date the files by the year and time based on the system time
  - Look at the existing reports in `C:\Claude-Flow\status-reports\` to see the naming standard (if any exist)
  - Name the file names as close as possible to the topic at hand
  - If there are more than one topic in a given session, make sure the title reflects that multiple topics were covered
  - Note: Use hyphens instead of forward slashes for AM/PM to ensure Windows file compatibility

### 14. INDEX FILE MAINTENANCE
- **CREATE (only done first time single creation) AND UPDATE** an index file in `C:\Claude-Flow\status-reports\`
- **UPDATE** that index file every time you add a status report
- The index file will assist in helping you find content across these documents
- **INDEXING** will be important to help you search and find things better
- The index file will include **RICH METADATA** that will help you identify files to read before you begin any task
- The indexing file name should be `INDEX.md` in the status-reports folder

### 15. HISTORICAL CONTEXT
- **ALWAYS** reference the `C:\Claude-Flow\status-reports\` folder when doing work (if it exists)
- This provides you with historical context
- **READ** relevant past reports before starting similar tasks
- **LEARN** from documented failures and successes

## CRITICAL REMINDERS:
1. **DO NOT** deviate from these instructions
2. **ALWAYS** be methodical and certain
3. **ALWAYS** verify your work
4. **ALWAYS** document what you've done
5. **ALWAYS** keep the system clean and organized
6. **ALWAYS** follow the established patterns and conventions

---

**These instructions are to be followed for EVERY session to ensure consistency, efficiency, and proper documentation.**
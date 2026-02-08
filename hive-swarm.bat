@echo off
REM HIVE-SWARM Batch Wrapper for Windows PATH
REM This enables hive-swarm command from CMD/PowerShell  
REM Mode: SWARM (Distributed parallel execution)

powershell.exe -ExecutionPolicy Bypass -File "C:\claude-flow\hive-swarm.ps1" %*
@echo off
REM HIVE-MIND Batch Wrapper for Windows PATH
REM This enables hive-mind command from CMD/PowerShell
REM Mode: MIND (Queen-led strategic planning)

chcp 65001 >nul 2>&1
powershell.exe -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & 'C:\claude-flow\hive-mind.ps1'" %*
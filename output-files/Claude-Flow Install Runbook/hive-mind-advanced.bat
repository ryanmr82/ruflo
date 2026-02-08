@echo off
:: Hive-Mind-Advanced Batch File Launcher
:: Executes the advanced hive-mind PowerShell script with intelligent agent selection

:: Fix PATH order - npm's claude-code must come BEFORE .local/bin claude
set PATH=C:\Users\ryanr\AppData\Roaming\npm;C:\Users\ryanr\.local\bin;%PATH%

powershell -ExecutionPolicy Bypass -File "C:\Claude-Flow\hive-mind-advanced.ps1" %*
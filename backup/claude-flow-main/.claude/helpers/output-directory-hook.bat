@echo off
REM Claude Flow Output Directory Hook for Windows
REM This hook ensures files are created in the correct output directory

SET OUTPUT_DIR=C:\Claude-Flow\output-files
SET BACKUP_DIR=C:\Claude-Flow\output-files\backups

REM Check the operation type
SET OPERATION=%1
SET FILE_PATH=%2

IF "%OPERATION%"=="pre-write" GOTO PRE_WRITE
IF "%OPERATION%"=="pre-edit" GOTO PRE_WRITE
IF "%OPERATION%"=="post-write" GOTO POST_WRITE
IF "%OPERATION%"=="post-edit" GOTO POST_WRITE
GOTO END

:PRE_WRITE
REM Check if file path is provided and is absolute
IF "%FILE_PATH%"=="" GOTO USE_DEFAULT
IF NOT "%FILE_PATH:~1,1%"==":" GOTO USE_DEFAULT
IF NOT "%FILE_PATH:Claude-Flow=%"=="%FILE_PATH%" GOTO EXTERNAL_PATH

:USE_DEFAULT
REM Determine subdirectory based on file extension
FOR %%i IN ("%FILE_PATH%") DO SET EXT=%%~xi
SET SUBDIR=temp

IF "%EXT%"==".js" SET SUBDIR=generated-code
IF "%EXT%"==".ts" SET SUBDIR=generated-code
IF "%EXT%"==".py" SET SUBDIR=generated-code
IF "%EXT%"==".java" SET SUBDIR=generated-code
IF "%EXT%"==".cpp" SET SUBDIR=generated-code
IF "%EXT%"==".c" SET SUBDIR=generated-code
IF "%EXT%"==".h" SET SUBDIR=generated-code
IF "%EXT%"==".go" SET SUBDIR=generated-code
IF "%EXT%"==".rs" SET SUBDIR=generated-code

IF "%EXT%"==".md" SET SUBDIR=reports
IF "%EXT%"==".txt" SET SUBDIR=reports
IF "%EXT%"==".pdf" SET SUBDIR=reports
IF "%EXT%"==".doc" SET SUBDIR=reports
IF "%EXT%"==".docx" SET SUBDIR=reports

IF "%EXT%"==".json" SET SUBDIR=data
IF "%EXT%"==".xml" SET SUBDIR=data
IF "%EXT%"==".csv" SET SUBDIR=data
IF "%EXT%"==".xlsx" SET SUBDIR=data
IF "%EXT%"==".xls" SET SUBDIR=data

REM Create the subdirectory if it doesn't exist
IF NOT EXIST "%OUTPUT_DIR%\%SUBDIR%" MKDIR "%OUTPUT_DIR%\%SUBDIR%"

REM Set the output path
FOR %%i IN ("%FILE_PATH%") DO SET FILENAME=%%~nxi
SET CLAUDE_FLOW_OUTPUT_PATH=%OUTPUT_DIR%\%SUBDIR%\%FILENAME%
echo Output will be saved to: %CLAUDE_FLOW_OUTPUT_PATH%
GOTO END

:EXTERNAL_PATH
echo External path detected: %FILE_PATH%
REM Create backup if file exists
IF EXIST "%FILE_PATH%" (
    FOR %%i IN ("%FILE_PATH%") DO SET FILENAME=%%~nxi
    FOR /f "tokens=2-4 delims=/ " %%a IN ('date /t') DO SET DATE=%%c%%a%%b
    FOR /f "tokens=1-2 delims=: " %%a IN ('time /t') DO SET TIME=%%a%%b
    SET BACKUP_FILE=%BACKUP_DIR%\%FILENAME%.%DATE%-%TIME%.bak
    COPY "%FILE_PATH%" "%BACKUP_FILE%" >nul 2>&1
    echo Backup created: %BACKUP_FILE%
)
SET CLAUDE_FLOW_OUTPUT_PATH=%FILE_PATH%
GOTO END

:POST_WRITE
echo File operation completed: %FILE_PATH%
REM Log to manifest
echo %date% %time% - %FILE_PATH% >> "%OUTPUT_DIR%\manifest.log"
GOTO END

:END

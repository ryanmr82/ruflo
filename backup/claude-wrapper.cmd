@echo off
REM Wrapper to ensure claude is found
set PATH=%PATH%;C:\Users\ryanr\AppData\Roaming\npm
C:\Users\ryanr\AppData\Roaming\npm\claude.cmd %*

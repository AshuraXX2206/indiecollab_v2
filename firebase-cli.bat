@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%node_modules\firebase-tools\lib\bin\firebase.js" %*

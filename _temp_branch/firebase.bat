@echo off
cd /d "%~dp0"
node "%~dp0node_modules\firebase-tools\lib\bin\firebase.js" %*

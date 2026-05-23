@echo off
chcp 65001 >nul
echo ============================================
echo    Firebase Login
echo ============================================
echo.

if not exist "%~dp0firebase.exe" (
    echo Firebase CLI not found!
    echo.
    echo Please wait for the download to complete,
    echo or run: install-firebase.ps1
    pause
    exit /b 1
)

echo Running Firebase login...
echo A browser window will open for you to login.
echo.
"%~dp0firebase.exe" login
echo.
echo Login complete!
pause

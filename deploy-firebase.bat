@echo off
chcp 65001 >nul
echo ============================================
echo    Firebase Deploy Script
echo ============================================
echo.
echo [1/4] Checking Firebase CLI...

if not exist "%~dp0firebase.exe" (
    echo Firebase CLI not found. Please run: install-firebase.ps1 first
    pause
    exit /b 1
)

echo [2/4] Firebase CLI found!
echo.
echo [3/4] Running Firebase Login...
echo Click the link below to login with your Google account
echo.

"%~dp0firebase.exe" login

if %ERRORLEVEL% neq 0 (
    echo.
    echo Login failed or cancelled.
    pause
    exit /b 1
)

echo.
echo [4/4] Deploying to Firebase...
echo.
echo Select what to deploy:
echo 1. Firestore only
echo 2. Auth only  
echo 3. Both Firestore + Auth
echo.

choice /C 123 /M "Select option: "

if %ERRORLEVEL% equ 1 (
    echo.
    echo Deploying Firestore...
    "%~dp0firebase.exe" deploy --only firestore
)

if %ERRORLEVEL% equ 2 (
    echo.
    echo Deploying Auth...
    "%~dp0firebase.exe" deploy --only auth
)

if %ERRORLEVEL% equ 3 (
    echo.
    echo Deploying Firestore + Auth...
    "%~dp0firebase.exe" deploy --only firestore,auth
)

echo.
echo ============================================
echo    Deploy complete!
echo ============================================
pause

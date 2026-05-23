# Download Firebase CLI standalone for Windows
$ProgressPreference = 'SilentlyContinue'
$version = "v15.18.0"
$url = "https://github.com/firebase/firebase-tools/releases/download/$version/firebase-tools-win.exe"
$output = "$PSScriptRoot\firebase.exe"

Write-Host "Downloading Firebase CLI $version..."
try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "Downloaded successfully to: $output"
    Write-Host ""
    Write-Host "Run the following to login:"
    Write-Host ".\firebase.exe login"
} catch {
    Write-Error "Failed to download: $_"
}

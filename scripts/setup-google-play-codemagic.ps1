# One-time setup: Google Play auto-upload via Codemagic
# Run: powershell -ExecutionPolicy Bypass -File scripts/setup-google-play-codemagic.ps1

$DeveloperId = "7867789338046928988"
$PackageName = "com.themuslimman.seerah"

Write-Host ""
Write-Host "=== Google Play + Codemagic auto-upload setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1 - Create a Google Play service account (if needed):"
Write-Host "  a) Open Play Console > Setup > API access"
Write-Host "  b) Link a Google Cloud project (or create one)"
Write-Host "  c) Create service account > Grant access > Release manager (or Admin)"
Write-Host "  d) Download the JSON key file"
Write-Host ""
Write-Host "Step 2 - Add the JSON key to Codemagic:"
Write-Host "  a) Codemagic > your app > Environment variables"
Write-Host "  b) Group name: google_play"
Write-Host "  c) Variable: GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS"
Write-Host "  d) Value: paste entire JSON key file contents"
Write-Host "  e) Check Secret and save"
Write-Host ""
Write-Host "Step 3 - Re-run Android Release build (or push to main)"
Write-Host ""
Write-Host "Package: $PackageName"
Write-Host "Track:   internal (Internal Testing)"
Write-Host ""

$urls = @(
    "https://play.google.com/console/u/0/developers/$DeveloperId/users-and-permissions",
    "https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com",
    "https://codemagic.io/apps"
)

foreach ($url in $urls) {
    Start-Process $url
    Start-Sleep -Milliseconds 800
}

Write-Host "Opened Play Console, Google Cloud API, and Codemagic in your browser." -ForegroundColor Green
Write-Host "After adding the secret, every Android build will upload to Internal Testing automatically." -ForegroundColor Green

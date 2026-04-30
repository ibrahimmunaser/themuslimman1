$lockFile = ".git/index.lock"
$maxAttempts = 5
$attempt = 1

while ($attempt -le $maxAttempts) {
    Write-Host "Attempt $attempt of $maxAttempts..."
    
    # Kill any processes holding the lock
    $gitProcesses = Get-Process | Where-Object { $_.ProcessName -like "*git*" }
    if ($gitProcesses) {
        $gitProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Remove lock file if it exists
    if (Test-Path $lockFile) {
        Start-Sleep -Milliseconds 500
        Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    
    # Try git operations
    try {
        git add "app/preview/[partId]/page.tsx" lib/files.ts lib/r2.ts
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Git add failed"
            $attempt++
            Start-Sleep -Seconds 2
            continue
        }
        
        git commit -m "Fix infographics loading from R2 storage"
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
            Write-Host "Git commit failed"
            $attempt++
            Start-Sleep -Seconds 2
            continue
        }
        
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Success!"
            exit 0
        }
        
    } catch {
        Write-Host "Error: $_"
    }
    
    $attempt++
    Start-Sleep -Seconds 3
}

Write-Host "Failed after $maxAttempts attempts"
exit 1

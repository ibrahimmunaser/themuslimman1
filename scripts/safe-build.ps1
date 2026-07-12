# Safe local production build for memory-constrained Windows machines.
#
# Stress-test findings (2026-07-08):
# - Default Next.js spawns os.cpus()-1 workers (15 on this machine).
# - `next build` (Turbopack) and `next build --webpack` both spiked RAM to
#   ~97% during "Creating an optimized production build".
# - NODE_OPTIONS --max-old-space-size only caps V8 heap, not native memory.
# - Cursor's TypeScript servers also run node.exe (~3 GB cap each) and grow
#   during builds - counted separately below.
#
# This script:
# 1. Clears a stale .next cache (partial failed builds bloat disk/RAM).
# 2. Runs prisma generate + next build --webpack (webpack path respects
#    experimental.webpackMemoryOptimizations + cpus: 1 in next.config.ts).
# 3. Aborts BEFORE the machine hits critical memory (default: 10 GB free).
# 4. Logs per-interval memory samples to build_memory_log.csv.

param(
  [double]$MinFreeGB = 10.0,
  [int]$PollSeconds = 2
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== Safe build starting ==="
Write-Host "Abort threshold: free memory < $MinFreeGB GB"
Write-Host ""

if (Test-Path ".next") {
  Write-Host "Removing stale .next cache..."
  Remove-Item -Path ".next" -Recurse -Force
}

$env:NODE_OPTIONS = "--max-old-space-size=1536"

$logPath = "build_memory_log.csv"
"timestamp,freeGB,buildNodeMB,cursorNodeMB,otherNodeMB,buildNodeCount" | Set-Content $logPath

function Get-NodeMemoryBreakdown {
  $all = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
  if (-not $all) {
    return @{ buildMB = 0; cursorMB = 0; otherMB = 0; buildCount = 0 }
  }

  $buildMB = 0; $cursorMB = 0; $otherMB = 0; $buildCount = 0
  foreach ($p in $all) {
    $mb = [math]::Round($p.WorkingSetSize / 1MB, 1)
    $cmd = if ($p.CommandLine) { $p.CommandLine } else { "" }
    if ($cmd -match "tsserver|typingsInstaller|cursor\\resources") {
      $cursorMB += $mb
    } elseif ($cmd -match "next\\dist|next build|npx.*next") {
      $buildMB += $mb
      $buildCount++
    } else {
      $otherMB += $mb
    }
  }
  return @{ buildMB = $buildMB; cursorMB = $cursorMB; otherMB = $otherMB; buildCount = $buildCount }
}

Write-Host "Running: npx prisma generate"
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running: npx next build --webpack"
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npx next build --webpack > build_webpack_output.log 2> build_webpack_error.log" `
  -PassThru -NoNewWindow

$minFreeGB = 999
$killed = $false

while (-not $proc.HasExited) {
  Start-Sleep -Seconds $PollSeconds
  $os = Get-CimInstance Win32_OperatingSystem
  $freeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
  if ($freeGB -lt $minFreeGB) { $minFreeGB = $freeGB }

  $mem = Get-NodeMemoryBreakdown
  "$(Get-Date -Format o),$freeGB,$($mem.buildMB),$($mem.cursorMB),$($mem.otherMB),$($mem.buildCount)" | Add-Content $logPath

  Write-Host ("  [{0}] free={1}GB  build-node={2}MB  cursor-ts={3}MB" -f (Get-Date -Format "HH:mm:ss"), $freeGB, $mem.buildMB, $mem.cursorMB)

  if ($freeGB -lt $MinFreeGB) {
    Write-Host ""
    Write-Host "ABORT: free memory $freeGB GB below $MinFreeGB GB threshold - killing build."
    Write-Host "Close Java/Android Studio, Discord, extra browser tabs, then retry."
    Write-Host "Or run this build outside Cursor (external terminal) to avoid TS server contention."
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object {
        $c = if ($_.CommandLine) { $_.CommandLine } else { "" }
        $c -match "next\\dist|next build|npx.*next"
      } |
      ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }
    $killed = $true
    break
  }
}

Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== SUMMARY ==="
Write-Host "killed_by_watchdog: $killed"
Write-Host "min_free_gb_observed: $minFreeGB"
Write-Host "log: $logPath"

if ($killed) {
  Write-Host "output: build_webpack_output.log / build_webpack_error.log"
  exit 2
}

$proc.WaitForExit()
Write-Host ("exit_code: {0}" -f $proc.ExitCode)
if (Test-Path "build_webpack_output.log") {
  Get-Content -Path "build_webpack_output.log" -Tail 15
}
exit $proc.ExitCode

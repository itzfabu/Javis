# Called from git-backup.ps1 (SessionEnd hook). Checks whether Fabio approved an
# overnight work queue in orb/accountability.json; if so, hands the actual run off
# to a detached worker so this hook returns immediately instead of blocking the
# session-end path for however long overnight work takes.
$accPath = "C:\Jarvis\orb\accountability.json"
if (-not (Test-Path $accPath)) { exit 0 }

try {
    $acc = Get-Content $accPath -Raw | ConvertFrom-Json
} catch {
    exit 0
}

if ($acc.signoff.status -ne "approved") { exit 0 }
$pending = @($acc.queue | Where-Object { $_.status -eq "queued" })
if ($pending.Count -eq 0) { exit 0 }

# Already running - don't double-launch (e.g. two session-ends close together).
$pidPath = "C:\Jarvis\orb\overnight-worker.pid"
if (Test-Path $pidPath) {
    $prevPid = (Get-Content $pidPath -Raw -ErrorAction SilentlyContinue).Trim()
    $prevProc = if ($prevPid) { Get-Process -Id $prevPid -ErrorAction SilentlyContinue } else { $null }
    if ($prevProc) { exit 0 }
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
}

$workerScript = "C:\Jarvis\.claude\hooks\overnight-run-worker.ps1"
$proc = Start-Process -FilePath "powershell" `
    -ArgumentList @("-ExecutionPolicy", "Bypass", "-File", $workerScript) `
    -WindowStyle Hidden -PassThru

Set-Content -Path $pidPath -Value "$($proc.Id)" -Encoding UTF8

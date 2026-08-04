Set-Location C:\Jarvis

# Structural recursion guard: the overnight worker's inner `claude -p` call is
# itself a full Claude Code session in this repo, so its own SessionEnd fires
# this exact hook again mid-run. If a worker is currently running, skip the
# whole backup + overnight-run call here - don't rely solely on the pid guard
# inside overnight-run.ps1 downstream (belt and suspenders, that guard stays).
$overnightPidPath = "C:\Jarvis\orb\overnight-worker.pid"
if (Test-Path $overnightPidPath) {
    $overnightPid = (Get-Content $overnightPidPath -Raw -ErrorAction SilentlyContinue).Trim()
    $overnightProc = if ($overnightPid) { Get-Process -Id $overnightPid -ErrorAction SilentlyContinue } else { $null }
    if ($overnightProc) {
        "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') git-backup guard: overnight worker (pid $overnightPid) still running - skipped backup and overnight-run.ps1" |
            Add-Content -Path "C:\Jarvis\orb\overnight-run.log" -Encoding UTF8
        exit 0
    }
}

$status = git status --porcelain
if ($status) {
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Auto-Backup: $timestamp"

    git fetch origin
    git rebase origin/main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git rebase --abort
        Add-Content -Path "C:\Jarvis\orb\git-backup-warnings.log" -Value "$(Get-Date): Auto-backup hit a rebase conflict and skipped the push. Needs manual resolution - run git status in C:\Jarvis to see what's pending."
    } else {
        git push
    }
}
powershell -File C:\Jarvis\.claude\hooks\sync-knowledge.ps1
powershell -File C:\Jarvis\.claude\hooks\overnight-run.ps1

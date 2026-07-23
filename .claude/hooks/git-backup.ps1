Set-Location C:\Jarvis
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

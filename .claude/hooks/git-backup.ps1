Set-Location C:\Jarvis
$status = git status --porcelain
if ($status) {
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Auto-Backup: $timestamp"
    git push
}
powershell -File C:\Jarvis\.claude\hooks\sync-knowledge.ps1

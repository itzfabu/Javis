Set-Location "C:\Jarvis"

git add -A

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) { exit }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-Backup: $timestamp" | Out-Null
git push https://github.com/itzfabu/Javis.git HEAD:main

$global:lastSyncTime = Get-Date "2000-01-01"

function Global:Invoke-KnowledgeSync {
    $now = Get-Date
    if (($now - $global:lastSyncTime).TotalSeconds -lt 3) { return }
    $global:lastSyncTime = $now
    powershell -File C:\Jarvis\.claude\hooks\sync-knowledge.ps1
    Write-Host ("Synced knowledge at " + $now.ToString("HH:mm:ss"))
}

$paths = @(
    @{ Path = "C:\Jarvis\knowledge"; Filter = "*.md"; Recurse = $false },
    @{ Path = "C:\Jarvis"; Filter = "TASKS.md"; Recurse = $false },
    @{ Path = "C:\Jarvis\vault"; Filter = "*.md"; Recurse = $true }
)

foreach ($p in $paths) {
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $p.Path
    $watcher.Filter = $p.Filter
    $watcher.IncludeSubdirectories = $p.Recurse
    $watcher.EnableRaisingEvents = $true
    Register-ObjectEvent -InputObject $watcher -EventName Changed -Action { Invoke-KnowledgeSync } | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Created -Action { Invoke-KnowledgeSync } | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action { Invoke-KnowledgeSync } | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action { Invoke-KnowledgeSync } | Out-Null
}

Write-Host "Watching knowledge/TASKS.md/vault for changes. Leave this window open."
while ($true) { Start-Sleep -Seconds 1 }

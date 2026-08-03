$inputJson = [Console]::In.ReadToEnd()
$data = $inputJson | ConvertFrom-Json
$transcriptPath = $data.transcript_path
$sessionId = $data.session_id

if ($sessionId -eq "8f14e45f-ceea-467e-9575-5c3c4a5c6f2b") { exit }

if ([string]::IsNullOrWhiteSpace($transcriptPath) -or -not (Test-Path $transcriptPath)) { exit }

$lastAssistantText = $null
Get-Content $transcriptPath | ForEach-Object {
    try { $entry = $_ | ConvertFrom-Json } catch { return }
    if ($entry.type -eq "assistant" -and $entry.message.content) {
        $textBlocks = $entry.message.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text }
        if ($textBlocks) { $lastAssistantText = ($textBlocks -join "`n") }
    }
}

$text = $lastAssistantText
if ([string]::IsNullOrWhiteSpace($text)) { exit }

$text = $text -replace "[*_#``]", ""
$text = $text -replace "\[(.+?)\]\(.+?\)", "`$1"

$tasksPath = "C:\Jarvis\TASKS.md"
$tasks = @()
if (Test-Path $tasksPath) {
    $tasks = @(Get-Content $tasksPath | Where-Object { $_ -match "^\s*-\s*\[ \]" } | ForEach-Object { $_ -replace "^\s*-\s*\[ \]\s*", "" })
}

# Single-speaker queue: if a previous worker is still running (still mid-synth or
# mid-playback-wait for an earlier response), kill it so it doesn't fight this one
# over status.json or overlap audio.
$pidPath = "C:\Jarvis\orb\speak-worker.pid"
if (Test-Path $pidPath) {
    $prevLine = (Get-Content $pidPath -Raw -ErrorAction SilentlyContinue)
    if ($prevLine) {
        $parts = $prevLine.Trim() -split '\|'
        $prevPid = $parts[0]
        $prevTag = if ($parts.Count -gt 1) { $parts[1] } else { $null }
        $prevProc = Get-Process -Id $prevPid -ErrorAction SilentlyContinue
        if ($prevProc) {
            # /T kills the whole process tree (e.g. an edge-tts child still holding a
            # file handle), not just the worker's own powershell.exe.
            taskkill /PID $prevPid /T /F 2>$null | Out-Null
        }
        if ($prevTag) {
            # A killed worker never reaches its own cleanup (finally doesn't run on a
            # forced kill), so remove its temp files here instead of leaking them.
            Remove-Item -Path "$env:TEMP\jarvis-speak-payload-$prevTag.json" -Force -ErrorAction SilentlyContinue
            Remove-Item -Path "$env:TEMP\jarvis-response-$prevTag.txt" -Force -ErrorAction SilentlyContinue
            Remove-Item -Path "$env:TEMP\jarvis-speak-$prevTag.mp3" -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
}

# Hand off the slow part (TTS synthesis + duration-based status timing) to a fully
# detached background process, and return immediately - this hook must never block
# on Start-Sleep for the length of the spoken audio.
$tag = [Guid]::NewGuid().ToString('N')
$payloadPath = "$env:TEMP\jarvis-speak-payload-$tag.json"
@{text=$text; tasks=$tasks} | ConvertTo-Json | Set-Content -Path $payloadPath -Encoding UTF8

$workerScript = "C:\Jarvis\.claude\hooks\speak-response-worker.ps1"
$proc = Start-Process -FilePath "powershell" `
    -ArgumentList @("-ExecutionPolicy", "Bypass", "-File", $workerScript, "-PayloadPath", $payloadPath, "-Tag", $tag) `
    -WindowStyle Hidden -PassThru

Set-Content -Path $pidPath -Value "$($proc.Id)|$tag" -Encoding UTF8

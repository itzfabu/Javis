$inputJson = [Console]::In.ReadToEnd()
$data = $inputJson | ConvertFrom-Json
$transcriptPath = $data.transcript_path
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
function Get-OpenTasks {
    if (Test-Path $tasksPath) {
        $lines = Get-Content $tasksPath | Where-Object { $_ -match "^\s*-\s*\[ \]" }
        return @($lines | ForEach-Object { $_ -replace "^\s*-\s*\[ \]\s*", "" })
    }
    return @()
}
$tasks = Get-OpenTasks

$txtPath = "$env:TEMP\jarvis-response.txt"
$mp3Path = "C:\Jarvis\orb\latest.mp3"
Set-Content -Path $txtPath -Value $text -Encoding UTF8

edge-tts --voice "en-GB-RyanNeural" --rate="-8%" --pitch="-5Hz" --file $txtPath --write-media $mp3Path

$audioToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
@{status="speaking"; lastMessage=$text; tasks=$tasks; audioToken=$audioToken} | ConvertTo-Json | Set-Content -Path "C:\Jarvis\orb\status.json" -Encoding UTF8

Add-Type -AssemblyName PresentationCore
$probe = New-Object System.Windows.Media.MediaPlayer
$probe.Open([Uri]$mp3Path)
$timeout = 0
while (-not $probe.NaturalDuration.HasTimeSpan -and $timeout -lt 50) {
  Start-Sleep -Milliseconds 100
  $timeout++
}
$duration = 3
if ($probe.NaturalDuration.HasTimeSpan) { $duration = $probe.NaturalDuration.TimeSpan.TotalSeconds }
$probe.Close()

Start-Sleep -Seconds $duration

@{status="idle"; lastMessage=$text; tasks=$tasks; audioToken=$audioToken} | ConvertTo-Json | Set-Content -Path "C:\Jarvis\orb\status.json" -Encoding UTF8

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

$txtPath = "$env:TEMP\jarvis-response.txt"
$mp3Path = "$env:TEMP\jarvis-response.mp3"
Set-Content -Path $txtPath -Value $text -Encoding UTF8

edge-tts --voice "en-GB-RyanNeural" --rate="-8%" --pitch="-5Hz" --file $txtPath --write-media $mp3Path

Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]$mp3Path)
$player.Play()
Start-Sleep -Milliseconds 500
$timeout = 0
while (-not $player.NaturalDuration.HasTimeSpan -and $timeout -lt 50) {
  Start-Sleep -Milliseconds 100
  $timeout++
}
if ($player.NaturalDuration.HasTimeSpan) {
  Start-Sleep -Seconds $player.NaturalDuration.TimeSpan.TotalSeconds
}
$player.Close()

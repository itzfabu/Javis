param(
    [Parameter(Mandatory=$true)]
    [string]$PayloadPath,
    [Parameter(Mandatory=$true)]
    [string]$Tag
)

$myPid = $PID
$pidPath = "C:\Jarvis\orb\speak-worker.pid"

$tag = $Tag
$txtPath = "$env:TEMP\jarvis-response-$tag.txt"
$ownMp3Path = "$env:TEMP\jarvis-speak-$tag.mp3"

try {
    $payload = Get-Content $PayloadPath -Raw | ConvertFrom-Json
    $text = $payload.text
    $tasks = @($payload.tasks)

    $mp3Path = "C:\Jarvis\orb\latest.mp3"
    Set-Content -Path $txtPath -Value $text -Encoding UTF8

    # Synthesize to a path unique to this invocation, never straight to the shared
    # latest.mp3 - a killed/superseded worker (single-speaker queue) could otherwise
    # leave a stale or partially-written file there for the next worker to read.
    edge-tts --voice "en-GB-RyanNeural" --rate="-2%" --file $txtPath --write-media $ownMp3Path

    # Probe duration from OUR OWN file, so it always matches the text we're actually
    # speaking regardless of what any other (killed or overlapping) worker is doing
    # to the shared latest.mp3 path.
    Add-Type -AssemblyName PresentationCore
    $probe = New-Object System.Windows.Media.MediaPlayer
    $probe.Open([Uri]$ownMp3Path)
    $timeout = 0
    while (-not $probe.NaturalDuration.HasTimeSpan -and $timeout -lt 50) { Start-Sleep -Milliseconds 100; $timeout++ }
    $duration = 3
    if ($probe.NaturalDuration.HasTimeSpan) { $duration = $probe.NaturalDuration.TimeSpan.TotalSeconds }
    $probe.Close()

    Copy-Item -Path $ownMp3Path -Destination $mp3Path -Force

    $audioToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    @{status="speaking"; lastMessage=$text; tasks=$tasks; audioToken=$audioToken} | ConvertTo-Json | Set-Content -Path "C:\Jarvis\orb\status.json" -Encoding UTF8

    Start-Sleep -Seconds $duration

    @{status="idle"; lastMessage=$text; tasks=$tasks; audioToken=$audioToken} | ConvertTo-Json | Set-Content -Path "C:\Jarvis\orb\status.json" -Encoding UTF8
}
finally {
    Remove-Item -Path $PayloadPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $txtPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $ownMp3Path -Force -ErrorAction SilentlyContinue
    # Only clear the pid file if we're still the current speaker (a newer worker hasn't already overwritten it).
    if (Test-Path $pidPath) {
        $currentLine = (Get-Content $pidPath -Raw -ErrorAction SilentlyContinue)
        if ($currentLine -and ($currentLine.Trim() -split '\|')[0] -eq "$myPid") {
            Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
        }
    }
}

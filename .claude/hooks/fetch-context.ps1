$weather = try { Invoke-RestMethod -Uri "https://wttr.in/Zurich?format=3" -TimeoutSec 3 } catch { "weather unavailable" }

$tasksPath = "C:\Jarvis\TASKS.md"
$openTasks = @()
if (Test-Path $tasksPath) {
    $openTasks = Get-Content $tasksPath | Where-Object { $_ -match "^\s*-\s*\[ \]" } | ForEach-Object { $_ -replace "^\s*-\s*\[ \]\s*", "" }
}
$tasksText = if ($openTasks.Count -gt 0) { $openTasks -join "; " } else { "no open tasks" }

$zurichTime = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, "W. Europe Standard Time")
$timeText = $zurichTime.ToString("HH:mm, dddd, dd.MM.yyyy")

$context = "Current Zurich time: $timeText. Zurich weather: $weather. Open tasks: $tasksText."

$output = @{
    hookSpecificOutput = @{
        hookEventName = "SessionStart"
        additionalContext = $context
    }
}
$output | ConvertTo-Json -Compress

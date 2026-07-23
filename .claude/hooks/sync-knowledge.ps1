$projectsPath = "C:\Jarvis\knowledge\PROJECTS.md"
$goalsPath = "C:\Jarvis\knowledge\GOALS.md"
$tasksPath = "C:\Jarvis\TASKS.md"
$outPath = "C:\Jarvis\orb\knowledge.json"
$warningsPath = "C:\Jarvis\orb\knowledge-warnings.json"

$warnings = @()

function Test-SuspiciousHeadingLines($filePath, $label) {
    $result = @()
    if (Test-Path $filePath) {
        $lineNum = 0
        Get-Content $filePath | ForEach-Object {
            $lineNum++
            $line = $_
            if ($line -match "##" -and $line -notmatch "^##\s+\S" -and $line.Trim() -ne "") {
                $result += "$label line $lineNum looks like a malformed heading and will be skipped: '$line'"
            }
        }
    }
    return $result
}

$warnings += Test-SuspiciousHeadingLines $goalsPath "GOALS.md"
$warnings += Test-SuspiciousHeadingLines $projectsPath "PROJECTS.md"

$agents = @("researcher","coder","debugger","business-analyst","writer","planner","webdesigner","project-manager")

$goals = @()
if (Test-Path $goalsPath) {
    $lines = Get-Content $goalsPath
    $current = $null
    foreach ($line in $lines) {
        if ($line -match "^##\s+(.+)") {
            if ($current -and $current.name -ne "Goal Name") { $goals += $current }
            $current = @{ name = $matches[1].Trim(); status = "unknown"; timeframe = "" }
        } elseif ($current -and $line -match "^-\s*Status:\s*(.+)") {
            $current.status = $matches[1].Trim()
        } elseif ($current -and $line -match "^-\s*Timeframe:\s*(.+)") {
            $current.timeframe = $matches[1].Trim()
        }
    }
    if ($current -and $current.name -ne "Goal Name") { $goals += $current }
}

$projects = @()
if (Test-Path $projectsPath) {
    $lines = Get-Content $projectsPath
    $current = $null
    foreach ($line in $lines) {
        if ($line -match "^##\s+(.+)") {
            if ($current -and $current.name -ne "Project Name") { $projects += $current }
            $current = @{ name = $matches[1].Trim(); status = "unknown"; owner = ""; goal = "" }
        } elseif ($current -and $line -match "^-\s*Status:\s*(.+)") {
            $current.status = $matches[1].Trim()
        } elseif ($current -and $line -match "^-\s*Owner agent:\s*(.+)") {
            $current.owner = $matches[1].Trim()
        } elseif ($current -and $line -match "^-\s*Goal:\s*(.+)") {
            $current.goal = $matches[1].Trim()
        }
    }
    if ($current -and $current.name -ne "Project Name") { $projects += $current }
}

$tasks = @()
if (Test-Path $tasksPath) {
    Get-Content $tasksPath | Where-Object { $_ -match "^\s*-\s*\[ \]" } | ForEach-Object {
        $line = $_ -replace "^\s*-\s*\[ \]\s*", ""
        $project = ""
        if ($line -match "#([\w-]+)") { $project = $matches[1] }
        $tasks += @{ text = $line; project = $project }
    }
}

$notes = @()
$vaultFolders = @("Projects","Areas","Resources")
foreach ($folder in $vaultFolders) {
    $folderPath = "C:\Jarvis\vault\$folder"
    if (Test-Path $folderPath) {
        Get-ChildItem -Path $folderPath -Filter "*.md" -File | ForEach-Object {
            $notes += @{ title = $_.BaseName; folder = $folder }
        }
    }
}

@{ agents = $agents; projects = $projects; tasks = $tasks; notes = $notes; goals = $goals } | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8

if ($warnings.Count -gt 0) {
    $warnings | ConvertTo-Json | Set-Content -Path $warningsPath -Encoding UTF8
    Write-Host "Knowledge sync warnings:"
    $warnings | ForEach-Object { Write-Host " - $_" }
} elseif (Test-Path $warningsPath) {
    Remove-Item $warningsPath
}

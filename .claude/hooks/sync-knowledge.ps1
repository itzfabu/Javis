$projectsPath = "C:\Jarvis\knowledge\PROJECTS.md"
$tasksPath = "C:\Jarvis\TASKS.md"
$outPath = "C:\Jarvis\orb\knowledge.json"

$agents = @("researcher","coder","debugger","business-analyst","writer","planner","webdesigner","project-manager")

$projects = @()
if (Test-Path $projectsPath) {
    $lines = Get-Content $projectsPath
    $current = $null
    foreach ($line in $lines) {
        if ($line -match "^##\s+(.+)") {
            if ($current -and $current.name -ne "Project Name") { $projects += $current }
            $current = @{ name = $matches[1].Trim(); status = "unknown"; owner = "" }
        } elseif ($current -and $line -match "^-\s*Status:\s*(.+)") {
            $current.status = $matches[1].Trim()
        } elseif ($current -and $line -match "^-\s*Owner agent:\s*(.+)") {
            $current.owner = $matches[1].Trim()
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

@{ agents = $agents; projects = $projects; tasks = $tasks; notes = $notes } | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8

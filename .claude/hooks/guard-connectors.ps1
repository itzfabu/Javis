$inputJson = [Console]::In.ReadToEnd()
$data = $inputJson | ConvertFrom-Json
$toolName = $data.tool_name
if (-not $toolName) { exit 0 }
$lower = $toolName.ToLower()

$isConnector = ($lower -match "outlook") -or ($lower -match "gdrive") -or ($lower -match "google_drive") -or ($lower -match "googledrive") -or ($lower -match "drive")

if (-not $isConnector) { exit 0 }

$isCalendarCreate = ($lower -match "calendar") -and (($lower -match "create") -or ($lower -match "add") -or ($lower -match "insert") -or ($lower -match "new") -or ($lower -match "event"))

if ($isCalendarCreate) {
    @{ hookSpecificOutput = @{ hookEventName = "PreToolUse"; permissionDecision = "allow"; permissionDecisionReason = "Calendar event creation is explicitly allowed" } } | ConvertTo-Json -Compress
    exit 0
}

$writeActions = @("send","delete","remove","update","edit","write","modify","move","archive","trash","upload","create","reply","forward")
$isWrite = $false
foreach ($w in $writeActions) { if ($lower -match $w) { $isWrite = $true; break } }

if ($isWrite) {
    @{ hookSpecificOutput = @{ hookEventName = "PreToolUse"; permissionDecision = "deny"; permissionDecisionReason = "Outlook and Google Drive are read-only except calendar event creation. This action was blocked by policy." } } | ConvertTo-Json -Compress
    exit 0
}

exit 0

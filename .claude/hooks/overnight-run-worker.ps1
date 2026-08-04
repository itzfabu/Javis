# Detached worker launched by overnight-run.ps1. Executes the approved queue in
# orb/accountability.json via a single autonomous `claude -p` run, then commits
# and pushes the results so the morning briefing is there when Fabio checks the
# Jarvis Background dashboard.
$pidPath = "C:\Jarvis\orb\overnight-worker.pid"
$logPath = "C:\Jarvis\orb\overnight-run.log"

function Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Add-Content -Path $logPath -Encoding UTF8
}

try {
    $prompt = @'
You are running autonomously overnight with nobody present, executing a work queue Fabio pre-approved earlier tonight. This is a safe-autonomy checkpoint - only do what is listed in the approved queue, nothing else.

Read C:\Jarvis\orb\accountability.json.

For each item in "queue" with status "queued", in order:
1. Set its status to "in_progress" and write the file back immediately.
2. Do the actual work described by the item - research, move a project forward, draft something, fix something small - using whatever tools and subagents (via the Task tool) fit the item. Check knowledge/PROJECTS.md and knowledge/GOALS.md for context first if the item references a project.
3. Set its status to "done" with a short "note" describing what you actually did, or "blocked" with a "note" explaining what you need from Fabio if you genuinely cannot complete it unattended. Write the file back after every single item so progress is never lost.

Do not start any work that is not one of these pre-approved queue items, and do not touch anything outside the scope of what each item describes.

When every item is done or blocked, update the "briefing" object in the same file:
- "date": today's date as YYYY-MM-DD
- "generatedAt": current ISO 8601 timestamp
- "researched": short bullet strings, anything you looked into
- "movedForward": short bullet strings, concrete progress made
- "stuck": short bullet strings, anything blocked that needs Fabio's input

Then set "signoff.status" back to "none" so a new proposal can be negotiated next session. Leave "signoff.items" untouched for the historical record.

The file must remain valid JSON at every write. Work through the queue now.
'@

    Log "Starting overnight run"
    Set-Location C:\Jarvis
    $result = $prompt | & cmd /c "claude -p --permission-mode acceptEdits" 2>&1
    Log "Claude run finished, exit=$LASTEXITCODE"
    $result | Out-String | Add-Content -Path $logPath -Encoding UTF8

    $status = git status --porcelain
    if ($status) {
        git add .
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        git commit -m "Overnight run: $timestamp" | Out-Null
        git fetch origin | Out-Null
        git rebase origin/main 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            git rebase --abort
            Log "Overnight run commit hit a rebase conflict - push skipped, needs manual resolution"
        } else {
            git push | Out-Null
            Log "Overnight run committed and pushed"
        }
    } else {
        Log "Overnight run made no file changes to commit"
    }
} catch {
    Log "Overnight run failed: $($_.Exception.Message)"
} finally {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
}

$statusPath = "C:\Jarvis\orb\status.json"
Set-Content -Path $statusPath -Value (@{status="thinking"} | ConvertTo-Json) -Encoding UTF8

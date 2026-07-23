@echo off
start /min "Knowledge Watcher" powershell -ExecutionPolicy Bypass -File C:\Jarvis\.claude\hooks\watch-knowledge.ps1
cd /d C:\Jarvis\orb
start /min "Jarvis Server" python app.py
powershell -Command "Start-Sleep -Seconds 2"
start "" http://localhost:8420

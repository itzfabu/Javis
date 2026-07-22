@echo off
cd /d C:\Jarvis\orb
start /min "" python -m http.server 8420
powershell -Command "Start-Sleep -Seconds 2"
start "" http://localhost:8420

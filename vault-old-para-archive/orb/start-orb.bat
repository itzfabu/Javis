@echo off
cd /d C:\Jarvis\orb
start /min "" python app.py
powershell -Command "Start-Sleep -Seconds 2"
start "" http://localhost:8420

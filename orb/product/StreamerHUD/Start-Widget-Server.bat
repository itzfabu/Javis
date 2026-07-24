@echo off
echo Starting the Streamer HUD widget server...
echo Keep this window open while you are streaming.
echo Point your OBS Browser Source to: http://localhost:8877/streamer-hud-widget.html
echo.
cd /d "%~dp0"
python -m http.server 8877
pause

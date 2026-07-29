# Streamer HUD Widget - Setup Guide

## What you need first
- Python installed (free): https://www.python.org/downloads/ - during install, check "Add Python to PATH"
- OBS Studio installed

## One-time setup

### Step 1 - Allow OBS to access your microphone
Close OBS completely if it's open. Find your OBS shortcut, right-click it, choose Properties.
In the "Target" field, add a space at the end and paste this in:
--enable-media-stream --use-fake-ui-for-media-stream
Click Apply, then always launch OBS from this shortcut going forward.

### Step 2 - Start the widget server
Double-click "Start-Widget-Server.bat" in this folder. Leave the black window open in the background
while you stream - closing it turns the widget off.

### Step 3 - Add it to OBS
In OBS: Sources -> + -> Browser
Name it "Streamer HUD"
URL: http://localhost:8877/reactive-hud-pack.html
Width/Height: whatever fits your scene (300x300 is a good starting point)
Click OK

### Step 4 - Grant microphone access (only needed once, ever)
Right-click the "Streamer HUD" source -> Interact
Click "Allow" on the microphone prompt
Close the Interact window - you will not be asked again

## Customizing the look
Click the small gear icon in the top-right corner of the widget (visible in the Interact window, or hover it in your scene) to open Settings. From there you can:
- Pick a Quick Preset for a ready-made combo
- Choose a Style (Sphere, Waveform, Radar, and more - some styles are Pro-only)
- Pick a Color, including a custom color swatch
- Set the Size (Small / Medium / Large)
- Add a Background Layer to combine with your chosen style
- Enter your license key under "License Key" to unlock Pro styles

Your choices are saved automatically in the browser and remembered next time you open OBS.

## Troubleshooting
- Widget shows solid black instead of transparent: make sure the URL starts with http://localhost, not a file path
- No reaction to your voice: make sure Start-Widget-Server.bat is still running, and that you completed Step 4
- Still nothing: restart OBS after applying Step 1, the launch flag only works from the shortcut you edited
- Settings panel won't open: click directly on the small gear icon in the corner of the widget while in the Interact window

#!/bin/bash
# AETHER DMX Kiosk Launcher
# Launches Chromium in kiosk mode pointing to the backend server
# The backend (port 3000) serves the built React frontend

# Kill any existing Chromium instances
pkill chromium

# Wait a moment for services to be ready
sleep 3

# Launch Chromium in kiosk mode pointing to backend
DISPLAY=:0 chromium \
  --kiosk \
  --disable-gpu \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --disable-translate \
  --start-fullscreen \
  --password-store=basic \
  http://localhost:3000

echo "AETHER DMX kiosk started! URL: http://localhost:3000"

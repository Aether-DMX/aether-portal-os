#!/bin/bash

# Kill any existing instances
sudo pkill -f "node src/server.js"
pkill -f "vite"
pkill chromium

# Start backend
cd /home/pi/dmx-maistro-v2/backend
node src/server.js > /tmp/dmx-backend.log 2>&1 &
echo "Backend started..."

# Start frontend
cd /home/pi/dmx-maistro-v2/frontend
npm run dev > /tmp/dmx-frontend.log 2>&1 &
echo "Frontend started..."

# Wait for services to be ready
sleep 5

# Launch Chromium in kiosk mode
DISPLAY=:0 chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --disable-translate \
  --start-fullscreen \
  http://localhost:5173

echo "DMX mAIstro started in kiosk mode!"

#!/bin/bash
echo "🚀 AETHER DEPLOY STARTING..."

# Pull latest code
echo "📦 Pulling aether-core..."
cd ~/aether-core-git && git pull

echo "📦 Pulling aether-portal-os..."
cd ~/aether-portal-os-git && git pull

# Rebuild frontend
echo "📦 Rebuilding frontend..."
cd ~/aether-portal-os-git/frontend && npm install && npm run build

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart aether-core dmx-backend

echo "✅ DEPLOY COMPLETE!"
echo ""
echo "To restart Chromium:"
echo "  pkill chromium && DISPLAY=:0 chromium --kiosk --disable-gpu --password-store=basic http://localhost:3000 &"

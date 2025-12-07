#!/bin/bash
echo "🚀 AETHER DEPLOY STARTING..."

echo "📦 Pulling aether-core..."
cd ~/aether-core-git && git pull

echo "📦 Pulling aether-portal-os..."
cd ~/aether-portal-os-git && git pull

echo "🔧 Copying core files..."
cp ~/aether-core-git/*.py ~/

echo "🔧 Copying portal files..."
cp -r ~/aether-portal-os-git/frontend/* ~/Aether-DMX/frontend/
cp -r ~/aether-portal-os-git/backend/* ~/Aether-DMX/backend/

echo "🔧 Copying scripts..."
cp ~/aether-portal-os-git/scripts/start-kiosk.sh /home/pi/start-aether-portal.sh
chmod +x /home/pi/start-aether-portal.sh

echo "📦 Rebuilding frontend..."
cd ~/Aether-DMX/frontend && npm install && npm run build

echo "🔄 Restarting services..."
sudo systemctl restart aether-core dmx-backend

echo "✅ DEPLOY COMPLETE!"

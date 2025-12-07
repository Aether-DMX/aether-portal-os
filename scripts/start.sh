#!/bin/bash
# AETHER DMX Development Start Script
# For development only - starts backend and frontend dev server
# Production uses systemd services and built static files

cd /home/ramzt/Aether-DMX/backend && node src/server.js &
cd /home/ramzt/Aether-DMX/frontend && npm run dev &
echo "Development servers started!"
echo "Backend: http://$(hostname -I | awk '{print $1}'):3000"
echo "Frontend Dev: http://$(hostname -I | awk '{print $1}'):5173"

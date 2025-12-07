#!/bin/bash
cd /home/pi/dmx-maistro-v2/backend && node src/server.js &
cd /home/pi/dmx-maistro-v2/frontend && npm run dev &
echo "Started! Access at http://$(hostname -I | awk '{print $1}'):5173"

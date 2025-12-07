#!/bin/bash
# AETHER DMX System Diagnostic Script
# Run this to check what's running and what's not

echo "=========================================="
echo "AETHER DMX System Diagnostic"
echo "=========================================="
echo ""

# Check services
echo "🔍 Checking systemd services..."
echo ""
sudo systemctl status aether-core --no-pager -l | head -10
echo ""
sudo systemctl status dmx-backend --no-pager -l | head -10
echo ""

# Check ports
echo "🔍 Checking open ports..."
echo ""
echo "Port 3000 (Backend):"
sudo netstat -tulpn | grep :3000 || echo "  ❌ Nothing listening on port 3000"
echo ""
echo "Port 8891 (Python Core):"
sudo netstat -tulpn | grep :8891 || echo "  ❌ Nothing listening on port 8891"
echo ""
echo "Port 9090 (OLA):"
sudo netstat -tulpn | grep :9090 || echo "  ⚠️  OLA may not be running"
echo ""

# Check if frontend dist exists
echo "🔍 Checking frontend build..."
if [ -d "/home/ramzt/Aether-DMX/frontend/dist" ]; then
  echo "  ✅ Frontend dist directory exists"
  if [ -f "/home/ramzt/Aether-DMX/frontend/dist/index.html" ]; then
    echo "  ✅ index.html found"
  else
    echo "  ❌ index.html missing - frontend needs to be built!"
  fi
else
  echo "  ❌ Frontend dist directory missing - run 'npm run build' in frontend/"
fi
echo ""

# Check backend directory
echo "🔍 Checking backend..."
if [ -d "/home/ramzt/Aether-DMX/backend" ]; then
  echo "  ✅ Backend directory exists"
  if [ -f "/home/ramzt/Aether-DMX/backend/src/server.js" ]; then
    echo "  ✅ server.js found"
  else
    echo "  ❌ server.js missing"
  fi
else
  echo "  ❌ Backend directory missing"
fi
echo ""

# Check Chromium
echo "🔍 Checking Chromium..."
if pgrep chromium > /dev/null; then
  echo "  ✅ Chromium is running"
  CHROMIUM_PID=$(pgrep chromium | head -1)
  echo "  PID: $CHROMIUM_PID"
else
  echo "  ⚠️  Chromium is not running"
fi
echo ""

# Try to access backend
echo "🔍 Testing backend URL..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200\|404"; then
  echo "  ✅ Backend is responding on port 3000"
  curl -s http://localhost:3000/api/health | head -3
else
  echo "  ❌ Backend is NOT responding on port 3000"
fi
echo ""

# Check Python core
echo "🔍 Testing Python core API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8891/api/health | grep -q "200\|404"; then
  echo "  ✅ Python core is responding on port 8891"
  curl -s http://localhost:8891/api/health | head -3
else
  echo "  ❌ Python core is NOT responding on port 8891"
fi
echo ""

echo "=========================================="
echo "Diagnostic complete!"
echo "=========================================="


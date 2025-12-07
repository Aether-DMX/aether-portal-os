# Fix Kiosk "Site Can't Be Reached" Issue

## Problem Summary

The kiosk browser is trying to connect to the wrong URL:
- **Current:** `http://localhost:5173` (Vite dev server - not running in production)
- **Should be:** `http://localhost:3000` (Backend serves built React app)

## What Was Fixed

1. ✅ Updated `start-kiosk.sh` to point to `http://localhost:3000`
2. ✅ Removed dev server startup (not needed in production)
3. ✅ Added proper Chromium flags for Pi

## Steps to Fix on Pi

### 1. SSH into the Pi
```bash
ssh ramzt@aether-portal.local
```

### 2. Check what's currently running
```bash
# Check if backend is running
sudo systemctl status dmx-backend

# Check if services are responding
curl http://localhost:3000/api/health
curl http://localhost:8891/api/health

# Check what Chromium is trying to access
ps aux | grep chromium
```

### 3. Run diagnostic script
```bash
cd /home/ramzt/Aether-DMX
chmod +x scripts/diagnose.sh
./scripts/diagnose.sh
```

### 4. Fix the kiosk script (if needed)
The script should now point to port 3000. If you need to update it manually:

```bash
nano ~/Aether-DMX/scripts/start-kiosk.sh
```

Make sure it contains:
```bash
http://localhost:3000
```

NOT:
```bash
http://localhost:5173
```

### 5. Check autostart configuration

The kiosk likely starts via one of these methods:

#### Option A: systemd service
```bash
# Check for kiosk service
sudo systemctl list-units | grep kiosk
```

#### Option B: autostart file (most common)
```bash
# Check for autostart file
ls -la ~/.config/autostart/
cat ~/.config/autostart/*.desktop 2>/dev/null | grep -i kiosk
```

#### Option C: .bashrc or .profile
```bash
grep -i kiosk ~/.bashrc ~/.profile 2>/dev/null
```

#### Option D: LXDE autostart
```bash
cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null
```

### 6. Ensure backend is running

```bash
# Check status
sudo systemctl status dmx-backend

# If not running, start it
sudo systemctl start dmx-backend

# Enable auto-start on boot
sudo systemctl enable dmx-backend

# Check logs
sudo journalctl -u dmx-backend -f
```

### 7. Ensure frontend is built

```bash
# Check if dist directory exists
ls -la /home/ramzt/Aether-DMX/frontend/dist/

# If missing, build it
cd /home/ramzt/Aether-DMX/frontend
npm run build
```

### 8. Restart kiosk manually

```bash
# Kill existing Chromium
pkill chromium

# Start kiosk
DISPLAY=:0 /home/ramzt/Aether-DMX/scripts/start-kiosk.sh
```

### 9. Test in browser

From your PC, try accessing:
```
http://aether-portal.local:3000
```

Should show the AETHER interface!

## Common Issues & Solutions

### Issue: "Backend not responding on port 3000"
**Solution:** 
- Check if service is running: `sudo systemctl status dmx-backend`
- Check logs: `sudo journalctl -u dmx-backend -n 50`
- Check if port is in use: `sudo netstat -tulpn | grep 3000`

### Issue: "Frontend dist directory missing"
**Solution:**
```bash
cd /home/ramzt/Aether-DMX/frontend
npm install
npm run build
```

### Issue: "Chromium won't start"
**Solution:**
- Check display: `echo $DISPLAY` (should be `:0`)
- Try starting manually: `DISPLAY=:0 chromium-browser http://localhost:3000`
- Check permissions: `ls -la ~/.config/autostart/`

### Issue: "Services conflict"
**Solution:**
- Make sure only `dmx-backend` is running (not `dmx-frontend`)
- Disable conflicting services: `sudo systemctl disable dmx-frontend`

## Quick Fix Commands (Run These)

```bash
# 1. Check backend status
sudo systemctl status dmx-backend

# 2. Ensure frontend is built
cd /home/ramzt/Aether-DMX/frontend && npm run build

# 3. Restart backend
sudo systemctl restart dmx-backend

# 4. Check if port 3000 is responding
curl http://localhost:3000/api/health

# 5. Restart kiosk
pkill chromium && sleep 2 && DISPLAY=:0 /home/ramzt/Aether-DMX/scripts/start-kiosk.sh
```

---

**Need help?** Share the output of the diagnostic script!


# AETHER Portal OS

The brain of the AETHER DMX system - a Raspberry Pi-based touchscreen hub for AI-powered lighting control.

## What is AETHER?

AETHER is an AI-powered distributed lighting control system that replaces expensive $5K-$15K professional DMX controllers with smart, modular, affordable hardware.

**Key Features:**
- Natural language lighting control via Claude AI
- Touch-friendly web UI
- sACN/E1.31 over WiFi to wireless nodes
- Serial control for wired nodes
- Scene management with smooth fades
- OLA integration for industry-standard protocols

---

## Quick Start

### Fresh Install (Pi OS Lite)

```bash
# On a fresh Raspberry Pi OS Lite (64-bit)
curl -sSL https://raw.githubusercontent.com/Aether-DMX/aether-portal-os/main/scripts/install.sh | bash
```

### Manual Install

```bash
git clone https://github.com/Aether-DMX/aether-portal-os.git
cd aether-portal-os
chmod +x scripts/install.sh
./scripts/install.sh
```

---

## Hardware Requirements

- **Raspberry Pi 5** (4GB or 8GB recommended)
- **7" or 10" Touchscreen** (official Pi display or HDMI)
- **microSD Card** (32GB+ Class 10)
- **5V 5A USB-C Power Supply**
- **Ethernet or WiFi** for network connectivity

---

## Repository Structure

```
aether-portal-os/
├── frontend/           # React + Vite + Tailwind UI
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── views/      # Page views (Dashboard, Faders, etc.)
│   │   └── store/      # Zustand state management
│   └── dist/           # Production build
├── backend/            # Node.js + Express API
│   └── src/
│       └── server.js   # Serves frontend + AI endpoints
├── scripts/
│   ├── install.sh      # Fresh install script
│   ├── deploy.sh       # Update from GitHub
│   └── start-kiosk.sh  # Chromium kiosk launcher
└── systemd/            # Service files
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| dmx-backend | 3000 | Node.js API + serves React UI |
| aether-core | 8891 | Python core (sACN, discovery, serial) |
| olad | 9090 | Open Lighting Architecture |
| aether-kiosk | - | Chromium in kiosk mode |

### Service Commands

```bash
# Check status
sudo systemctl status aether-core dmx-backend

# Restart services
sudo systemctl restart aether-core dmx-backend

# View logs
sudo journalctl -u aether-core -f
sudo journalctl -u dmx-backend -f
```

---

## Development Workflow

### On your PC:
```bash
# Edit code in your favorite editor
cd C:\MyProjects\Aether\aether-portal-os

# Commit and push
git add .
git commit -m "Description of changes"
git push
```

### Deploy to Pi:
```bash
ssh user@192.168.x.x "~/deploy.sh"
```

The deploy script:
1. Pulls latest from GitHub
2. Copies files to correct locations
3. Rebuilds frontend
4. Restarts services

---

## Network Configuration

### Normal Mode (Home Network)
- Pi gets IP via DHCP
- Access UI at `http://<pi-ip>:3000`
- Pulse nodes connect to same network

### AP Mode (Standalone)
- Pi creates "AetherDMX" WiFi network
- Portal IP: 192.168.50.1
- Access UI at `http://192.168.50.1:3000`

---

## Related Repositories

- [aether-core](https://github.com/Aether-DMX/aether-core) - Python backend services
- [aether-pulse](https://github.com/Aether-DMX/aether-pulse) - ESP32 node firmware

---

## Troubleshooting

### UI shows "Site can't be reached"
```bash
# Check services
sudo systemctl status dmx-backend

# Restart if needed
sudo systemctl restart dmx-backend

# Check logs
sudo journalctl -u dmx-backend -n 50
```

### Kiosk not starting
```bash
# Manual start
pkill chromium
DISPLAY=:0 chromium --kiosk --disable-gpu --password-store=basic http://localhost:3000 &
```

### No DMX output
1. Check OLA is running: `sudo systemctl status olad`
2. Open OLA web UI: `http://<pi-ip>:9090`
3. Verify universe is patched to E1.31

---

## License

MIT License - See LICENSE file

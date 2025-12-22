# AETHER DMX - PROJECT STATUS
## Quick Context for Any Chat Session

**Last Updated:** December 21, 2025 @ 7:00 PM

---

## SYSTEM ARCHITECTURE

### Hardware
- **Portal:** Raspberry Pi 5 with 7" touchscreen (kiosk mode)
- **Nodes:** ESP32-based "Pulse" nodes (WiFi + hardwired DMX)
- **Current Setup:** 3 universes (1 hardwired, 2 WiFi nodes)

### Software Stack
- **Backend:** `~/aether-core/aether-core.py` - Python Flask + SQLite
- **Frontend:** `~/aether-portal-os/frontend/` - React + Vite
- **Database:** `~/aether-core.db` - SQLite
- **Service:** `systemctl status aether-core`

### Key Directories
```
~/aether-core/           # Backend (Python Flask)
~/aether-portal-os/      # Frontend (React)
~/aether-portal-os/frontend/src/views/     # Main UI views
~/aether-portal-os/frontend/src/components/ # Shared components
```

---

## CURRENT STATE (Dec 21, 2025)

### What Works ✅
- DMX output (hardwired UART + WiFi UDP to ESP32 nodes)
- Scenes: Create, edit, play with fades
- Chases: Create, edit, play with BPM and fade rate
- Shows: Timeline playback, distributed mode, pause/resume/tempo
- Node auto-discovery and management
- 3-tier PIN security system
- Basic scheduling
- MIDI Pad controller with effects
- Themed logo (syncs to theme color)
- Dynamic floating bubbles background
- AI suggestions for scene/chase creation

### What's Broken 🔴
- SSOT race condition (scenes don't always stop shows)
- Fixtures turn blue on startup (ESP32 channel mapping)
- Lock button sizing on some views

### What's Missing 🟡
- Master dimmer
- Fixture patching/grouping tool
- Play/pause/stop indicators in Scenes/Chases
- Plymouth boot screen with branding

---

## RECENT CHANGES (Dec 21)

1. **MIDI Pads** - New view at `/midi-pad`
   - 3x3 colorful pad grid
   - Scene/Chase/Effect/Blackout triggers
   - Strobe, Pulse, Heartbeat effects
   - Tap/Hold/Toggle modes
   - Color selection for effects

2. **Themed Logo** - `ThemedLogo.jsx`
   - Syncs to current theme color
   - Used in Header and Screensaver
   - Metallic silver glow effect

3. **Dynamic Background** - `AetherBackground.jsx`
   - 15 small floating bubbles
   - Syncs to theme when idle
   - Syncs to scene/chase colors when playing

4. **AI Suggestions** - In AIAssistant
   - Suggests scenes based on time of day
   - Holiday-aware suggestions
   - Auto-creates and plays on accept

---

## API ENDPOINTS (Key Ones)
```
POST /api/scenes/<id>/play
POST /api/chases/<id>/play
POST /api/shows/<id>/play
POST /api/shows/stop|pause|resume
POST /api/shows/tempo {tempo: 2.0}
POST /api/dmx/blackout
POST /api/dmx/master {level: 0-255}
GET  /api/nodes
GET  /api/playback/status
```

---

## QUICK COMMANDS
```bash
# Restart backend
sudo systemctl restart aether-core

# Watch logs
journalctl -u aether-core -f

# Rebuild frontend
cd ~/aether-portal-os/frontend && npm run build

# Git status
cd ~/aether-portal-os && git status
cd ~/aether-core && git status
```

---

## MCP SSH ACCESS

Claude has direct SSH access via MCP tools:
- `aether-pi:exec` - Run shell commands
- `aether-pi:sudo-exec` - Run sudo commands

Start session: "Read ~/TODO.md and ~/AETHER_STATUS.md"

---

## NOTES FOR CLAUDE

- Check existing code with `grep` BEFORE fixing
- Backend: `sudo systemctl restart aether-core`
- Frontend: `npm run build` in frontend dir
- User prefers direct commands over explanations

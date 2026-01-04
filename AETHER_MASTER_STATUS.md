# AETHER DMX — MASTER STATUS & TODO
## Single Source of Truth for Development
## Last Updated: December 22, 2025 @ 12:45 CST

---

## 📊 OVERALL STATUS SNAPSHOT

| Area | Status | Notes |
|------|--------|-------|
| Core Engine (DMX, SSOT, Multi-Universe) | ✅ 95% | Stable, architecture sound |
| UI / UX (Console) | ✅ 90% | Final polish complete |
| Kiosk / Boot Experience | ✅ 90% | Boot polish applied, brief Pi5 kernel text remains |
| AI Assistant | 🟠 40% | Basic keyword matching only |
| Mobile Interface | 🟡 50% | Not started for Beta 1 |
| Debugging / Observability | ✅ 70% | Beta debug logging added |
| Documentation | 🔴 30% | Needs work |
| **Beta-1 Readiness** | **🟡 90%** | **Needs: stability testing** |

---

## ✅ COMPLETED & VERIFIED

### Core Engine (95% Complete)
- ✅ SSOT Implementation - Threading locks
- ✅ Multi-Universe Broadcast - All universes get commands
- ✅ Universe-1-Only Bug - ELIMINATED
- ✅ Chase Engine - BPM + fade rate control
- ✅ Show Timeline - Sync/distributed modes
- ✅ Schedule Runner - Cron triggers
- ✅ Stop-before-start logic
- ✅ Nodes stable (UART + 2x WiFi)

### Services (100%)
- ✅ aether-core.service (Python, 8891)
- ✅ dmx-backend.service (Node, 3000)
- ✅ aether-kiosk.service (Chromium + port-wait)
- ✅ olad (DMX transport)

### UI/UX Console (90%)
- ✅ Fullscreen Scenes/Chases views
- ✅ Grid 15 items/page (5×3), 48px cards
- ✅ Pagination 44px touch buttons
- ✅ Back buttons on views
- ✅ Play indicators with pulse animation
- ✅ Lock button fixed 44px
- ✅ Screensaver with logo glow
- ✅ MIDI Pad 3x3 grid
- ✅ Clock top-right
- ✅ Quick Scenes card
- ✅ Theme system

### Kiosk (90%)
- ✅ systemd kiosk service
- ✅ Port-wait script
- ✅ Cursor hidden (unclutter)
- ✅ Autostart disabled
- ✅ Screen blanking off
- ✅ Desktop flash - MOSTLY FIXED (boot-polish.sh)
- ✅ Plymouth splash - DONE (AETHER black theme)
- ✅ Kernel quiet boot (loglevel=0, console=tty3)
- ✅ Rainbow splash disabled (disable_splash=1)
- ✅ Console black service (early black screen)
- ✅ LightDM display-setup-script (black before X)
- ⚠️ Brief kernel text on Pi 5 (GPU init before Plymouth)
- ⬜ 3× reboot stability test
- ⬜ 3× power-pull stability test

### Debug/Observability (70%)
- ✅ Beta debug logging (AETHER_BETA_DEBUG=1)
- ✅ Logs: action, universes, playback state
- ⬜ Structured log format
- ⬜ SSOT stress test docs

### Nodes (100%)
- ✅ Universe 1 - Built-in UART
- ✅ Universe 2 - Node-F004 (WiFi)
- ✅ Universe 3 - Node-791C (WiFi)

---

## 🟡 BETA 1 TODO — CRITICAL PATH

### 1️⃣ KIOSK BOOT (95% COMPLETE)
**Goal: Pi boots like appliance, no desktop visible**

Solution: Pi OS Lite + Cage + Boot Polish

- ✅ Pi OS Lite + Cage (eliminates desktop entirely)
- ✅ Plymouth splash (AETHER black theme)
- ✅ Zero desktop flash (boot-polish.sh applied)
- ⬜ 3× reboot stability test
- ⬜ 3× power-pull stability test

**Scripts:**
- `scripts/boot-polish.sh` - Applies all boot polish settings
- `scripts/verify-boot.sh` - Verifies boot configuration

### 2️⃣ LOADING SCREEN (NICE TO HAVE)
- ⬜ Graceful "Loading Aether..." if backend slow
- ⬜ Auto-retry until ready
- ⬜ Minimal, professional

### 3️⃣ BETA-1 BRANCH PREP
- ✅ beta-1 branch exists
- ⬜ Hide: Shows, Cloud Sync, Multi-Venue, API
- ⬜ Commit systemd files to repo
- ⬜ Document Beta 1 limitations

---

## 🟠 POST-BETA 1 — AI ASSISTANT

**Goal: Intent → Plan → Validate → Execute → Verify**

Current: Basic keyword matching in frontend.
Target: Structured operator mode.

- ⬜ Intent router (JSON only)
- ⬜ Planner (maps intent to ops)
- ⬜ Validator (safety, scope)
- ⬜ Executor (function registry)
- ⬜ Verifier (status + confirm)
- ⬜ Session memory
- ⬜ Preference learning
- ⬜ Audit logging

---

## 🟠 POST-BETA 1 — MOBILE INTERFACE

**Role: Config & prep tool (not live console)**

- ⬜ Mobile login/connection
- ⬜ Fixture patching
- ⬜ Scene creation/editing
- ⬜ Chase creation/editing
- ⬜ Sync to console

**NOT in Beta 1:**
- Live fader control
- Real-time busking
- Multi-user sync

---

## 🔴 DOCUMENTATION (REQUIRED FOR BETA)

- ⬜ Quick start guide
- ⬜ Recovery guide
- ⬜ How updates work
- ⬜ Where logs live
- ⬜ Beta limitations stated

---

## 📁 KEY FILES

### Services
```
/etc/systemd/system/aether-core.service
/etc/systemd/system/dmx-backend.service
/etc/systemd/system/aether-kiosk.service
```

### Scripts
```
/home/pi/aether-kiosk.sh (active)
/home/pi/start-aether-portal.sh (old)
scripts/boot-polish.sh (boot experience)
scripts/verify-boot.sh (boot verification)
```

### Frontend
```
frontend/src/views/Scenes.jsx
frontend/src/views/Chases.jsx
frontend/src/components/Screensaver.jsx
frontend/src/index.css
```

### Backend
```
/home/ramzt/aether-core/aether-core.py
```

---

## 🔧 COMMANDS

### Rebuild Frontend
```bash
cd /home/ramzt/aether-portal-os/frontend
npm run build
sudo systemctl restart aether-core
```

### Check Services
```bash
systemctl status aether-core dmx-backend aether-kiosk
```

### View Logs
```bash
journalctl -u aether-core -f
journalctl -u aether-kiosk -f
```

### Test API
```bash
curl localhost:8891/api/nodes
curl localhost:8891/api/scenes
curl localhost:8891/api/playback/status
```

---

## 📋 GIT STATUS (Dec 22, 2025)

**aether-portal-os** (aed1bbf):
- Beta 1 UI Polish complete
- Status docs updated
- Pushed to main and beta-1

**aether-core** (dd3d3d5):
- Beta Debug Logging added
- Pushed to main and beta-1

---

## 🌱 POST-BETA / FUTURE (DO NOT MIX)

### Platform
- ⬜ Aether Portal OS (Pi OS Lite base)
- ⬜ Immutable appliance image

### AI Advanced
- ⬜ Cross-session learning
- ⬜ Pattern recognition
- ⬜ Predictive suggestions

### Control
- ⬜ Scene versioning
- ⬜ Live scene recorder
- ⬜ Master dimmer
- ⬜ Fixture patching tool

### Ecosystem
- ⬜ Cloud sync (opt-in)
- ⬜ Remote monitoring
- ⬜ API integrations

---

## ⚠️ MOSTLY RESOLVED: Desktop Flash on Boot

**Root cause:** Pi OS Desktop loads LXDE first.
**Solution applied:** Boot Polish (Plymouth + LightDM display-setup-script)

Boot sequence now:
1. Power on → Black screen (disable_splash=1)
2. Brief kernel text (~1-2 seconds on Pi 5 - GPU init before Plymouth)
3. Plymouth AETHER theme (black) covers rest of boot
4. Services start in background
5. Kiosk waits for backend ready
6. Plymouth quits, LightDM/X11/Chromium takes over

**Known limitation:** Pi 5's GPU initializes and shows framebuffer console before
Plymouth can take over. This is a kernel/firmware issue requiring custom boot
splash support that isn't available on Pi 5 yet.

**To apply:** `sudo ./scripts/boot-polish.sh`
**To verify:** `./scripts/verify-boot.sh`

---

## ⛔ DO NOT REDO (ALREADY COMPLETE)

- Kiosk service ✅
- Cursor hiding ✅
- UI polish ✅
- Play indicators ✅
- Multi-universe ✅
- SSOT ✅
- Fullscreen views ✅
- Grid layout ✅
- Screensaver ✅

---

## 🧠 INSTRUCTIONS FOR CLAUDE

1. This is the SINGLE SOURCE OF TRUTH
2. Update statuses only when verified complete
3. Do NOT introduce new tasks without instruction
4. Keep Beta-1 separate from Post-Beta
5. Read this file FIRST in new sessions

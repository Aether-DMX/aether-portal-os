# AETHER DMX — MASTER STATUS & TODO
## Single Source of Truth for Development
## Last Updated: December 22, 2025 @ 12:45 CST

---

## 📊 OVERALL STATUS SNAPSHOT

| Area | Status | Notes |
|------|--------|-------|
| Core Engine (DMX, SSOT, Multi-Universe) | ✅ 95% | Stable, architecture sound |
| UI / UX (Console) | ✅ 90% | Final polish complete |
| Kiosk / Boot Experience | 🟡 70% | Works, but desktop flashes |
| AI Assistant | 🟠 40% | Basic keyword matching only |
| Mobile Interface | 🟡 50% | Not started for Beta 1 |
| Debugging / Observability | ✅ 70% | Beta debug logging added |
| Documentation | 🔴 30% | Needs work |
| **Beta-1 Readiness** | **🟡 80%** | **Blocked by: kiosk boot** |

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

### Kiosk (70%)
- ✅ systemd kiosk service
- ✅ Port-wait script
- ✅ Cursor hidden (unclutter)
- ✅ Autostart disabled
- ✅ Screen blanking off
- ⬜ Desktop flash - NOT FIXED
- ⬜ Plymouth splash - NOT DONE

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

### 1️⃣ KIOSK BOOT (BLOCKING)
**Goal: Pi boots like appliance, no desktop visible**

Current issue: Pi OS Desktop loads LXDE before Chromium.

- ⬜ Pi OS Lite + Cage (eliminates desktop entirely)
- ⬜ OR Plymouth splash to cover boot
- ⬜ Zero desktop flash
- ⬜ 3× reboot stability test
- ⬜ 3× power-pull stability test

**Fix approach chosen:** Pi OS Lite + Cage/Weston

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

## 🚨 BLOCKING ISSUE

### Desktop Flash on Boot
**Root cause:** Pi OS Desktop loads LXDE first.
**Solution chosen:** Pi OS Lite + Cage

When ready:
1. Flash Pi OS Lite (no desktop)
2. Install Cage compositor
3. Configure autologin to Cage
4. Cage launches Chromium directly
5. No desktop = no flash

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

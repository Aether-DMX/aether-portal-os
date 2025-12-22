# AETHER DMX - BETA RELEASE TODO
## Updated: December 21, 2025

---

## CRITICAL BUGS 🔴

- [ ] **SSOT Race Condition** - Scenes not stopping shows consistently
- [ ] **Blue fixtures on startup** - ESP32 nodes show blue on restart
- [ ] **Lock button sizing** - Button broken on some views

---

## UI/UX FIXES 🟠

- [ ] **Play/Pause/Stop indicators** - Missing in Scenes AND Chases views
- [ ] **Header overlapping content** - Some views cut off at top
- [ ] **Dashboard node spacing** - Tighten layout
- [ ] **Settings/More page polish** - Needs cleanup

---

## NEW FEATURES TO BUILD 🟢

- [ ] **Master Dimmer** - Global intensity control
- [ ] **Fixture Patching Tool** - Create/manage fixture groups  
- [ ] **Plymouth boot screen** - Update with AETHER branding
- [ ] **MIDI Pad Effects Backend** - Strobe/pulse need proper backend support

---

## NICE TO HAVE 🔵

- [ ] **Cleanup dead API routes** - Audit unused endpoints
- [ ] **Route security audit** - Verify access controls
- [ ] **Web remote control** - Phone/tablet access on network

---

## COMPLETED ✅

### December 21, 2025
- [x] MIDI Pad Controller - 3x3 grid with scene/chase/effect triggers
- [x] Effect modes - Strobe, pulse, heartbeat with color selection
- [x] Trigger modes - Tap, hold, toggle for all pad types
- [x] Themed Logo System - Dynamic colors matching theme
- [x] Dynamic Background Bubbles - 15 floating, sync to playback
- [x] AI Suggestion System - Auto-suggests based on time/holidays
- [x] Dock 7th Item - Added MIDI Pads button
- [x] Dashboard Blackout - Working with fade support

### December 14, 2025
- [x] Shows UI with floating player controls
- [x] Distributed vs Sync mode toggle
- [x] Created 11 scenes and 8 shows
- [x] Tempo controls with smart jumps
- [x] Dock hidden on content views
- [x] pause/resume/tempo API routes
- [x] skip_ssot parameter for shows

### Previous
- [x] WiFi node fade engine fix
- [x] Node reconnection spam fix
- [x] Show looping
- [x] Custom dock icons
- [x] Preset scene color fixes
- [x] Chase fade rate control
- [x] Dynamic background sync

---

## BETA RELEASE CHECKLIST

- [ ] Fix SSOT race condition (critical)
- [ ] Fix blue fixture startup issue
- [ ] Add play state indicators
- [ ] Full system test on clean Pi
- [ ] Update README
- [ ] Record demo video
- [ ] 10-20 beta testers
- [ ] Landing page live

---

## ESTIMATED: 75% Complete

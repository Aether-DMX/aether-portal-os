# AETHER Boot Polish

Seamless appliance boot experience for Raspberry Pi OS Lite + Cage.

## What It Does

Eliminates all visual artifacts during boot:

| Issue | Solution |
|-------|----------|
| Rainbow splash | `disable_splash=1` in config.txt |
| Kernel boot text | `quiet loglevel=0 console=tty3` |
| Blinking cursor | `vt.global_cursor_default=0` |
| Pi logo | `logo.nologo` |
| Gap before Chromium | Plymouth black splash |
| Race condition | Kiosk waits for backend |

## Boot Sequence

```
Power On
   │
   ├─► GPU init (black - no rainbow)
   │
   ├─► Kernel loads (silent, console on tty3)
   │
   ├─► Plymouth starts (black screen)
   │
   ├─► systemd starts services:
   │     ├─ aether-core.service (Python backend)
   │     └─ dmx-backend.service (Node.js)
   │
   ├─► aether-kiosk.service:
   │     ├─ Waits for backend (curl localhost:3000)
   │     ├─ Quits Plymouth
   │     └─ Starts Cage + Chromium
   │
   └─► UI visible (no flash)
```

## Installation

### Fresh Install
The boot polish is automatically applied during fresh installation:
```bash
./scripts/install.sh
```

### Existing Installation
Apply boot polish to an existing system:
```bash
sudo ./scripts/boot-polish.sh
sudo reboot
```

## Verification

Check that all boot polish settings are correctly applied:
```bash
./scripts/verify-boot.sh
```

Expected output:
```
[1/7] Kernel Command Line
  ✓ quiet mode enabled
  ✓ splash enabled
  ✓ Raspberry Pi logo disabled
  ✓ loglevel=0 (silent)
  ✓ cursor hidden

[2/7] Boot Config (config.txt)
  ✓ Rainbow splash disabled

[3/7] Plymouth Installation
  ✓ Plymouth installed
  ✓ AETHER theme installed
  ✓ AETHER is default theme

[4/7] Plymouth Services
  ✓ plymouth-start.service enabled
  ✓ plymouth-quit.service enabled

[5/7] Console Black Service
  ✓ console-black.service exists
  ✓ console-black.service enabled

[6/7] Kiosk Service
  ✓ aether-kiosk.service exists
  ✓ Kiosk service quits Plymouth
  ✓ Kiosk waits for backend
  ✓ aether-kiosk.service enabled

[7/7] Required Packages
  ✓ Cage compositor installed
  ✓ Chromium installed
  ✓ unclutter installed

SUMMARY
  Passed:  17
  Warnings: 0
  Failed:  0
```

## Files Modified

| File | Changes |
|------|---------|
| `/boot/firmware/cmdline.txt` | Added quiet boot params |
| `/boot/firmware/config.txt` | Added `disable_splash=1` |
| `/usr/share/plymouth/themes/aether/` | Custom black theme |
| `/etc/systemd/system/console-black.service` | Early black console |
| `/etc/systemd/system/aether-kiosk.service` | Plymouth integration |
| `/etc/initramfs-tools/` | Rebuilt with Plymouth |

## Troubleshooting

### Still seeing boot text
```bash
# Check cmdline
cat /proc/cmdline
# Should contain: quiet loglevel=0 console=tty3
```

### Plymouth not starting
```bash
# Check if masked
ls -la /etc/systemd/system/plymouth-*.service
# Should NOT be symlinks to /dev/null

# Unmask if needed
sudo rm /etc/systemd/system/plymouth-start.service
sudo systemctl daemon-reload
```

### Rainbow still showing
```bash
# Check config
grep disable_splash /boot/firmware/config.txt
# Should show: disable_splash=1
```

### Kiosk starting too early
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check kiosk logs
journalctl -u aether-kiosk -f
```

## Testing Protocol

Before marking boot polish complete:

1. **3x Reboot Test**
   ```bash
   for i in 1 2 3; do sudo reboot; done
   ```
   - [ ] No white/gray flash
   - [ ] No boot text visible
   - [ ] UI loads cleanly

2. **3x Power-Pull Test**
   - Physically remove power
   - Reconnect power
   - [ ] No white/gray flash
   - [ ] No boot text visible
   - [ ] UI loads cleanly (may take longer due to fsck)

3. **Cold Boot Test**
   ```bash
   sudo poweroff
   # Wait 30 seconds
   # Power on
   ```
   - [ ] No white/gray flash
   - [ ] No boot text visible
   - [ ] UI loads cleanly

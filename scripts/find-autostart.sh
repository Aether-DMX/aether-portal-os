#!/bin/bash
# Find how the kiosk is configured to auto-start

echo "=========================================="
echo "Finding Kiosk Autostart Configuration"
echo "=========================================="
echo ""

# Check systemd services
echo "1. Checking systemd services..."
sudo systemctl list-units --all | grep -i kiosk || echo "  No kiosk systemd service found"
echo ""

# Check autostart directory
echo "2. Checking ~/.config/autostart/..."
if [ -d ~/.config/autostart ]; then
  for file in ~/.config/autostart/*.desktop; do
    if [ -f "$file" ]; then
      echo "  Found: $file"
      grep -i "chromium\|kiosk\|start-kiosk" "$file" || echo "    (no kiosk references)"
      echo ""
    fi
  done
else
  echo "  Directory doesn't exist"
fi
echo ""

# Check LXDE autostart
echo "3. Checking LXDE autostart..."
if [ -f ~/.config/lxsession/LXDE-pi/autostart ]; then
  echo "  Found LXDE autostart file:"
  grep -i "chromium\|kiosk\|start-kiosk" ~/.config/lxsession/LXDE-pi/autostart || echo "    (no kiosk references)"
else
  echo "  LXDE autostart file not found"
fi
echo ""

# Check profile files
echo "4. Checking profile files..."
for file in ~/.bashrc ~/.profile ~/.bash_profile; do
  if [ -f "$file" ]; then
    if grep -qi "chromium\|kiosk\|start-kiosk" "$file"; then
      echo "  Found references in: $file"
      grep -i "chromium\|kiosk\|start-kiosk" "$file"
    fi
  fi
done
echo ""

# Check system-wide autostart
echo "5. Checking system-wide autostart..."
if [ -d /etc/xdg/autostart ]; then
  for file in /etc/xdg/autostart/*.desktop; do
    if [ -f "$file" ] && grep -qi "chromium\|kiosk" "$file"; then
      echo "  Found: $file"
      grep -i "chromium\|kiosk" "$file"
    fi
  done
fi
echo ""

# Check cron
echo "6. Checking cron jobs..."
crontab -l 2>/dev/null | grep -i "chromium\|kiosk\|start-kiosk" || echo "  No kiosk cron jobs found"
echo ""

# Check current Chromium process
echo "7. Current Chromium process..."
if pgrep chromium > /dev/null; then
  echo "  Chromium is running:"
  ps aux | grep chromium | grep -v grep | head -3
else
  echo "  Chromium is not running"
fi
echo ""

echo "=========================================="
echo "Search complete!"
echo "=========================================="


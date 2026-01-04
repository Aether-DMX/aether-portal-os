#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# AETHER PORTAL - Boot Polish Script
# ═══════════════════════════════════════════════════════════════════════════
# Eliminates visual artifacts during boot:
#   - Rainbow splash disabled
#   - Kernel boot messages hidden (redirected to tty3)
#   - Console background set to black
#   - Plymouth splash covers boot-to-X transition
#   - LightDM sets black background before X session
#   - Seamless transition to Chromium kiosk
#
# Supports both:
#   - Pi OS Desktop (LightDM + Openbox + X11)
#   - Pi OS Lite (Cage compositor)
# ═══════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════"
echo "         AETHER BOOT POLISH v2.0"
echo "         Seamless Appliance Boot Experience"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Must run as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo $0${NC}"
    exit 1
fi

# Detect display system
DISPLAY_SYSTEM="unknown"
if systemctl is-active lightdm &>/dev/null || systemctl is-enabled lightdm &>/dev/null; then
    DISPLAY_SYSTEM="lightdm"
    echo -e "${CYAN}Detected: LightDM (X11/Openbox)${NC}"
elif command -v cage &>/dev/null; then
    DISPLAY_SYSTEM="cage"
    echo -e "${CYAN}Detected: Cage (Wayland)${NC}"
else
    echo -e "${YELLOW}Display system not detected, will configure for both${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Configure Kernel Command Line for Silent Boot
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[1/7] Configuring kernel for silent boot...${NC}"

CMDLINE_FILE="/boot/firmware/cmdline.txt"
if [ ! -f "$CMDLINE_FILE" ]; then
    CMDLINE_FILE="/boot/cmdline.txt"
fi

if [ -f "$CMDLINE_FILE" ]; then
    # Backup original
    cp "$CMDLINE_FILE" "${CMDLINE_FILE}.backup.$(date +%Y%m%d%H%M%S)"

    # Read current cmdline
    CMDLINE=$(cat "$CMDLINE_FILE")

    # Remove any existing splash/quiet/logo params we'll be setting
    CMDLINE=$(echo "$CMDLINE" | sed 's/splash//g; s/quiet//g; s/plymouth[^ ]*//g; s/logo.nologo//g; s/vt.global_cursor_default=[^ ]*//g; s/loglevel=[^ ]*//g; s/console=tty[0-9]*//g; s/consoleblank=[^ ]*//g; s/rd.plymouth[^ ]*//g; s/fbcon=[^ ]*//g')

    # Clean up multiple spaces
    CMDLINE=$(echo "$CMDLINE" | tr -s ' ')

    # Add our boot params
    CMDLINE="$CMDLINE quiet splash plymouth.enable=1 logo.nologo vt.global_cursor_default=0 loglevel=0 console=tty3 consoleblank=0 rd.plymouth=1 plymouth.ignore-serial-consoles"

    # Clean up and write
    CMDLINE=$(echo "$CMDLINE" | tr -s ' ' | sed 's/^ //; s/ $//')
    echo "$CMDLINE" > "$CMDLINE_FILE"

    echo "  Updated: $CMDLINE_FILE"
else
    echo -e "${YELLOW}  Warning: cmdline.txt not found, skipping...${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Configure Boot Config for Black Screen
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[2/7] Configuring boot config...${NC}"

CONFIG_FILE="/boot/firmware/config.txt"
if [ ! -f "$CONFIG_FILE" ]; then
    CONFIG_FILE="/boot/config.txt"
fi

if [ -f "$CONFIG_FILE" ]; then
    # Backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d%H%M%S)"

    # Remove existing AETHER boot polish entries
    sed -i '/# AETHER Boot Polish/d' "$CONFIG_FILE"
    sed -i '/disable_splash/d' "$CONFIG_FILE"
    sed -i '/boot_delay/d' "$CONFIG_FILE"

    # Add boot polish settings
    echo "" >> "$CONFIG_FILE"
    echo "# AETHER Boot Polish - Seamless boot" >> "$CONFIG_FILE"
    echo "disable_splash=1" >> "$CONFIG_FILE"
    echo "boot_delay=0" >> "$CONFIG_FILE"

    echo "  Updated: $CONFIG_FILE"
else
    echo -e "${YELLOW}  Warning: config.txt not found, skipping...${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Install and Configure Plymouth
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[3/7] Installing Plymouth...${NC}"

apt-get update -qq
apt-get install -y -qq plymouth plymouth-themes

# Create AETHER Plymouth theme directory
THEME_DIR="/usr/share/plymouth/themes/aether"
mkdir -p "$THEME_DIR"

# Create theme script - simple black background
cat > "$THEME_DIR/aether.script" << 'SCRIPT'
# AETHER Plymouth Theme - Clean Black Boot
Window.SetBackgroundTopColor(0, 0, 0);
Window.SetBackgroundBottomColor(0, 0, 0);

# Progress callback - we don't show progress, just black
fun refresh_callback() {
}
Plymouth.SetRefreshFunction(refresh_callback);

# Boot progress
fun boot_progress_callback(time, progress) {
}
Plymouth.SetBootProgressFunction(boot_progress_callback);

# Message callback
fun message_callback(text) {
}
Plymouth.SetMessageFunction(message_callback);
SCRIPT

# Create theme definition
cat > "$THEME_DIR/aether.plymouth" << 'PLYMOUTH'
[Plymouth Theme]
Name=AETHER
Description=AETHER Portal clean black boot theme
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/aether
ScriptFile=/usr/share/plymouth/themes/aether/aether.script
PLYMOUTH

# Create a simple black logo placeholder (1x1 black pixel PNG)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x00\x00\x00\x00\x01\x00\x01\x00\x05\xfe\xd0\x17\x00\x00\x00\x00IEND\xaeB\x60\x82' > "$THEME_DIR/logo.png"

echo "  Created AETHER Plymouth theme"

# Set as default theme
plymouth-set-default-theme -R aether 2>/dev/null || plymouth-set-default-theme aether

echo "  Set AETHER as default Plymouth theme"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Unmask Plymouth Services (if masked)
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[4/7] Enabling Plymouth services...${NC}"

# Remove any masks
rm -f /etc/systemd/system/plymouth-start.service 2>/dev/null || true
rm -f /etc/systemd/system/plymouth-quit.service 2>/dev/null || true
rm -f /etc/systemd/system/plymouth-quit-wait.service 2>/dev/null || true

# Reload and enable
systemctl daemon-reload
systemctl enable plymouth-start.service 2>/dev/null || true
systemctl enable plymouth-quit.service 2>/dev/null || true
systemctl enable plymouth-quit-wait.service 2>/dev/null || true

echo "  Plymouth services enabled"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Configure Console for Black Background
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[5/7] Configuring console colors...${NC}"

cat > /etc/systemd/system/console-black.service << 'SERVICE'
[Unit]
Description=Set console to black
DefaultDependencies=no
Before=plymouth-start.service
After=systemd-vconsole-setup.service

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'for tty in /dev/tty[1-6]; do [ -e "$tty" ] && /bin/setterm --foreground black --background black --clear all > "$tty" 2>/dev/null || true; done'
RemainAfterExit=yes

[Install]
WantedBy=sysinit.target
SERVICE

systemctl daemon-reload
systemctl enable console-black.service

echo "  Console black service installed"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Configure LightDM (if present)
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[6/7] Configuring display manager...${NC}"

LIGHTDM_CONF="/etc/lightdm/lightdm.conf"
if [ -f "$LIGHTDM_CONF" ]; then
    # Backup
    cp "$LIGHTDM_CONF" "${LIGHTDM_CONF}.backup.$(date +%Y%m%d%H%M%S)"

    # Check if display-setup-script already exists
    if ! grep -q "display-setup-script" "$LIGHTDM_CONF"; then
        # Add display-setup-script to set black background before X session
        sed -i '/^\[Seat:\*\]/a # AETHER Boot Polish - Black background before session\ndisplay-setup-script=/usr/bin/xsetroot -solid black' "$LIGHTDM_CONF"
        echo "  Added display-setup-script to LightDM"
    else
        echo "  LightDM display-setup-script already configured"
    fi
else
    echo "  LightDM not found (may be using Cage/Wayland)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Update Kiosk Service
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[7/7] Updating kiosk service...${NC}"

AETHER_USER="${SUDO_USER:-pi}"

# Check for existing kiosk service
if [ -f "/etc/systemd/system/aether-kiosk.service" ]; then
    # Read existing service to preserve display system choice
    if grep -q "lightdm" /etc/systemd/system/aether-kiosk.service 2>/dev/null; then
        DISPLAY_SYSTEM="lightdm"
    elif grep -q "cage" /etc/systemd/system/aether-kiosk.service 2>/dev/null; then
        DISPLAY_SYSTEM="cage"
    fi
fi

if [ "$DISPLAY_SYSTEM" = "lightdm" ]; then
    # LightDM/X11/Openbox setup
    cat > /etc/systemd/system/aether-kiosk.service << EOF
[Unit]
Description=AETHER DMX Kiosk Browser
After=lightdm.service aether-core.service dmx-backend.service
Requires=lightdm.service

[Service]
Type=simple
User=${AETHER_USER}
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/${AETHER_USER}/.Xauthority
ExecStartPre=/bin/bash -c 'for i in {1..30}; do curl -s http://localhost:3000 >/dev/null && break; sleep 1; done'
ExecStartPre=/bin/bash -c '/usr/bin/plymouth quit 2>/dev/null || true'
ExecStart=/home/${AETHER_USER}/aether-kiosk.sh
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF
    echo "  Configured kiosk for LightDM/X11"
else
    # Cage/Wayland setup
    USER_ID=$(id -u "$AETHER_USER")
    cat > /etc/systemd/system/aether-kiosk.service << EOF
[Unit]
Description=AETHER Kiosk (Cage + Chromium)
After=aether-core.service dmx-backend.service plymouth-quit-wait.service
Wants=aether-core.service dmx-backend.service

[Service]
Type=simple
User=${AETHER_USER}
Environment=WLR_LIBINPUT_NO_DEVICES=1
Environment=XDG_RUNTIME_DIR=/run/user/${USER_ID}
ExecStartPre=/bin/bash -c 'for i in {1..30}; do curl -s http://localhost:3000 >/dev/null && break; sleep 1; done'
ExecStartPre=/bin/bash -c '/usr/bin/plymouth quit 2>/dev/null || true'
ExecStart=/usr/bin/cage -s -- chromium --kiosk --disable-gpu --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --password-store=basic --disable-background-networking --disable-sync http://localhost:3000
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF
    echo "  Configured kiosk for Cage/Wayland"
fi

systemctl daemon-reload

# ═══════════════════════════════════════════════════════════════════════════
# COMPLETE
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}         BOOT POLISH COMPLETE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Changes made:"
echo "  1. Kernel cmdline: quiet splash, hidden cursor, loglevel=0"
echo "  2. config.txt: disable_splash=1, boot_delay=0"
echo "  3. Plymouth: AETHER black theme installed"
echo "  4. Plymouth services: unmasked and enabled"
echo "  5. Console: black background service"
echo "  6. LightDM: display-setup-script (if applicable)"
echo "  7. Kiosk: waits for backend, quits Plymouth"
echo ""
echo "Boot sequence:"
echo "  1. Black screen (rainbow disabled)"
echo "  2. Plymouth black splash (covers most of kernel boot)"
echo "  3. Services start in background"
echo "  4. Plymouth quits when backend ready"
echo "  5. Display manager + Chromium takes over"
echo ""
echo -e "${YELLOW}Note: Some early kernel text may still appear briefly on Pi 5${NC}"
echo -e "${YELLOW}      due to GPU initialization before Plymouth starts.${NC}"
echo ""
echo -e "${GREEN}Reboot to test: sudo reboot${NC}"
echo ""

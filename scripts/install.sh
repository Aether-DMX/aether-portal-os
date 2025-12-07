#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# AETHER PORTAL - Fresh Install Script for Raspberry Pi OS Lite (64-bit)
# ═══════════════════════════════════════════════════════════════════════════
#
# Prerequisites:
#   - Raspberry Pi 5 (4GB or 8GB)
#   - Fresh Raspberry Pi OS Lite (64-bit) - Bookworm
#   - Connected to internet via Ethernet or pre-configured WiFi
#   - SSH enabled
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/Aether-DMX/aether-portal-os/main/scripts/install.sh | bash
#
# Or manually:
#   git clone https://github.com/Aether-DMX/aether-portal-os.git
#   cd aether-portal-os && chmod +x scripts/install.sh && ./scripts/install.sh
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

AETHER_USER="${USER}"
AETHER_HOME="/home/${AETHER_USER}"

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════"
echo "         AETHER PORTAL INSTALLER v1.0"
echo "         AI-Powered DMX Lighting Control"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: System Update
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Install System Dependencies
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[2/10] Installing system dependencies...${NC}"
sudo apt install -y \
    git \
    curl \
    python3 \
    python3-pip \
    python3-venv \
    ola \
    ola-python \
    cage \
    chromium \
    unclutter \
    xdotool \
    libdrm2 \
    libgbm1 \
    libegl1 \
    libgles2

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Install Node.js 20 LTS
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[3/10] Installing Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Install Python Dependencies
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[4/10] Installing Python dependencies...${NC}"
pip3 install --break-system-packages \
    flask \
    flask-cors \
    pyserial \
    sacn

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Clone Repositories
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[5/10] Cloning AETHER repositories...${NC}"

cd "${AETHER_HOME}"

# Clone aether-portal-os
if [ -d "aether-portal-os-git" ]; then
    echo "aether-portal-os-git exists, pulling latest..."
    cd aether-portal-os-git && git pull && cd ..
else
    git clone https://github.com/Aether-DMX/aether-portal-os.git aether-portal-os-git
fi

# Clone aether-core
if [ -d "aether-core-git" ]; then
    echo "aether-core-git exists, pulling latest..."
    cd aether-core-git && git pull && cd ..
else
    git clone https://github.com/Aether-DMX/aether-core.git aether-core-git
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Create Directory Structure
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[6/10] Creating directory structure...${NC}"

mkdir -p "${AETHER_HOME}/Aether-DMX/frontend"
mkdir -p "${AETHER_HOME}/Aether-DMX/backend"

# Copy files
cp -r "${AETHER_HOME}/aether-portal-os-git/frontend/"* "${AETHER_HOME}/Aether-DMX/frontend/"
cp -r "${AETHER_HOME}/aether-portal-os-git/backend/"* "${AETHER_HOME}/Aether-DMX/backend/"
cp "${AETHER_HOME}/aether-core-git/"*.py "${AETHER_HOME}/"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Build Frontend
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[7/10] Building frontend...${NC}"

cd "${AETHER_HOME}/Aether-DMX/frontend"
npm install
npm run build

cd "${AETHER_HOME}/Aether-DMX/backend"
npm install

# Copy .env.example to .env if .env doesn't exist
if [ ! -f "${AETHER_HOME}/Aether-DMX/backend/.env" ]; then
    cp "${AETHER_HOME}/Aether-DMX/backend/.env.example" "${AETHER_HOME}/Aether-DMX/backend/.env"
    echo -e "${YELLOW}NOTE: Edit ~/Aether-DMX/backend/.env to add your Claude API key for AI features${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: Install Systemd Services
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[8/10] Installing systemd services...${NC}"

# Update service files with current username
sed "s/ramzt/${AETHER_USER}/g" "${AETHER_HOME}/aether-portal-os-git/systemd/aether-core.service" | sudo tee /etc/systemd/system/aether-core.service > /dev/null
sed "s/ramzt/${AETHER_USER}/g" "${AETHER_HOME}/aether-portal-os-git/systemd/dmx-backend.service" | sudo tee /etc/systemd/system/dmx-backend.service > /dev/null

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable aether-core dmx-backend
sudo systemctl start aether-core dmx-backend

# ═══════════════════════════════════════════════════════════════════════════
# STEP 9: Setup Kiosk Autostart
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[9/10] Setting up kiosk mode...${NC}"

# Copy kiosk script
cp "${AETHER_HOME}/aether-portal-os-git/scripts/start-kiosk.sh" /home/pi/start-aether-portal.sh 2>/dev/null || \
cp "${AETHER_HOME}/aether-portal-os-git/scripts/start-kiosk.sh" "${AETHER_HOME}/start-aether-portal.sh"
chmod +x "${AETHER_HOME}/start-aether-portal.sh"

# Create cage-based kiosk service (better for Lite)
sudo tee /etc/systemd/system/aether-kiosk.service > /dev/null << EOF
[Unit]
Description=AETHER Kiosk (Cage + Chromium)
After=aether-core.service dmx-backend.service
Wants=aether-core.service dmx-backend.service

[Service]
Type=simple
User=${AETHER_USER}
Environment=WLR_LIBINPUT_NO_DEVICES=1
Environment=XDG_RUNTIME_DIR=/run/user/$(id -u ${AETHER_USER})
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/cage -s -- chromium --kiosk --disable-gpu --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --password-store=basic http://localhost:3000
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable aether-kiosk

# ═══════════════════════════════════════════════════════════════════════════
# STEP 10: Configure OLA
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[10/10] Configuring OLA...${NC}"

# Enable E1.31 plugin
sudo systemctl enable olad
sudo systemctl start olad

# Wait for OLA to start
sleep 3

# Create default universe (Universe 1 with E1.31 output)
# Note: OLA web interface is at http://localhost:9090 for manual config
echo "OLA started - configure universes at http://localhost:9090"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 11: Copy Deploy Script
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${GREEN}[Bonus] Setting up deploy script...${NC}"
cp "${AETHER_HOME}/aether-portal-os-git/scripts/deploy.sh" "${AETHER_HOME}/deploy.sh"
chmod +x "${AETHER_HOME}/deploy.sh"

# ═══════════════════════════════════════════════════════════════════════════
# COMPLETE!
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}         AETHER PORTAL INSTALLATION COMPLETE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Access the UI at: ${YELLOW}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo ""
echo "Services:"
echo "  - aether-core    (Python, port 8891)"
echo "  - dmx-backend    (Node.js, port 3000)"
echo "  - aether-kiosk   (Chromium in Cage)"
echo "  - olad           (OLA, port 9090)"
echo ""
echo "Commands:"
echo "  sudo systemctl status aether-core dmx-backend"
echo "  sudo journalctl -u aether-core -f"
echo "  ~/deploy.sh   # Update from GitHub"
echo ""
echo -e "${YELLOW}Reboot recommended to start kiosk mode: sudo reboot${NC}"
echo ""

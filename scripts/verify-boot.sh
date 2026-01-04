#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# AETHER PORTAL - Boot Configuration Verification Script
# ═══════════════════════════════════════════════════════════════════════════
# Checks all boot polish settings and reports status
# ═══════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARN++))
}

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════"
echo "         AETHER BOOT VERIFICATION"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 1: Kernel Command Line
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[1/7] Kernel Command Line${NC}"

CMDLINE=$(cat /proc/cmdline 2>/dev/null || echo "")

if echo "$CMDLINE" | grep -q "quiet"; then
    check_pass "quiet mode enabled"
else
    check_fail "quiet mode NOT in cmdline"
fi

if echo "$CMDLINE" | grep -q "splash"; then
    check_pass "splash enabled"
else
    check_fail "splash NOT in cmdline"
fi

if echo "$CMDLINE" | grep -q "logo.nologo"; then
    check_pass "Raspberry Pi logo disabled"
else
    check_warn "logo.nologo not set (Pi logo may show)"
fi

if echo "$CMDLINE" | grep -q "loglevel=0"; then
    check_pass "loglevel=0 (silent)"
else
    check_warn "loglevel not set to 0"
fi

if echo "$CMDLINE" | grep -q "vt.global_cursor_default=0"; then
    check_pass "cursor hidden"
else
    check_warn "cursor may be visible"
fi

echo "  Current cmdline: $CMDLINE"

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 2: Boot Config
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[2/7] Boot Config (config.txt)${NC}"

CONFIG_FILE="/boot/firmware/config.txt"
if [ ! -f "$CONFIG_FILE" ]; then
    CONFIG_FILE="/boot/config.txt"
fi

if [ -f "$CONFIG_FILE" ]; then
    if grep -q "disable_splash=1" "$CONFIG_FILE"; then
        check_pass "Rainbow splash disabled"
    else
        check_fail "disable_splash=1 NOT set (rainbow will show)"
    fi
else
    check_warn "config.txt not found"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 3: Plymouth Installation
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[3/7] Plymouth Installation${NC}"

if command -v plymouth &>/dev/null; then
    check_pass "Plymouth installed"
else
    check_fail "Plymouth NOT installed"
fi

if [ -d "/usr/share/plymouth/themes/aether" ]; then
    check_pass "AETHER theme installed"
else
    check_fail "AETHER theme NOT installed"
fi

DEFAULT_THEME=$(plymouth-set-default-theme 2>/dev/null || echo "unknown")
if [ "$DEFAULT_THEME" = "aether" ]; then
    check_pass "AETHER is default theme"
else
    check_warn "Default theme is: $DEFAULT_THEME (expected: aether)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 4: Plymouth Services
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[4/7] Plymouth Services${NC}"

# Check if masked
if [ -L "/etc/systemd/system/plymouth-start.service" ]; then
    TARGET=$(readlink -f /etc/systemd/system/plymouth-start.service)
    if [ "$TARGET" = "/dev/null" ]; then
        check_fail "plymouth-start.service is MASKED"
    else
        check_pass "plymouth-start.service symlink OK"
    fi
else
    if systemctl is-enabled plymouth-start.service &>/dev/null; then
        check_pass "plymouth-start.service enabled"
    else
        check_warn "plymouth-start.service not enabled"
    fi
fi

if systemctl is-enabled plymouth-quit.service &>/dev/null; then
    check_pass "plymouth-quit.service enabled"
else
    check_warn "plymouth-quit.service not enabled"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 5: Console Black Service
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[5/7] Console Black Service${NC}"

if [ -f "/etc/systemd/system/console-black.service" ]; then
    check_pass "console-black.service exists"
    if systemctl is-enabled console-black.service &>/dev/null; then
        check_pass "console-black.service enabled"
    else
        check_fail "console-black.service NOT enabled"
    fi
else
    check_fail "console-black.service NOT installed"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 6: Kiosk Service
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[6/7] Kiosk Service${NC}"

if [ -f "/etc/systemd/system/aether-kiosk.service" ]; then
    check_pass "aether-kiosk.service exists"

    if grep -q "plymouth quit" /etc/systemd/system/aether-kiosk.service; then
        check_pass "Kiosk service quits Plymouth"
    else
        check_warn "Kiosk service does not quit Plymouth"
    fi

    if grep -q "ExecStartPre.*curl" /etc/systemd/system/aether-kiosk.service; then
        check_pass "Kiosk waits for backend"
    else
        check_warn "Kiosk may start before backend ready"
    fi

    if systemctl is-enabled aether-kiosk.service &>/dev/null; then
        check_pass "aether-kiosk.service enabled"
    else
        check_fail "aether-kiosk.service NOT enabled"
    fi
else
    check_fail "aether-kiosk.service NOT installed"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 7: Required Packages
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[7/7] Required Packages${NC}"

if command -v cage &>/dev/null; then
    check_pass "Cage compositor installed"
else
    check_fail "Cage compositor NOT installed"
fi

if command -v chromium &>/dev/null || command -v chromium-browser &>/dev/null; then
    check_pass "Chromium installed"
else
    check_fail "Chromium NOT installed"
fi

if dpkg -l | grep -q "^ii.*unclutter"; then
    check_pass "unclutter installed (cursor hiding)"
else
    check_warn "unclutter not installed"
fi

# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo "SUMMARY"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}  $PASS"
echo -e "  ${YELLOW}Warnings:${NC} $WARN"
echo -e "  ${RED}Failed:${NC}  $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}Boot polish is fully configured!${NC}"
    else
        echo -e "${YELLOW}Boot polish configured with minor issues.${NC}"
    fi
    echo ""
    echo "Expected boot sequence:"
    echo "  1. Power on → Black screen (no rainbow)"
    echo "  2. Plymouth black splash covers kernel boot"
    echo "  3. Services start in background"
    echo "  4. Kiosk waits for backend, quits Plymouth"
    echo "  5. Cage + Chromium displays UI"
    echo ""
    echo "To test: sudo reboot"
else
    echo -e "${RED}Boot polish has issues that need fixing.${NC}"
    echo ""
    echo "To fix, run: sudo /path/to/boot-polish.sh"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# BOOT TIME ANALYSIS (if systemd-analyze available)
# ═══════════════════════════════════════════════════════════════════════════
if command -v systemd-analyze &>/dev/null; then
    echo -e "${CYAN}Boot Time Analysis:${NC}"
    systemd-analyze 2>/dev/null || echo "  (boot analysis not available yet - reboot first)"
    echo ""
fi

exit $FAIL

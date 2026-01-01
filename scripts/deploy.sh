#!/bin/bash
set -e  # Exit on any error

echo "🚀 AETHER DEPLOY STARTING..."
echo "📅 $(date)"

# Configuration
AETHER_CORE_GIT=~/aether-core-git
AETHER_PORTAL_GIT=~/aether-portal-os-git
AETHER_CORE_RUN=/home/ramzt
AETHER_PORTAL_RUN=/home/ramzt/Aether-DMX
BACKUP_DIR=/home/ramzt/.aether-backups
MAX_BACKUPS=5

# Step 0: Create backup of current runtime
echo ""
echo "💾 STEP 0: Creating backup..."
echo "----------------------------------------"
mkdir -p "$BACKUP_DIR"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup current aether-core.py (if exists)
if [ -f "$AETHER_CORE_RUN/aether-core.py" ]; then
    CURRENT_COMMIT=$(grep -o 'AETHER_COMMIT = "[^"]*"' "$AETHER_CORE_RUN/aether-core.py" | cut -d'"' -f2 || echo "unknown")
    cp "$AETHER_CORE_RUN/aether-core.py" "$BACKUP_DIR/aether-core.py.${BACKUP_TIMESTAMP}_${CURRENT_COMMIT}"
    echo "  ✅ Backed up aether-core.py (commit: $CURRENT_COMMIT)"
fi

# Cleanup old backups (keep only MAX_BACKUPS)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/aether-core.py.* 2>/dev/null | wc -l || echo 0)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    ls -1t "$BACKUP_DIR"/aether-core.py.* | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    echo "  ℹ️  Cleaned up old backups (kept last $MAX_BACKUPS)"
fi

# Step 1: Pull latest code
echo ""
echo "📦 STEP 1: Pulling latest code..."
echo "----------------------------------------"

cd "$AETHER_CORE_GIT"
echo "📍 aether-core-git: $(pwd)"
git fetch origin
BEFORE_CORE=$(git rev-parse HEAD)
git pull
AFTER_CORE=$(git rev-parse HEAD)
if [ "$BEFORE_CORE" != "$AFTER_CORE" ]; then
    echo "✅ aether-core updated: ${BEFORE_CORE:0:7} → ${AFTER_CORE:0:7}"
else
    echo "ℹ️  aether-core already up-to-date: ${AFTER_CORE:0:7}"
fi

cd "$AETHER_PORTAL_GIT"
echo "📍 aether-portal-os-git: $(pwd)"
git fetch origin
BEFORE_PORTAL=$(git rev-parse HEAD)
git pull
AFTER_PORTAL=$(git rev-parse HEAD)
if [ "$BEFORE_PORTAL" != "$AFTER_PORTAL" ]; then
    echo "✅ aether-portal-os updated: ${BEFORE_PORTAL:0:7} → ${AFTER_PORTAL:0:7}"
else
    echo "ℹ️  aether-portal-os already up-to-date: ${AFTER_PORTAL:0:7}"
fi

# Step 2: Sync to runtime locations
echo ""
echo "📦 STEP 2: Syncing to runtime locations..."
echo "----------------------------------------"

# Sync aether-core.py to runtime location WITH embedded commit hash
# (The runtime location is outside git, so we bake in the commit at deploy time)
echo "🔄 Syncing aether-core.py → $AETHER_CORE_RUN/"
cp "$AETHER_CORE_GIT/aether-core/aether-core.py" "$AETHER_CORE_RUN/aether-core.py"

# Embed the commit hash directly in the file for runtime verification
# This replaces the dynamic git lookup with a static value
COMMIT_SHORT="${AFTER_CORE:0:7}"
sed -i "s/AETHER_COMMIT = get_git_commit()/AETHER_COMMIT = \"$COMMIT_SHORT\"  # Baked at deploy: $(date +%Y-%m-%d_%H:%M:%S)/" "$AETHER_CORE_RUN/aether-core.py"
echo "  ✅ Embedded commit hash: $COMMIT_SHORT"

# Sync portal backend (if it exists)
if [ -d "$AETHER_PORTAL_GIT/backend" ]; then
    echo "🔄 Syncing backend → $AETHER_PORTAL_RUN/backend/"
    mkdir -p "$AETHER_PORTAL_RUN/backend"
    rsync -a --delete "$AETHER_PORTAL_GIT/backend/" "$AETHER_PORTAL_RUN/backend/"
fi

# Sync portal frontend
if [ -d "$AETHER_PORTAL_GIT/frontend" ]; then
    echo "🔄 Syncing frontend → $AETHER_PORTAL_RUN/frontend/"
    mkdir -p "$AETHER_PORTAL_RUN/frontend"
    rsync -a --delete "$AETHER_PORTAL_GIT/frontend/" "$AETHER_PORTAL_RUN/frontend/"
fi

# Step 3: Rebuild frontend (if needed)
echo ""
echo "📦 STEP 3: Rebuilding frontend..."
echo "----------------------------------------"
cd "$AETHER_PORTAL_RUN/frontend"
npm install --silent
npm run build

# Step 4: Restart services
echo ""
echo "🔄 STEP 4: Restarting services..."
echo "----------------------------------------"
sudo systemctl restart aether-core
sleep 2
sudo systemctl restart dmx-backend 2>/dev/null || echo "ℹ️  dmx-backend not installed (OK)"

# Step 5: Verify deployment with health check
echo ""
echo "✅ STEP 5: Verifying deployment..."
echo "----------------------------------------"

DEPLOY_OK=true
BACKUP_FILE="$BACKUP_DIR/aether-core.py.${BACKUP_TIMESTAMP}_${CURRENT_COMMIT}"

# Wait for aether-core to start
echo "  Waiting for service to start..."
sleep 3

# Check service status
echo ""
echo "Service Status:"
if systemctl is-active --quiet aether-core; then
    echo "  ✅ aether-core: running"
else
    echo "  ❌ aether-core: NOT running"
    DEPLOY_OK=false
fi
systemctl is-active dmx-backend 2>/dev/null && echo "  ✅ dmx-backend: running" || echo "  ℹ️  dmx-backend: not installed"

# Check version endpoint (with retries)
echo ""
echo "Version Check:"
for RETRY in 1 2 3; do
    VERSION_RESPONSE=$(curl -s --max-time 5 http://localhost:8891/api/version 2>/dev/null || echo "FAILED")
    if [ "$VERSION_RESPONSE" != "FAILED" ]; then
        break
    fi
    if [ $RETRY -lt 3 ]; then
        echo "  Retry $RETRY/3..."
        sleep 2
    fi
done

if [ "$VERSION_RESPONSE" != "FAILED" ]; then
    RUNNING_COMMIT=$(echo "$VERSION_RESPONSE" | grep -o '"git_commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo "  Running commit: $RUNNING_COMMIT"
    echo "  Expected commit: ${AFTER_CORE:0:7}"
    if [[ "$RUNNING_COMMIT" == "${AFTER_CORE:0:7}"* ]]; then
        echo "  ✅ COMMIT MATCH - Deployment verified!"
    else
        echo "  ⚠️  COMMIT MISMATCH - Service may be running old code!"
        DEPLOY_OK=false
    fi
else
    echo "  ❌ Could not reach /api/version after 3 attempts"
    DEPLOY_OK=false
fi

# Health check - verify critical endpoints
echo ""
echo "Health Check:"
HEALTH_RESPONSE=$(curl -s --max-time 5 http://localhost:8891/api/health 2>/dev/null || echo "FAILED")
if [ "$HEALTH_RESPONSE" != "FAILED" ]; then
    echo "  ✅ /api/health: OK"
else
    echo "  ❌ /api/health: FAILED"
    DEPLOY_OK=false
fi

# Auto-rollback if deployment failed
if [ "$DEPLOY_OK" = false ]; then
    echo ""
    echo "⚠️  DEPLOYMENT HEALTH CHECK FAILED!"
    echo "----------------------------------------"

    if [ -f "$BACKUP_FILE" ]; then
        echo "🔙 AUTO-ROLLBACK: Restoring previous version..."
        cp "$BACKUP_FILE" "$AETHER_CORE_RUN/aether-core.py"
        sudo systemctl restart aether-core
        sleep 3

        if systemctl is-active --quiet aether-core; then
            echo "  ✅ Rollback successful - service running"
            echo ""
            echo "❌ DEPLOY FAILED - ROLLED BACK TO: ${CURRENT_COMMIT}"
            echo "Check logs: journalctl -u aether-core -n 100"
            exit 1
        else
            echo "  ❌ Rollback failed - service still not running"
            echo ""
            echo "🚨 CRITICAL: Both deploy and rollback failed!"
            echo "Manual intervention required."
            echo "Check logs: journalctl -u aether-core -n 100"
            exit 2
        fi
    else
        echo "  ⚠️  No backup available for rollback"
        echo ""
        echo "❌ DEPLOY FAILED - NO ROLLBACK AVAILABLE"
        echo "Check logs: journalctl -u aether-core -n 100"
        exit 1
    fi
fi

echo ""
echo "🎉 DEPLOY COMPLETE!"
echo "----------------------------------------"
echo "Commits deployed:"
echo "  aether-core:      ${AFTER_CORE:0:7}"
echo "  aether-portal-os: ${AFTER_PORTAL:0:7}"
echo "Backup available:"
echo "  $BACKUP_FILE"
echo ""
echo "To rollback:"
echo "  ~/aether-portal-os-git/scripts/rollback.sh"
echo ""
echo "To restart Chromium kiosk:"
echo "  pkill chromium && DISPLAY=:0 chromium --kiosk --disable-gpu --password-store=basic http://localhost:3000 &"

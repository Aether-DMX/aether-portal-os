#!/bin/bash
# AETHER Rollback Script
# Restores the previous version of aether-core.py

set -e

AETHER_CORE_RUN=/home/ramzt
BACKUP_DIR=/home/ramzt/.aether-backups

echo "🔙 AETHER ROLLBACK"
echo "📅 $(date)"
echo "----------------------------------------"

# List available backups
echo ""
echo "Available backups:"
echo ""

BACKUPS=($(ls -1t "$BACKUP_DIR"/aether-core.py.* 2>/dev/null || true))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo "❌ No backups found in $BACKUP_DIR"
    exit 1
fi

for i in "${!BACKUPS[@]}"; do
    BACKUP_FILE="${BACKUPS[$i]}"
    BACKUP_NAME=$(basename "$BACKUP_FILE")
    # Extract timestamp and commit from filename: aether-core.py.20241229_120000_abc1234
    PARTS=$(echo "$BACKUP_NAME" | sed 's/aether-core.py.//')
    TIMESTAMP=$(echo "$PARTS" | cut -d'_' -f1-2)
    COMMIT=$(echo "$PARTS" | cut -d'_' -f3)
    echo "  [$i] $BACKUP_NAME"
    echo "      Timestamp: $TIMESTAMP"
    echo "      Commit:    $COMMIT"
    echo ""
done

# Get user selection
if [ -n "$1" ]; then
    SELECTION=$1
else
    echo "Enter backup number to restore (0 = most recent, or 'q' to quit):"
    read -r SELECTION
fi

if [ "$SELECTION" = "q" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -ge ${#BACKUPS[@]} ]; then
    echo "❌ Invalid selection"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$SELECTION]}"
echo ""
echo "🔄 Restoring: $(basename "$SELECTED_BACKUP")"
echo "----------------------------------------"

# Get current version info before rollback
if [ -f "$AETHER_CORE_RUN/aether-core.py" ]; then
    CURRENT_COMMIT=$(grep -o 'AETHER_COMMIT = "[^"]*"' "$AETHER_CORE_RUN/aether-core.py" | cut -d'"' -f2 || echo "unknown")
    echo "  Current commit: $CURRENT_COMMIT"
fi

# Restore the backup
cp "$SELECTED_BACKUP" "$AETHER_CORE_RUN/aether-core.py"
RESTORED_COMMIT=$(grep -o 'AETHER_COMMIT = "[^"]*"' "$AETHER_CORE_RUN/aether-core.py" | cut -d'"' -f2 || echo "unknown")
echo "  Restored commit: $RESTORED_COMMIT"

# Restart service
echo ""
echo "🔄 Restarting aether-core service..."
sudo systemctl restart aether-core

# Wait and verify
sleep 3

echo ""
echo "✅ Verifying rollback..."
if systemctl is-active --quiet aether-core; then
    echo "  ✅ aether-core: running"

    # Check version endpoint
    VERSION_RESPONSE=$(curl -s http://localhost:8891/api/version 2>/dev/null || echo "FAILED")
    if [ "$VERSION_RESPONSE" != "FAILED" ]; then
        RUNNING_COMMIT=$(echo "$VERSION_RESPONSE" | grep -o '"git_commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo "  ✅ Running commit: $RUNNING_COMMIT"
    else
        echo "  ⚠️  Could not verify via API"
    fi
else
    echo "  ❌ aether-core: NOT running"
    echo "  Check logs: journalctl -u aether-core -n 50"
fi

echo ""
echo "🎉 ROLLBACK COMPLETE!"
echo "----------------------------------------"
echo "Rolled back from: $CURRENT_COMMIT"
echo "Rolled back to:   $RESTORED_COMMIT"

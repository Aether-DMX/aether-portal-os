# AETHER Deployment Runbook

## Overview

AETHER uses a **git-based deployment workflow** with automatic backup, health verification, and rollback capabilities.

**Golden Rule:** Never run code that wasn't committed → pushed → pulled.

## Architecture

```
Development (Windows)          Pi (Production)
====================          ================
aether-core/                  ~/aether-core-git/
aether-portal-os/             ~/aether-portal-os-git/
                               ↓ deploy.sh syncs to
                              /home/ramzt/aether-core.py
                              /home/ramzt/Aether-DMX/
```

The Pi runs code from `/home/ramzt/` (runtime location), NOT directly from the git repos.
Deploy script syncs code and embeds commit hash for verification.

## Deployment Commands

### Standard Deployment
```bash
# SSH to Pi
ssh ramzt@aether.local

# Run deploy script
~/aether-portal-os-git/scripts/deploy.sh
```

### Manual Rollback
```bash
~/aether-portal-os-git/scripts/rollback.sh
```

### Check What's Running
```bash
# Via API
curl http://localhost:8891/api/version | jq .

# Via service
systemctl status aether-core
journalctl -u aether-core -n 50
```

### Check for Updates
```bash
curl http://localhost:8891/api/system/update/check | jq .
```

## Deploy Script Flow

1. **Backup** - Creates backup of current runtime to `~/.aether-backups/`
2. **Git Pull** - Fetches latest from both repos
3. **Sync** - Copies files to runtime location with embedded commit hash
4. **Build** - Rebuilds frontend
5. **Restart** - Restarts services
6. **Verify** - Checks health and version match
7. **Auto-rollback** - If health check fails, restores backup

## Commit Hash Verification

The deploy script embeds the git commit directly in the copied file:

```python
# In git repo:
AETHER_COMMIT = get_git_commit()

# After deploy:
AETHER_COMMIT = "abc1234"  # Baked at deploy: 2024-12-29_12:00:00
```

This ensures `/api/version` always reports the actual deployed commit.

## Auto-Update System

AETHER has optional auto-sync that can be enabled via API:

```bash
# Enable auto-sync (check every 30 minutes)
curl -X POST http://localhost:8891/api/system/autosync \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "interval_minutes": 30}'

# Check status
curl http://localhost:8891/api/system/autosync
```

Auto-sync will:
1. Check for updates at the configured interval
2. Pull if behind
3. Deploy to runtime location
4. Restart the service

## Backup & Rollback

Backups are stored in `~/.aether-backups/`:
- Keeps last 5 backups automatically
- Named with timestamp and commit: `aether-core.py.20241229_120000_abc1234`

To rollback:
```bash
# Interactive rollback
~/aether-portal-os-git/scripts/rollback.sh

# Auto-select most recent backup
~/aether-portal-os-git/scripts/rollback.sh 0
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
journalctl -u aether-core -n 100

# Verify syntax
python3 -m py_compile /home/ramzt/aether-core.py

# Try manual start
sudo systemctl stop aether-core
python3 /home/ramzt/aether-core.py
```

### Commit Mismatch
If `/api/version` shows wrong commit:
1. Check the file has embedded commit: `grep AETHER_COMMIT /home/ramzt/aether-core.py`
2. Re-run deploy script
3. If still wrong, manually restart: `sudo systemctl restart aether-core`

### Deploy Failed, Auto-Rollback Triggered
1. Check what failed in deploy output
2. Check service logs: `journalctl -u aether-core -n 100`
3. Fix the issue in code
4. Commit, push, redeploy

### Both Deploy and Rollback Failed
1. Check if Python or dependencies are broken
2. Try running manually: `python3 /home/ramzt/aether-core.py`
3. Check for OS-level issues (disk full, permissions, etc.)

## File Locations

| Purpose | Path |
|---------|------|
| Git repo (core) | `~/aether-core-git/` |
| Git repo (portal) | `~/aether-portal-os-git/` |
| Runtime (core) | `/home/ramzt/aether-core.py` |
| Runtime (portal) | `/home/ramzt/Aether-DMX/` |
| Backups | `~/.aether-backups/` |
| Service file | `/etc/systemd/system/aether-core.service` |
| Database | `/home/ramzt/aether.db` |
| Logs | `journalctl -u aether-core` |

## Systemd Service

```ini
# /etc/systemd/system/aether-core.service
[Unit]
Description=AETHER Core - Unified Control System
After=network.target

[Service]
Type=simple
User=ramzt
WorkingDirectory=/home/ramzt
ExecStart=/usr/bin/python3 /home/ramzt/aether-core.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## API Endpoints for Deployment

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/version` | GET | Current version and commit |
| `/api/health` | GET | Health check |
| `/api/system/update/check` | GET | Check for available updates |
| `/api/system/update` | POST | Pull and deploy updates |
| `/api/system/autosync` | GET/POST | Auto-sync configuration |

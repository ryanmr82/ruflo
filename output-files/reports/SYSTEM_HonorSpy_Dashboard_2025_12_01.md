# HonorSpy Dashboard System Documentation

**Created:** 2025-12-01
**Last Updated:** 2025-12-01
**Type:** System Documentation
**Project Location (Windows):** `C:\turtlewow\HonorTracking\`
**Project Location (Linux):** `/home/opc/HonorSpy/`
**Dashboard URL:** http://132.226.72.121/honorspy/
**Awards Page URL:** http://132.226.72.121/honorspy/awards.html

---

## Overview

A distributed honor tracking system for Turtle WoW PvP that collects HonorSpy addon data from multiple contributors and displays real-time standings, bracket calculations, and RP projections.

---

## Server Information

- **Server IP:** 132.226.72.121
- **SSH Alias:** `torreyserver` (configured in `~/.ssh/config`)
- **User:** opc
- **SSH Key:** `~/.ssh/linux-server.key`

### Server Paths
| Path | Purpose |
|------|---------|
| `/home/opc/HonorSpy/` | Main application directory |
| `/home/opc/HonorSpy/api.py` | Flask API server (port 5002) |
| `/home/opc/HonorSpy/data/` | Merged player data |
| `/home/opc/HonorSpy/contributors/` | Raw contributor uploads |
| `/home/opc/HonorSpy/snapshots/` | Weekly RP snapshots for analysis |
| `/home/opc/HonorSpy/logs/` | API and cron logs |
| `/var/www/html/honorspy/` | Static HTML output (nginx) |

### Windows Paths
| Path | Purpose |
|------|---------|
| `C:\turtlewow\HonorTracking\` | Main project directory |
| `C:\turtlewow\HonorTracking\server\api.py` | Local copy of API server |
| `C:\turtlewow\HonorTracking\contributor_installer\` | Contributor package source |
| `C:\turtlewow\HonorTracking\server\` | Server config files |

### Services
- **honorspy-api:** systemd service running Flask on port 5002
- **nginx:** Reverse proxy at `/honorspy/api/` -> `127.0.0.1:5002`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Receive contributor data |
| `/api/players` | GET | Return merged player data |
| `/api/contributors` | GET | Return contributor statistics |
| `/api/snapshot` | POST | Take a snapshot (body: `{"label": "pre_reset"}`) |
| `/api/snapshot` | GET | List all snapshots |
| `/api/awards` | GET | Calculate awards from last reset |
| `/api/awards/refresh` | POST | Regenerate awards HTML page |

---

## Automated Snapshots (Cron Jobs)

Three snapshots per week for RP formula reverse engineering:

| Day | Time (Server) | Label | Purpose |
|-----|---------------|-------|---------|
| Tuesday | 3:55 PM | `pre_reset` | Capture state before weekly reset (4 PM Pacific) |
| Wednesday | 6:00 PM | `post_reset_wed` | Early post-reset data (~24hr lag for repopulation) |
| Sunday | 6:00 PM | `post_reset_sun` | Maximum pool size before next reset |

**Purpose:** Accumulate data to reverse engineer the exact RP calculation formula used by TurtleWow.

---

## Snapshot Data Structure

Each snapshot captures per player:
- `RP` - Rank Points at snapshot time
- `rank` - Current rank (1-14)
- `progress` - Progress % toward next rank
- `thisWeekHonor` - Honor earned that week
- `class` - Player class

---

## Bracket System

Brackets determine RP rewards based on standing percentile:

| Bracket | Threshold (Cumulative) | RP Range |
|---------|------------------------|----------|
| 14 | Top 0.3% | 12,000 - 13,000 |
| 13 | Top 0.8% | 11,000 - 12,000 |
| 12 | Top 2.0% | 10,000 - 11,000 |
| 11 | Top 3.5% | 9,000 - 10,000 |
| 10 | Top 6.0% | 8,000 - 9,000 |
| 9 | Top 10.0% | 7,000 - 8,000 |
| 8 | Top 15.9% | 6,000 - 7,000 |
| 7 | Top 22.8% | 5,000 - 6,000 |
| 6 | Top 32.7% | 4,000 - 5,000 |
| 5 | Top 43.6% | 3,000 - 4,000 |
| 4 | Top 56.6% | 2,000 - 3,000 |
| 3 | Top 69.7% | 1,000 - 2,000 |
| 2 | Top 84.5% | 400 - 1,000 |
| 1 | Top 100% | 0 - 400 |

**Bracket spot calculation:** `Math.floor(poolSize * threshold + 0.5)`

---

## TurtleWow-Specific Rules

### No Rank Regression
**CRITICAL:** In TurtleWow, players CANNOT lose their rank number due to decay.

- A player at R13 @ 90% can decay to R13 @ 0%
- They will NEVER drop from R13 to R12
- Progress can go from 99% to 0% within the same rank
- Rank number is protected

This is a custom TurtleWow feature to allow breaks without losing rank.

### Weekly Decay
- 20% decay on current RP each week
- Formula: `decay = RP * 0.20`

### Rank Thresholds
| Rank | RP Required |
|------|-------------|
| 1 | 0 |
| 2 | 2,000 |
| 3 | 5,000 |
| 4 | 10,000 |
| 5 | 15,000 |
| 6 | 20,000 |
| 7 | 25,000 |
| 8 | 30,000 |
| 9 | 35,000 |
| 10 | 40,000 |
| 11 | 45,000 |
| 12 | 50,000 |
| 13 | 55,000 |
| 14 | 60,000 |

---

## RP Calculation (Current Approximation)

RP within a bracket is distributed based on honor position:
```
honorPosition = (playerHonor - minHonorInBracket) / (maxHonorInBracket - minHonorInBracket)
rpGain = bracketMin + (bracketMax - bracketMin) * honorPosition
```

**Note:** This formula is an approximation. The automated snapshot system is collecting data to reverse engineer the exact calculation.

---

## Contributor System

### Installation Package
Location: `C:\turtlewow\HonorTracking\HonorSpy_Contributor_Setup.zip`

Contents:
- `upload_honorspy.py` - Upload script
- `config.txt` - Contributor configuration
- `INSTALL.bat` - Creates scheduled task (every 5 min)
- `UNINSTALL.bat` - Removes scheduled task
- `Manual Upload.bat` - Test upload

### Contributor Flow
1. Contributor plays WoW with HonorSpy addon
2. HonorSpy saves data to `SavedVariables/HonorSpy.lua`
3. Scheduled task runs every 5 minutes
4. Python script parses Lua and POSTs to `/api/upload`
5. Server merges data (keeps most recent per player)
6. Dashboard regenerates

---

## Dashboard Features

### Main Dashboard
- Real-time standings sorted by honor
- Bracket assignment
- Decay/Gain/Net projections
- Projected rank after reset (respects no-rank-regression rule)
- Hover tooltip showing last week's award data
- Search by player name
- Honor simulation ("what if I get X honor?")
- Bracket 14 spot calculator

### Awards Page
- Weekly reset comparison
- Pre-reset vs post-reset RP
- Actual awards received
- Search by player name

---

## Common Operations

### Restart API
```bash
ssh torreyserver "sudo systemctl restart honorspy-api"
```

### Regenerate Dashboard
```bash
ssh torreyserver "cd /home/opc/HonorSpy && python3 -c \"from api import load_merged_data, generate_dashboard_html; data = load_merged_data(); open('/var/www/html/honorspy/index.html', 'w').write(generate_dashboard_html(data))\""
```

### Take Manual Snapshot
```bash
curl -X POST http://132.226.72.121/honorspy/api/snapshot -H "Content-Type: application/json" -d '{"label": "manual"}'
```

### Upload API Code from Windows
```bash
scp "C:/turtlewow/HonorTracking/server/api.py" torreyserver:/home/opc/HonorSpy/api.py
```

### View Snapshots
```bash
ssh torreyserver "ls -la /home/opc/HonorSpy/snapshots/"
```

---

## Troubleshooting

### API Not Responding
```bash
ssh torreyserver "sudo systemctl status honorspy-api"
ssh torreyserver "sudo journalctl -u honorspy-api -n 50"
```

### Dashboard Not Updating
- Check if contributor uploads are working
- Verify merged_players.json timestamp
- Manually regenerate dashboard

### Cron Jobs Not Running
```bash
ssh torreyserver "crontab -l"
ssh torreyserver "cat /home/opc/HonorSpy/logs/snapshot_cron.log"
```

---

## Reverse Engineering Goals

With accumulated snapshot data, analyze:
1. Exact RP distribution formula within brackets
2. Bracket boundary behavior (last B14 vs first B13)
3. Whether distribution is linear, curved, or stepped
4. Pool size effects on calculations
5. Honor gap impact on RP rewards

---

## Keywords
HonorSpy, TurtleWow, PvP, honor tracking, rank points, brackets, decay, weekly reset, snapshots, reverse engineering, contributor system, Flask API

---

*This documentation is maintained in the centralized repository. For the latest version, check the INDEX.md file.*

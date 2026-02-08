# HonorSpy Dashboard Setup Guide

## Package Contents
- `api.py` - Main Flask application (dashboard + API)
- `analyze_formula.py` - Weekly reset analysis script
- `docs/` - Infrastructure documentation
- `honorspy-api.service` - Systemd service file
- `honorspy-ip.conf` - Nginx configuration example

## Requirements
- Python 3.8+
- Flask (`pip install flask flask-cors`)
- Nginx (or any web server) to serve static files
- Linux server (tested on Oracle Linux/Ubuntu)

## Quick Start

1. **Extract and setup:**
   ```bash
   unzip HonorSpy-package.zip
   cd HonorSpy
   mkdir -p logs snapshots data contributors analysis
   ```

2. **Install Python dependencies:**
   ```bash
   pip install flask flask-cors
   ```

3. **Configure paths in api.py (lines 18-25):**
   ```python
   DATA_FILE = '/path/to/data/players.json'
   OUTPUT_FILE = '/var/www/html/honorspy/index.html'
   AWARDS_OUTPUT_FILE = '/var/www/html/honorspy/awards.html'
   SNAPSHOTS_DIR = '/path/to/snapshots'
   ```

4. **Start the API server:**
   ```bash
   python3 api.py
   # Runs on port 5002 by default
   ```

5. **Configure nginx:**
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:5002/api/;
   }
   location /honorspy/ {
       alias /var/www/html/honorspy/;
   }
   ```

## Cron Jobs for Weekly Reset

The honor reset happens every **Tuesday at 4:00 PM PST**.

```bash
# Edit crontab
crontab -e

# Add these lines (adjust timezone as needed):

# Pre-reset snapshot - 5 minutes BEFORE reset
55 15 * * 2 curl -X POST http://127.0.0.1:5002/api/snapshot -H "Content-Type: application/json" -d '{"label": "pre_reset"}'

# Post-reset snapshot - 6 hours AFTER reset
0 22 * * 2 curl -X POST http://127.0.0.1:5002/api/snapshot -H "Content-Type: application/json" -d '{"label": "post_reset"}'

# Run analysis after post-reset
5 22 * * 2 cd /path/to/HonorSpy && python3 analyze_formula.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players` | GET | Get all player data |
| `/api/upload` | POST | Upload HonorSpy addon data |
| `/api/snapshot` | POST | Create a snapshot |
| `/api/snapshot` | GET | List all snapshots |
| `/api/week-pairs` | GET | Get weekly snapshot pairs |
| `/api/awards` | GET | Get weekly awards data |
| `/api/awards/refresh` | POST | Regenerate awards page |
| `/api/health` | GET | Health check |

## Data Upload

Players upload data from the HonorSpy WoW addon via:
```
POST /api/upload
Content-Type: application/json
{
  "players": [...],
  "contributor": "PlayerName"
}
```

## Running as a Service

```bash
# Copy service file
sudo cp honorspy-api.service /etc/systemd/system/

# Edit paths in the service file
sudo nano /etc/systemd/system/honorspy-api.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable honorspy-api
sudo systemctl start honorspy-api
```

## Features
- Real-time honor standings dashboard
- Weekly awards page showing RP gains
- Sortable columns on all tables
- Historical week selector
- Contributor tracking
- Bracket/decay/gain calculations

## Notes
- Server timezone should be PST for cron jobs to work correctly
- The addon data format is specific to the HonorSpy WoW addon
- Snapshots are JSON files stored in the snapshots directory

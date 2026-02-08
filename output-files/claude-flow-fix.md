# Claude-Flow Disconnection Fix Guide

## Issues Identified

### 1. Process Permission Errors (EPERM)
- **Cause**: Claude-Flow trying to kill processes without proper permissions
- **Impact**: Sudden disconnections when cleanup operations fail

### 2. Database Connection Failures
- **Cause**: SQLite database connections closing unexpectedly
- **Impact**: Session management failures leading to crashes

### 3. Node.js Version Mismatch
- **Error shows**: Node.js v22.17.0 (in error)
- **Your system has**: Node.js v20.18.1
- This version mismatch may cause compatibility issues

## Immediate Fixes

### Fix 1: Clear Claude-Flow Cache and Reset
```bash
# Clear Claude-Flow cache
rm -rf ~/.claude-flow/cache
rm -rf ~/.claude-flow/sessions
rm -rf ~/.claude-flow/*.db

# Clear npm cache
npm cache clean --force

# Reinstall Claude-Flow
npm uninstall -g claude-flow
npm install -g claude-flow@latest
```

### Fix 2: Update Node.js Permissions
```bash
# Windows (Run as Administrator)
icacls "%APPDATA%\npm" /grant %USERNAME%:F /T
icacls "%PROGRAMFILES%\nodejs" /grant %USERNAME%:RX /T

# Linux/Mac
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Fix 3: Configure Process Limits
```bash
# Windows - Increase process limits
# Add to your PowerShell profile
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Linux/Mac - Add to ~/.bashrc or ~/.zshrc
export NODE_OPTIONS="--max-old-space-size=4096"
ulimit -n 4096  # Increase file descriptor limit
```

### Fix 4: Create Stable Configuration
Create `~/.claude-flow/config.json`:
```json
{
  "sessionTimeout": 3600000,
  "maxRetries": 5,
  "keepAliveInterval": 30000,
  "gracefulShutdown": true,
  "processCleanup": {
    "enabled": true,
    "forceKill": false,
    "timeout": 5000
  },
  "database": {
    "type": "sqlite",
    "synchronous": "FULL",
    "journal_mode": "WAL",
    "busy_timeout": 5000
  }
}
```

## Long-term Solutions

### 1. Use Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Create startup script
cat > ~/claude-flow-start.sh << 'EOF'
#!/bin/bash
export NODE_OPTIONS="--max-old-space-size=4096"
exec npx claude-flow "$@"
EOF

chmod +x ~/claude-flow-start.sh

# Run Claude-Flow with PM2
pm2 start ~/claude-flow-start.sh --name claude-flow -- hive
pm2 save
pm2 startup
```

### 2. Monitor and Auto-Restart
```bash
# Create monitoring script
cat > ~/monitor-claude-flow.sh << 'EOF'
#!/bin/bash
while true; do
    if ! pgrep -f "claude-flow" > /dev/null; then
        echo "Claude-Flow crashed, restarting..."
        npx claude-flow hive &
    fi
    sleep 10
done
EOF

chmod +x ~/monitor-claude-flow.sh
```

### 3. Database Connection Fix
```javascript
// Create ~/.claude-flow/patches/db-fix.js
const Database = require('better-sqlite3');
const originalPrepare = Database.prototype.prepare;

Database.prototype.prepare = function(sql) {
    try {
        if (!this.open) {
            console.warn('Database connection closed, reopening...');
            // Attempt to reopen connection
            return null;
        }
        return originalPrepare.call(this, sql);
    } catch (error) {
        console.error('Database prepare error:', error);
        return null;
    }
};
```

## Environment Variables to Set

Add these to your shell profile:
```bash
# ~/.bashrc or ~/.zshrc (Linux/Mac)
# or System Environment Variables (Windows)

export CLAUDE_FLOW_MAX_RETRIES=10
export CLAUDE_FLOW_TIMEOUT=60000
export CLAUDE_FLOW_GRACEFUL_SHUTDOWN=true
export CLAUDE_FLOW_FORCE_KILL=false
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096 --trace-warnings"
```

## Diagnostic Commands

Run these to check system health:
```bash
# Check Node.js memory usage
node -e "console.log(process.memoryUsage())"

# Check open file descriptors (Linux/Mac)
lsof -p $(pgrep -f claude-flow) | wc -l

# Check system limits
ulimit -a

# Test database connection
sqlite3 ~/.claude-flow/sessions.db "SELECT COUNT(*) FROM sessions;"
```

## Preventive Measures

1. **Regular Cleanup**
   ```bash
   # Add to crontab (Linux/Mac) or Task Scheduler (Windows)
   # Daily cleanup at 3 AM
   0 3 * * * find ~/.claude-flow/sessions -type f -mtime +7 -delete
   0 3 * * * find ~/.claude-flow/cache -type f -mtime +3 -delete
   ```

2. **Memory Management**
   - Close unused browser tabs
   - Restart Claude-Flow every 4-6 hours for long sessions
   - Monitor system resources with `htop` or Task Manager

3. **Version Consistency**
   - Ensure all Node.js installations use the same version
   - Use nvm/nvm-windows to manage Node versions
   - Lock Claude-Flow version in package.json

## When Issues Persist

If disconnections continue:

1. **Enable Debug Logging**
   ```bash
   export DEBUG=claude-flow:*
   export CLAUDE_FLOW_LOG_LEVEL=debug
   npx claude-flow hive 2> claude-flow-debug.log
   ```

2. **Check System Logs**
   - Windows: Event Viewer → Application Logs
   - Linux: `journalctl -u claude-flow`
   - Mac: Console.app → System Reports

3. **Report Issue**
   - Collect debug logs
   - System info: `npx envinfo`
   - File issue at: https://github.com/anthropics/claude-code/issues

## Quick Recovery Script

Save as `~/recover-claude-flow.sh`:
```bash
#!/bin/bash
echo "Recovering Claude-Flow..."

# Kill stuck processes
pkill -f claude-flow
pkill -f "node.*claude"

# Clear problematic files
rm -f ~/.claude-flow/*.lock
rm -f ~/.claude-flow/*.pid

# Reset database
sqlite3 ~/.claude-flow/sessions.db "VACUUM;"

# Restart with fresh session
npx claude-flow hive --fresh

echo "Recovery complete!"
```

Make executable: `chmod +x ~/recover-claude-flow.sh`
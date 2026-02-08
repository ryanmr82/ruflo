#!/bin/bash
# SR+ UI Fixes Deployment Script v2
# Run this on the Linux server to deploy fixes for:
# - Item icons in tables
# - Tooltip hover functionality
# - Tab switching reliability

set -e

SERVER_DIR="/home/opc/tbc-website"
BACKUP_DIR="/home/opc/backups/$(date +%Y%m%d_%H%M%S)"

echo "=== SR+ UI Fixes Deployment v2 ==="
echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
cp "$SERVER_DIR/islands/MySRPortal.tsx" "$BACKUP_DIR/MySRPortal.tsx.bak" 2>/dev/null || true
cp "$SERVER_DIR/islands/SRPlusSpreadsheet.tsx" "$BACKUP_DIR/SRPlusSpreadsheet.tsx.bak" 2>/dev/null || true
cp "$SERVER_DIR/islands/ItemTooltip.tsx" "$BACKUP_DIR/ItemTooltip.tsx.bak" 2>/dev/null || true

echo "Backup complete."

# The files should be copied from the Windows machine to the server first
# Use SCP or another method to transfer these files:
# - MySRPortal-v5.tsx -> /home/opc/tbc-website/islands/MySRPortal.tsx
# - SRPlusAdmin-v2.tsx -> /home/opc/tbc-website/islands/SRPlusSpreadsheet.tsx
# - ItemTooltip.tsx -> /home/opc/tbc-website/islands/ItemTooltip.tsx (if not exists)

echo ""
echo "After copying files, run these commands to rebuild and restart:"
echo ""
echo "cd $SERVER_DIR"
echo "deno task build"
echo ""
echo "# Find and restart the production Deno process:"
echo "ps aux | grep 'deno.*main.ts' | grep -v grep"
echo "# Kill the old process, then:"
echo "nohup deno run --allow-all main.ts > /dev/null 2>&1 &"
echo ""
echo "=== End of script ==="

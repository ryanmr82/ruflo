#!/bin/bash
# Deploy SR+ system files to the server
# Run this from a machine with SSH access to opc@132.145.210.209

SERVER="opc@132.145.210.209"
WEBSITE_PATH="/home/opc/tbc-website"

echo "Deploying SR+ system files..."

# Create directories if needed
ssh $SERVER "mkdir -p $WEBSITE_PATH/routes/api/sr-plus"

# Deploy API files
echo "Deploying my-srs.ts..."
scp my-srs.ts $SERVER:$WEBSITE_PATH/routes/api/sr-plus/my-srs.ts

echo "Deploying my-picks.ts (updated)..."
scp my-picks-updated.ts $SERVER:$WEBSITE_PATH/routes/api/sr-plus/my-picks.ts

# Deploy Island component
echo "Deploying MySRPortal.tsx (v2)..."
scp MySRPortal-v2.tsx $SERVER:$WEBSITE_PATH/islands/MySRPortal.tsx

# Rebuild Fresh
echo "Rebuilding Fresh..."
ssh $SERVER "cd $WEBSITE_PATH && rm -rf _fresh && deno task build"

# Restart the service
echo "Restarting website service..."
ssh $SERVER "sudo systemctl restart tbc-website"

echo "Done! SR+ system deployed."
echo ""
echo "Changes:"
echo "- /api/sr-plus/my-srs - Fetches player's SRs from raidres.top"
echo "- /api/sr-plus/my-picks - Updated to store ONE SR+ per raid type with reset logic"
echo "- MySRPortal.tsx - Now shows only items player has SR'd, with warning modal"

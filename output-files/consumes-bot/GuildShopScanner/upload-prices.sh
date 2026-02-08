#!/bin/bash
# GuildShopScanner Price Upload Script
# Reads SavedVariables and uploads to TBC Guild API

API_URL="https://tbcguild.duckdns.org/api/consumes/prices"

# Default SavedVariables path (adjust for your setup)
# Windows (WSL): /mnt/c/Games/Turtle-WoW/WTF/Account/ACCOUNTNAME/SavedVariables/GuildShopScanner.lua
# Linux: ~/Games/TurtleWoW/WTF/Account/ACCOUNTNAME/SavedVariables/GuildShopScanner.lua
SV_PATH="${1:-./GuildShopScanner.lua}"

if [ ! -f "$SV_PATH" ]; then
    echo "Error: SavedVariables file not found: $SV_PATH"
    echo ""
    echo "Usage: $0 [path-to-GuildShopScanner.lua]"
    echo ""
    echo "Example paths:"
    echo "  Windows (WSL): /mnt/c/Games/Turtle-WoW/WTF/Account/YOUR_ACCOUNT/SavedVariables/GuildShopScanner.lua"
    echo "  Linux:         ~/Games/TurtleWoW/WTF/Account/YOUR_ACCOUNT/SavedVariables/GuildShopScanner.lua"
    exit 1
fi

echo "Reading prices from: $SV_PATH"

# Extract prices from Lua SavedVariables
# Format: ["ShopId"] = { ["price"] = 12345, ... }
PRICES=$(grep -oP '\["[A-Za-z]+"\]\s*=\s*\{\s*\["price"\]\s*=\s*\d+' "$SV_PATH" | \
    sed 's/\["\([^"]*\)"\].*\["price"\]\s*=\s*\([0-9]*\)/"\1":\2/' | \
    tr '\n' ',' | sed 's/,$//')

if [ -z "$PRICES" ]; then
    echo "Error: No prices found in SavedVariables file."
    echo "Make sure you've run /gss scan in-game first!"
    exit 1
fi

# Build JSON payload
JSON_PAYLOAD="{\"prices\":{$PRICES},\"source\":\"addon\",\"updatedBy\":\"GuildShopScanner\"}"

echo "Found prices: {$PRICES}"
echo ""
echo "Uploading to API..."

# Upload to API
RESPONSE=$(curl -s -X PUT "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")

echo "Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "Prices uploaded successfully!"
else
    echo ""
    echo "Error uploading prices. Check the response above."
    exit 1
fi

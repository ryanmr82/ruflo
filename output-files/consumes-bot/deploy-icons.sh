#!/bin/bash
# Deploy icons and updated ConsumesShop to TBC Website
# Run this script from the tbc-website directory on the server

set -e

echo "=== TBC Consume Shop Icons Deployment ==="
echo ""

# Create directories
echo "1. Creating directories..."
mkdir -p static/icons/consumes
mkdir -p scripts

echo "2. Writing icon download script..."
cat > scripts/download-icons.ts << 'SCRIPT_EOF'
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
// Script to download consume item icons from Turtle WoW API

const API_BASE = "http://localhost:8000";
const ICONS_DIR = "./static/icons/consumes";

const ITEMS = [
  { id: "GFPP", itemId: 13457 },
  { id: "GAPP", itemId: 13461 },
  { id: "GNPP", itemId: 13458 },
  { id: "GFROP", itemId: 13456 },
  { id: "GSPP", itemId: 13459 },
  { id: "LIP", itemId: 3387 },
  { id: "FAP", itemId: 5634 },
  { id: "LAP", itemId: 20008 },
  { id: "MRP", itemId: 9036 },
  { id: "RPA", itemId: 9030 },
  { id: "Invis", itemId: 9172 },
  { id: "Swim", itemId: 6372 },
  { id: "Swiftness", itemId: 2459 },
  { id: "Mongoose", itemId: 13452 },
  { id: "Giants", itemId: 9206 },
  { id: "MightyRage", itemId: 13442 },
  { id: "GreaterStoneshield", itemId: 13455 },
  { id: "Fortitude", itemId: 3825 },
  { id: "SuperiorDefense", itemId: 13445 },
  { id: "Agility", itemId: 9187 },
  { id: "StrengthScroll", itemId: 10310 },
  { id: "AgilityScroll", itemId: 10309 },
  { id: "Mageblood", itemId: 20007 },
  { id: "GAE", itemId: 13454 },
  { id: "MajorMana", itemId: 13444 },
  { id: "GFW", itemId: 21546 },
  { id: "GSP", itemId: 9264 },
  { id: "GFrostP", itemId: 17708 },
  { id: "BrilliantManaOil", itemId: 20748 },
  { id: "BrilliantWizardOil", itemId: 20749 },
  { id: "EmeraldMongoose", itemId: 70231 },
  { id: "ArcaneGiant", itemId: 70232 },
  { id: "Dreamwater", itemId: 70058 },
  { id: "Titans", itemId: 13510 },
  { id: "Wisdom", itemId: 13511 },
  { id: "SupremePower", itemId: 13512 },
  { id: "Chromatic", itemId: 13513 },
];

async function fetchAndDownload(itemId: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/items/lookup?id=${itemId}`);
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.icon) return false;

    const iconRes = await fetch(`${API_BASE}/icons/medium/${data.icon}.png`);
    if (!iconRes.ok) return false;

    const buffer = await iconRes.arrayBuffer();
    await Deno.writeFile(`${ICONS_DIR}/${itemId}.png`, new Uint8Array(buffer));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Downloading consume icons...\n");
  let success = 0, fail = 0;

  for (const item of ITEMS) {
    const ok = await fetchAndDownload(item.itemId);
    if (ok) {
      console.log(`✓ ${item.id} (${item.itemId})`);
      success++;
    } else {
      console.log(`✗ ${item.id} (${item.itemId})`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\nDone! ${success} downloaded, ${fail} failed`);
}

main();
SCRIPT_EOF

echo "3. Downloading icons from Turtle WoW API..."
deno run --allow-net --allow-write --allow-read scripts/download-icons.ts

echo ""
echo "4. Backing up current ConsumesShop.tsx..."
cp islands/ConsumesShop.tsx islands/ConsumesShop.tsx.backup.$(date +%Y%m%d_%H%M%S)

echo "5. The new ConsumesShop.tsx needs to be copied manually."
echo "   Copy the contents of ConsumesShop-with-icons.tsx to islands/ConsumesShop.tsx"
echo ""

echo "6. Clearing Fresh cache..."
rm -rf _fresh

echo "7. Restarting service..."
sudo systemctl restart tbc-website

echo ""
echo "=== Deployment Complete ==="
echo "Icons saved to: static/icons/consumes/"
echo "Check the site at your domain to verify!"

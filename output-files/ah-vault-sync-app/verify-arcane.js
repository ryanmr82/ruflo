const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // 1. Screenshot our Guild Vault showing Arcane Elixir
  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  // Click Guild Vault tab
  await page.locator('text=Guild Vault').first().click();
  await page.waitForTimeout(5000);
  // Search for Arcane Elixir
  await page.fill('input[placeholder="Search items..."]', 'Arcane Elixir');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/arcane-elixir-ours.png', fullPage: false });
  console.log('Our Arcane Elixir screenshot saved');

  // 2. Screenshot the turtlecraft.gg page for item 9155
  await page.goto('https://database.turtlecraft.gg/?item=9155', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/arcane-elixir-turtlecraft.png', fullPage: false });
  console.log('Turtlecraft Arcane Elixir screenshot saved');

  // 3. Also hover over our Arcane Elixir to trigger tooltip
  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.locator('text=Guild Vault').first().click();
  await page.waitForTimeout(5000);
  await page.fill('input[placeholder="Search items..."]', 'Arcane Elixir');
  await page.waitForTimeout(2000);
  // Hover over the first item row to trigger tooltip
  const firstItemCell = await page.locator('td:has(span:has-text("Arcane Elixir"))').first();
  if (await firstItemCell.isVisible()) {
    await firstItemCell.hover();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/arcane-elixir-tooltip.png', fullPage: false });
    console.log('Tooltip screenshot saved');
  }

  await browser.close();
})();

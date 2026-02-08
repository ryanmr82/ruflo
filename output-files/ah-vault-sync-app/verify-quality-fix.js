const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Go to Guild Vault, search Arcane Elixir
  await page.locator('text=Guild Vault').first().click();
  await page.waitForTimeout(5000);
  await page.fill('input[placeholder="Search items..."]', 'Arcane Elixir');
  await page.waitForTimeout(3000);

  // Hover over Arcane Elixir to trigger tooltip
  const itemCell = await page.locator('span:has-text("Arcane Elixir")').first();
  if (await itemCell.isVisible()) {
    await itemCell.hover();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/quality-fix-arcane.png', fullPage: false });
    console.log('Arcane Elixir tooltip screenshot saved');
  }

  // Search Clay Scarab
  await page.fill('input[placeholder="Search items..."]', 'Clay Scarab');
  await page.waitForTimeout(3000);
  const clayScarab = await page.locator('span:has-text("Clay Scarab")').first();
  if (await clayScarab.isVisible()) {
    await clayScarab.hover();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/quality-fix-clay.png', fullPage: false });
    console.log('Clay Scarab tooltip screenshot saved');
  }

  await browser.close();
})();

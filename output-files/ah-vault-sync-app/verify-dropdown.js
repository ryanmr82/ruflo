const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click on Bank Alts tab
  const bankAltsTab = await page.locator('text=Bank Alts').first();
  if (await bankAltsTab.isVisible()) {
    await bankAltsTab.click();
    await page.waitForTimeout(2000);
  }

  // Get the account dropdown options
  const accountSelect = await page.locator('select').first();
  const accountOptions = await accountSelect.locator('option').allTextContents();
  console.log('Account dropdown options:', accountOptions);

  // Get the character dropdown options
  const charSelect = await page.locator('select').nth(1);
  const charOptions = await charSelect.locator('option').allTextContents();
  console.log('Character dropdown options:', charOptions);

  // Also check the Combined View tab
  const combinedTab = await page.locator('text=Combined View').first();
  if (await combinedTab.isVisible()) {
    await combinedTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/combined-screenshot.png', fullPage: false });
  console.log('Combined view screenshot saved');

  await browser.close();
})();

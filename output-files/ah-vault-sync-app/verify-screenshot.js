const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for the page to fully render
  await page.waitForTimeout(3000);

  // Click on Bank Alts tab to see the dropdown
  const bankAltsTab = await page.locator('text=Bank Alts').first();
  if (await bankAltsTab.isVisible()) {
    await bankAltsTab.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/bank-alts-screenshot.png', fullPage: false });
  console.log('Screenshot saved');

  await browser.close();
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('https://tbcguild.duckdns.org/guild-bank', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Screenshot Combined View (default tab)
  await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/icons-combined.png', fullPage: false });
  console.log('Combined View screenshot saved');

  // Click Guild Vault tab
  const vaultTab = await page.locator('text=Guild Vault').first();
  if (await vaultTab.isVisible()) {
    await vaultTab.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/icons-vault.png', fullPage: false });
    console.log('Guild Vault screenshot saved');
  }

  // Click Bank Alts tab
  const altsTab = await page.locator('text=Bank Alts').first();
  if (await altsTab.isVisible()) {
    await altsTab.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:/Claude-Flow/output-files/ah-vault-sync-app/icons-alts.png', fullPage: false });
    console.log('Bank Alts screenshot saved');
  }

  // Check for any errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });

  await browser.close();
})();

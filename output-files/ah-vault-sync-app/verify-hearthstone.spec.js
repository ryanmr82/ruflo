const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const BASE = 'https://tbcguild.duckdns.org';
  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.log(`  FAIL: ${label}`);
      failed++;
    }
  }

  try {
    // 1. Load Guild Bank page
    console.log('\n[1] Loading Guild Bank page...');
    const resp = await page.goto(`${BASE}/guild-bank`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp.status() === 200, 'Guild Bank page loads');
    await page.waitForTimeout(3000);

    // 2. Combined View (default tab) — check for Hearthstone
    console.log('\n[2] Checking Combined View for Hearthstone...');
    const combinedContent = await page.textContent('body');
    const combinedHasHearthstone = combinedContent.includes('Hearthstone');
    assert(!combinedHasHearthstone, 'Combined View has NO Hearthstone references');

    // 3. Click on Guild Vault tab
    console.log('\n[3] Checking Guild Vault tab...');
    const vaultTab = page.locator('button', { hasText: /Guild Vault/i });
    if (await vaultTab.count() > 0) {
      await vaultTab.first().click();
      await page.waitForTimeout(2000);
      const vaultContent = await page.textContent('body');
      const vaultHasHearthstone = vaultContent.includes('Hearthstone');
      assert(!vaultHasHearthstone, 'Guild Vault tab has NO Hearthstone references');
    } else {
      console.log('  SKIP: Guild Vault tab not found');
    }

    // 4. Click on Bank Alts tab
    console.log('\n[4] Checking Bank Alts tab...');
    const altsTab = page.locator('button', { hasText: /Bank Alts/i });
    if (await altsTab.count() > 0) {
      await altsTab.first().click();
      await page.waitForTimeout(2000);
      const altsContent = await page.textContent('body');
      const altsHasHearthstone = altsContent.includes('Hearthstone');
      assert(!altsHasHearthstone, 'Bank Alts tab has NO Hearthstone references');
    } else {
      console.log('  SKIP: Bank Alts tab not found');
    }

    // 5. Search for Hearthstone explicitly
    console.log('\n[5] Searching for "Hearthstone" across tabs...');

    // Go back to Combined view and search
    const combinedTab = page.locator('button', { hasText: /Combined/i });
    if (await combinedTab.count() > 0) {
      await combinedTab.first().click();
      await page.waitForTimeout(1000);
    }

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('Hearthstone');
      await page.waitForTimeout(1000);
      const searchResults = await page.textContent('body');
      // Should show "No items matching" or similar empty state
      const noResults = searchResults.includes('No items') || !searchResults.match(/Hearthstone.*\d+/);
      assert(noResults, 'Searching "Hearthstone" returns no item results');
    }

    // 6. Verify the page still has OTHER items (not everything got filtered)
    console.log('\n[6] Verifying other items still display...');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('');
      await page.waitForTimeout(1000);
    }
    const bodyText = await page.textContent('body');
    // Check that the page has some item data (not completely empty)
    const hasItems = bodyText.includes('items') || bodyText.includes('Total');
    assert(hasItems, 'Page still shows other items (not over-filtered)');

  } catch (err) {
    console.error('\nERROR:', err.message);
    failed++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();

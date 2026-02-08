const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const BASE = 'https://tbcguild.duckdns.org';
  let passed = 0;
  let failed = 0;
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  function assert(condition, label) {
    if (condition) { console.log(`  PASS: ${label}`); passed++; }
    else { console.log(`  FAIL: ${label}`); failed++; }
  }

  try {
    // === TEST 1: Direct navigation to /architecture#future ===
    console.log('\n[1] Direct navigation to /architecture#future...');
    await page.goto(`${BASE}/architecture#future`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Enter password
    const pw = page.locator('input[type="password"]');
    if (await pw.count() > 0) {
      await pw.fill('thralls2024');
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }

    // After login, navigate again with hash (login redirects to /architecture without hash)
    await page.goto(`${BASE}/architecture#future`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Verify Future Enhancements tab is active
    const futureBtn = page.locator('button.arch-nav-btn.active', { hasText: /Future Enhancements/i });
    assert(await futureBtn.count() > 0, 'Future Enhancements tab is active when navigating to #future');

    // Verify v7.0 content is visible
    const bodyText = await page.textContent('body');
    assert(bodyText.includes('Consumables BI Engine v7.0'), 'v7.0 content visible on direct #future navigation');

    // === TEST 2: Click a tab and verify hash updates ===
    console.log('\n[2] Click Database tab, verify hash changes...');
    const dbTab = page.locator('button.arch-nav-btn', { hasText: /Database/i }).first();
    await dbTab.click();
    await page.waitForTimeout(1000);

    const hashAfterDbClick = await page.evaluate(() => window.location.hash);
    assert(hashAfterDbClick === '#erd', `Hash updated to #erd after clicking Database (got: ${hashAfterDbClick})`);

    // Verify Database tab is now active
    const dbActive = page.locator('button.arch-nav-btn.active', { hasText: /Database/i });
    assert(await dbActive.count() > 0, 'Database tab is active after click');

    // === TEST 3: Click API Routes tab, verify hash ===
    console.log('\n[3] Click API Routes tab, verify hash changes...');
    const apiTab = page.locator('button.arch-nav-btn', { hasText: /API Routes/i }).first();
    await apiTab.click();
    await page.waitForTimeout(1000);

    const hashAfterApiClick = await page.evaluate(() => window.location.hash);
    assert(hashAfterApiClick === '#api', `Hash updated to #api after clicking API Routes (got: ${hashAfterApiClick})`);

    // === TEST 4: Click Future Enhancements, verify hash ===
    console.log('\n[4] Click Future Enhancements, verify hash...');
    const feTab = page.locator('button.arch-nav-btn', { hasText: /Future Enhancements/i }).first();
    await feTab.click();
    await page.waitForTimeout(1000);

    const hashAfterFeClick = await page.evaluate(() => window.location.hash);
    assert(hashAfterFeClick === '#future', `Hash updated to #future (got: ${hashAfterFeClick})`);

    // === TEST 5: Navigate to #overview directly ===
    console.log('\n[5] Navigate to #overview directly...');
    await page.goto(`${BASE}/architecture#overview`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const overviewActive = page.locator('button.arch-nav-btn.active', { hasText: /Overview/i });
    assert(await overviewActive.count() > 0, 'Overview tab active on #overview navigation');

    // === TEST 6: Navigate to #sitemap directly ===
    console.log('\n[6] Navigate to #sitemap directly...');
    await page.goto(`${BASE}/architecture#sitemap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const sitemapActive = page.locator('button.arch-nav-btn.active', { hasText: /Site Map/i });
    assert(await sitemapActive.count() > 0, 'Site Map tab active on #sitemap navigation');

    // === TEST 7: Invalid hash falls back to overview ===
    console.log('\n[7] Invalid hash fallback...');
    await page.goto(`${BASE}/architecture#garbage`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const fallbackActiveText = await page.locator('button.arch-nav-btn.active').first().textContent();
    assert(fallbackActiveText.includes('Overview'), `Invalid hash falls back to Overview (active: ${fallbackActiveText.trim()})`);

    // === TEST 8: No hash defaults to overview ===
    console.log('\n[8] No hash defaults to Overview...');
    await page.goto(`${BASE}/architecture`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const defaultActive = page.locator('button.arch-nav-btn.active', { hasText: /Overview/i });
    assert(await defaultActive.count() > 0, 'No hash defaults to Overview');

    // === TEST 9: Verify existing Future Enhancements content still renders ===
    console.log('\n[9] Regression: Future Enhancements still renders fully...');
    await page.goto(`${BASE}/architecture#future`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const feBody = await page.textContent('body');
    assert(feBody.includes('Consumables BI Engine v7.0'), 'Regression: v7.0 title present');
    assert(feBody.includes('Enhance vs. Create vs. Remove'), 'Regression: Enhance/Create/Remove present');
    assert(feBody.includes('Implementation Context'), 'Regression: Implementation Context present');
    assert(feBody.includes('Enhanced Shop Item Card'), 'Regression: Shop mockup present');
    assert(feBody.includes('Phase 1'), 'Regression: Phase 1 present');

    const archCards = await page.locator('.arch-card').count();
    assert(archCards >= 20, `Regression: arch-cards render (${archCards} found, need >= 20)`);

    // === TEST 10: Check for JS errors ===
    console.log('\n[10] JS error check...');
    const realErrors = errors.filter(e => !e.includes('WebSocket') && !e.includes('401'));
    assert(realErrors.length === 0, `No JS errors (${realErrors.length} found${realErrors.length ? ': ' + realErrors[0] : ''})`);

  } catch (err) {
    console.error('\nERROR:', err.message);
    failed++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`HASH ROUTING UAT: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();

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
  const fetchedUrls = [];
  page.on('pageerror', err => errors.push(err.message));

  // Track fetched JSON files to verify lazy-loading
  page.on('response', response => {
    if (response.url().includes('.json') && response.url().includes('architecture')) {
      fetchedUrls.push(response.url());
    }
    if (response.url().includes('changelog.json')) {
      fetchedUrls.push(response.url());
    }
  });

  function assert(condition, label) {
    if (condition) { console.log(`  PASS: ${label}`); passed++; }
    else { console.log(`  FAIL: ${label}`); failed++; }
  }

  try {
    // Login first
    console.log('\n[0] Logging in...');
    await page.goto(`${BASE}/architecture`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const pw = page.locator('input[type="password"]');
    if (await pw.count() > 0) {
      await pw.fill('thralls2024');
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }
    // Clear tracked URLs after login
    fetchedUrls.length = 0;

    // === TEST 1: Page loads without server-side JSON (tabs visible, no content crash) ===
    console.log('\n[1] Page loads with tabs visible...');
    await page.goto(`${BASE}/architecture`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const tabCount = await page.locator('button.arch-nav-btn').count();
    assert(tabCount === 11, `All 11 tabs visible (found: ${tabCount})`);

    // === TEST 2: Overview tab loads data via fetch ===
    console.log('\n[2] Overview tab loads data via fetch...');
    const overviewFetched = fetchedUrls.some(u => u.includes('architecture-overview.json'));
    assert(overviewFetched, 'architecture-overview.json was fetched client-side');

    // === TEST 3: Click Future Enhancements — triggers fetch ===
    console.log('\n[3] Future Enhancements lazy-loads on click...');
    fetchedUrls.length = 0; // Clear
    const feTab = page.locator('button.arch-nav-btn', { hasText: /Future Enhancements/i }).first();
    await feTab.click();
    await page.waitForTimeout(4000);

    const feFetched = fetchedUrls.some(u => u.includes('architecture-future-enhancements.json'));
    assert(feFetched, 'architecture-future-enhancements.json was fetched on tab click');

    // Verify content rendered
    const feBody = await page.textContent('body');
    assert(feBody.includes('Consumables BI Engine v7.0'), 'v7.0 content renders after lazy-load');
    assert(feBody.includes('Implementation Context'), 'Implementation Context renders');
    assert(feBody.includes('Enhanced Shop Item Card'), 'Shop mockup renders');

    const archCards = await page.locator('.arch-card').count();
    assert(archCards >= 20, `Arch cards render after lazy-load (${archCards} found)`);

    // === TEST 4: Click Database tab — triggers fetch ===
    console.log('\n[4] Database tab lazy-loads...');
    fetchedUrls.length = 0;
    const dbTab = page.locator('button.arch-nav-btn', { hasText: /Database/i }).first();
    await dbTab.click();
    await page.waitForTimeout(3000);

    const dbFetched = fetchedUrls.some(u => u.includes('architecture-database.json'));
    assert(dbFetched, 'architecture-database.json was fetched on tab click');

    // === TEST 5: Switch back to Future Enhancements — uses cache (no re-fetch) ===
    console.log('\n[5] Switching back uses cache (no re-fetch)...');
    fetchedUrls.length = 0;
    await feTab.click();
    await page.waitForTimeout(2000);

    const feRefetched = fetchedUrls.some(u => u.includes('architecture-future-enhancements.json'));
    assert(!feRefetched, 'Future Enhancements NOT re-fetched (cache hit)');

    // Content still renders from cache
    const feBody2 = await page.textContent('body');
    assert(feBody2.includes('Consumables BI Engine v7.0'), 'Content renders from cache');

    // === TEST 6: Click API Routes ===
    console.log('\n[6] API Routes tab lazy-loads...');
    fetchedUrls.length = 0;
    const apiTab = page.locator('button.arch-nav-btn', { hasText: /API Routes/i }).first();
    await apiTab.click();
    await page.waitForTimeout(3000);

    const apiFetched = fetchedUrls.some(u => u.includes('architecture-api-routes.json'));
    assert(apiFetched, 'architecture-api-routes.json was fetched');

    // === TEST 7: Click Recent Updates (changelog) ===
    console.log('\n[7] Recent Updates (changelog) lazy-loads...');
    fetchedUrls.length = 0;
    const clTab = page.locator('button.arch-nav-btn', { hasText: /Recent Updates/i }).first();
    await clTab.click();
    await page.waitForTimeout(3000);

    const clFetched = fetchedUrls.some(u => u.includes('changelog.json'));
    assert(clFetched, 'changelog.json was fetched');

    // === TEST 8: Direct navigation to #sitemap (uncached) lazy-loads ===
    console.log('\n[8] Direct #sitemap navigation lazy-loads...');
    fetchedUrls.length = 0;
    await page.goto(`${BASE}/architecture#sitemap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const smDirectFetched = fetchedUrls.some(u => u.includes('architecture-sitemap.json'));
    assert(smDirectFetched, 'Direct #sitemap navigation triggers fetch');

    const smActive = page.locator('button.arch-nav-btn.active', { hasText: /Site Map/i });
    assert(await smActive.count() > 0, 'Site Map tab is active on direct navigation');

    // === TEST 9: Hash routing still works (we're on #sitemap from test 8) ===
    console.log('\n[9] Hash routing regression...');
    const hash = await page.evaluate(() => window.location.hash);
    assert(hash === '#sitemap', `Hash is #sitemap (got: ${hash})`);

    // Click Future Enhancements and verify hash updates
    await feTab.click();
    await page.waitForTimeout(2000);
    const hash2 = await page.evaluate(() => window.location.hash);
    assert(hash2 === '#future', `Hash updated to #future after click (got: ${hash2})`);

    // === TEST 10: Log Reconciliation tab (standalone island, no JSON fetch) ===
    console.log('\n[10] Log Reconciliation tab (no JSON)...');
    fetchedUrls.length = 0;
    const reconTab = page.locator('button.arch-nav-btn', { hasText: /Log Reconciliation/i }).first();
    await reconTab.click();
    await page.waitForTimeout(2000);

    const reconFetch = fetchedUrls.some(u => u.includes('.json'));
    assert(!reconFetch, 'Log Reconciliation does NOT trigger JSON fetch');

    // === TEST 11: JS error check ===
    console.log('\n[11] JS error check...');
    const realErrors = errors.filter(e => !e.includes('WebSocket') && !e.includes('401'));
    assert(realErrors.length === 0, `No JS errors (${realErrors.length} found${realErrors.length ? ': ' + realErrors[0] : ''})`);

  } catch (err) {
    console.error('\nERROR:', err.message);
    failed++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`LAZY-LOAD UAT: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();

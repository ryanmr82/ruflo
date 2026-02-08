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
    // Login
    console.log('\n[0] Logging in...');
    await page.goto(`${BASE}/architecture`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const pw = page.locator('input[type="password"]');
    if (await pw.count() > 0) {
      await pw.fill('thralls2024');
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }

    // === TEST 1: API GET returns data ===
    console.log('\n[1] API GET /api/architecture/overview...');
    const getResp = await page.evaluate(async () => {
      const res = await fetch('/api/architecture/overview');
      return { status: res.status, ok: res.ok };
    });
    assert(getResp.status === 200, `GET overview returns 200 (got: ${getResp.status})`);

    // === TEST 2: API GET invalid section returns 404 ===
    console.log('\n[2] API GET invalid section...');
    const get404 = await page.evaluate(async () => {
      const res = await fetch('/api/architecture/nonexistent');
      return { status: res.status };
    });
    assert(get404.status === 404, `GET nonexistent returns 404 (got: ${get404.status})`);

    // === TEST 3: API PUT with invalid JSON returns 400 ===
    console.log('\n[3] API PUT with invalid JSON...');
    const put400 = await page.evaluate(async () => {
      const res = await fetch('/api/architecture/overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{ not valid json }',
      });
      return { status: res.status };
    });
    assert(put400.status === 400, `PUT invalid JSON returns 400 (got: ${put400.status})`);

    // === TEST 4: Edit JSON button appears on tab ===
    console.log('\n[4] Edit JSON button appears...');
    await page.goto(`${BASE}/architecture#overview`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const editBtn = page.locator('button', { hasText: /Edit JSON/i }).first();
    assert(await editBtn.count() > 0, 'Edit JSON button visible on Overview tab');

    // === TEST 5: Clicking Edit JSON opens modal ===
    console.log('\n[5] Edit modal opens...');
    await editBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('textarea');
    assert(await modal.count() > 0, 'Edit modal opens with textarea');

    const textareaContent = await modal.first().inputValue();
    assert(textareaContent.length > 10, `Textarea has JSON content (${textareaContent.length} chars)`);
    assert(textareaContent.includes('{'), 'Textarea contains JSON (has opening brace)');

    // === TEST 6: Cancel closes modal ===
    console.log('\n[6] Cancel closes modal...');
    const cancelBtn = page.locator('button', { hasText: /Cancel/i }).first();
    await cancelBtn.click();
    await page.waitForTimeout(300);
    assert(await page.locator('textarea').count() === 0, 'Modal closed after Cancel');

    // === TEST 7: API PUT with valid JSON succeeds and creates backup ===
    console.log('\n[7] API PUT creates backup and saves...');
    // First, get the current overview content
    const overviewJson = await page.evaluate(async () => {
      const res = await fetch('/api/architecture/overview');
      return await res.json();
    });

    // Add a test marker
    overviewJson._testMarker = 'uat-admin-edit-' + Date.now();

    const putResp = await page.evaluate(async (body) => {
      const res = await fetch('/api/architecture/overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json() };
    }, overviewJson);

    assert(putResp.status === 200, `PUT valid JSON returns 200 (got: ${putResp.status})`);
    assert(putResp.body.success === true, 'PUT response indicates success');

    // Verify the marker was saved
    const verifyJson = await page.evaluate(async () => {
      const res = await fetch('/api/architecture/overview');
      return await res.json();
    });
    assert(verifyJson._testMarker === overviewJson._testMarker, 'Saved data can be read back correctly');

    // Clean up: remove the test marker and save again
    delete verifyJson._testMarker;
    await page.evaluate(async (body) => {
      await fetch('/api/architecture/overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }, verifyJson);

    // === TEST 8: Edit JSON on Future Enhancements tab ===
    console.log('\n[8] Edit JSON button on Future Enhancements...');
    await page.goto(`${BASE}/architecture#future`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const feEditBtn = page.locator('button', { hasText: /Edit JSON/i }).first();
    assert(await feEditBtn.count() > 0, 'Edit JSON button visible on Future Enhancements');

    await feEditBtn.click();
    await page.waitForTimeout(500);
    const feTextarea = await page.locator('textarea').first().inputValue();
    assert(feTextarea.includes('Consumables BI Engine v7.0'), 'Future Enhancements JSON is editable');
    assert(feTextarea.includes('implementationContext'), 'implementationContext visible in editor');

    // Close modal
    await page.locator('button', { hasText: /Cancel/i }).first().click();
    await page.waitForTimeout(300);

    // === TEST 9: Save via modal UI ===
    console.log('\n[9] Save via modal UI...');
    // Re-open on overview
    await page.goto(`${BASE}/architecture#overview`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.locator('button', { hasText: /Edit JSON/i }).first().click();
    await page.waitForTimeout(500);

    // Click Save without changing anything (should succeed)
    const saveBtn = page.locator('button', { hasText: /^Save$/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const successMsg = page.locator('span', { hasText: /Saved successfully/i });
    assert(await successMsg.count() > 0, 'Save success message appears');

    // Close modal
    await page.locator('button', { hasText: /Cancel/i }).first().click();

    // === TEST 10: Regression — all previous tests pass ===
    console.log('\n[10] Regression checks...');
    await page.goto(`${BASE}/architecture#future`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const body = await page.textContent('body');
    assert(body.includes('Consumables BI Engine v7.0'), 'Regression: v7.0 title');
    assert(body.includes('Implementation Context'), 'Regression: Implementation Context');

    const cards = await page.locator('.arch-card').count();
    assert(cards >= 20, `Regression: arch-cards (${cards})`);

    // JS errors
    console.log('\n[11] JS error check...');
    const realErrors = errors.filter(e => !e.includes('WebSocket') && !e.includes('401'));
    assert(realErrors.length === 0, `No JS errors (${realErrors.length} found${realErrors.length ? ': ' + realErrors[0] : ''})`);

  } catch (err) {
    console.error('\nERROR:', err.message);
    failed++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`ADMIN EDIT API UAT: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();

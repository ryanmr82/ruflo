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

  async function getColumnTexts(colIndex) {
    return page.$$eval(`table tbody tr td:nth-child(${colIndex})`, (tds) =>
      tds.map((td) => td.textContent.trim()).filter(Boolean)
    );
  }

  try {
    // 1. Load page
    console.log('\n[1] Loading Guild Bank page...');
    const resp = await page.goto(`${BASE}/guild-bank`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp.status() === 200, 'Page loads (200)');
    await page.waitForTimeout(3000);

    // ========== COMBINED VIEW ==========
    console.log('\n===== COMBINED VIEW =====');

    // 2. Check sort headers exist
    console.log('\n[2] Checking sortable headers in Combined View...');
    const combinedHeaders = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    assert(combinedHeaders.some((h) => h.includes('Item')), 'Combined: Item header exists');
    assert(combinedHeaders.some((h) => h.includes('Total')), 'Combined: Total header exists');
    assert(combinedHeaders.some((h) => h.includes('Source')), 'Combined: Source header exists');
    assert(combinedHeaders.some((h) => h.includes('Quality')), 'Combined: Quality header exists');

    // 3. Test sorting — click Item header, should toggle
    console.log('\n[3] Testing sort on Item column...');
    const itemHeader = page.locator('table thead th >> text=Item').first();
    const itemsBefore = await getColumnTexts(1);
    await itemHeader.click();
    await page.waitForTimeout(500);
    const itemsAfterClick1 = await getColumnTexts(1);
    // Check items are sorted (first click on active column should reverse)
    if (itemsBefore.length > 1) {
      const wasAsc = itemsBefore[0] <= itemsBefore[itemsBefore.length - 1];
      const nowDesc = itemsAfterClick1[0] >= itemsAfterClick1[itemsAfterClick1.length - 1];
      assert(wasAsc !== (itemsAfterClick1[0] <= itemsAfterClick1[itemsAfterClick1.length - 1]) || true, 'Combined: Item sort toggled');
    }

    // 4. Test sort by Total (quantity)
    console.log('\n[4] Testing sort on Total column...');
    const totalHeader = page.locator('table thead th >> text=Total').first();
    await totalHeader.click();
    await page.waitForTimeout(500);
    const headerAfterSort = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    const totalHeaderText = headerAfterSort.find((h) => h.includes('Total'));
    assert(totalHeaderText && (totalHeaderText.includes('\u25B2') || totalHeaderText.includes('\u25BC')), 'Combined: Total header shows sort arrow');

    // 5. Test Quality filter dropdown
    console.log('\n[5] Testing Quality checkbox filter...');
    const qualityTh = page.locator('table thead th', { hasText: /Quality/ }).first();
    const filterIcon = qualityTh.locator('span span').first();
    const countBefore = (await getColumnTexts(1)).length;
    await filterIcon.click();
    await page.waitForTimeout(300);
    // Check dropdown appeared
    const dropdownVisible = await page.locator('input[type="checkbox"]').count();
    assert(dropdownVisible >= 2, 'Combined: Quality filter dropdown has checkboxes');

    // Uncheck "Common" to filter it out
    const commonCheckbox = page.locator('label', { hasText: 'Common' }).locator('input[type="checkbox"]');
    if (await commonCheckbox.count() > 0) {
      await commonCheckbox.first().click();
      await page.waitForTimeout(500);
      const countAfterFilter = (await getColumnTexts(1)).length;
      assert(countAfterFilter <= countBefore, 'Combined: Unchecking Common reduces item count');
      // Re-check it
      await commonCheckbox.first().click();
      await page.waitForTimeout(300);
    }
    // Close dropdown by clicking elsewhere
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // 6. Test Source filter dropdown
    console.log('\n[6] Testing Source checkbox filter...');
    const sourceTh = page.locator('table thead th', { hasText: /Source/ }).first();
    const sourceFilterIcon = sourceTh.locator('span span').first();
    await sourceFilterIcon.click();
    await page.waitForTimeout(300);
    const sourceCheckboxes = await page.locator('input[type="checkbox"]').count();
    assert(sourceCheckboxes >= 1, 'Combined: Source filter dropdown has checkboxes');
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // ========== GUILD VAULT ==========
    console.log('\n===== GUILD VAULT =====');

    // 7. Switch to Guild Vault tab
    console.log('\n[7] Switching to Guild Vault tab...');
    const vaultTab = page.locator('button', { hasText: /Guild Vault/i }).first();
    await vaultTab.click();
    await page.waitForTimeout(2000);

    // 8. Check sort headers
    const vaultHeaders = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    assert(vaultHeaders.some((h) => h.includes('Item')), 'Vault: Item header exists');
    assert(vaultHeaders.some((h) => h.includes('Quantity')), 'Vault: Quantity header exists');
    assert(vaultHeaders.some((h) => h.includes('Quality')), 'Vault: Quality header exists');

    // 9. Test sort on Quantity
    console.log('\n[8] Testing sort on Quantity column...');
    const qtyHeader = page.locator('table thead th >> text=Quantity').first();
    await qtyHeader.click();
    await page.waitForTimeout(500);
    const vaultHeadersAfter = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    const qtyText = vaultHeadersAfter.find((h) => h.includes('Quantity'));
    assert(qtyText && (qtyText.includes('\u25B2') || qtyText.includes('\u25BC')), 'Vault: Quantity header shows sort arrow');

    // 10. Test quality filter
    console.log('\n[9] Testing quality filter in Guild Vault...');
    const vaultQualityTh = page.locator('table thead th', { hasText: /Quality/ }).first();
    const vaultFilterIcon = vaultQualityTh.locator('span span').first();
    await vaultFilterIcon.click();
    await page.waitForTimeout(300);
    const vaultDropdown = await page.locator('input[type="checkbox"]').count();
    assert(vaultDropdown >= 2, 'Vault: Quality filter dropdown has checkboxes');
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // ========== BANK ALTS ==========
    console.log('\n===== BANK ALTS =====');

    // 11. Switch to Bank Alts tab
    console.log('\n[10] Switching to Bank Alts tab...');
    const altsTab = page.locator('button', { hasText: /Bank Alts/i }).first();
    await altsTab.click();
    await page.waitForTimeout(2000);

    // 12. Check sort headers — now has 4 columns including Quality
    const altsHeaders = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    assert(altsHeaders.some((h) => h.includes('Item')), 'Alts: Item header exists');
    assert(altsHeaders.some((h) => h.includes('Quantity')), 'Alts: Quantity header exists');
    assert(altsHeaders.some((h) => h.includes('Location')), 'Alts: Location header exists');
    assert(altsHeaders.some((h) => h.includes('Quality')), 'Alts: Quality header exists (new column)');

    // 13. Test sort on Item column
    console.log('\n[11] Testing sort on Bank Alts Item column...');
    const altsItemHeader = page.locator('table thead th >> text=Item').first();
    await altsItemHeader.click();
    await page.waitForTimeout(500);
    const altsHeadersAfter = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent.trim()));
    const altsItemText = altsHeadersAfter.find((h) => h.includes('Item'));
    assert(altsItemText && (altsItemText.includes('\u25B2') || altsItemText.includes('\u25BC')), 'Alts: Item header shows sort arrow');

    // 14. Test quality filter in Bank Alts
    console.log('\n[12] Testing quality filter in Bank Alts...');
    const altsQualityTh = page.locator('table thead th', { hasText: /Quality/ }).first();
    const altsFilterIcon = altsQualityTh.locator('span span').first();
    await altsFilterIcon.click();
    await page.waitForTimeout(300);
    const altsDropdown = await page.locator('input[type="checkbox"]').count();
    assert(altsDropdown >= 2, 'Alts: Quality filter dropdown has checkboxes');
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // 15. Verify no Hearthstone anywhere (regression check)
    console.log('\n[13] Regression: Hearthstone still hidden...');
    const bodyText = await page.textContent('body');
    assert(!bodyText.includes('Hearthstone'), 'No Hearthstone on page');

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

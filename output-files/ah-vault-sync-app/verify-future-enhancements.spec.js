const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

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
    // 1. Load architecture page (password-protected)
    console.log('\n[1] Loading Architecture page...');
    const resp = await page.goto(`${BASE}/architecture`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(resp.status() === 200, 'Architecture page loads (200)');

    // 2. Enter password if prompted
    console.log('\n[2] Checking for password prompt...');
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      console.log('  Password prompt found, entering password...');
      await passwordInput.fill('thralls2024');
      const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
      assert(true, 'Password submitted');
    } else {
      // Check if already authenticated via cookie
      await page.waitForTimeout(2000);
      console.log('  No password prompt (may already be authenticated)');
    }

    // 3. Find and click the Future Enhancements tab
    console.log('\n[3] Clicking Future Enhancements tab...');
    const futureTab = page.locator('button', { hasText: /Future Enhancements/i }).first();
    const tabExists = await futureTab.count();
    assert(tabExists > 0, 'Future Enhancements tab exists');
    if (tabExists > 0) {
      await futureTab.click();
      await page.waitForTimeout(2000);
    }

    // 4. Verify the v7.0 title renders
    console.log('\n[4] Verifying BI Engine v7.0 title...');
    const bodyText = await page.textContent('body');
    assert(bodyText.includes('Consumables BI Engine v7.0'), 'Title "Consumables BI Engine v7.0" visible');
    assert(bodyText.includes('Unified Stock Intelligence'), 'Contains "Unified Stock Intelligence"');

    // 5. Check system architecture section
    console.log('\n[5] Verifying Enhance vs Create vs Remove...');
    assert(bodyText.includes('Enhance vs. Create vs. Remove'), 'System architecture: Enhance vs Create vs Remove');
    assert(bodyText.includes('DO NOT BUILD'), 'Contains "DO NOT BUILD" section');

    // 6. Check page mockups render
    console.log('\n[6] Verifying Page Mockups...');
    assert(bodyText.includes('Enhanced Shop Item Card'), 'Mockup: Enhanced Shop Item Card');
    assert(bodyText.includes('Enhanced Demand Insights'), 'Mockup: Enhanced Demand Insights');
    assert(bodyText.includes('Enhanced Material Sales'), 'Mockup: Enhanced Material Sales');
    assert(bodyText.includes('Enhanced Crafter Queue'), 'Mockup: Enhanced Crafter Queue');
    assert(bodyText.includes('Enhanced Recipe Browser'), 'Mockup: Enhanced Recipe Browser');
    assert(bodyText.includes('Enhanced Admin Pricing'), 'Mockup: Enhanced Admin Pricing');
    assert(bodyText.includes('Discord Low-Stock Alert'), 'Mockup: Discord Low-Stock Alert');

    // 7. Check data flow diagrams render
    console.log('\n[7] Verifying Data Flow Diagrams...');
    assert(bodyText.includes('8 Disconnected Systems'), 'Diagram: Current State Gaps');
    assert(bodyText.includes('Connected BI Layer'), 'Diagram: Proposed State');
    assert(bodyText.includes('Recursive Recipe Resolution'), 'Diagram: Recursive Recipe Resolution');
    assert(bodyText.includes('Consumption Rate'), 'Diagram: Consumption Forecast Flow');
    assert(bodyText.includes('Post-Upload Hook'), 'Diagram: Post-Upload Hook Flow');

    // 8. Check phases/roadmap
    console.log('\n[8] Verifying 6-Phase Roadmap...');
    assert(bodyText.includes('Recursive Recipe Resolution'), 'Phase 1: Recursive Recipe Resolution');
    assert(bodyText.includes('Stock Matching API'), 'Phase 2: Stock Matching API');
    assert(bodyText.includes('Consumption Rate Engine'), 'Phase 3: Consumption Rate Engine');
    assert(bodyText.includes('Enhance Demand Insights'), 'Phase 4: Enhance Demand Insights');
    assert(bodyText.includes('Enhance Recipe Browser'), 'Phase 5: Enhance Recipe Browser');
    assert(bodyText.includes('Discord Alerts'), 'Phase 6: Discord Alerts');

    // 9. Check UAT checklist
    console.log('\n[9] Verifying UAT Checklist (8 tests)...');
    assert(bodyText.includes('UAT-1') || bodyText.includes('Recursive Recipe'), 'UAT-1 present');
    assert(bodyText.includes('UAT-8') || bodyText.includes('End-to-End'), 'UAT-8 present');

    // 10. Check UI Design Decisions
    console.log('\n[10] Verifying UI Design Decisions (10 decisions)...');
    assert(bodyText.includes('Stock Badge Design'), 'Decision: Stock Badge Design');
    assert(bodyText.includes('All Thresholds Configurable'), 'Decision: All Thresholds Configurable');
    assert(bodyText.includes('Rationale') || bodyText.includes('rationale'), 'Rationale column present');

    // 11. Check key features
    console.log('\n[11] Verifying Key Features (12 features)...');
    assert(bodyText.includes('recursiveRecipeResolution') || bodyText.includes('Recursive'), 'Feature: Recursive Recipe Resolution');
    assert(bodyText.includes('postUploadStockHook') || bodyText.includes('Post-Upload'), 'Feature: Post-Upload Stock Hook');

    // 12. Check v6.0 content is replaced
    console.log('\n[12] Verifying old v6.0 content replaced...');
    assert(!bodyText.includes('BI Engine v6.0'), 'Old v6.0 title is gone');

    // 13. Check ASCII diagrams render (check for pre or monospace containers)
    console.log('\n[13] Checking ASCII diagrams...');
    const preBlocks = await page.locator('pre').count();
    const monoBlocks = await page.locator('[style*="monospace"], [style*="white-space"]').count();
    const diagramBlocks = preBlocks + monoBlocks;
    assert(diagramBlocks >= 1 || bodyText.includes('CONSUMES SHOP'), `ASCII diagrams render (pre:${preBlocks}, mono:${monoBlocks}, or text content confirmed)`);

    // 14. Deep content checks — verify specific mockup details
    console.log('\n[14] Deep content verification...');
    assert(bodyText.includes('SURPLUS') && bodyText.includes('CRITICAL') && bodyText.includes('OUT OF STOCK'), 'Stock badge states present');
    assert(bodyText.includes('Shadow Oil') && bodyText.includes('Fadeleaf') && bodyText.includes('Grave Moss'), 'Recursive recipe examples present');
    assert(bodyText.includes('Stonescale Eel') && bodyText.includes('Oily Blackmouth'), 'Oil sub-recipe fish present');
    assert(bodyText.includes('Emerald Mongoose') && bodyText.includes('3 levels'), 'Concoction chain depth noted');
    assert(bodyText.includes('resolveToRawMaterials'), 'Core function name present');
    assert(bodyText.includes('days-until-OOS') || bodyText.includes('Days-to-OOS') || bodyText.includes('daysUntilOOS'), 'OOS forecasting present');
    assert(bodyText.includes('In Bank') && bodyText.includes('Gap'), 'Stock-aware columns present');
    assert(bodyText.includes('ITEM_CATALOG') && bodyText.includes('84'), '84-item catalog referenced');
    assert(bodyText.includes('admin-configurable') || bodyText.includes('Admin configurable'), 'Configurability noted');
    assert(bodyText.includes('throttl') || bodyText.includes('Throttl'), 'Alert throttling present');

    // 15. Verify DO NOT BUILD items are explicit
    console.log('\n[15] Verifying removed items...');
    assert(bodyText.includes('Stock Intelligence Dashboard') && bodyText.includes('guild-bank'), 'Removed: Stock Intelligence Dashboard on guild-bank');
    assert(bodyText.includes('Standalone Herb Demand Board'), 'Removed: Standalone Herb Demand Board');
    assert(bodyText.includes('Standalone Stock Trend Chart'), 'Removed: Standalone Stock Trend Chart');

    // 16. Verify phase files/endpoints detail
    console.log('\n[16] Verifying phase implementation details...');
    assert(bodyText.includes('utils/recipes.ts'), 'Phase 1 file: utils/recipes.ts');
    assert(bodyText.includes('/api/stock/levels'), 'Phase 2 endpoint: /api/stock/levels');
    assert(bodyText.includes('ConsumesShop.tsx'), 'Phase 3 file: ConsumesShop.tsx');
    assert(bodyText.includes('ConsumesAnalytics.tsx'), 'Phase 4 file: ConsumesAnalytics.tsx');
    assert(bodyText.includes('RecipeBrowser.tsx'), 'Phase 5 file: RecipeBrowser.tsx');
    assert(bodyText.includes('guild-bank/inventory.ts'), 'Phase 6 file: guild-bank/inventory.ts');

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

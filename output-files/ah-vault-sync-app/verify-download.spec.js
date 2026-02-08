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
    assert(resp.status() === 200, `Guild Bank page loads (got ${resp.status()})`);

    // 2. Check admin toggle button exists
    console.log('\n[2] Checking admin toggle button...');
    await page.waitForTimeout(2000);
    const adminBtn = page.locator('button', { hasText: /Admin/ });
    const adminBtnCount = await adminBtn.count();
    assert(adminBtnCount > 0, 'Admin button exists on page');

    // 3. Verify download banner is NOT visible before admin auth
    console.log('\n[3] Checking download banner is hidden before auth...');
    const downloadLink = page.locator('a[href="/api/download/tray-app"]');
    const downloadVisible = await downloadLink.count();
    assert(downloadVisible === 0, 'Download link is hidden before admin auth');

    // 4. Click admin button — should show password modal
    console.log('\n[4] Clicking admin button...');
    await adminBtn.first().click();
    await page.waitForTimeout(500);
    const passwordInput = page.locator('input[type="password"]');
    const modalVisible = await passwordInput.isVisible();
    assert(modalVisible, 'Password modal appears after clicking Admin');

    // 5. Enter wrong password
    console.log('\n[5] Testing wrong password...');
    await passwordInput.fill('wrongpassword');
    const loginBtn = page.locator('button', { hasText: 'Login' });
    await loginBtn.click();
    await page.waitForTimeout(1000);
    const errorMsg = page.locator('div', { hasText: 'Incorrect password' });
    const errorVisible = await errorMsg.count();
    assert(errorVisible > 0, 'Wrong password shows error message');

    // 6. Enter correct password
    console.log('\n[6] Testing correct password...');
    await passwordInput.fill('thralls2024');
    await loginBtn.click();
    await page.waitForTimeout(1500);

    // 7. Verify modal closed
    const modalStillVisible = await passwordInput.isVisible().catch(() => false);
    assert(!modalStillVisible, 'Password modal closes after correct password');

    // 8. Verify admin mode is active (button text changes)
    console.log('\n[7] Checking admin mode active...');
    const exitAdminBtn = page.locator('button', { hasText: /Exit Admin/ });
    const exitBtnVisible = await exitAdminBtn.count();
    assert(exitBtnVisible > 0, 'Admin mode is active (Exit Admin button visible)');

    // 9. Verify download banner is NOW visible
    console.log('\n[8] Checking download banner appears...');
    const downloadLinkNow = page.locator('a[href="/api/download/tray-app"]');
    const downloadNowCount = await downloadLinkNow.count();
    assert(downloadNowCount > 0, 'Download link is visible after admin auth');

    // 10. Verify download link text
    if (downloadNowCount > 0) {
      const linkText = await downloadLinkNow.first().textContent();
      assert(linkText.includes('Download'), 'Download link has correct text');
    }

    // 11. Test the download endpoint directly (with the auth cookie that was set)
    console.log('\n[9] Testing download endpoint with auth cookie...');
    const cookies = await context.cookies();
    const adminCookie = cookies.find(c => c.name === 'admin_auth');
    assert(adminCookie && adminCookie.value === 'true', 'admin_auth cookie is set');

    // 12. Verify download actually works (HEAD request via page context)
    console.log('\n[10] Verifying download endpoint serves file...');
    const downloadResp = await page.request.head(`${BASE}/api/download/tray-app`);
    assert(downloadResp.status() === 200, 'Download endpoint returns 200 with auth');
    const contentType = downloadResp.headers()['content-type'];
    assert(contentType === 'application/zip', `Content-Type is application/zip (got: ${contentType})`);
    const contentDisp = downloadResp.headers()['content-disposition'];
    assert(contentDisp && contentDisp.includes('.zip'), 'Content-Disposition has zip filename');

    // 13. Test unauthenticated download (fresh context, no cookies)
    console.log('\n[11] Verifying download blocked without auth...');
    const freshContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const freshPage = await freshContext.newPage();
    const unauthResp = await freshPage.request.get(`${BASE}/api/download/tray-app`);
    assert(unauthResp.status() === 401, 'Download returns 401 without auth cookie');
    await freshContext.close();

    // 14. Click Exit Admin and verify download disappears
    console.log('\n[12] Testing Exit Admin...');
    await exitAdminBtn.first().click();
    await page.waitForTimeout(500);
    const downloadAfterExit = page.locator('a[href="/api/download/tray-app"]');
    const downloadAfterExitCount = await downloadAfterExit.count();
    assert(downloadAfterExitCount === 0, 'Download link hidden after exiting admin');

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

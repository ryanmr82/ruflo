// Phase 7 Verification Tests — Guild Bank Server Upload + Website Page
// Tests API endpoint, data upload from tray app, website rendering, and visual design.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://tbcguild.duckdns.org';
const API_URL = BASE_URL + '/api/guild-bank/inventory';
const PAGE_URL = BASE_URL + '/guild-bank';
const LOG_FILE = path.join(process.env.LOCALAPPDATA, 'AH_and_VaultSync', 'service.log');
const STORMSHADOW_JSON = path.join('C:\\turtlewow', 'Interface', 'AddOns', 'GBankExport', 'GuildBank_STORMSHADOW.json');

test.describe('Phase 7: Guild Bank Server Upload & Website', () => {

  test('API GET returns guild bank data', async ({ request }) => {
    const res = await request.get(API_URL);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.guildName).toBe('Thralls Book Club');
    expect(data.account).toBe('STORMSHADOW');
    expect(data.totalItems).toBe(2653);
    expect(data.uniqueItems).toBe(81);
    expect(data.tabs).toBeDefined();
    expect(data.tabs.length).toBeGreaterThan(0);
    expect(data.summary).toBeDefined();
    expect(data.summary.length).toBe(81);
    expect(data.uploadedAt).toBeDefined();
  });

  test('API data matches local JSON export', async ({ request }) => {
    // Read local JSON
    const localData = JSON.parse(fs.readFileSync(STORMSHADOW_JSON, 'utf8'));

    // Fetch server data
    const res = await request.get(API_URL);
    const serverData = await res.json();

    // Core fields should match
    expect(serverData.guildName).toBe(localData.guildName);
    expect(serverData.account).toBe(localData.account);
    expect(serverData.totalItems).toBe(localData.totalItems);
    expect(serverData.uniqueItems).toBe(localData.uniqueItems);
    expect(serverData.scanTime).toBe(localData.scanTime);
    expect(serverData.tabs.length).toBe(localData.tabs.length);
    expect(serverData.summary.length).toBe(localData.summary.length);
  });

  test('Tray app log confirms successful upload', () => {
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    expect(log).toContain('[GBank] Uploaded to website successfully');
  });

  test('Guild bank page loads (HTTP 200)', async ({ request }) => {
    const res = await request.get(PAGE_URL);
    expect(res.status()).toBe(200);
  });

  test('Guild bank page has correct title and meta', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page).toHaveTitle(/Guild Bank.*Thralls Book Club/);
    const desc = await page.getAttribute('meta[name="description"]', 'content');
    expect(desc).toContain('guild bank');
  });

  test('Nav shows Guild Bank link in Consumes dropdown', async ({ page }) => {
    await page.goto(PAGE_URL);
    // The guild bank link is in a dropdown — check it exists in DOM
    const gbLink = page.locator('a[href="/guild-bank"]');
    await expect(gbLink).toHaveCount(1);
    // Verify it has correct text
    await expect(gbLink).toHaveText('Guild Bank');
    // It should have aria-current since we're on the page
    await expect(gbLink).toHaveAttribute('aria-current', 'page');
  });

  test('Guild bank page renders inventory data', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Wait for the island to hydrate and fetch data — look for the h1 heading
    await page.waitForSelector('h1:has-text("Guild Bank")', { timeout: 15000 });

    // Header should show guild name
    await expect(page.locator('text=Thralls Book Club').first()).toBeVisible();

    // Should show item counts
    await expect(page.locator('text=81 unique items')).toBeVisible();
    await expect(page.locator('text=2653 total')).toBeVisible();

    // Should have search input
    const searchInput = page.locator('input[placeholder="Search items..."]');
    await expect(searchInput).toBeVisible();

    // Should have tab buttons
    await expect(page.locator('button:has-text("All Items")')).toBeVisible();
  });

  test('Search filters items correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('input[placeholder="Search items..."]', { timeout: 10000 });

    // Type a search term
    await page.fill('input[placeholder="Search items..."]', 'Runecloth');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show filtered results
    const footer = page.locator('text=/\\d+ items? shown.*filtered/');
    await expect(footer).toBeVisible();

    // Should contain the search term in results
    await expect(page.locator('text=Runecloth')).toBeVisible();
  });

  test('Page has dark theme styling matching site design', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('h1:has-text("Guild Bank")', { timeout: 15000 });

    // Check background color is dark
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    // Should be dark (RGB values should be low)
    const rgb = bgColor.match(/\d+/g).map(Number);
    expect(rgb[0]).toBeLessThan(80); // R
    expect(rgb[1]).toBeLessThan(80); // G
    expect(rgb[2]).toBeLessThan(80); // B
  });

  test('Navigation bar is consistent with other pages', async ({ page }) => {
    // Check guild bank page nav
    await page.goto(PAGE_URL);
    const gbNav = await page.locator('nav.nav').innerHTML();

    // Check consumes page nav for comparison
    await page.goto(BASE_URL + '/consumes');
    const consumesNav = await page.locator('nav.nav').innerHTML();

    // Both should have the same nav structure (same links)
    expect(gbNav).toContain('Raid Calendar');
    expect(gbNav).toContain('Consumes');
    expect(gbNav).toContain('SR Plus');
    expect(consumesNav).toContain('Guild Bank');
  });

  test('Background image overlay present', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Should have the fixed background image div
    const bgDiv = page.locator('div[style*="position: fixed"][style*="background-image"]');
    await expect(bgDiv).toBeVisible();

    // Should have opacity set
    const style = await bgDiv.getAttribute('style');
    expect(style).toContain('opacity');
    expect(style).toContain('background-image');
  });

  test('Quality colors are applied to items', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('h1:has-text("Guild Bank")', { timeout: 15000 });

    // Table should have rendered with items
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check that items have colored text (any inline style with color)
    const coloredItems = page.locator('td span[style*="color"]');
    const count = await coloredItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('API PUT validates required fields', async ({ request }) => {
    // Missing guildName
    const res = await request.put(API_URL, {
      data: { scanTime: '2026-01-01 00:00:00', tabs: [] }
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('Tab switching works', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('h1:has-text("Guild Bank")', { timeout: 15000 });

    // Get tab buttons within main content area (not nav buttons)
    const mainContent = page.locator('main');
    const allItemsBtn = mainContent.locator('button:has-text("All Items")');
    await expect(allItemsBtn).toBeVisible();

    // Find tab buttons that aren't the "All Items" button
    const allButtons = mainContent.locator('button');
    const buttonCount = await allButtons.count();

    // There should be at least 2 buttons (All Items + at least one tab)
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    // Click the second button (first tab after "All Items")
    await allButtons.nth(1).click();
    await page.waitForTimeout(500);

    // Footer should show items
    const footer = mainContent.locator('text=/\\d+ items? shown/');
    await expect(footer).toBeVisible();
  });
});

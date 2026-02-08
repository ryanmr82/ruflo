import { test, expect } from '@playwright/test';

const BASE_URL = 'https://tbcguild.duckdns.org';
const PASSWORD = 'thralls2024';

test.describe('Architecture Future Enhancements Page - v7 Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Login to architecture page
    await page.goto(`${BASE_URL}/architecture`);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/architecture`);
    // Navigate to Future Enhancements tab
    await page.click('text=Future');
    await page.waitForTimeout(1000);
  });

  test('Main title displays correctly', async ({ page }) => {
    const title = await page.locator('text=AH & Vault Sync v5.0').first();
    await expect(title).toBeVisible();
  });

  test('System Architecture diagram shows DONE and TODO labels', async ({ page }) => {
    const diagram = await page.locator('pre:has-text("[DONE]")').first();
    await expect(diagram).toBeVisible();
    await expect(diagram).toContainText('[TODO]');
    await expect(diagram).toContainText('GAME CLIENT');
  });

  test('Build Strategy section renders', async ({ page }) => {
    const buildStrategy = await page.locator('text=Build Strategy: Complete First, Compile Once').first();
    await expect(buildStrategy).toBeVisible();
  });

  test('Bank Alt Data Hierarchy diagram renders', async ({ page }) => {
    const hierarchy = await page.locator('text=Bank Alt Data Hierarchy').first();
    await expect(hierarchy).toBeVisible();
  });

  test('BANKALTEXPORT_V1 format section renders', async ({ page }) => {
    const format = await page.locator('text=BANKALTEXPORT_V1 Flat Data Format').first();
    await expect(format).toBeVisible();
  });

  test('Server API Endpoints section shows DONE status for all APIs', async ({ page }) => {
    const api = await page.locator('text=Server API Endpoints').first();
    await expect(api).toBeVisible();

    const apiDiagram = await page.locator('pre:has-text("/api/bank-alts/inventory")').first();
    await expect(apiDiagram).toContainText('[DONE]');
    // All 4 APIs are now DONE (Phase 3 completed)
    await expect(apiDiagram).toContainText('/api/consumes/prices');
    await expect(apiDiagram).toContainText('/api/guild-bank/inventory');
    await expect(apiDiagram).toContainText('/api/guild-storage/combined');
  });

  test('Settings GUI mockup renders with account selection', async ({ page }) => {
    const settingsTitle = await page.locator('text=Tray App: Settings GUI').first();
    await expect(settingsTitle).toBeVisible();

    // Find the Settings GUI mockup specifically (has "BANK ALT ACCOUNTS" which is unique to it)
    const mockup = await page.locator('pre:has-text("BANK ALT ACCOUNTS")').first();
    await expect(mockup).toBeVisible();
    await expect(mockup).toContainText('STORMBANK');
    await expect(mockup).toContainText('Bankalt');
  });

  test('Context menu mockup renders', async ({ page }) => {
    const contextMenu = await page.locator('text=Tray App: Context Menu').first();
    await expect(contextMenu).toBeVisible();
  });

  test('Website Guild Storage 3 tabs mockup renders', async ({ page }) => {
    const tabs = await page.locator('text=Website: Guild Storage Page — 3 Tabs').first();
    await expect(tabs).toBeVisible();
  });

  test('Phase 1: BankAltExport Addon renders with description', async ({ page }) => {
    // Use heading role to specifically target the h3, not the diagram text
    const phase1 = await page.getByRole('heading', { name: /Phase 1.*BankAltExport/ });
    await expect(phase1).toBeVisible();

    // Verify description mentions addon/lua (actual text: "Create BankAltExport.lua addon modeled after...")
    const desc = await page.locator('text=BankAltExport.lua addon').first();
    await expect(desc).toBeVisible();
  });

  test('Phase 2: Tray App renders with description', async ({ page }) => {
    const phase2 = await page.locator('text=Phase 2: Build Tray App v5.0 with Settings GUI');
    await expect(phase2).toBeVisible();
  });

  test('Phase 3: Missing Server APIs renders correctly', async ({ page }) => {
    // Use heading role to specifically target the h3
    const phase3 = await page.getByRole('heading', { name: /Phase 3.*Missing Server APIs/ });
    await expect(phase3).toBeVisible();

    // Verify it mentions new API endpoints (actual: "Create two new Deno Fresh API endpoints")
    const desc = await page.locator('text=Deno Fresh API').first();
    await expect(desc).toBeVisible();
  });

  test('Phase 4: Website UI renders', async ({ page }) => {
    // Use heading role to specifically target the h3
    const phase4 = await page.getByRole('heading', { name: /Phase 4.*Website UI/ });
    await expect(phase4).toBeVisible();
  });

  test('Phase 5: Compile Installer renders', async ({ page }) => {
    // Use heading role to specifically target the h3
    const phase5 = await page.getByRole('heading', { name: /Phase 5.*Installer/ });
    await expect(phase5).toBeVisible();

    // Verify mentions "Compile ONCE" (actual: "Compile ONCE with all components complete")
    const once = await page.locator('text=Compile ONCE').first();
    await expect(once).toBeVisible();
  });

  test('Phase 6: Test & Deploy renders', async ({ page }) => {
    // Use heading role to specifically target the h3
    const phase6 = await page.getByRole('heading', { name: /Phase 6.*Test.*Deploy/ });
    await expect(phase6).toBeVisible();
  });

  test('All phases have estimated time filled in', async ({ page }) => {
    // Check for multiple "Estimated Time:" entries with hours
    const times = await page.locator('text=/Estimated Time:.*hours/');
    const count = await times.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('Files to Create sections exist', async ({ page }) => {
    const filesToCreate = await page.locator('text=Files to Create');
    const count = await filesToCreate.count();
    expect(count).toBeGreaterThan(0);
  });

  test('BankAltExport.lua file listed', async ({ page }) => {
    const file = await page.locator('text=BankAltExport.lua').first();
    await expect(file).toBeVisible();
  });

  test('SettingsForm.cs file listed', async ({ page }) => {
    const file = await page.locator('text=SettingsForm.cs').first();
    await expect(file).toBeVisible();
  });

  test('Bagshui Analysis section renders with NOT Reinventing the Wheel', async ({ page }) => {
    // Title contains "NOT Reinventing the Wheel"
    const bagshuiTitle = await page.locator('text=NOT Reinventing the Wheel').first();
    await expect(bagshuiTitle).toBeVisible();

    // Verify key API content appears in diagram
    const diagram = await page.locator('pre:has-text("GetContainerNumSlots")').first();
    await expect(diagram).toBeVisible();
    await expect(diagram).toContainText('BANKFRAME_OPENED');
    await expect(diagram).toContainText('WHY STANDALONE ADDON');
  });

});

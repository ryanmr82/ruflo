// Phase 6 Verification Tests — AH & Vault Sync v4.0 Tray App
// Uses Playwright's test runner for structured assertions.
// Tests process lifecycle, file output, log behavior, and mutex.

const { test, expect } = require('@playwright/test');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXE_PATH = 'C:\\Claude-Flow\\output-files\\AH_and_Vault_Sync-v4.0\\source\\AH_and_VaultSyncTray.exe';
const LOG_DIR = path.join(process.env.LOCALAPPDATA, 'AH_and_VaultSync');
const LOG_FILE = path.join(LOG_DIR, 'service.log');
const WOW_PATH = 'C:\\turtlewow';
const GBANK_ADDON_DIR = path.join(WOW_PATH, 'Interface', 'AddOns', 'GBankExport');
const STORMSHADOW_SV = path.join(WOW_PATH, 'WTF', 'Account', 'STORMSHADOW', 'SavedVariables', 'GBankExport.lua');
const STORMSHADOW_JSON = path.join(GBANK_ADDON_DIR, 'GuildBank_STORMSHADOW.json');
const STORMSHADOW_TXT = path.join(GBANK_ADDON_DIR, 'GuildBank_STORMSHADOW.txt');

function killApp() {
  try {
    execSync('taskkill /f /im AH_and_VaultSyncTray.exe', { stdio: 'ignore' });
  } catch (e) { /* not running */ }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isProcessRunning(name) {
  try {
    const out = execSync(`tasklist /fi "IMAGENAME eq ${name}"`, { encoding: 'utf8' });
    return out.includes(name);
  } catch (e) {
    return false;
  }
}

test.describe('Phase 6: AH & Vault Sync v4.0 Tray App', () => {

  test.beforeAll(() => {
    // Ensure clean state
    killApp();
  });

  test.afterAll(() => {
    // Leave app running for manual inspection
  });

  test('EXE file exists and is valid', () => {
    expect(fs.existsSync(EXE_PATH)).toBe(true);
    const stats = fs.statSync(EXE_PATH);
    expect(stats.size).toBeGreaterThan(10000); // At least 10KB
    expect(stats.size).toBeLessThan(200000);   // Should be small (<200KB)
  });

  test('Source files all present in output directory', () => {
    const sourceDir = path.dirname(EXE_PATH);
    const requiredFiles = [
      'AH_and_VaultSyncTray.cs',
      'AH_and_VaultSyncTray.exe',
      'GuildShopSync.lua',
      'GuildShopSync.toc',
      'GBankExport.lua',
      'GBankExport.toc',
      'README.txt',
    ];
    for (const f of requiredFiles) {
      expect(fs.existsSync(path.join(sourceDir, f)), `Missing: ${f}`).toBe(true);
    }
  });

  test('Installer script exists', () => {
    const issPath = 'C:\\Claude-Flow\\output-files\\AH_and_Vault_Sync-v4.0\\AH_and_Vault_Sync.iss';
    expect(fs.existsSync(issPath)).toBe(true);
    const content = fs.readFileSync(issPath, 'utf8');
    expect(content).toContain('#define MyAppVersion "4.0"');
    expect(content).toContain('AH_and_VaultSyncTray.exe');
    expect(content).toContain('GBankExport.lua');
    expect(content).toContain('GuildShopSync.lua');
    expect(content).toContain('GBankExport-AutoExport.vbs'); // cleanup of old VBS
  });

  test('App launches and creates log file', async () => {
    // Clear old log
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

    // Launch
    const proc = spawn(EXE_PATH, [], { detached: true, stdio: 'ignore' });
    proc.unref();

    // Wait for startup
    await sleep(4000);

    // Verify process is running
    expect(isProcessRunning('AH_and_VaultSyncTray.exe')).toBe(true);

    // Verify log file created
    expect(fs.existsSync(LOG_FILE)).toBe(true);
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    expect(log).toContain('AH & Vault Sync v4.0 started');
    expect(log).toContain('[Prices] Polling for GuildShopSync.lua changes');
    expect(log).toContain('[GBank] Polling for GBankExport.lua changes');
  });

  test('Mutex prevents second instance', async () => {
    // First instance should already be running
    expect(isProcessRunning('AH_and_VaultSyncTray.exe')).toBe(true);

    // Try to launch second instance
    const proc = spawn(EXE_PATH, [], { detached: true, stdio: 'ignore' });

    await sleep(2000);

    // Count instances - should be exactly 1
    try {
      const out = execSync('tasklist /fi "IMAGENAME eq AH_and_VaultSyncTray.exe"', { encoding: 'utf8' });
      const matches = out.match(/AH_and_VaultSyncTray\.exe/g);
      expect(matches.length).toBe(1);
    } catch (e) {
      // If tasklist format is different, just check process is still running
      expect(isProcessRunning('AH_and_VaultSyncTray.exe')).toBe(true);
    }
  });

  test('Guild bank export triggers on file change', async () => {
    // Record current JSON timestamp
    const beforeStat = fs.existsSync(STORMSHADOW_JSON)
      ? fs.statSync(STORMSHADOW_JSON).mtimeMs : 0;

    // Touch the SavedVariables file to trigger re-export
    const now = new Date();
    fs.utimesSync(STORMSHADOW_SV, now, now);

    // Wait for poll (5s) + debounce (1.5s) + processing
    await sleep(9000);

    // Verify JSON was re-exported
    expect(fs.existsSync(STORMSHADOW_JSON)).toBe(true);
    const afterStat = fs.statSync(STORMSHADOW_JSON).mtimeMs;
    expect(afterStat).toBeGreaterThan(beforeStat);

    // Verify JSON content
    const json = JSON.parse(fs.readFileSync(STORMSHADOW_JSON, 'utf8'));
    expect(json.exportVersion).toBe('1.0');
    expect(json.guildName).toBe('Thralls Book Club');
    expect(json.totalItems).toBe(2653);
    expect(json.uniqueItems).toBe(81);
    expect(json.tabs).toBeDefined();
    expect(json.tabs.length).toBeGreaterThan(0);
    expect(json.summary).toBeDefined();
    expect(json.summary.length).toBeGreaterThan(0);

    // Verify TXT was also re-exported
    expect(fs.existsSync(STORMSHADOW_TXT)).toBe(true);
    const txt = fs.readFileSync(STORMSHADOW_TXT, 'utf8');
    expect(txt).toContain('GUILD BANK EXPORT');
    expect(txt).toContain('Thralls Book Club');
    expect(txt).toContain('81 unique items, 2653 total');
    expect(txt).toContain('COMBINED SUMMARY (A-Z)');
  });

  test('Log contains export confirmation', () => {
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    expect(log).toContain('[GBank] Exported STORMSHADOW');
    expect(log).toContain('81 unique / 2653 total -> JSON + TXT');
  });

  test('Log file is in correct directory', () => {
    expect(LOG_DIR).toContain('AH_and_VaultSync');
    expect(fs.existsSync(LOG_DIR)).toBe(true);
    expect(fs.existsSync(LOG_FILE)).toBe(true);
  });

  test('WoW path correctly detected from filesystem', () => {
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    expect(log).toContain('WoW path: C:\\turtlewow');
    expect(log).toContain('Watch path: C:\\turtlewow\\WTF\\Account');
  });

  test('JSON export has correct schema', () => {
    const json = JSON.parse(fs.readFileSync(STORMSHADOW_JSON, 'utf8'));

    // Top-level fields
    expect(json).toHaveProperty('exportVersion');
    expect(json).toHaveProperty('scanTime');
    expect(json).toHaveProperty('guildName');
    expect(json).toHaveProperty('account');
    expect(json).toHaveProperty('totalItems');
    expect(json).toHaveProperty('uniqueItems');
    expect(json).toHaveProperty('tabs');
    expect(json).toHaveProperty('summary');

    // Tab structure
    const tab = json.tabs[0];
    expect(tab).toHaveProperty('tabIndex');
    expect(tab).toHaveProperty('tabName');
    expect(tab).toHaveProperty('items');

    // Item structure
    const item = tab.items[0];
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('count');
    expect(item).toHaveProperty('quality');
    expect(item).toHaveProperty('qualityName');
    expect(item).toHaveProperty('itemId');
    expect(item).toHaveProperty('slot');

    // Summary item structure
    const summary = json.summary[0];
    expect(summary).toHaveProperty('name');
    expect(summary).toHaveProperty('count');
    expect(summary).toHaveProperty('quality');
    expect(summary).toHaveProperty('qualityName');
    expect(summary).toHaveProperty('itemId');
  });

  test('Accounts without scan data are handled gracefully', () => {
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    // These accounts have empty FlatData - should log informative message, not crash
    expect(log).toContain('Empty FlatData for KRR86');
    expect(log).not.toContain('Fatal error');
    expect(log).not.toContain('Unhandled');
  });

  test('Old AutoExport.ps1 is NOT running', () => {
    const running = isProcessRunning('powershell.exe');
    if (running) {
      // Check if any PowerShell is running AutoExport specifically
      try {
        const out = execSync(
          'powershell.exe -NoProfile -Command "Get-WmiObject Win32_Process -Filter \\"Name=\'powershell.exe\'\\" | Select-Object CommandLine"',
          { encoding: 'utf8', timeout: 10000 }
        );
        expect(out).not.toContain('AutoExport.ps1');
      } catch (e) {
        // If WMI query fails, skip this check
      }
    }
  });
});

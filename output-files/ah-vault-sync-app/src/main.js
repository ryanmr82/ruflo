const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const FileWatcher = require('./services/fileWatcher');
const Uploader = require('./services/uploader');

// Single instance lock — prevent multiple copies from running
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const store = new Store();
let mainWindow;
let tray;
let fileWatcher;
let watcherRunning = false;

// App configuration
const APP_NAME = 'Guild Sync';
const SERVER_URL = 'https://hydraguild.duckdns.org';
const SERVER_URL_FALLBACK = 'https://132.226.72.121';
const DASHBOARD_URL = 'https://hydraguild.duckdns.org/guild-bank';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    minWidth: 850,
    minHeight: 600,
    resizable: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Use ICO for Windows tray — must be a valid .ico file or tray shows blank
  const iconCandidates = [];

  if (app.isPackaged) {
    // Production paths (electron-builder copies build/ into resources/)
    iconCandidates.push(path.join(process.resourcesPath, 'build', 'icon.ico'));
    iconCandidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico'));
    iconCandidates.push(path.join(path.dirname(process.execPath), 'resources', 'build', 'icon.ico'));
  }
  // Development + fallback
  iconCandidates.push(path.join(__dirname, '..', 'build', 'icon.ico'));

  let trayIcon = null;
  for (const candidate of iconCandidates) {
    if (fs.existsSync(candidate)) {
      trayIcon = candidate;
      break;
    }
  }

  if (!trayIcon) {
    // Use the app executable itself as icon source (Electron extracts its icon)
    console.log('No .ico found, using app executable icon');
    trayIcon = process.execPath;
  }

  try {
    const { nativeImage } = require('electron');
    const icon = nativeImage.createFromPath(trayIcon);
    if (icon.isEmpty()) {
      console.error('Tray icon loaded but is empty:', trayIcon);
      // Create a simple 16x16 colored icon as last resort
      tray = new Tray(nativeImage.createFromBuffer(
        Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVQ4jWNgGLTgPwMDAwMjIyMjAzYMkmNkZGRkwKYAXQ1DFgAAJQ4FARyPNeUAAAAASUVORK5CYII=', 'base64')
      ));
    } else {
      tray = new Tray(icon);
    }
    tray.setToolTip(APP_NAME);
    updateTrayMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Failed to create tray:', err);
  }
}

function updateTrayMenu() {
  if (!tray) return;

  const lastSync = store.get('lastSyncTime');
  const syncStatus = lastSync ? `Last sync: ${new Date(lastSync).toLocaleTimeString()}` : 'Not synced yet';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Guild Sync',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Sync Now',
      click: () => {
        handleManualSync();
      }
    },
    { type: 'separator' },
    {
      label: syncStatus,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Website',
      click: () => {
        shell.openExternal(DASHBOARD_URL);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function startWatching() {
  const wowPath = store.get('wowPath');
  const enabledAccounts = store.get('enabledAccounts', {});

  if (!wowPath) {
    return;
  }

  if (fileWatcher) {
    fileWatcher.stop();
  }

  fileWatcher = new FileWatcher(wowPath, enabledAccounts, store);

  fileWatcher.on('pricesChanged', async (data) => {
    try {
      const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
      await uploader.uploadPrices(data);
      store.set('lastSyncTime', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'prices', data });
    } catch (error) {
      console.error('Price upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'prices', error: error.message });
    }
  });

  fileWatcher.on('guildBankChanged', async (data) => {
    try {
      const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
      await uploader.uploadGuildBank(data);
      store.set('lastSyncTime', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'guildBank', data });
    } catch (error) {
      console.error('Guild bank upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'guildBank', error: error.message });
    }
    // Push updated settings/scan info to renderer (may have changed via in-game commands)
    refreshGBankSettingsToRenderer();
  });

  fileWatcher.on('bankAltChanged', async (data) => {
    try {
      const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
      await uploader.uploadBankAlt(data);
      store.set('lastSyncTime', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'bankAlt', data });
    } catch (error) {
      console.error('Bank alt upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'bankAlt', error: error.message });
    }
  });

  fileWatcher.on('guildTrackerChanged', async (data) => {
    try {
      const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
      await uploader.uploadGuildGrowth(data);
      store.set('lastSyncTime', Date.now());
      store.set('lastGuildGrowthSync', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'guildGrowth', data: {
        eventCount: data.events ? data.events.length : 0,
        rosterCount: data.currentRosterCount || 0,
        under60: data.levelingTracker ? data.levelingTracker.totalUnder60 : 0,
      }});
    } catch (error) {
      console.error('Guild growth upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'guildGrowth', error: error.message });
    }
  });

  fileWatcher.start();
  watcherRunning = true;
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('watcher-started');
  }
}

function stopWatching() {
  if (fileWatcher) {
    fileWatcher.stop();
  }
  watcherRunning = false;
}

async function handleManualSync() {
  const wowPath = store.get('wowPath');

  if (!wowPath) {
    dialog.showErrorBox('Setup Required', 'Please configure your WoW path first.');
    mainWindow.show();
    return;
  }

  mainWindow.webContents.send('sync-started');

  try {
    const enabledAccounts = store.get('enabledAccounts', {});
    const tempWatcher = new FileWatcher(wowPath, enabledAccounts, store);
    const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);

    // Sync prices — from ANY account that has GuildShopSync data (prices are global)
    const accounts = tempWatcher.discoverAccounts();
    const priceAccounts = accounts.filter(a => a.addons.GuildShopSync);
    let bestPriceData = null;
    for (const acct of priceAccounts) {
      const pd = tempWatcher.readPriceData(acct.name);
      if (pd && pd.itemCount > 0 && (!bestPriceData || pd.itemCount > bestPriceData.itemCount)) {
        bestPriceData = pd;
      }
    }
    if (bestPriceData) {
      await uploader.uploadPrices(bestPriceData);
      mainWindow.webContents.send('sync-success', { type: 'prices' });
    }

    // Sync guild bank — from ANY account that has GBankExport data (guild bank is global)
    const gbankAccounts = accounts.filter(a => a.addons.GBankExport);
    let bestGbankData = null;
    for (const acct of gbankAccounts) {
      const gd = tempWatcher.readGuildBankData(acct.name);
      if (gd && gd.totalItems > 0 && (!bestGbankData || gd.totalItems > bestGbankData.totalItems)) {
        bestGbankData = gd;
      }
    }
    if (bestGbankData) {
      await uploader.uploadGuildBank(bestGbankData);
      mainWindow.webContents.send('sync-success', { type: 'guildBank' });
    }

    // Sync bank alts — all checked accounts that have BankAltExport data
    const bankAltData = tempWatcher.readAllBankAltData();
    if (bankAltData && Object.keys(bankAltData).length > 0) {
      for (const [account, data] of Object.entries(bankAltData)) {
        await uploader.uploadBankAlt({ ...data, account });
        mainWindow.webContents.send('sync-success', { type: 'bankAlt', account });
      }
    }

    // Sync guild growth — merge all GuildTracker data across accounts
    const guildGrowthData = tempWatcher.readGuildGrowthData();
    if (guildGrowthData) {
      await uploader.uploadGuildGrowth(guildGrowthData);
      store.set('lastGuildGrowthSync', Date.now());
      mainWindow.webContents.send('sync-success', { type: 'guildGrowth', data: {
        eventCount: guildGrowthData.events ? guildGrowthData.events.length : 0,
        rosterCount: guildGrowthData.currentRosterCount || 0,
        under60: guildGrowthData.levelingTracker ? guildGrowthData.levelingTracker.totalUnder60 : 0,
      }});
    }

    store.set('lastSyncTime', Date.now());
    updateTrayMenu();

    dialog.showMessageBox({
      type: 'info',
      title: 'Sync Complete',
      message: 'All data synced successfully!'
    });
  } catch (error) {
    console.error('Manual sync failed:', error);
    dialog.showErrorBox('Sync Failed', error.message);
  }
}

// IPC Handlers
ipcMain.on('save-config', async (event, config) => {
  const oldEnabledAccounts = store.get('enabledAccounts', {});
  const newEnabledAccounts = config.enabledAccounts || {};

  store.set('wowPath', config.wowPath);
  store.set('enabledAccounts', newEnabledAccounts);
  store.set('autoSync', config.autoSync);

  // Start with Windows toggle
  app.setLoginItemSettings({ openAtLogin: !!config.startWithWindows });

  event.reply('config-saved');

  // Detect accounts that were just unchecked and delete their data from the server
  const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
  for (const accountName of Object.keys(newEnabledAccounts)) {
    const wasEnabled = oldEnabledAccounts[accountName] !== false;
    const isNowDisabled = newEnabledAccounts[accountName] === false;

    if (wasEnabled && isNowDisabled) {
      try {
        await uploader.deleteBankAlt(accountName);
        console.log(`Deleted bank alt data for unchecked account: ${accountName}`);
        if (mainWindow) {
          mainWindow.webContents.send('sync-success', {
            type: 'bankAltDelete',
            account: accountName
          });
        }
      } catch (error) {
        console.error(`Failed to delete bank alt data for ${accountName}:`, error.message);
        if (mainWindow) {
          mainWindow.webContents.send('sync-error', {
            type: 'bankAltDelete',
            account: accountName,
            error: error.message
          });
        }
      }
    }
  }

  if (config.autoSync) {
    startWatching();
  } else {
    stopWatching();
  }

  updateTrayMenu();
});

ipcMain.on('get-config', (event) => {
  const loginSettings = app.getLoginItemSettings();
  event.reply('config-data', {
    wowPath: store.get('wowPath', ''),
    enabledAccounts: store.get('enabledAccounts', {}),
    autoSync: store.get('autoSync', true),
    startWithWindows: loginSettings.openAtLogin,
    lastSyncTime: store.get('lastSyncTime'),
    watcherRunning: watcherRunning
  });
});

ipcMain.on('get-accounts', (event, wowPath) => {
  try {
    const tempWatcher = new FileWatcher(wowPath, {}, store);
    const accounts = tempWatcher.discoverAccounts();
    event.reply('accounts-data', { success: true, accounts });
  } catch (error) {
    event.reply('accounts-data', { success: false, error: error.message, accounts: [] });
  }
});

ipcMain.on('browse-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Turtle WoW Installation Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const wowPath = result.filePaths[0];
    event.reply('folder-selected', wowPath);

    // Auto-install addons when WoW folder is selected
    installAddons(wowPath);
  }
});

// Read addon version from a .toc file (returns version string or null)
function getAddonVersion(tocPath) {
  try {
    if (!fs.existsSync(tocPath)) return null;
    const content = fs.readFileSync(tocPath, 'utf8');
    const match = content.match(/^##\s*Version:\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } catch (err) {
    console.error('Error reading addon version from', tocPath, err);
    return null;
  }
}

// Auto-update addons on startup if bundled versions are newer than installed
function autoUpdateAddons(wowPath) {
  const addonsPath = path.join(wowPath, 'Interface', 'AddOns');
  if (!fs.existsSync(addonsPath)) return null;

  let sourceAddons;
  if (app.isPackaged) {
    sourceAddons = path.join(process.resourcesPath, 'addons');
  } else {
    sourceAddons = path.join(__dirname, '..', 'addons');
  }

  if (!fs.existsSync(sourceAddons)) return null;

  const addonsToCheck = ['GuildShopSync', 'GBankExport', 'BankAltExport', 'GuildTracker'];
  const updated = [];

  for (const addon of addonsToCheck) {
    const bundledToc = path.join(sourceAddons, addon, `${addon}.toc`);
    const installedToc = path.join(addonsPath, addon, `${addon}.toc`);

    const bundledVersion = getAddonVersion(bundledToc);
    const installedVersion = getAddonVersion(installedToc);

    if (!bundledVersion) continue; // No bundled addon to compare

    // Update if: addon not installed, or installed version differs from bundled
    if (!installedVersion || installedVersion !== bundledVersion) {
      updated.push({ addon, from: installedVersion, to: bundledVersion });
    }
  }

  if (updated.length > 0) {
    const result = installAddons(wowPath);
    if (result && result.success) {
      console.log('Auto-updated addons:', updated.map(u => `${u.addon} ${u.from || '(new)'} -> ${u.to}`).join(', '));
      return updated;
    }
  }

  return null;
}

// Install addons to WoW folder
function installAddons(wowPath) {
  const addonsPath = path.join(wowPath, 'Interface', 'AddOns');

  // Create AddOns folder if it doesn't exist
  if (!fs.existsSync(addonsPath)) {
    try {
      fs.mkdirSync(addonsPath, { recursive: true });
    } catch (err) {
      console.error('Failed to create AddOns folder:', err);
      return { success: false, error: err.message };
    }
  }

  // Find our bundled addons
  let sourceAddons;
  if (app.isPackaged) {
    sourceAddons = path.join(process.resourcesPath, 'addons');
  } else {
    sourceAddons = path.join(__dirname, '..', 'addons');
  }

  if (!fs.existsSync(sourceAddons)) {
    console.error('Source addons folder not found:', sourceAddons);
    return { success: false, error: 'Addons not found in app package' };
  }

  const addonsToInstall = ['GuildShopSync', 'GBankExport', 'BankAltExport', 'GuildTracker'];
  const results = [];

  for (const addon of addonsToInstall) {
    const srcDir = path.join(sourceAddons, addon);
    const destDir = path.join(addonsPath, addon);

    if (!fs.existsSync(srcDir)) {
      results.push({ addon, success: false, error: 'Source not found' });
      continue;
    }

    try {
      // Create destination folder
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy all files
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
      }

      results.push({ addon, success: true });
      console.log(`Installed addon: ${addon}`);
    } catch (err) {
      results.push({ addon, success: false, error: err.message });
      console.error(`Failed to install ${addon}:`, err);
    }
  }

  // Notify renderer about addon installation
  if (mainWindow) {
    mainWindow.webContents.send('addons-installed', results);
  }

  return { success: true, results };
}

ipcMain.on('install-addons', (event, wowPath) => {
  const result = installAddons(wowPath);
  event.reply('addons-install-result', result);
});

// Check addon installation status without reinstalling
ipcMain.on('check-addons', (event, wowPath) => {
  const addonsPath = path.join(wowPath, 'Interface', 'AddOns');
  const addonsToCheck = ['GuildShopSync', 'GBankExport', 'BankAltExport', 'GuildTracker'];
  const results = [];

  for (const addon of addonsToCheck) {
    const addonDir = path.join(addonsPath, addon);
    const tocFile = path.join(addonDir, `${addon}.toc`);
    const luaFile = path.join(addonDir, `${addon}.lua`);
    const installed = fs.existsSync(tocFile) || fs.existsSync(luaFile);
    results.push({ addon, success: installed, error: installed ? null : 'Not installed' });
  }

  event.reply('addons-status', results);
});

// GBank Scanner Settings — read from SavedVariables
ipcMain.on('get-gbank-settings', (event) => {
  const settings = readGBankSettingsFromDisk();
  event.reply('gbank-settings-data', settings);
});

// GBank Scanner Settings — write to SavedVariables
ipcMain.on('save-gbank-settings', (event, settings) => {
  const wowPath = store.get('wowPath');
  if (!wowPath) {
    event.reply('gbank-settings-saved', { success: false, error: 'No WoW path configured' });
    return;
  }

  const tempWatcher = new FileWatcher(wowPath, store.get('enabledAccounts', {}), store);
  const accounts = tempWatcher.discoverAccounts();
  const gbankAccounts = accounts.filter(a => a.addons.GBankExport);

  if (gbankAccounts.length === 0) {
    event.reply('gbank-settings-saved', { success: false, error: 'No GBankExport data found. Open the guild bank in-game first.' });
    return;
  }

  try {
    for (const account of gbankAccounts) {
      const filePath = path.join(account.path, 'SavedVariables', 'GBankExport.lua');
      if (fs.existsSync(filePath)) {
        writeGBankSettings(filePath, settings);
      }
    }
    event.reply('gbank-settings-saved', { success: true });
  } catch (error) {
    console.error('Error saving GBank settings:', error);
    event.reply('gbank-settings-saved', { success: false, error: error.message });
  }
});

ipcMain.on('manual-sync', async (event) => {
  await handleManualSync();
});

ipcMain.on('test-connection', async (event) => {
  try {
    const uploader = new Uploader(SERVER_URL, SERVER_URL_FALLBACK);
    await uploader.testConnection();
    event.reply('connection-test-result', { success: true });
  } catch (error) {
    event.reply('connection-test-result', { success: false, error: error.message });
  }
});

ipcMain.on('open-dashboard', () => {
  shell.openExternal(DASHBOARD_URL);
});

ipcMain.on('get-guild-growth-status', (event) => {
  const wowPath = store.get('wowPath');
  if (!wowPath) {
    event.reply('guild-growth-status', { hasData: false });
    return;
  }

  try {
    const tempWatcher = new FileWatcher(wowPath, store.get('enabledAccounts', {}), store);
    const accounts = tempWatcher.discoverAccounts();
    const gtAccounts = accounts.filter(a => a.addons.GuildTracker);
    event.reply('guild-growth-status', {
      hasData: gtAccounts.length > 0,
      accountCount: gtAccounts.length,
      lastSync: store.get('lastGuildGrowthSync'),
    });
  } catch (error) {
    event.reply('guild-growth-status', { hasData: false, error: error.message });
  }
});

ipcMain.on('start-watching', () => {
  startWatching();
});

ipcMain.on('stop-watching', () => {
  stopWatching();
});

// GBank Settings helpers
function parseGBankSettings(content) {
  const result = {
    autoScan: true,
    cooldownMinutes: 30,
    lastScan: null,
    guildName: null,
    totalItems: 0,
    uniqueItems: 0
  };

  // Parse GBankExport_Settings
  const settingsBlock = content.match(/GBankExport_Settings\s*=\s*\{([^}]*)\}/s);
  if (settingsBlock) {
    const autoMatch = settingsBlock[1].match(/\["autoScan"\]\s*=\s*(true|false)/);
    if (autoMatch) result.autoScan = autoMatch[1] === 'true';

    const cooldownMatch = settingsBlock[1].match(/\["cooldownMinutes"\]\s*=\s*(\d+)/);
    if (cooldownMatch) result.cooldownMinutes = parseInt(cooldownMatch[1]);
  }

  // Parse scan info from GBankExport_Data
  const scanTimeMatch = content.match(/\["scanTime"\]\s*=\s*"([^"]+)"/);
  if (scanTimeMatch) result.lastScan = scanTimeMatch[1];

  const guildMatch = content.match(/\["guildName"\]\s*=\s*"([^"]+)"/);
  if (guildMatch) result.guildName = guildMatch[1];

  const totalMatch = content.match(/\["totalItems"\]\s*=\s*(\d+)/);
  if (totalMatch) result.totalItems = parseInt(totalMatch[1]);

  const uniqueMatch = content.match(/\["uniqueItems"\]\s*=\s*(\d+)/);
  if (uniqueMatch) result.uniqueItems = parseInt(uniqueMatch[1]);

  return result;
}

function writeGBankSettings(filePath, settings) {
  let content = fs.readFileSync(filePath, 'utf8');

  const newSettingsBlock = 'GBankExport_Settings = {\n' +
    '\t["autoScan"] = ' + (settings.autoScan ? 'true' : 'false') + ',\n' +
    '\t["cooldownMinutes"] = ' + settings.cooldownMinutes + ',\n' +
    '}';

  // Check if GBankExport_Settings already exists in file
  const existingMatch = content.match(/GBankExport_Settings\s*=\s*\{[^}]*\}/s);
  if (existingMatch) {
    content = content.replace(existingMatch[0], newSettingsBlock);
  } else {
    // Append at end of file
    content = content.trimEnd() + '\n\n' + newSettingsBlock + '\n';
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function readGBankSettingsFromDisk() {
  const defaults = { autoScan: true, cooldownMinutes: 30, lastScan: null, guildName: null, totalItems: 0, uniqueItems: 0 };
  const wowPath = store.get('wowPath');
  if (!wowPath) return defaults;

  try {
    const tempWatcher = new FileWatcher(wowPath, store.get('enabledAccounts', {}), store);
    const accounts = tempWatcher.discoverAccounts();
    const gbankAccount = accounts.find(a => a.addons.GBankExport);
    if (!gbankAccount) return defaults;

    const filePath = path.join(gbankAccount.path, 'SavedVariables', 'GBankExport.lua');
    if (!fs.existsSync(filePath)) return defaults;

    const content = fs.readFileSync(filePath, 'utf8');
    return parseGBankSettings(content);
  } catch (error) {
    console.error('Error reading GBank settings:', error);
    return defaults;
  }
}

function refreshGBankSettingsToRenderer() {
  if (!mainWindow || !mainWindow.webContents) return;
  const settings = readGBankSettingsFromDisk();
  mainWindow.webContents.send('gbank-settings-updated', settings);
}

// App lifecycle
app.on('second-instance', () => {
  // Someone tried to launch a second instance — show our existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Wait for renderer to finish loading before starting watcher
  // so the watcher-started IPC message isn't lost
  mainWindow.webContents.once('did-finish-load', () => {
    const wowPath = store.get('wowPath');
    if (wowPath) {
      // Auto-update addons if bundled versions are newer than installed
      const updated = autoUpdateAddons(wowPath);
      if (updated && mainWindow) {
        mainWindow.webContents.send('addons-auto-updated', updated);
      }

      if (store.get('autoSync', true)) {
        startWatching();
      }
    }
  });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  stopWatching();
  // Destroy tray icon on quit to prevent ghost icons
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

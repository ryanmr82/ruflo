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

// App configuration
const APP_NAME = 'AH & Vault Sync';
const SERVER_URL = 'https://tbcguild.duckdns.org';
const DASHBOARD_URL = 'https://tbcguild.duckdns.org/guild-bank';

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
      label: 'Open AH & Vault Sync',
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
      const uploader = new Uploader(SERVER_URL);
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
      const uploader = new Uploader(SERVER_URL);
      await uploader.uploadGuildBank(data);
      store.set('lastSyncTime', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'guildBank', data });
    } catch (error) {
      console.error('Guild bank upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'guildBank', error: error.message });
    }
  });

  fileWatcher.on('bankAltChanged', async (data) => {
    try {
      const uploader = new Uploader(SERVER_URL);
      await uploader.uploadBankAlt(data);
      store.set('lastSyncTime', Date.now());
      updateTrayMenu();
      mainWindow.webContents.send('sync-success', { type: 'bankAlt', data });
    } catch (error) {
      console.error('Bank alt upload failed:', error);
      mainWindow.webContents.send('sync-error', { type: 'bankAlt', error: error.message });
    }
  });

  fileWatcher.start();
  mainWindow.webContents.send('watcher-started');
}

function stopWatching() {
  if (fileWatcher) {
    fileWatcher.stop();
  }
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
    const uploader = new Uploader(SERVER_URL);

    // Sync prices — from first checked account that has GuildShopSync
    const accounts = tempWatcher.discoverAccounts();
    const priceAccount = accounts.find(a => enabledAccounts[a.name] && a.addons.GuildShopSync);
    if (priceAccount) {
      const priceData = tempWatcher.readPriceData(priceAccount.name);
      if (priceData) {
        await uploader.uploadPrices(priceData);
        mainWindow.webContents.send('sync-success', { type: 'prices' });
      }
    }

    // Sync guild bank — from first checked account that has GBankExport
    const gbankAccount = accounts.find(a => enabledAccounts[a.name] && a.addons.GBankExport);
    if (gbankAccount) {
      const guildBankData = tempWatcher.readGuildBankData(gbankAccount.name);
      if (guildBankData) {
        await uploader.uploadGuildBank(guildBankData);
        mainWindow.webContents.send('sync-success', { type: 'guildBank' });
      }
    }

    // Sync bank alts — all checked accounts that have BankAltExport data
    const bankAltData = tempWatcher.readAllBankAltData();
    if (bankAltData && Object.keys(bankAltData).length > 0) {
      for (const [account, data] of Object.entries(bankAltData)) {
        await uploader.uploadBankAlt({ ...data, account });
        mainWindow.webContents.send('sync-success', { type: 'bankAlt', account });
      }
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

  event.reply('config-saved');

  // Detect accounts that were just unchecked and delete their data from the server
  const uploader = new Uploader(SERVER_URL);
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
  event.reply('config-data', {
    wowPath: store.get('wowPath', ''),
    enabledAccounts: store.get('enabledAccounts', {}),
    autoSync: store.get('autoSync', true),
    lastSyncTime: store.get('lastSyncTime')
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

  const addonsToInstall = ['GuildShopSync', 'GBankExport', 'BankAltExport'];
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
  const addonsToCheck = ['GuildShopSync', 'GBankExport', 'BankAltExport'];
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

ipcMain.on('manual-sync', async (event) => {
  await handleManualSync();
});

ipcMain.on('test-connection', async (event) => {
  try {
    const uploader = new Uploader(SERVER_URL);
    await uploader.testConnection();
    event.reply('connection-test-result', { success: true });
  } catch (error) {
    event.reply('connection-test-result', { success: false, error: error.message });
  }
});

ipcMain.on('open-dashboard', () => {
  shell.openExternal(DASHBOARD_URL);
});

ipcMain.on('start-watching', () => {
  startWatching();
});

ipcMain.on('stop-watching', () => {
  stopWatching();
});

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

  // Auto-start watching if configured
  if (store.get('autoSync', true) && store.get('wowPath')) {
    startWatching();
  }
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

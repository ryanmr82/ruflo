const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 450,
    minWidth: 400,
    minHeight: 350,
    resizable: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// Handle folder selection
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select TurtleWoW Logs Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle log rotation
ipcMain.handle('rotate-logs', async (event, logsPath) => {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  const logsToRotate = [
    'WoWCombatLog.txt',
    'WoWRawCombatLog.txt'
  ];

  const results = [];

  for (const logFile of logsToRotate) {
    const originalPath = path.join(logsPath, logFile);
    const archiveName = logFile.replace('.txt', `.archived.${timestamp}.txt`);
    const archivePath = path.join(logsPath, archiveName);

    try {
      // Check if file exists
      if (!fs.existsSync(originalPath)) {
        results.push({ file: logFile, status: 'skipped', message: 'File not found' });
        continue;
      }

      // Get file size before rotation
      const stats = fs.statSync(originalPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Copy to archive (works even if WoW has file open for writing)
      fs.copyFileSync(originalPath, archivePath);

      // Truncate original file (clear it)
      // Use multiple methods to handle WoW's file locking
      let truncated = false;

      // Method 1: Direct truncate
      try {
        fs.truncateSync(originalPath, 0);
        truncated = true;
      } catch (e) {
        // Method 2: Open with write flag
        try {
          const fd = fs.openSync(originalPath, 'w');
          fs.closeSync(fd);
          truncated = true;
        } catch (e2) {
          // Method 3: Write empty string
          try {
            fs.writeFileSync(originalPath, '');
            truncated = true;
          } catch (e3) {
            truncated = false;
          }
        }
      }

      // Verify truncation worked
      const newStats = fs.statSync(originalPath);
      if (newStats.size > 1024) {
        results.push({
          file: logFile,
          status: 'warning',
          message: `Archived (${sizeMB} MB) but could not clear - file still ${(newStats.size / (1024 * 1024)).toFixed(2)} MB. Type /combatlog twice in-game to reset.`,
          archive: archiveName
        });
      } else {
        results.push({
          file: logFile,
          status: 'success',
          message: `Archived (${sizeMB} MB)`,
          archive: archiveName
        });
      }

    } catch (err) {
      results.push({
        file: logFile,
        status: 'error',
        message: err.message
      });
    }
  }

  return results;
});

// Save/load settings
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('load-settings', () => {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return { logsPath: '' };
});

ipcMain.handle('save-settings', (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
});

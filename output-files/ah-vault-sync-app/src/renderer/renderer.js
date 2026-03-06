const { ipcRenderer } = require('electron');

// DOM Elements
const wowPathInput = document.getElementById('wowPath');
const browseBtn = document.getElementById('browseBtn');
const accountsList = document.getElementById('accountsList');
const autoSyncCheckbox = document.getElementById('autoSync');
const startWithWindowsCheckbox = document.getElementById('startWithWindows');
const lastSyncTime = document.getElementById('lastSyncTime');
const connectionStatus = document.getElementById('connectionStatus');
const watcherStatus = document.getElementById('watcherStatus');
const syncLog = document.getElementById('syncLog');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const addonStatus = document.getElementById('addonStatus');
const installAddonsBtn = document.getElementById('installAddonsBtn');
const gbankAutoScanCheckbox = document.getElementById('gbankAutoScan');
const gbankCooldownSelect = document.getElementById('gbankCooldown');
const gbankLastScan = document.getElementById('gbankLastScan');
const gbankGuild = document.getElementById('gbankGuild');
const gbankItems = document.getElementById('gbankItems');
const gtAccountCount = document.getElementById('gtAccountCount');
const gtLastSync = document.getElementById('gtLastSync');

let currentAccounts = [];
let enabledAccounts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('get-config');
});

// Event Listeners
browseBtn.addEventListener('click', () => {
  ipcRenderer.send('browse-folder');
});

testConnectionBtn.addEventListener('click', () => {
  addLog('Testing connection...', 'info');
  ipcRenderer.send('test-connection');
});

syncNowBtn.addEventListener('click', () => {
  addLog('Starting manual sync...', 'info');
  ipcRenderer.send('manual-sync');
});

openDashboardBtn.addEventListener('click', () => {
  ipcRenderer.send('open-dashboard');
});

saveConfigBtn.addEventListener('click', () => {
  saveConfig();
});

installAddonsBtn.addEventListener('click', () => {
  if (wowPathInput.value) {
    addLog('Reinstalling addons...', 'info');
    ipcRenderer.send('install-addons', wowPathInput.value);
  }
});

// IPC Handlers
ipcRenderer.on('config-data', (event, config) => {
  wowPathInput.value = config.wowPath || '';
  autoSyncCheckbox.checked = config.autoSync !== false;
  startWithWindowsCheckbox.checked = !!config.startWithWindows;
  enabledAccounts = config.enabledAccounts || {};

  if (config.lastSyncTime) {
    lastSyncTime.textContent = new Date(config.lastSyncTime).toLocaleString();
  }

  // Reflect current watcher state from main process
  if (config.watcherRunning) {
    watcherStatus.textContent = 'Running';
    watcherStatus.className = 'status-value status-ok';
  }

  if (config.wowPath) {
    ipcRenderer.send('get-accounts', config.wowPath);
    ipcRenderer.send('check-addons', config.wowPath);
    ipcRenderer.send('get-gbank-settings');
    ipcRenderer.send('get-guild-growth-status');
  }
});

ipcRenderer.on('folder-selected', (event, folderPath) => {
  wowPathInput.value = folderPath;
  ipcRenderer.send('get-accounts', folderPath);
  addLog(`WoW folder selected: ${folderPath}`, 'info');
});

ipcRenderer.on('accounts-data', (event, data) => {
  if (data.success) {
    currentAccounts = data.accounts;
    renderAccounts(data.accounts);
    addLog(`Found ${data.accounts.length} account(s)`, 'success');
  } else {
    accountsList.innerHTML = `<p class="placeholder-text">Error: ${data.error}</p>`;
    addLog(`Error discovering accounts: ${data.error}`, 'error');
  }
});

ipcRenderer.on('config-saved', () => {
  addLog('Settings saved successfully!', 'success');
});

ipcRenderer.on('connection-test-result', (event, result) => {
  if (result.success) {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'status-value status-ok';
    addLog('Connection test successful!', 'success');
  } else {
    connectionStatus.textContent = 'Failed';
    connectionStatus.className = 'status-value status-error';
    addLog(`Connection failed: ${result.error}`, 'error');
  }
});

ipcRenderer.on('watcher-started', () => {
  watcherStatus.textContent = 'Running';
  watcherStatus.className = 'status-value status-ok';
  addLog('File watcher started', 'success');
});

ipcRenderer.on('sync-started', () => {
  addLog('Sync in progress...', 'info');
});

ipcRenderer.on('sync-success', (event, data) => {
  lastSyncTime.textContent = new Date().toLocaleString();
  if (data.type === 'prices') {
    addLog('Price data synced successfully!', 'success');
  } else if (data.type === 'guildBank') {
    addLog('Guild bank data synced successfully!', 'success');
  } else if (data.type === 'bankAlt') {
    addLog(`Bank alt data synced: ${data.account || 'Unknown'}`, 'success');
  } else if (data.type === 'bankAltDelete') {
    addLog(`Bank alt data removed from website: ${data.account}`, 'info');
  } else if (data.type === 'guildGrowth') {
    const info = data.data || {};
    addLog(`Guild growth synced: ${info.rosterCount || '?'} members, ${info.eventCount || '?'} events, ${info.under60 || '?'} leveling`, 'success');
    gtLastSync.textContent = new Date().toLocaleString();
  }
});

ipcRenderer.on('sync-error', (event, data) => {
  addLog(`Sync error (${data.type}): ${data.error}`, 'error');
});

ipcRenderer.on('addons-installed', (event, results) => {
  updateAddonStatus(results);
});

ipcRenderer.on('addons-install-result', (event, result) => {
  if (result.success) {
    updateAddonStatus(result.results);
    addLog('Addons installed successfully!', 'success');
  } else {
    addLog(`Addon installation failed: ${result.error}`, 'error');
  }
});

ipcRenderer.on('addons-status', (event, results) => {
  updateAddonStatus(results);
});

ipcRenderer.on('addons-auto-updated', (event, updated) => {
  for (const u of updated) {
    addLog(`Auto-updated addon: ${u.addon} (${u.from || 'new'} → ${u.to})`, 'success');
  }
  // Refresh addon status display
  if (wowPathInput.value) {
    ipcRenderer.send('check-addons', wowPathInput.value);
  }
});

// GBank Settings IPC handlers
ipcRenderer.on('gbank-settings-data', (event, settings) => {
  updateGBankSettingsUI(settings);
});

ipcRenderer.on('gbank-settings-updated', (event, settings) => {
  updateGBankSettingsUI(settings);
  addLog('Guild bank scanner settings updated from in-game.', 'info');
});

ipcRenderer.on('gbank-settings-saved', (event, result) => {
  if (result.success) {
    addLog('Guild bank scanner settings saved. Do /reload in-game to apply.', 'success');
  } else {
    addLog('Failed to save GBank settings: ' + result.error, 'error');
  }
});

ipcRenderer.on('guild-growth-status', (event, data) => {
  if (data.hasData) {
    gtAccountCount.textContent = `${data.accountCount} account(s) detected`;
    gtAccountCount.style.color = '#4caf50';
  } else {
    gtAccountCount.textContent = 'No GuildTracker data found';
    gtAccountCount.style.color = '#f44336';
  }
  if (data.lastSync) {
    gtLastSync.textContent = new Date(data.lastSync).toLocaleString();
  }
});

function updateAddonStatus(results) {
  if (!results || results.length === 0) {
    addonStatus.innerHTML = '<p class="placeholder-text">No addon information available</p>';
    return;
  }

  let html = '<div class="addon-list">';
  for (const result of results) {
    const statusClass = result.success ? 'addon-ok' : 'addon-error';
    const statusIcon = result.success ? '✓' : '✗';
    html += `
      <div class="addon-item ${statusClass}">
        <span class="addon-icon">${statusIcon}</span>
        <span class="addon-name">${result.addon}</span>
        <span class="addon-status-text">${result.success ? 'Installed' : result.error}</span>
      </div>
    `;
  }
  html += '</div>';
  addonStatus.innerHTML = html;
  installAddonsBtn.style.display = 'block';
}

// Helper Functions
function getAccountAddonSettings(accountName) {
  const val = enabledAccounts[accountName];
  if (val === undefined) return { prices: true, gbank: true, bankalt: true, roster: true };
  if (typeof val === 'boolean') return { prices: val, gbank: val, bankalt: val, roster: val };
  if (typeof val === 'object' && val !== null) {
    return {
      prices: val.prices !== false,
      gbank: val.gbank !== false,
      bankalt: val.bankalt !== false,
      roster: val.roster !== false
    };
  }
  return { prices: true, gbank: true, bankalt: true, roster: true };
}

function renderAccounts(accounts) {
  if (accounts.length === 0) {
    accountsList.innerHTML = '<p class="placeholder-text">No accounts found. Make sure you have the addons installed.</p>';
    return;
  }

  let html = '';
  for (const account of accounts) {
    const settings = getAccountAddonSettings(account.name);
    const hasGSS = account.addons.GuildShopSync;
    const hasGBE = account.addons.GBankExport;
    const hasBAE = account.addons.BankAltExport;
    const hasGT = account.addons.GuildTracker;

    const allChecked = settings.prices && settings.gbank && settings.bankalt && settings.roster;
    const noneChecked = !settings.prices && !settings.gbank && !settings.bankalt && !settings.roster;
    const masterChecked = allChecked;
    const masterIndeterminate = !allChecked && !noneChecked;

    html += `
      <div class="account-item">
        <div class="account-header">
          <input type="checkbox"
                 class="master-checkbox"
                 id="master-${account.name}"
                 data-account="${account.name}"
                 ${masterChecked ? 'checked' : ''}
                 onchange="toggleAccountMaster('${account.name}', this.checked)">
          <span class="account-name">${account.name}</span>
        </div>
        <div class="addon-toggles">
          <label class="addon-toggle ${hasGSS ? '' : 'unavailable'}">
            <input type="checkbox"
                   data-account="${account.name}" data-addon="prices"
                   ${settings.prices ? 'checked' : ''}
                   ${hasGSS ? '' : 'disabled'}
                   onchange="toggleAddon('${account.name}', 'prices', this.checked)">
            <span>Prices</span>
          </label>
          <label class="addon-toggle ${hasGBE ? '' : 'unavailable'}">
            <input type="checkbox"
                   data-account="${account.name}" data-addon="gbank"
                   ${settings.gbank ? 'checked' : ''}
                   ${hasGBE ? '' : 'disabled'}
                   onchange="toggleAddon('${account.name}', 'gbank', this.checked)">
            <span>GBank</span>
          </label>
          <label class="addon-toggle ${hasBAE ? '' : 'unavailable'}">
            <input type="checkbox"
                   data-account="${account.name}" data-addon="bankalt"
                   ${settings.bankalt ? 'checked' : ''}
                   ${hasBAE ? '' : 'disabled'}
                   onchange="toggleAddon('${account.name}', 'bankalt', this.checked)">
            <span>BankAlt</span>
          </label>
          <label class="addon-toggle ${hasGT ? '' : 'unavailable'}">
            <input type="checkbox"
                   data-account="${account.name}" data-addon="roster"
                   ${settings.roster ? 'checked' : ''}
                   ${hasGT ? '' : 'disabled'}
                   onchange="toggleAddon('${account.name}', 'roster', this.checked)">
            <span>Roster</span>
          </label>
        </div>
        <div class="character-list">
          ${account.characters.map(c => `
            <div class="character-item">${c.name} - ${c.realm}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  accountsList.innerHTML = html;

  // Set indeterminate state on master checkboxes after DOM render
  for (const account of accounts) {
    const settings = getAccountAddonSettings(account.name);
    const allChecked = settings.prices && settings.gbank && settings.bankalt && settings.roster;
    const noneChecked = !settings.prices && !settings.gbank && !settings.bankalt && !settings.roster;
    const masterEl = document.getElementById(`master-${account.name}`);
    if (masterEl && !allChecked && !noneChecked) {
      masterEl.indeterminate = true;
    }
  }
}

window.toggleAccountMaster = function(accountName, enabled) {
  const settings = { prices: enabled, gbank: enabled, bankalt: enabled, roster: enabled };
  enabledAccounts[accountName] = settings;

  // Update all addon checkboxes for this account
  const addonCheckboxes = document.querySelectorAll(`input[data-account="${accountName}"][data-addon]`);
  for (const cb of addonCheckboxes) {
    if (!cb.disabled) cb.checked = enabled;
  }

  // Clear indeterminate
  const masterEl = document.getElementById(`master-${accountName}`);
  if (masterEl) masterEl.indeterminate = false;
};

window.toggleAddon = function(accountName, addonKey, enabled) {
  // Ensure enabledAccounts[accountName] is an object
  if (typeof enabledAccounts[accountName] !== 'object' || enabledAccounts[accountName] === null) {
    enabledAccounts[accountName] = { prices: true, gbank: true, bankalt: true, roster: true };
  }
  enabledAccounts[accountName][addonKey] = enabled;

  // Update master checkbox state
  const s = enabledAccounts[accountName];
  const allChecked = s.prices && s.gbank && s.bankalt && s.roster;
  const noneChecked = !s.prices && !s.gbank && !s.bankalt && !s.roster;
  const masterEl = document.getElementById(`master-${accountName}`);
  if (masterEl) {
    masterEl.checked = allChecked;
    masterEl.indeterminate = !allChecked && !noneChecked;
  }
};

function saveConfig() {
  const config = {
    wowPath: wowPathInput.value,
    enabledAccounts: enabledAccounts,
    autoSync: autoSyncCheckbox.checked,
    startWithWindows: startWithWindowsCheckbox.checked
  };

  ipcRenderer.send('save-config', config);

  // Also save GBank scanner settings to SavedVariables
  ipcRenderer.send('save-gbank-settings', {
    autoScan: gbankAutoScanCheckbox.checked,
    cooldownMinutes: parseInt(gbankCooldownSelect.value)
  });
}

function updateGBankSettingsUI(settings) {
  if (!settings) return;

  gbankAutoScanCheckbox.checked = settings.autoScan !== false;
  gbankCooldownSelect.value = String(settings.cooldownMinutes != null ? settings.cooldownMinutes : 30);

  if (settings.lastScan) {
    gbankLastScan.textContent = settings.lastScan;
  } else {
    gbankLastScan.textContent = 'No data yet';
  }

  if (settings.guildName) {
    gbankGuild.textContent = settings.guildName;
  } else {
    gbankGuild.textContent = '\u2014';
  }

  if (settings.uniqueItems != null && settings.totalItems != null) {
    gbankItems.textContent = settings.uniqueItems + ' unique | ' + settings.totalItems + ' total';
  } else {
    gbankItems.textContent = '\u2014';
  }
}

function addLog(message, type = '') {
  const entry = document.createElement('p');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

  // Keep only last 50 entries
  while (syncLog.children.length > 50) {
    syncLog.removeChild(syncLog.firstChild);
  }

  syncLog.appendChild(entry);
  syncLog.scrollTop = syncLog.scrollHeight;
}

// Test connection on load
setTimeout(() => {
  ipcRenderer.send('test-connection');
}, 1000);

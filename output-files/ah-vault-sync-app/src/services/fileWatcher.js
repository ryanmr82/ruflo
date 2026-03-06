const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const EventEmitter = require('events');
const { discoverAllGuildTrackerData } = require('./guildTrackerParser');
const { processGuildGrowthData } = require('./guildGrowthProcessor');

class FileWatcher extends EventEmitter {
  constructor(wowPath, enabledAccounts = {}, store = null) {
    super();
    this.wowPath = wowPath;
    this.enabledAccounts = enabledAccounts;
    this.store = store;
    this.watcher = null;
    this.wtfPath = path.join(wowPath, 'WTF', 'Account');
  }

  /**
   * Check if a specific addon is enabled for an account.
   * Handles both old boolean format and new per-addon object format.
   */
  isAddonEnabled(accountName, addonKey) {
    const val = this.enabledAccounts[accountName];
    if (val === undefined) return true;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'object' && val !== null) {
      return val[addonKey] !== false;
    }
    return true;
  }

  discoverAccounts() {
    const accounts = [];

    if (!fs.existsSync(this.wtfPath)) {
      return accounts;
    }

    const accountFolders = fs.readdirSync(this.wtfPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);

    for (const accountName of accountFolders) {
      const accountPath = path.join(this.wtfPath, accountName);
      const savedVarsPath = path.join(accountPath, 'SavedVariables');
      const characters = [];

      // Find realm folders (they contain character folders)
      const realmFolders = fs.readdirSync(accountPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'SavedVariables' && !d.name.startsWith('.'));

      for (const realm of realmFolders) {
        const realmPath = path.join(accountPath, realm.name);
        const charFolders = fs.readdirSync(realmPath, { withFileTypes: true })
          .filter(d => d.isDirectory() && !d.name.startsWith('.'));

        for (const char of charFolders) {
          characters.push({
            name: char.name,
            realm: realm.name,
            path: path.join(realmPath, char.name)
          });
        }
      }

      // Check what addons this account has data for
      const hasGuildShopSync = fs.existsSync(path.join(savedVarsPath, 'GuildShopSync.lua'));
      const hasGBankExport = fs.existsSync(path.join(savedVarsPath, 'GBankExport.lua'));
      const hasBankAltExport = fs.existsSync(path.join(savedVarsPath, 'BankAltExport.lua'));
      const hasGuildTracker = fs.existsSync(path.join(savedVarsPath, 'GuildTracker.lua'));

      accounts.push({
        name: accountName,
        path: accountPath,
        characters,
        addons: {
          GuildShopSync: hasGuildShopSync,
          GBankExport: hasGBankExport,
          BankAltExport: hasBankAltExport,
          GuildTracker: hasGuildTracker
        }
      });
    }

    return accounts;
  }

  start() {
    if (this.watcher) {
      this.stop();
    }

    const watchPaths = [];

    const accounts = this.discoverAccounts();
    for (const account of accounts) {
      const savedVarsPath = path.join(account.path, 'SavedVariables');
      if (!fs.existsSync(savedVarsPath)) continue;

      // Per-addon filtering — only watch files for addons enabled on this account
      if (this.isAddonEnabled(account.name, 'prices')) {
        watchPaths.push(path.join(savedVarsPath, 'GuildShopSync.lua'));
      }
      if (this.isAddonEnabled(account.name, 'gbank')) {
        watchPaths.push(path.join(savedVarsPath, 'GBankExport.lua'));
      }
      if (this.isAddonEnabled(account.name, 'bankalt')) {
        watchPaths.push(path.join(savedVarsPath, 'BankAltExport.lua'));
      }
      if (this.isAddonEnabled(account.name, 'roster')) {
        watchPaths.push(path.join(savedVarsPath, 'GuildTracker.lua'));
      }
    }

    this.watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher.on('change', (filePath) => {
      this.handleFileChange(filePath);
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  handleFileChange(filePath) {
    const fileName = path.basename(filePath);
    const accountMatch = filePath.match(/WTF[\\\/]Account[\\\/]([^\\\/]+)/i);
    const accountName = accountMatch ? accountMatch[1] : null;

    if (fileName === 'GuildShopSync.lua') {
      const data = this.readPriceData(accountName);
      if (data) {
        this.emit('pricesChanged', data);
      }
    } else if (fileName === 'GBankExport.lua') {
      const data = this.readGuildBankData(accountName);
      if (data) {
        this.emit('guildBankChanged', data);
      }
    } else if (fileName === 'BankAltExport.lua') {
      const data = this.readBankAltData(accountName);
      if (data) {
        this.emit('bankAltChanged', { ...data, account: accountName });
      }
    } else if (fileName === 'GuildTracker.lua') {
      const data = this.readGuildGrowthData();
      if (data) {
        this.emit('guildTrackerChanged', data);
      }
    }
  }

  readPriceData(accountName = null) {
    const accounts = this.discoverAccounts();
    const targetAccount = accountName
      ? accounts.find(a => a.name === accountName)
      : accounts.find(a => a.addons.GuildShopSync);

    if (!targetAccount) return null;

    const filePath = path.join(targetAccount.path, 'SavedVariables', 'GuildShopSync.lua');
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.parsePriceData(content);
    } catch (error) {
      console.error('Error reading price data:', error);
      return null;
    }
  }

  parsePriceData(content) {
    // Parse GuildShopSyncDB from Lua SavedVariables
    const prices = {};
    const priceMatch = content.match(/\["prices"\]\s*=\s*\{([^}]+)\}/s);

    if (priceMatch) {
      const priceBlock = priceMatch[1];
      const itemMatches = priceBlock.matchAll(/\["([^"]+)"\]\s*=\s*(\d+)/g);
      for (const match of itemMatches) {
        prices[match[1]] = parseInt(match[2]);
      }
    }

    const scanTimeMatch = content.match(/\["lastSync"\]\s*=\s*"([^"]+)"/) ||
                          content.match(/\["scanTime"\]\s*=\s*"([^"]+)"/);
    const scanTime = scanTimeMatch ? scanTimeMatch[1] : new Date().toISOString();

    return {
      prices,
      scanTime,
      itemCount: Object.keys(prices).length
    };
  }

  readGuildBankData(accountName = null) {
    const accounts = this.discoverAccounts();
    const targetAccount = accountName
      ? accounts.find(a => a.name === accountName)
      : accounts.find(a => a.addons.GBankExport);

    if (!targetAccount) return null;

    const filePath = path.join(targetAccount.path, 'SavedVariables', 'GBankExport.lua');
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for flat data format first
      const flatMatch = content.match(/GBankExport_FlatData\s*=\s*"([^"]+)"/s);
      if (flatMatch) {
        return this.parseGBankFlatData(flatMatch[1]);
      }

      return null;
    } catch (error) {
      console.error('Error reading guild bank data:', error);
      return null;
    }
  }

  parseGBankFlatData(flatData) {
    const lines = flatData.split('\\n');
    const result = {
      exportVersion: '',
      scanTime: '',
      guildName: '',
      tabs: [],
      summary: [],
      totalItems: 0,
      uniqueItems: 0
    };

    let currentTab = null;
    let inSummary = false;

    for (const line of lines) {
      const parts = line.split('|');
      const type = parts[0];

      if (type === 'GBANKEXPORT_V1') {
        result.exportVersion = 'V1';
      } else if (type === 'SCAN_TIME') {
        result.scanTime = parts[1];
      } else if (type === 'GUILD') {
        result.guildName = parts[1];
      } else if (type === 'TAB') {
        currentTab = { tabIndex: parseInt(parts[1]), tabName: parts[2], items: [] };
        result.tabs.push(currentTab);
      } else if (type === 'ITEM' && currentTab) {
        currentTab.items.push({
          name: parts[1],
          count: parseInt(parts[2]),
          quality: parseInt(parts[3]),
          itemId: parts[4],
          slot: parseInt(parts[5])
        });
      } else if (type === 'SUMMARY') {
        inSummary = true;
      } else if (type === 'TOTAL_ITEMS') {
        result.totalItems = parseInt(parts[1]);
      } else if (type === 'UNIQUE_ITEMS') {
        result.uniqueItems = parseInt(parts[1]);
      } else if (type === 'TOTAL' && inSummary) {
        result.summary.push({
          name: parts[1],
          count: parseInt(parts[2]),
          quality: parseInt(parts[3]),
          itemId: parts[4]
        });
      }
    }

    return result;
  }

  readBankAltData(accountName = null) {
    const accounts = this.discoverAccounts();
    const targetAccount = accountName
      ? accounts.find(a => a.name === accountName)
      : accounts.find(a => a.addons.BankAltExport);

    if (!targetAccount) return null;

    const filePath = path.join(targetAccount.path, 'SavedVariables', 'BankAltExport.lua');
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for flat data format
      const flatMatch = content.match(/BankAltExport_FlatData\s*=\s*"([^"]+)"/s);
      if (flatMatch) {
        return this.parseBankAltFlatData(flatMatch[1]);
      }

      return null;
    } catch (error) {
      console.error('Error reading bank alt data:', error);
      return null;
    }
  }

  parseBankAltFlatData(flatData) {
    const lines = flatData.split('\\n');
    const result = {
      exportVersion: '',
      scanTime: '',
      account: '',
      characters: [],
      totalItems: 0
    };

    let currentChar = null;

    for (const line of lines) {
      const parts = line.split('|');
      const type = parts[0];

      if (type === 'BANKALTEXPORT_V1' || type === 'BANKALTEXPORT_V2') {
        result.exportVersion = type.replace('BANKALTEXPORT_', '');
      } else if (type === 'ENDCHAR') {
        currentChar = null;
      } else if (type === 'SCAN_TIME') {
        result.scanTime = parts[1];
      } else if (type === 'ACCOUNT') {
        result.account = parts[1];
      } else if (type === 'CHAR') {
        currentChar = {
          name: parts[1],
          class: parts[2],
          level: parseInt(parts[3]),
          bags: [],
          bank: [],
          totalItems: 0
        };
        result.characters.push(currentChar);
      } else if (type === 'BAG' && currentChar) {
        const item = {
          location: 'BAG',
          bagId: parseInt(parts[1]),
          slot: parseInt(parts[2]),
          name: parts[3],
          count: parseInt(parts[4]),
          quality: parseInt(parts[5]),
          itemId: parts[6]
        };
        currentChar.bags.push(item);
        currentChar.totalItems += item.count;
      } else if (type === 'BANK' && currentChar) {
        const item = {
          location: 'BANK',
          bagId: parseInt(parts[1]),
          slot: parseInt(parts[2]),
          name: parts[3],
          count: parseInt(parts[4]),
          quality: parseInt(parts[5]),
          itemId: parts[6]
        };
        currentChar.bank.push(item);
        currentChar.totalItems += item.count;
      } else if (type === 'TOTAL_ITEMS') {
        result.totalItems = parseInt(parts[1]);
      }
    }

    return result;
  }

  readAllBankAltData() {
    const accounts = this.discoverAccounts();
    const allData = {};

    for (const account of accounts) {
      if (this.isAddonEnabled(account.name, 'bankalt') && account.addons.BankAltExport) {
        const data = this.readBankAltData(account.name);
        if (data) {
          allData[account.name] = data;
        }
      }
    }

    return allData;
  }

  /**
   * Read GuildTracker SavedVariables from enabled accounts only,
   * merge them, and run through the guild growth processor.
   * Filters by enabledAccounts and auto-detects guild name.
   * @returns {Object|null} Processed guild growth data
   */
  readGuildGrowthData() {
    try {
      const allAccountData = discoverAllGuildTrackerData(this.wowPath);
      if (!allAccountData || allAccountData.length === 0) return null;

      // Filter out accounts with roster disabled
      const filtered = allAccountData.filter(acct => {
        if (!this.isAddonEnabled(acct.name, 'roster')) {
          console.log(`Skipping account with roster disabled: ${acct.name}`);
          return false;
        }
        return true;
      });

      if (filtered.length === 0) return null;

      // Process with auto guild name detection (majority vote)
      return processGuildGrowthData(filtered);
    } catch (error) {
      console.error('Error processing guild growth data:', error);
      return null;
    }
  }
}

module.exports = FileWatcher;

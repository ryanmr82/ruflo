/**
 * GuildTracker.lua SavedVariables Parser
 *
 * Parses the WoW SavedVariables Lua table format used by the GuildTracker addon.
 * Returns structured account data suitable for guildGrowthProcessor.processGuildGrowthData().
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse a Lua table string into a JavaScript object.
 * Handles the specific Lua subset used by WoW SavedVariables:
 *   - ["key"] = value  (string keys)
 *   - [number] = value (numeric keys — treated as array indices)
 *   - String values: "..."
 *   - Numeric values: 123, 123.45
 *   - Boolean values: true, false
 *   - Nested tables: { ... }
 *   - nil values (skipped)
 */
function parseLuaTable(src, pos) {
  pos = pos || 0;

  // Skip whitespace
  function skipWS() {
    while (pos < src.length && /\s/.test(src[pos])) pos++;
  }

  // Parse a quoted string (handles escaped quotes)
  function parseString() {
    const quote = src[pos]; // " or '
    pos++; // skip opening quote
    let str = '';
    while (pos < src.length && src[pos] !== quote) {
      if (src[pos] === '\\') {
        pos++;
        if (src[pos] === 'n') str += '\n';
        else if (src[pos] === 't') str += '\t';
        else if (src[pos] === '\\') str += '\\';
        else if (src[pos] === quote) str += quote;
        else str += src[pos];
      } else {
        str += src[pos];
      }
      pos++;
    }
    pos++; // skip closing quote
    return str;
  }

  // Parse a value (string, number, boolean, nil, or table)
  function parseValue() {
    skipWS();
    if (pos >= src.length) return undefined;

    const ch = src[pos];

    // String
    if (ch === '"' || ch === "'") {
      return parseString();
    }

    // Table
    if (ch === '{') {
      return parseTable();
    }

    // Boolean or nil
    if (src.substring(pos, pos + 4) === 'true') {
      pos += 4;
      return true;
    }
    if (src.substring(pos, pos + 5) === 'false') {
      pos += 5;
      return false;
    }
    if (src.substring(pos, pos + 3) === 'nil') {
      pos += 3;
      return null;
    }

    // Number (including negative)
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let numStr = '';
      if (ch === '-') { numStr += '-'; pos++; }
      while (pos < src.length && ((src[pos] >= '0' && src[pos] <= '9') || src[pos] === '.')) {
        numStr += src[pos];
        pos++;
      }
      return parseFloat(numStr);
    }

    return undefined;
  }

  // Parse a table { ... }
  function parseTable() {
    pos++; // skip '{'
    skipWS();

    // Determine if this is an array-style table or a dict-style table
    // We'll collect entries and decide at the end
    const entries = [];
    let hasNumericKeys = false;
    let hasStringKeys = false;

    while (pos < src.length && src[pos] !== '}') {
      skipWS();
      if (pos >= src.length || src[pos] === '}') break;

      // Key-value entry: [key] = value
      if (src[pos] === '[') {
        pos++; // skip '['
        skipWS();

        let key;
        if (src[pos] === '"' || src[pos] === "'") {
          key = parseString();
          hasStringKeys = true;
        } else {
          // Numeric key
          let numStr = '';
          while (pos < src.length && src[pos] !== ']') {
            numStr += src[pos];
            pos++;
          }
          key = parseInt(numStr.trim(), 10);
          hasNumericKeys = true;
        }

        skipWS();
        if (src[pos] === ']') pos++; // skip ']'
        skipWS();
        if (src[pos] === '=') pos++; // skip '='
        skipWS();

        const value = parseValue();
        entries.push({ key, value });
      }
      // Implicit key (unkeyed value — rare in SavedVariables but handle it)
      else if (src[pos] === '{' || src[pos] === '"' || src[pos] === "'" ||
               (src[pos] >= '0' && src[pos] <= '9') || src[pos] === '-' ||
               src.substring(pos, pos + 4) === 'true' || src.substring(pos, pos + 5) === 'false') {
        const value = parseValue();
        hasNumericKeys = true;
        entries.push({ key: entries.length + 1, value });
      }

      // Skip comma and whitespace
      skipWS();
      if (pos < src.length && src[pos] === ',') pos++;
      skipWS();
    }

    if (pos < src.length && src[pos] === '}') pos++; // skip '}'

    // If purely numeric keys (array-style), return as array
    if (hasNumericKeys && !hasStringKeys) {
      const arr = [];
      for (const { key, value } of entries) {
        arr[key - 1] = value; // Lua arrays are 1-based
      }
      return arr;
    }

    // Otherwise return as object
    const obj = {};
    for (const { key, value } of entries) {
      obj[key] = value;
    }
    return obj;
  }

  return parseValue();
}

/**
 * Parse a GuildTracker.lua SavedVariables file.
 * @param {string} content - Raw file content
 * @returns {Object|null} Parsed GuildTracker_DB or null on error
 */
function parseGuildTrackerLua(content) {
  if (!content) return null;

  // Find the start of GuildTracker_DB = { ... }
  const match = content.match(/GuildTracker_DB\s*=\s*\{/);
  if (!match) return null;

  // Find where the table starts (the '{')
  const tableStart = content.indexOf('{', match.index);
  if (tableStart === -1) return null;

  try {
    const result = parseLuaTable(content, tableStart);
    return result;
  } catch (err) {
    console.error('Error parsing GuildTracker Lua:', err.message);
    return null;
  }
}

/**
 * Read and parse a GuildTracker.lua file from disk.
 * @param {string} filePath - Path to GuildTracker.lua
 * @returns {Object|null} Parsed data or null
 */
function readGuildTrackerFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseGuildTrackerLua(content);
  } catch (err) {
    console.error('Error reading GuildTracker file:', filePath, err.message);
    return null;
  }
}

/**
 * Convert parsed GuildTracker_DB into the format expected by
 * guildGrowthProcessor.processGuildGrowthData():
 *   { name, seedDate, seedCount, log, roster, initialized }
 *
 * @param {string} accountName - WoW account name
 * @param {Object} db - Parsed GuildTracker_DB
 * @returns {Object} Account data for the processor
 */
function toAccountData(accountName, db) {
  if (!db) return null;

  // Build roster object (filter out nil entries)
  const roster = {};
  if (db.roster) {
    for (const [name, entry] of Object.entries(db.roster)) {
      if (entry && typeof entry === 'object') {
        roster[name] = {
          class: entry.class || 'Unknown',
          level: entry.level || 0,
          rank: entry.rank || '?',
          lastSeen: entry.lastSeen || '',
          firstSeen: entry.firstSeen || '',
          departed: entry.departed || false,
          departedDate: entry.departedDate || '',
        };
      }
    }
  }

  // Extract guild name (added in addon v1.2)
  const guildName = db.guildName || '';

  // Build log array (Lua arrays are 1-indexed, parser returns 0-indexed JS array)
  const log = [];
  if (db.log && Array.isArray(db.log)) {
    for (const entry of db.log) {
      if (entry && typeof entry === 'object') {
        log.push({
          type: entry.type || '',
          date: entry.date || '',
          name: entry.name || '',
          class: entry.class || 'Unknown',
          level: entry.level || 0,
          rank: entry.rank || '?',
          firstSeen: entry.firstSeen || '',
        });
      }
    }
  }

  return {
    name: accountName,
    guildName,
    seedDate: db.seedDate || '',
    seedCount: db.seedCount || 0,
    log,
    roster,
    initialized: db.initialized || false,
  };
}

/**
 * Discover and parse all GuildTracker SavedVariables from a WoW installation.
 * @param {string} wowPath - Path to the TurtleWoW installation
 * @returns {Array} Array of account data objects
 */
function discoverAllGuildTrackerData(wowPath) {
  const wtfPath = path.join(wowPath, 'WTF', 'Account');
  if (!fs.existsSync(wtfPath)) return [];

  const accounts = [];

  const accountFolders = fs.readdirSync(wtfPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);

  for (const accountName of accountFolders) {
    const gtFile = path.join(wtfPath, accountName, 'SavedVariables', 'GuildTracker.lua');
    if (!fs.existsSync(gtFile)) continue;

    const db = readGuildTrackerFile(gtFile);
    if (!db) continue;

    const data = toAccountData(accountName, db);
    if (data && data.initialized) {
      accounts.push(data);
    }
  }

  return accounts;
}

module.exports = {
  parseLuaTable,
  parseGuildTrackerLua,
  readGuildTrackerFile,
  toAccountData,
  discoverAllGuildTrackerData,
};

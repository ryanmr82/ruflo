const fs = require('fs');
const https = require('https');

const content = fs.readFileSync('C:/TurtleWoW/WTF/Account/STORMSHADOW/SavedVariables/GBankExport.lua', 'utf8');

const flatMatch = content.match(/GBankExport_FlatData\s*=\s*"([^"]+)"/s);
if (!flatMatch) {
  console.log('ERROR: No flat data found');
  process.exit(1);
}

const flatData = flatMatch[1];
const lines = flatData.split('\\n');
console.log('Lines:', lines.length);

const result = { exportVersion: '', scanTime: '', guildName: '', tabs: [], summary: [], totalItems: 0, uniqueItems: 0 };
let currentTab = null;
let inSummary = false;

for (const line of lines) {
  const parts = line.split('|');
  const type = parts[0];
  if (type === 'GBANKEXPORT_V1') result.exportVersion = 'V1';
  else if (type === 'SCAN_TIME') result.scanTime = parts[1];
  else if (type === 'GUILD') result.guildName = parts[1];
  else if (type === 'TAB') { currentTab = { tabIndex: parseInt(parts[1]), tabName: parts[2], items: [] }; result.tabs.push(currentTab); }
  else if (type === 'ITEM' && currentTab) { currentTab.items.push({ name: parts[1], count: parseInt(parts[2]), quality: parseInt(parts[3]), itemId: parts[4], slot: parseInt(parts[5]) }); }
  else if (type === 'SUMMARY') inSummary = true;
  else if (type === 'TOTAL_ITEMS') result.totalItems = parseInt(parts[1]);
  else if (type === 'UNIQUE_ITEMS') result.uniqueItems = parseInt(parts[1]);
  else if (type === 'TOTAL' && inSummary) { result.summary.push({ name: parts[1], count: parseInt(parts[2]), quality: parseInt(parts[3]), itemId: parts[4] }); }
}

console.log('Guild:', result.guildName, '| Scan time:', result.scanTime, '| Tabs:', result.tabs.length, '| Total items:', result.totalItems);

const data = JSON.stringify(result);
const options = {
  hostname: 'tbcguild.duckdns.org',
  path: '/api/guild-bank/inventory',
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Server response:', res.statusCode, body));
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();

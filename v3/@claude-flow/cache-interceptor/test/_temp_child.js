
const fs = require('fs');
const path = require('path');
const os = require('os');

// Find the largest session
const claudeDir = path.join(os.homedir(), '.claude', 'projects');
let largestSession = null;
let largestSize = 0;

function findSessions(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSessions(fullPath);
    } else if (entry.name.endsWith('.jsonl')) {
      const stats = fs.statSync(fullPath);
      if (stats.size > largestSize) {
        largestSize = stats.size;
        largestSession = fullPath;
      }
    }
  }
}

findSessions(claudeDir);

if (!largestSession) {
  console.log(JSON.stringify({ error: 'No sessions found' }));
  process.exit(1);
}

// Read the file - this should be intercepted!
const content = fs.readFileSync(largestSession, 'utf8');
const lines = content.trim().split('\n');

// Parse types
const types = {};
for (const line of lines) {
  try {
    const parsed = JSON.parse(line);
    types[parsed.type] = (types[parsed.type] || 0) + 1;
  } catch {}
}

// Output results
console.log(JSON.stringify({
  sessionPath: largestSession,
  originalSize: largestSize,
  interceptedSize: content.length,
  messageCount: lines.length,
  reduction: ((1 - content.length / largestSize) * 100).toFixed(1),
  types
}));

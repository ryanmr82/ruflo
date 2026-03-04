/**
 * Test: GuildTracker parser + GuildGrowth processor
 * Verifies JS output matches known Python output.
 */

const path = require('path');
const { discoverAllGuildTrackerData, readGuildTrackerFile, toAccountData } = require('../src/services/guildTrackerParser');
const { processGuildGrowthData, xpBetweenLevels } = require('../src/services/guildGrowthProcessor');

const WOW_PATH = 'C:\\TurtleWoW';
let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label} — ${detail || 'FAILED'}`);
    failed++;
  }
}

// ============================================================
// Test 1: XP table sanity checks
// ============================================================
console.log('\n=== Test 1: XP Table ===');
assert(xpBetweenLevels(1, 2) === 400, 'XP 1→2 = 400');
assert(xpBetweenLevels(59, 60) === 209800, 'XP 59→60 = 209800');
assert(xpBetweenLevels(54, 56) === 173900 + 180800, 'XP 54→56 = 354700', `got ${xpBetweenLevels(54, 56)}`);
assert(xpBetweenLevels(10, 10) === 0, 'Same level = 0 XP');
assert(xpBetweenLevels(60, 61) === 217400, 'XP 60→61 = 217400 (edge)');

// ============================================================
// Test 2: Lua parser — individual account
// ============================================================
console.log('\n=== Test 2: Lua Parser (STORMBANK) ===');
const stormFile = path.join(WOW_PATH, 'WTF', 'Account', 'STORMBANK', 'SavedVariables', 'GuildTracker.lua');
const stormDb = readGuildTrackerFile(stormFile);
assert(stormDb !== null, 'STORMBANK parsed successfully');
assert(stormDb.initialized === true, 'initialized = true');
assert(stormDb.seedCount === 48, `seedCount = 48`, `got ${stormDb.seedCount}`);
assert(stormDb.seedDate === '03/03/26 01:13', `seedDate = 03/03/26 01:13`, `got ${stormDb.seedDate}`);
assert(typeof stormDb.roster === 'object', 'roster is object');
const rosterCount = Object.keys(stormDb.roster).length;
assert(rosterCount === 48, `roster has 48 entries`, `got ${rosterCount}`);
assert(Array.isArray(stormDb.log), 'log is array');
assert(stormDb.log.length === 1, `log has 1 entry`, `got ${stormDb.log.length}`);
assert(stormDb.log[0].type === 'leave', 'log[0] is leave event');
assert(stormDb.log[0].name === 'Oponn', 'log[0].name = Oponn');

// Check a specific roster entry
assert(stormDb.roster['Tickox'] && stormDb.roster['Tickox'].level === 41, 'Tickox level = 41');
assert(stormDb.roster['Tickox'].class === 'Warlock', 'Tickox class = Warlock');

// ============================================================
// Test 3: Lua parser — account with departed members and logs
// ============================================================
console.log('\n=== Test 3: Lua Parser (REEE_V — oldest seed) ===');
const reeFile = path.join(WOW_PATH, 'WTF', 'Account', 'REEE_V', 'SavedVariables', 'GuildTracker.lua');
const reeDb = readGuildTrackerFile(reeFile);
assert(reeDb !== null, 'REEE_V parsed successfully');
assert(reeDb.seedDate === '02/24/26 14:55', `seedDate = 02/24/26 14:55`, `got ${reeDb.seedDate}`);
assert(reeDb.seedCount === 366, `seedCount = 366`, `got ${reeDb.seedCount}`);

// Check log entries
const reeJoins = reeDb.log.filter(e => e.type === 'join').length;
const reeLeaves = reeDb.log.filter(e => e.type === 'leave').length;
console.log(`  ℹ REEE_V joins=${reeJoins}, leaves=${reeLeaves}`);
assert(reeJoins > 100, `REEE_V has >100 joins (got ${reeJoins})`);
assert(reeLeaves > 10, `REEE_V has >10 leaves (got ${reeLeaves})`);

// Check departed members exist
const departedCount = Object.values(reeDb.roster).filter(e => e.departed).length;
console.log(`  ℹ REEE_V departed members: ${departedCount}`);
assert(departedCount > 0, 'Has departed members');

// ============================================================
// Test 4: Discover all accounts
// ============================================================
console.log('\n=== Test 4: Discover All Accounts ===');
const allAccounts = discoverAllGuildTrackerData(WOW_PATH);
console.log(`  ℹ Found ${allAccounts.length} accounts with GuildTracker data`);
assert(allAccounts.length === 7, `7 accounts found`, `got ${allAccounts.length}`);

for (const acct of allAccounts) {
  const rCount = Object.keys(acct.roster).length;
  const lCount = acct.log.length;
  console.log(`  ℹ ${acct.name}: seed=${acct.seedDate}, seedCount=${acct.seedCount}, roster=${rCount}, log=${lCount}`);
}

// ============================================================
// Test 5: Process full guild growth data
// ============================================================
console.log('\n=== Test 5: Full Processor Output ===');
const result = processGuildGrowthData(allAccounts);
assert(result !== null, 'processGuildGrowthData returned data');

// Known Python output values
console.log(`  ℹ seedDate: ${result.seedDate}`);
console.log(`  ℹ seedCount: ${result.seedCount}`);
console.log(`  ℹ currentRosterCount: ${result.currentRosterCount}`);
console.log(`  ℹ totalJoins: ${result.summary.totalJoins}`);
console.log(`  ℹ totalLeaves: ${result.summary.totalLeaves}`);
console.log(`  ℹ netGrowth: ${result.summary.netGrowth}`);
console.log(`  ℹ daysTracked: ${result.summary.daysTracked}`);
console.log(`  ℹ eventCount: ${result.events.length}`);
console.log(`  ℹ level60Joins: ${result.summary.level60Joins}`);

assert(result.seedDate === '02/24/26 14:55', `seedDate = 02/24/26 14:55`, `got ${result.seedDate}`);
assert(result.seedCount === 366, `seedCount = 366`, `got ${result.seedCount}`);

// These should be close to Python output (exact match depends on dedup timing)
assert(result.currentRosterCount >= 460 && result.currentRosterCount <= 490,
  `currentRosterCount ~474 (freshest scan)`, `got ${result.currentRosterCount}`);
assert(result.summary.totalJoins >= 180 && result.summary.totalJoins <= 210,
  `totalJoins ~194 (range 180-210)`, `got ${result.summary.totalJoins}`);
assert(result.summary.totalLeaves >= 20 && result.summary.totalLeaves <= 35,
  `totalLeaves ~27 (range 20-35)`, `got ${result.summary.totalLeaves}`);
assert(result.summary.level60Joins >= 30 && result.summary.level60Joins <= 45,
  `level60Joins ~36 (range 30-45)`, `got ${result.summary.level60Joins}`);

// ============================================================
// Test 6: Leveling tracker output
// ============================================================
console.log('\n=== Test 6: Leveling Tracker ===');
const lt = result.levelingTracker;
assert(lt !== null && lt !== undefined, 'levelingTracker exists');
console.log(`  ℹ totalUnder60: ${lt.totalUnder60}`);
console.log(`  ℹ hot: ${lt.hotCount}, active: ${lt.activeCount}, slow: ${lt.slowCount}`);
console.log(`  ℹ stagnant: ${lt.stagnantCount}, atRisk: ${lt.atRiskCount}, new: ${lt.newCount}`);
console.log(`  ℹ snapshotDays: ${lt.snapshotDays}`);

assert(lt.totalUnder60 >= 200 && lt.totalUnder60 <= 800,
  `totalUnder60 200-800 (merged roster)`, `got ${lt.totalUnder60}`);
assert(lt.hotCount >= 1, `hotCount >= 1 (min/max level diff detected)`, `got ${lt.hotCount}`);
assert(lt.activeCount >= 1, `activeCount >= 1`, `got ${lt.activeCount}`);

// Check top candidates
const hotCandidates = lt.candidates.filter(c => c.status === 'HOT');
const activeCandidates = lt.candidates.filter(c => c.status === 'ACTIVE');
console.log(`  ℹ HOT candidates: ${hotCandidates.map(c => `${c.name} ${c.xpPerDay}xp/day`).join(', ') || 'none'}`);
console.log(`  ℹ ACTIVE candidates: ${activeCandidates.map(c => `${c.name} ${c.xpPerDay}xp/day`).join(', ') || 'none'}`);

// Velocity distribution
console.log('  ℹ Velocity distribution:');
for (const vd of lt.velocityDistribution) {
  console.log(`    ${vd.range}: ${vd.count}`);
}

// ============================================================
// Test 7: Data structure integrity
// ============================================================
console.log('\n=== Test 7: Data Structure ===');
assert(Array.isArray(result.dailyStats), 'dailyStats is array');
assert(result.dailyStats.length > 0, `dailyStats has entries (${result.dailyStats.length})`);
assert(Array.isArray(result.classBreakdown), 'classBreakdown is array');
assert(result.classBreakdown.length > 0, 'classBreakdown has entries');
assert(Array.isArray(result.levelDistribution), 'levelDistribution is array');
assert(result.levelDistribution.length === 7, `levelDistribution has 7 ranges`, `got ${result.levelDistribution.length}`);
assert(Array.isArray(result.events), 'events is array');
assert(result.events.length > 0, 'events has entries');
assert(typeof result.summary === 'object', 'summary is object');
assert(typeof result.summary.overallRetentionPct === 'number', 'retentionPct is number');

// Check no account names leaked
const jsonStr = JSON.stringify(result);
assert(!jsonStr.includes('KRR86'), 'No account name KRR86 in output');
assert(!jsonStr.includes('REEE_V'), 'No account name REEE_V in output');

// ============================================================
// Summary
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  console.log('⚠️  Some tests failed — review output above');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
}

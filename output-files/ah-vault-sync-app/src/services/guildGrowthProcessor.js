/**
 * Guild Growth Processor — processes GuildTracker SavedVariables from
 * multiple WoW accounts into a unified guild-growth-data.json.
 *
 * Port of parse_guild_tracker_v2.py (v3) to JavaScript.
 * Handles: roster merging, event deduplication, XP-based leveling velocity,
 * daily stats, class breakdown, level distribution, retention metrics.
 */

// Vanilla WoW XP required per level (XP to go from level N to N+1)
// Source: https://warcraft.wiki.gg/wiki/Experience_to_level
const XP_PER_LEVEL = {
  1: 400, 2: 900, 3: 1400, 4: 2100, 5: 2800,
  6: 3600, 7: 4500, 8: 5400, 9: 6500, 10: 7600,
  11: 8800, 12: 10100, 13: 11400, 14: 12900, 15: 14400,
  16: 16000, 17: 17700, 18: 19400, 19: 21300, 20: 23200,
  21: 25200, 22: 27300, 23: 29400, 24: 31700, 25: 34000,
  26: 36400, 27: 38900, 28: 41400, 29: 44300, 30: 47400,
  31: 50800, 32: 54500, 33: 58600, 34: 62800, 35: 67100,
  36: 71600, 37: 76100, 38: 80800, 39: 85700, 40: 90700,
  41: 95800, 42: 101000, 43: 106300, 44: 111800, 45: 117500,
  46: 123200, 47: 129100, 48: 135100, 49: 141200, 50: 147500,
  51: 153900, 52: 160400, 53: 167100, 54: 173900, 55: 180800,
  56: 187900, 57: 195000, 58: 202300, 59: 209800, 60: 217400,
};

/**
 * Calculate total XP required to go from fromLevel to toLevel.
 */
function xpBetweenLevels(fromLevel, toLevel) {
  if (fromLevel >= toLevel || fromLevel < 1) return 0;
  let total = 0;
  for (let lvl = fromLevel; lvl < Math.min(toLevel, 61); lvl++) {
    total += (XP_PER_LEVEL[lvl] || 0);
  }
  return total;
}

/**
 * Convert 'MM/DD/YY HH:MM' to a sortable integer.
 */
function parseDateToSortkey(datestr) {
  if (!datestr) return 0;
  const m = datestr.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (!m) return 0;
  const mo = parseInt(m[1], 10);
  const d = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const h = parseInt(m[4], 10);
  const mi = parseInt(m[5], 10);
  return y * 100000000 + mo * 1000000 + d * 10000 + h * 100 + mi;
}

/**
 * Extract just the date portion from 'MM/DD/YY HH:MM'.
 */
function dateToDay(datestr) {
  if (!datestr) return '';
  return datestr.split(' ')[0];
}

/**
 * Convert date string to rough days since epoch for comparison.
 */
function dateToDaysEpoch(datestr) {
  if (!datestr) return 0;
  const m = datestr.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (!m) return 0;
  const mo = parseInt(m[1], 10);
  const d = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const h = parseInt(m[4], 10);
  const mi = parseInt(m[5], 10);
  return (2000 + y) * 365 + mo * 30 + d + h / 24.0 + mi / 1440.0;
}

/**
 * Deduplicate events across accounts within 48-hour windows.
 */
function deduplicateEvents(allEvents) {
  // Group by (name, type)
  const groups = {};
  for (const ev of allEvents) {
    const key = `${ev.name || ''}|${ev.type || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }

  const deduped = [];

  for (const key of Object.keys(groups)) {
    const events = groups[key];
    events.sort((a, b) => parseDateToSortkey(a.date) - parseDateToSortkey(b.date));

    const clusters = [];
    for (const ev of events) {
      const sk = parseDateToSortkey(ev.date);
      let merged = false;
      for (const cluster of clusters) {
        const clusterSk = parseDateToSortkey(cluster[0].date);
        if (Math.abs(sk - clusterSk) <= 4800) {
          cluster.push(ev);
          merged = true;
          break;
        }
      }
      if (!merged) {
        clusters.push([ev]);
      }
    }

    for (const cluster of clusters) {
      cluster.sort((a, b) => parseDateToSortkey(a.date) - parseDateToSortkey(b.date));
      let best = cluster[0];
      for (let i = 1; i < cluster.length; i++) {
        const ev = cluster[i];
        if (Object.keys(ev).length > Object.keys(best).length) {
          best = { ...ev, date: cluster[0].date };
        }
      }
      deduped.push(best);
    }
  }

  deduped.sort((a, b) => parseDateToSortkey(a.date) - parseDateToSortkey(b.date));
  return deduped;
}

/**
 * Process all account data into the final guild-growth-data.json structure.
 *
 * @param {Array} accountDataList - Array of { name, seedDate, seedCount, log, roster, initialized }
 * @returns {Object} The complete guild growth data object
 */
function processGuildGrowthData(accountDataList) {
  if (!accountDataList || accountDataList.length === 0) {
    return null;
  }

  const accounts = [];
  const allEvents = [];
  let bestSeedDate = null;
  let bestSeedCount = 0;
  let bestSeedSortkey = 99999999999;
  const allRosters = []; // [{ sortkey, accountName, roster }]

  for (const acctData of accountDataList) {
    const sk = parseDateToSortkey(acctData.seedDate || '');

    accounts.push({
      name: acctData.name,
      seedDate: acctData.seedDate,
      seedCount: acctData.seedCount || 0,
      logEntries: (acctData.log || []).length,
      rosterSize: Object.keys(acctData.roster || {}).length,
      initialized: acctData.initialized || false,
    });

    allEvents.push(...(acctData.log || []));

    // Track earliest seed
    if (sk > 0 && sk < bestSeedSortkey) {
      bestSeedSortkey = sk;
      bestSeedDate = acctData.seedDate;
      bestSeedCount = acctData.seedCount || 0;
    }

    allRosters.push({ sortkey: sk, accountName: acctData.name, roster: acctData.roster || {} });
  }

  // ================================================================
  // MERGE ROSTERS: oldest first so newer data overwrites stale data
  // ================================================================
  allRosters.sort((a, b) => a.sortkey - b.sortkey);
  const mergedRoster = {};

  for (const { roster } of allRosters) {
    for (const [name, entry] of Object.entries(roster)) {
      const existing = mergedRoster[name];
      if (!existing) {
        mergedRoster[name] = entry;
      } else {
        const newRank = (entry.rank || '');
        const oldRank = (existing.rank || '');
        // Prefer non-stale rank over "Leave of Absenc" truncated rank
        if (oldRank.includes('Leave of Absen') && !newRank.includes('Leave of Absen')) {
          mergedRoster[name] = entry;
        } else if (!oldRank.includes('Leave of Absen') && !newRank.includes('Leave of Absen')) {
          // Both real ranks; prefer newer
          mergedRoster[name] = entry;
        }
        // If new is also Leave of Absenc, keep existing
      }
    }
  }

  // ================================================================
  // DEDUPLICATE EVENTS
  // ================================================================
  const deduped = deduplicateEvents(allEvents);

  // ================================================================
  // CROSS-REFERENCE: Update stale ranks/levels from current roster
  // ================================================================
  let staleRankFixes = 0;
  let levelUpdates = 0;
  for (const ev of deduped) {
    const name = ev.name || '';
    if (mergedRoster[name]) {
      const rosterEntry = mergedRoster[name];
      const oldRank = ev.rank || '';
      const newRank = rosterEntry.rank || oldRank;
      if (oldRank !== newRank) {
        ev.rank = newRank;
        staleRankFixes++;
      }
      const oldLevel = ev.level || 0;
      const newLevel = rosterEntry.level || oldLevel;
      if (newLevel > oldLevel) {
        ev.level = newLevel;
        levelUpdates++;
      }
    }
  }

  // ================================================================
  // CLASSIFY LEAVE EVENTS: LoA kick vs other departure
  // ================================================================
  for (const ev of deduped) {
    if (ev.type !== 'leave') continue;
    const rank = (ev.rank || '').toLowerCase();
    ev.leaveType = rank.includes('leave of absen') ? 'loa' : 'other';
  }

  // ================================================================
  // DAILY STATS
  // ================================================================
  const daily = {};
  for (const ev of deduped) {
    const day = dateToDay(ev.date);
    if (!day) continue;
    if (!daily[day]) daily[day] = { joins: 0, leaves: 0, loaKicks: 0, otherLeaves: 0 };
    if (ev.type === 'join') daily[day].joins++;
    else if (ev.type === 'leave') {
      daily[day].leaves++;
      if (ev.leaveType === 'loa') daily[day].loaKicks++;
      else daily[day].otherLeaves++;
    }
  }

  const dailySummary = Object.entries(daily)
    .sort((a, b) => parseDateToSortkey(a[0] + ' 00:00') - parseDateToSortkey(b[0] + ' 00:00'))
    .map(([date, stats]) => ({
      date,
      joins: stats.joins,
      leaves: stats.leaves,
      net: stats.joins - stats.leaves,
    }));

  let runningTotal = bestSeedCount;
  for (const ds of dailySummary) {
    runningTotal += ds.net;
    ds.cumulativeTotal = runningTotal;
  }

  // ================================================================
  // CLASS BREAKDOWN
  // ================================================================
  const classJoins = {};
  const classLeaves = {};
  for (const ev of deduped) {
    const cls = ev.class || 'Unknown';
    if (ev.type === 'join') classJoins[cls] = (classJoins[cls] || 0) + 1;
    else if (ev.type === 'leave') classLeaves[cls] = (classLeaves[cls] || 0) + 1;
  }

  const allClasses = [...new Set([...Object.keys(classJoins), ...Object.keys(classLeaves)])].sort();
  const classBreakdown = allClasses.map(cls => ({
    class: cls,
    joins: classJoins[cls] || 0,
    leaves: classLeaves[cls] || 0,
    net: (classJoins[cls] || 0) - (classLeaves[cls] || 0),
  }));
  classBreakdown.sort((a, b) => b.joins - a.joins);

  // ================================================================
  // LEVEL DISTRIBUTION
  // ================================================================
  const levelRanges = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60': 0 };
  const level60Joins = [];
  for (const ev of deduped) {
    if (ev.type !== 'join') continue;
    const lvl = ev.level || 0;
    if (lvl >= 60) { levelRanges['60']++; level60Joins.push(ev); }
    else if (lvl >= 50) levelRanges['50-59']++;
    else if (lvl >= 40) levelRanges['40-49']++;
    else if (lvl >= 30) levelRanges['30-39']++;
    else if (lvl >= 20) levelRanges['20-29']++;
    else if (lvl >= 10) levelRanges['10-19']++;
    else levelRanges['1-9']++;
  }

  const levelDistribution = Object.entries(levelRanges).map(([range, count]) => ({ range, count }));

  // ================================================================
  // RETENTION
  // ================================================================
  const joinNames = new Set(deduped.filter(e => e.type === 'join').map(e => e.name));
  const leaveNames = new Set(deduped.filter(e => e.type === 'leave').map(e => e.name));
  const joinersWhoLeft = new Set([...joinNames].filter(n => leaveNames.has(n)));

  const totalJoins = deduped.filter(e => e.type === 'join').length;
  const totalLeaves = deduped.filter(e => e.type === 'leave').length;
  const loaKicks = deduped.filter(e => e.type === 'leave' && e.leaveType === 'loa').length;
  const otherLeaves = totalLeaves - loaKicks;
  const joinerRetentionPct = ((totalJoins - joinersWhoLeft.size) / Math.max(totalJoins, 1)) * 100;

  const lv60JoinNames = new Set(level60Joins.map(e => e.name));
  const lv60WhoLeft = new Set([...lv60JoinNames].filter(n => leaveNames.has(n)));
  const lv60RetentionPct = ((lv60JoinNames.size - lv60WhoLeft.size) / Math.max(lv60JoinNames.size, 1)) * 100;

  const under60Joins = totalJoins - level60Joins.length;
  const under60Left = joinersWhoLeft.size - lv60WhoLeft.size;
  const under60RetentionPct = ((under60Joins - under60Left) / Math.max(under60Joins, 1)) * 100;

  // ================================================================
  // FRESHEST ROSTER — used for current member count and leveling tracker
  // ================================================================
  let currentRosterCount = 0;
  let newestLastSeen = 0;
  let freshestRoster = {};
  for (const { roster } of allRosters) {
    let maxLs = 0;
    let activeCount = 0;
    for (const entry of Object.values(roster)) {
      if (!entry.departed) activeCount++;
      const ls = parseDateToSortkey(entry.lastSeen || '');
      if (ls > maxLs) maxLs = ls;
    }
    if (maxLs > newestLastSeen) {
      newestLastSeen = maxLs;
      currentRosterCount = activeCount;
      freshestRoster = roster;
    }
  }

  // ================================================================
  // LEVELING VELOCITY TRACKER
  // Uses MIN level across ALL accounts (oldest known snapshot) vs
  // MAX level across ALL accounts (most current) for each member.
  // This survives account rescans that update old snapshots.
  // ================================================================
  const oldSeedDate = allRosters[0] ? accounts.find(a => a.name === allRosters[0].accountName)?.seedDate : null;
  const newSeedDate = allRosters.length > 0
    ? accounts.find(a => a.name === allRosters[allRosters.length - 1].accountName)?.seedDate
    : null;

  let snapshotDays = dateToDaysEpoch(newSeedDate) - dateToDaysEpoch(oldSeedDate);
  if (snapshotDays < 1) snapshotDays = 1;

  // For each member, find MIN level and MAX level across ALL account rosters.
  // Also build lastSeen map and collect best metadata (class, rank, etc.)
  const memberMinLevel = {};  // name -> lowest level seen
  const memberMaxLevel = {};  // name -> highest level seen
  const memberBestMeta = {};  // name -> { class, rank, firstSeen, departed }
  const lastSeenMap = {};

  for (const { roster } of allRosters) {
    for (const [name, entry] of Object.entries(roster)) {
      const lvl = entry.level || 0;
      if (lvl > 0) {
        if (memberMinLevel[name] === undefined || lvl < memberMinLevel[name]) {
          memberMinLevel[name] = lvl;
        }
        if (memberMaxLevel[name] === undefined || lvl > memberMaxLevel[name]) {
          memberMaxLevel[name] = lvl;
        }
      }

      // Track best metadata (prefer non-departed, non-LoA entries)
      const existing = memberBestMeta[name];
      if (!existing) {
        memberBestMeta[name] = {
          class: entry.class || 'Unknown',
          rank: entry.rank || '?',
          firstSeen: entry.firstSeen || '',
          departed: entry.departed || false,
        };
      } else {
        // Prefer non-departed over departed
        if (existing.departed && !entry.departed) {
          memberBestMeta[name] = {
            class: entry.class || existing.class,
            rank: entry.rank || existing.rank,
            firstSeen: existing.firstSeen || entry.firstSeen || '',
            departed: false,
          };
        } else if (!existing.departed && !entry.departed) {
          // Both active — prefer better rank (non-LoA)
          const newRank = entry.rank || '';
          const oldRank = existing.rank || '';
          if (oldRank.includes('Leave of Absen') && !newRank.includes('Leave of Absen') && newRank) {
            existing.rank = newRank;
          }
        }
      }

      // Build lastSeen map
      const ls = entry.lastSeen || '';
      if (ls) {
        const existingLs = lastSeenMap[name] || '';
        if (!existingLs || parseDateToSortkey(ls) > parseDateToSortkey(existingLs)) {
          lastSeenMap[name] = ls;
        }
      }
    }
  }

  const levelingCandidates = [];

  // Use freshest roster for current members — only track people actually in the guild
  for (const [name, rosterEntry] of Object.entries(freshestRoster)) {
    if (rosterEntry.departed) continue;
    const maxLevel = memberMaxLevel[name] || 0;
    if (maxLevel >= 60) continue;

    const minLevel = memberMinLevel[name] || 0;
    const hasOldSnapshot = minLevel > 0 && minLevel < maxLevel;
    const levelsGained = hasOldSnapshot ? maxLevel - minLevel : 0;

    // XP-based velocity
    const xpGained = hasOldSnapshot ? xpBetweenLevels(minLevel, maxLevel) : 0;
    const xpPerDay = hasOldSnapshot ? Math.round(xpGained / snapshotDays) : 0;

    const lastSeen = lastSeenMap[name] || '';
    let daysSinceLastSeen = 0;
    if (lastSeen && newSeedDate) {
      daysSinceLastSeen = Math.round((dateToDaysEpoch(newSeedDate) - dateToDaysEpoch(lastSeen)) * 10) / 10;
      if (daysSinceLastSeen < 0) daysSinceLastSeen = 0;
    }

    const meta = memberBestMeta[name] || {};

    // Classify status using XP thresholds
    let status;
    if (!hasOldSnapshot) {
      status = 'NEW';
    } else if (xpPerDay >= 30000) {
      status = 'HOT';
    } else if (xpPerDay >= 10000) {
      status = 'ACTIVE';
    } else if (xpGained > 0) {
      status = 'SLOW';
    } else if (maxLevel < 20) {
      status = 'AT_RISK';
    } else {
      status = 'STAGNANT';
    }

    levelingCandidates.push({
      name,
      class: meta.class || rosterEntry.class || 'Unknown',
      rank: meta.rank || rosterEntry.rank || '?',
      currentLevel: maxLevel,
      previousLevel: hasOldSnapshot ? minLevel : null,
      levelsGained: hasOldSnapshot ? levelsGained : null,
      xpGained: hasOldSnapshot ? xpGained : null,
      xpPerDay: hasOldSnapshot ? xpPerDay : null,
      lastSeen,
      daysSinceLastSeen,
      status,
      firstSeen: meta.firstSeen || rosterEntry.firstSeen || '',
    });
  }

  // Sort: HOT first, then ACTIVE, SLOW, NEW, STAGNANT, AT_RISK
  const statusOrder = { HOT: 1, ACTIVE: 2, SLOW: 3, NEW: 4, STAGNANT: 5, AT_RISK: 6 };
  levelingCandidates.sort((a, b) => {
    const orderDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    if (orderDiff !== 0) return orderDiff;
    return -((a.xpPerDay || 0) - (b.xpPerDay || 0));
  });

  const hotCount = levelingCandidates.filter(c => c.status === 'HOT').length;
  const activeCount = levelingCandidates.filter(c => c.status === 'ACTIVE').length;
  const slowCount = levelingCandidates.filter(c => c.status === 'SLOW').length;
  const stagnantCount = levelingCandidates.filter(c => c.status === 'STAGNANT').length;
  const atRiskCount = levelingCandidates.filter(c => c.status === 'AT_RISK').length;
  const newCount = levelingCandidates.filter(c => c.status === 'NEW').length;

  // Velocity distribution (XP/day ranges)
  const velRanges = { '0': 0, '1-5k': 0, '5k-10k': 0, '10k-20k': 0, '20k-30k': 0, '30k+': 0 };
  for (const c of levelingCandidates) {
    const v = c.xpPerDay;
    if (v === null || v === 0) velRanges['0']++;
    else if (v < 5000) velRanges['1-5k']++;
    else if (v < 10000) velRanges['5k-10k']++;
    else if (v < 20000) velRanges['10k-20k']++;
    else if (v < 30000) velRanges['20k-30k']++;
    else velRanges['30k+']++;
  }

  const velocityDistribution = Object.entries(velRanges).map(([range, count]) => ({ range, count }));

  const levelingTracker = {
    snapshotDays: Math.round(snapshotDays * 10) / 10,
    oldSnapshotDate: oldSeedDate,
    newSnapshotDate: newSeedDate,
    totalUnder60: levelingCandidates.length,
    hotCount,
    activeCount,
    slowCount,
    stagnantCount,
    atRiskCount,
    newCount,
    velocityDistribution,
    candidates: levelingCandidates,
  };

  // ================================================================
  // BUILD OUTPUT
  // ================================================================
  const lastEvent = deduped.length > 0 ? deduped[deduped.length - 1] : {};
  const lastUpdated = lastEvent.date || 'Unknown';

  return {
    seedDate: bestSeedDate,
    seedCount: bestSeedCount,
    lastUpdated,
    currentEstimate: runningTotal,
    currentRosterCount,
    summary: {
      totalJoins,
      totalLeaves,
      loaKicks,
      otherLeaves,
      netGrowth: totalJoins - totalLeaves,
      growthPct: Math.round(((totalJoins - totalLeaves) / Math.max(bestSeedCount, 1)) * 1000) / 10,
      trueNetGrowth: currentRosterCount - bestSeedCount,
      trueGrowthPct: Math.round(((currentRosterCount - bestSeedCount) / Math.max(bestSeedCount, 1)) * 1000) / 10,
      avgJoinsPerDay: Math.round((totalJoins / Math.max(dailySummary.length, 1)) * 10) / 10,
      avgLeavesPerDay: Math.round((totalLeaves / Math.max(dailySummary.length, 1)) * 10) / 10,
      daysTracked: dailySummary.length,
      level60Joins: level60Joins.length,
      level60RetentionPct: Math.round(lv60RetentionPct * 10) / 10,
      overallRetentionPct: Math.round(joinerRetentionPct * 10) / 10,
      under60RetentionPct: Math.round(under60RetentionPct * 10) / 10,
    },
    dailyStats: dailySummary,
    classBreakdown,
    levelDistribution,
    events: deduped,
    levelingTracker,
    // Note: accounts list intentionally excluded from output (per user request to not expose account names)
  };
}

module.exports = {
  processGuildGrowthData,
  xpBetweenLevels,
  parseDateToSortkey,
  deduplicateEvents,
  XP_PER_LEVEL,
};

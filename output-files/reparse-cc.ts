// Re-parse CC from all stored log files
const kv = await Deno.openKv("/home/opc/tbc-website/data.db");
const LOGS_DIR = "/home/opc/tbc-website/logs/";

// Confirmed raid players from stored logs
async function getConfirmedPlayers(logId: string): Promise<Set<string>> {
  const entry = await kv.get(["combat_logs", logId]);
  const log = entry.value as any;
  if (!log?.playerStats) return new Set();
  return new Set(log.playerStats.map((p: any) => p.name));
}

// CC detection patterns
function extractCC(content: string, confirmedPlayers: Set<string>) {
  const lines = content.split("\n");
  const ccByPlayer = new Map<string, {
    total: number;
    interrupts: Record<string, number>;
    stuns: Record<string, number>;
    polymorphs: Record<string, number>;
    fears: Record<string, number>;
    roots: Record<string, number>;
    kicks: Record<string, number>;
    other: Record<string, number>;
    byTarget: Record<string, number>;
  }>();

  // Initialize CC for all confirmed players
  for (const player of confirmedPlayers) {
    ccByPlayer.set(player, {
      total: 0,
      interrupts: {},
      stuns: {},
      polymorphs: {},
      fears: {},
      roots: {},
      kicks: {},
      other: {},
      byTarget: {},
    });
  }

  for (const line of lines) {
    // Pattern: "PlayerName interrupts Target's SpellName."
    const interruptMatch = line.match(/(\w+) interrupts (.+?) 's (.+?)\./);
    if (interruptMatch) {
      const [, player, target, spellName] = interruptMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.interrupts[spellName.trim()] = (cc.interrupts[spellName.trim()] || 0) + 1;
        cc.byTarget[target] = (cc.byTarget[target] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Kick/Pummel/Shield Bash hits
    const kickMatch = line.match(/(\w+) 's (Kick|Pummel|Shield Bash) (hits|crits) (.+?) for/);
    if (kickMatch) {
      const [, player, ability, , target] = kickMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.kicks[ability] = (cc.kicks[ability] || 0) + 1;
        cc.byTarget[target] = (cc.byTarget[target] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: "PlayerName casts Polymorph on Target"
    const polyMatch = line.match(/(\w+) casts (Polymorph[^\.]*) on (.+?)\./);
    if (polyMatch) {
      const [, player, spell, target] = polyMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.polymorphs[spell.trim()] = (cc.polymorphs[spell.trim()] || 0) + 1;
        cc.byTarget[target.trim()] = (cc.byTarget[target.trim()] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Blind
    const blindMatch = line.match(/(\w+) 's Blind/);
    if (blindMatch) {
      const [, player] = blindMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.stuns["Blind"] = (cc.stuns["Blind"] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Gouge hits
    const gougeMatch = line.match(/(\w+) 's Gouge (hits|crits) (.+?) for/);
    if (gougeMatch) {
      const [, player, , target] = gougeMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.stuns["Gouge"] = (cc.stuns["Gouge"] || 0) + 1;
        cc.byTarget[target] = (cc.byTarget[target] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Kidney Shot
    const kidneyMatch = line.match(/(\w+) 's Kidney Shot (hits|crits) (.+?) for/);
    if (kidneyMatch) {
      const [, player, , target] = kidneyMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.stuns["Kidney Shot"] = (cc.stuns["Kidney Shot"] || 0) + 1;
        cc.byTarget[target] = (cc.byTarget[target] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Cheap Shot
    const cheapMatch = line.match(/(\w+) 's Cheap Shot (hits|crits) (.+?) for/);
    if (cheapMatch) {
      const [, player, , target] = cheapMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.stuns["Cheap Shot"] = (cc.stuns["Cheap Shot"] || 0) + 1;
        cc.byTarget[target] = (cc.byTarget[target] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Fear casts
    const fearMatch = line.match(/(\w+) casts (Fear|Psychic Scream|Howl of Terror|Intimidating Shout)/);
    if (fearMatch) {
      const [, player, spell] = fearMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.fears[spell] = (cc.fears[spell] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Root casts
    const rootMatch = line.match(/(\w+) casts (Frost Nova|Entangling Roots)/);
    if (rootMatch) {
      const [, player, spell] = rootMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.roots[spell] = (cc.roots[spell] || 0) + 1;
        cc.total++;
      }
    }

    // Pattern: Stun casts
    const stunCastMatch = line.match(/(\w+) casts (Hammer of Justice|Repentance|Bash|War Stomp|Hibernate|Sap) on (.+?)\./);
    if (stunCastMatch) {
      const [, player, spell, target] = stunCastMatch;
      if (confirmedPlayers.has(player)) {
        const cc = ccByPlayer.get(player)!;
        cc.stuns[spell] = (cc.stuns[spell] || 0) + 1;
        cc.byTarget[target.trim()] = (cc.byTarget[target.trim()] || 0) + 1;
        cc.total++;
      }
    }
  }

  return ccByPlayer;
}

// Get all stored logs
const logs: { id: string; raidName: string }[] = [];
for await (const entry of kv.list({ prefix: ["combat_logs"] })) {
  if (entry.key[0] === "combat_logs" && entry.key.length === 2) {
    const log = entry.value as { id: string; raidName: string };
    if (log.id) logs.push({ id: log.id, raidName: log.raidName });
  }
}

console.log(`Found ${logs.length} logs to reparse`);

// Map log IDs to file names
const logFiles = new Map<string, string>();
for await (const entry of Deno.readDir(LOGS_DIR)) {
  if (entry.isFile && entry.name.endsWith(".txt")) {
    logFiles.set(entry.name, entry.name);
  }
}

console.log(`Found ${logFiles.size} raw log files`);

// Process each log
for (const log of logs) {
  console.log(`\nProcessing: ${log.raidName} (${log.id})`);

  // Try to find matching raw file
  const entry = await kv.get(["combat_logs", log.id]);
  const logData = entry.value as any;

  // Find raw file by matching raid type and date from log metadata
  let rawContent = "";
  const raidType = logData.raidType;
  const startDate = logData.startTime?.split("T")[0];

  for (const [filename] of logFiles) {
    if (filename.includes(raidType) && startDate && filename.includes(startDate)) {
      const filePath = `${LOGS_DIR}${filename}`;
      try {
        rawContent = await Deno.readTextFile(filePath);
        console.log(`  Found raw file: ${filename} (${rawContent.length} chars)`);
        break;
      } catch {
        continue;
      }
    }
  }

  // Also try matching by raidName pattern
  if (!rawContent && logData.raidName) {
    for (const [filename] of logFiles) {
      // Extract date from raidName like "BWL - 2025-11-21"
      const dateMatch = logData.raidName.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && filename.includes(dateMatch[1]) && filename.includes(raidType)) {
        const filePath = `${LOGS_DIR}${filename}`;
        try {
          rawContent = await Deno.readTextFile(filePath);
          console.log(`  Found raw file by name: ${filename}`);
          break;
        } catch {
          continue;
        }
      }
    }
  }

  if (!rawContent) {
    console.log("  WARNING: No raw file found, skipping");
    continue;
  }

  // Get confirmed players
  const confirmedPlayers = await getConfirmedPlayers(log.id);
  console.log(`  Players: ${confirmedPlayers.size}`);

  // Extract CC
  const ccByPlayer = extractCC(rawContent, confirmedPlayers);

  // Update each player's CC stats
  let totalCC = 0;
  let mostCC = { player: "", count: 0 };

  for (const playerStats of logData.playerStats) {
    const cc = ccByPlayer.get(playerStats.name);
    if (cc) {
      playerStats.cc = cc;
      totalCC += cc.total;
      if (cc.total > mostCC.count) {
        mostCC = { player: playerStats.name, count: cc.total };
      }
    } else {
      playerStats.cc = {
        total: 0,
        interrupts: {},
        stuns: {},
        polymorphs: {},
        fears: {},
        roots: {},
        kicks: {},
        other: {},
        byTarget: {},
      };
    }
  }

  // Update summary
  logData.summary.totalCC = totalCC;
  logData.summary.mostCC = mostCC;

  // Save updated log
  await kv.set(["combat_logs", log.id], logData);
  console.log(`  Updated! Total CC: ${totalCC}, Most CC: ${mostCC.player} (${mostCC.count})`);
}

console.log("\nDone!");
kv.close();

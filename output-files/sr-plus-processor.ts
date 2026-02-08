#!/usr/bin/env -S deno run --unstable-kv --allow-read --allow-write --allow-net

/**
 * SR+ Automatic Processor
 *
 * This script runs via cron every 5 minutes to:
 * 1. Find combat logs that haven't been processed for SR+
 * 2. For each unprocessed log:
 *    - Identify players who attended (name in playerStats)
 *    - Increment timesSRd for players with SR+ picks matching the raid type
 *    - Detect loot wins and clear SR+ entries when player wins their item
 *    - Mark log as processed
 *
 * Usage: deno run --unstable-kv --allow-read --allow-write sr-plus-processor.ts
 *
 * Cron: Add to crontab - runs every 5 minutes
 */

const LOG_PREFIX = "[SR+ Processor]";

// Map raid names to raid types
function getRaidTypeFromName(raidName: string): string | null {
  const name = raidName.toLowerCase();

  if (name.includes("molten core") || name.includes("mc -") || name.startsWith("mc")) return "MC";
  if (name.includes("blackwing") || name.includes("bwl")) return "BWL";
  if (name.includes("aq40") || name.includes("temple of ahn'qiraj")) return "AQ40";
  if (name.includes("aq20") || name.includes("ruins of ahn'qiraj")) return "AQ20";
  if (name.includes("zul'gurub") || name.includes("zg")) return "ZG";
  if (name.includes("naxx")) return "NAXX";
  if (name.includes("onyxia") || name.includes("ony")) return "ONY";
  if (name.includes("emerald") || name.includes("es ")) return "EMERALD";
  if (name.includes("kara") && name.includes("10")) return "KARA10";
  if (name.includes("kara") && name.includes("40")) return "KARA40";

  return null;
}

// Normalize item names for comparison
function normalizeItemName(name: string): string {
  return name.toLowerCase().trim().replace(/['']/g, "'");
}

interface SRPlusEntry {
  visitorId: string;
  playerName: string;
  raidType: string;
  itemName: string;
  timesSRd: number;
  currentBonus: number;
  pickedAt: number;
  lastIncrementedAt?: number;
  lastProcessedLogId?: string;
}

interface CombatLog {
  id: string;
  raidType: string;
  raidName: string;
  uploadedAt: string;
  playerStats: Array<{ name: string }>;
  loot: Array<{ player: string; itemName: string; quality: string }>;
  srPlusProcessed?: boolean;
  srPlusProcessedAt?: string;
}

interface Settings {
  bonusPerSR: number;
  hardReserveThreshold: number;
}

async function main() {
  const startTime = Date.now();
  console.log(`${LOG_PREFIX} Starting SR+ processing at ${new Date().toISOString()}`);

  const kv = await Deno.openKv("./data.db");

  try {
    // Get SR+ settings
    const settingsEntry = await kv.get(["sr_plus", "settings"]);
    const settings: Settings = (settingsEntry.value as Settings) || { bonusPerSR: 17, hardReserveThreshold: 5 };
    console.log(`${LOG_PREFIX} Settings: bonusPerSR=${settings.bonusPerSR}, hardReserveThreshold=${settings.hardReserveThreshold}`);

    // Get all combat logs
    const logs: CombatLog[] = [];
    for await (const entry of kv.list({ prefix: ["combat_logs"] })) {
      logs.push(entry.value as CombatLog);
    }
    console.log(`${LOG_PREFIX} Found ${logs.length} combat logs`);

    // Filter to unprocessed logs
    const unprocessedLogs = logs.filter(log => !log.srPlusProcessed);
    console.log(`${LOG_PREFIX} ${unprocessedLogs.length} logs need SR+ processing`);

    if (unprocessedLogs.length === 0) {
      console.log(`${LOG_PREFIX} No logs to process. Exiting.`);
      return;
    }

    // Get all SR+ entries
    const srPlusEntries: Map<string, SRPlusEntry> = new Map();
    for await (const entry of kv.list({ prefix: ["sr_plus", "entries"] })) {
      const srEntry = entry.value as SRPlusEntry;
      // Key format: ["sr_plus", "entries", raidType, visitorId]
      const key = `${srEntry.raidType}:${srEntry.playerName.toLowerCase()}`;
      srPlusEntries.set(key, srEntry);
    }
    console.log(`${LOG_PREFIX} Found ${srPlusEntries.size} SR+ entries`);

    // Process each unprocessed log
    for (const log of unprocessedLogs) {
      console.log(`${LOG_PREFIX} Processing log: ${log.id} (${log.raidName})`);

      // Determine raid type
      const raidType = getRaidTypeFromName(log.raidName);
      if (!raidType) {
        console.log(`${LOG_PREFIX}   Could not determine raid type for "${log.raidName}", skipping`);
        // Mark as processed anyway to avoid reprocessing
        await kv.set(["combat_logs", log.id], {
          ...log,
          srPlusProcessed: true,
          srPlusProcessedAt: new Date().toISOString(),
          srPlusSkipReason: "Unknown raid type",
        });
        continue;
      }
      console.log(`${LOG_PREFIX}   Raid type: ${raidType}`);

      // Get attendees (players in playerStats)
      const attendees = new Set<string>();
      for (const player of (log.playerStats || [])) {
        attendees.add(player.name.toLowerCase());
      }
      console.log(`${LOG_PREFIX}   ${attendees.size} attendees in log`);

      // Get loot winners
      const lootWinners: Map<string, string[]> = new Map(); // playerName -> itemNames won
      for (const loot of (log.loot || [])) {
        const playerLower = loot.player.toLowerCase();
        if (!lootWinners.has(playerLower)) {
          lootWinners.set(playerLower, []);
        }
        lootWinners.get(playerLower)!.push(loot.itemName);
      }

      let incrementedCount = 0;
      let wonItemCount = 0;

      // Process SR+ entries for this raid type
      for (const [key, srEntry] of srPlusEntries) {
        if (srEntry.raidType !== raidType) continue;

        const playerLower = srEntry.playerName.toLowerCase();

        // Skip if this log was already processed for this entry
        if (srEntry.lastProcessedLogId === log.id) {
          console.log(`${LOG_PREFIX}   Skipping ${srEntry.playerName} - already processed this log`);
          continue;
        }

        // Check if player attended
        if (!attendees.has(playerLower)) {
          console.log(`${LOG_PREFIX}   ${srEntry.playerName} did not attend, skipping`);
          continue;
        }

        // Check if player won their SR+ item
        const itemsWon = lootWinners.get(playerLower) || [];
        const normalizedSRItem = normalizeItemName(srEntry.itemName);
        const wonSRItem = itemsWon.some(item => normalizeItemName(item) === normalizedSRItem);

        if (wonSRItem) {
          // Player won their SR+ item! Clear their entry
          console.log(`${LOG_PREFIX}   ${srEntry.playerName} WON their SR+ item "${srEntry.itemName}"!`);

          // Log to history
          await kv.set(["sr_plus", "history", srEntry.visitorId, Date.now()], {
            visitorId: srEntry.visitorId,
            playerName: srEntry.playerName,
            raidType: srEntry.raidType,
            itemName: srEntry.itemName,
            action: "won",
            previousValue: srEntry.timesSRd,
            newValue: 0,
            logId: log.id,
            timestamp: Date.now(),
          });

          // Delete the SR+ entry
          await kv.delete(["sr_plus", "entries", srEntry.raidType, srEntry.visitorId]);
          srPlusEntries.delete(key);
          wonItemCount++;
        } else {
          // Player attended but didn't win - increment timesSRd
          const newTimesSRd = srEntry.timesSRd + 1;
          const newBonus = newTimesSRd * settings.bonusPerSR;

          console.log(`${LOG_PREFIX}   ${srEntry.playerName} attended, incrementing ${srEntry.timesSRd} -> ${newTimesSRd}`);

          const updatedEntry: SRPlusEntry = {
            ...srEntry,
            timesSRd: newTimesSRd,
            currentBonus: newBonus,
            lastIncrementedAt: Date.now(),
            lastProcessedLogId: log.id,
          };

          // Update entry
          await kv.set(["sr_plus", "entries", srEntry.raidType, srEntry.visitorId], updatedEntry);
          srPlusEntries.set(key, updatedEntry);

          // Log to history
          await kv.set(["sr_plus", "history", srEntry.visitorId, Date.now()], {
            visitorId: srEntry.visitorId,
            playerName: srEntry.playerName,
            raidType: srEntry.raidType,
            itemName: srEntry.itemName,
            action: "incremented",
            previousValue: srEntry.timesSRd,
            newValue: newTimesSRd,
            logId: log.id,
            timestamp: Date.now(),
          });

          incrementedCount++;
        }
      }

      // Mark log as processed
      await kv.set(["combat_logs", log.id], {
        ...log,
        srPlusProcessed: true,
        srPlusProcessedAt: new Date().toISOString(),
        srPlusIncrementedCount: incrementedCount,
        srPlusWonCount: wonItemCount,
      });

      console.log(`${LOG_PREFIX}   Log ${log.id} processed: ${incrementedCount} incremented, ${wonItemCount} won items`);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${LOG_PREFIX} Completed in ${elapsed}ms`);

  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error);
  } finally {
    kv.close();
  }
}

// Run
main();

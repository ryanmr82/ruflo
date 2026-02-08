// /routes/api/guild-storage/combined.ts
// API endpoint for combined guild storage view
// Merges guild vault + all bank alt inventories
// Returns aggregated item counts with flat location breakdown

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const GUILD_BANK_KEY = ["guild-bank", "inventory"];
const BANK_ALTS_KEY = ["bank-alts"];
const ALL_ACCOUNTS_KEY = ["bank-alts", "_accounts"];

interface ItemSummary {
  name: string;
  totalCount: number;
  quality: number;
  qualityName: string;
  itemId: string;
  locations: Record<string, number>; // flat: {"Guild Vault": 5, "Nerdsbank (Bags)": 2}
}

const QUALITY_NAMES: Record<number, string> = {
  0: "Poor",
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
};

export const handler: Handlers = {
  // GET: Retrieve combined guild storage view
  async GET(_req) {
    try {
      const itemMap: Record<string, ItemSummary> = {};
      let guildBankTotal = 0;
      let bankAltsTotal = 0;
      let guildBankScanTime = null;
      const bankAltScanTimes: Record<string, string> = {};

      // Fetch guild bank inventory
      const guildBankResult = await kv.get(GUILD_BANK_KEY);
      if (guildBankResult.value) {
        const guildBank = guildBankResult.value as {
          scanTime: string;
          tabs: Array<{
            items: Array<{
              name: string;
              count: number;
              quality: number;
              itemId: string;
            }>;
          }>;
          summary?: Array<{
            name: string;
            count: number;
            quality: number;
            itemId: string;
          }>;
        };

        guildBankScanTime = guildBank.scanTime;

        const addGuildVaultItem = (item: { name: string; count: number; quality: number; itemId: string }) => {
          const key = item.name.toLowerCase();
          if (!itemMap[key]) {
            itemMap[key] = {
              name: item.name,
              totalCount: 0,
              quality: item.quality,
              qualityName: QUALITY_NAMES[item.quality] || "Unknown",
              itemId: item.itemId,
              locations: {},
            };
          }
          itemMap[key].totalCount += item.count;
          itemMap[key].locations["Guild Vault"] = (itemMap[key].locations["Guild Vault"] || 0) + item.count;
          guildBankTotal += item.count;
        };

        // Use summary if available, otherwise aggregate from tabs
        if (guildBank.summary && guildBank.summary.length > 0) {
          for (const item of guildBank.summary) {
            addGuildVaultItem(item);
          }
        } else if (guildBank.tabs) {
          for (const tab of guildBank.tabs) {
            if (tab.items) {
              for (const item of tab.items) {
                addGuildVaultItem(item);
              }
            }
          }
        }
      }

      // Fetch all bank alt accounts
      const accountListResult = await kv.get(ALL_ACCOUNTS_KEY);
      const accountList = (accountListResult.value as string[]) || [];

      for (const account of accountList) {
        const result = await kv.get([...BANK_ALTS_KEY, account]);
        if (result.value) {
          const bankAlt = result.value as {
            scanTime: string;
            characters: Array<{
              name: string;
              items?: Array<{ name: string; count: number; quality: number; itemId: string; }>;
              bags?: Array<{ name: string; count: number; quality: number; itemId: string; location?: string; }>;
              bank?: Array<{ name: string; count: number; quality: number; itemId: string; location?: string; }>;
            }>;
          };

          bankAltScanTimes[account] = bankAlt.scanTime;

          for (const char of bankAlt.characters) {
            const bagItems = char.bags || [];
            const bankItems = char.bank || [];
            const flatItems = char.items || [];
            const hasSeparate = bagItems.length > 0 || bankItems.length > 0;

            const processItem = (item: { name: string; count: number; quality: number; itemId: string }, locLabel: string) => {
              const key = item.name.toLowerCase();
              if (!itemMap[key]) {
                itemMap[key] = {
                  name: item.name,
                  totalCount: 0,
                  quality: item.quality,
                  qualityName: QUALITY_NAMES[item.quality] || "Unknown",
                  itemId: item.itemId,
                  locations: {},
                };
              }
              itemMap[key].totalCount += item.count;
              itemMap[key].locations[locLabel] = (itemMap[key].locations[locLabel] || 0) + item.count;
              bankAltsTotal += item.count;
            };

            if (hasSeparate) {
              for (const item of bagItems) {
                processItem(item, `${char.name} (Bags)`);
              }
              for (const item of bankItems) {
                processItem(item, `${char.name} (Bank)`);
              }
            } else {
              for (const item of flatItems) {
                processItem(item, char.name);
              }
            }
          }
        }
      }

      // Convert to sorted array
      const items = Object.values(itemMap).sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      return new Response(JSON.stringify({
        combined: {
          items,
          uniqueItems: items.length,
          totalItems: guildBankTotal + bankAltsTotal,
          guildBankItems: guildBankTotal,
          bankAltItems: bankAltsTotal,
        },
        sources: {
          guildBank: guildBankScanTime ? {
            scanTime: guildBankScanTime,
            totalItems: guildBankTotal,
          } : null,
          bankAlts: Object.keys(bankAltScanTimes).length > 0 ? {
            accounts: bankAltScanTimes,
            totalItems: bankAltsTotal,
          } : null,
        },
        generatedAt: new Date().toISOString(),
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};

// /routes/api/guild-storage/combined.ts
// API endpoint for combined guild storage view
// Merges guild vault + all bank alt inventories
// Returns aggregated item counts with flat location breakdown
// Locations use "Tab N - TabName" for vault items, "CharName (Bags/Bank)" for alts

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
  locations: Record<string, number>;
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
  async GET(_req) {
    try {
      const itemMap: Record<string, ItemSummary> = {};
      let guildBankTotal = 0;
      let bankAltsTotal = 0;
      let guildBankScanTime: string | null = null;
      const bankAltAccounts: Array<{ account: string; scanTime: string }> = [];

      // Fetch guild bank inventory
      const guildBankResult = await kv.get(GUILD_BANK_KEY);
      if (guildBankResult.value) {
        const guildBank = guildBankResult.value as {
          scanTime: string;
          tabs: Array<{
            tabIndex: number;
            tabName: string;
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

        // Always iterate over tabs so we get tab name + index for location labels
        if (guildBank.tabs && guildBank.tabs.length > 0) {
          for (const tab of guildBank.tabs) {
            // If tabName already starts with "Tab", use it directly; otherwise prefix with "Tab N - "
            const locLabel = tab.tabName.startsWith("Tab ")
              ? tab.tabName
              : `Tab ${tab.tabIndex} - ${tab.tabName}`;
            if (tab.items) {
              for (const item of tab.items) {
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
                guildBankTotal += item.count;
              }
            }
          }
        } else if (guildBank.summary) {
          // Fallback if no tabs (shouldn't happen, but safe)
          for (const item of guildBank.summary) {
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

          bankAltAccounts.push({ account, scanTime: bankAlt.scanTime });

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
            available: true,
            scanTime: guildBankScanTime,
            totalItems: guildBankTotal,
          } : { available: false },
          bankAlts: bankAltAccounts.length > 0 ? {
            available: true,
            accounts: bankAltAccounts,
            totalItems: bankAltsTotal,
          } : { available: false },
        },
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

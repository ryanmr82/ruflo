// /routes/api/bank-alts/inventory.ts
// API endpoint for bank alt character inventory data
// Receives JSON payload from AH_and_VaultSyncTray.exe after bank alt scan
// Stores in Deno KV under ["bank-alts", accountName]
// MERGE LOGIC: incoming characters are merged by name with existing data,
// preserving characters not in the current upload.

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const BANK_ALTS_KEY = ["bank-alts"];
const ALL_ACCOUNTS_KEY = ["bank-alts", "_accounts"];

interface CharacterData {
  name: string;
  class?: string;
  level?: number;
  bags?: unknown[];
  bank?: unknown[];
  items?: unknown[];
  totalItems?: number;
  bankScanned?: boolean;
  scanTime?: string;
  [key: string]: unknown;
}

interface BankAltRecord {
  exportVersion?: string;
  scanTime: string;
  account: string;
  characters: CharacterData[];
  totalItems: number;
  uniqueItems: number;
  characterCount: number;
  uploadedAt: string;
  source?: string;
}

export const handler: Handlers = {
  // GET: Retrieve bank alt inventories
  async GET(req) {
    try {
      const url = new URL(req.url);
      const accountFilter = url.searchParams.get("account");

      if (accountFilter) {
        const result = await kv.get([...BANK_ALTS_KEY, accountFilter]);
        if (!result.value) {
          return new Response(JSON.stringify({
            error: "Account not found",
            account: accountFilter,
            message: "No bank alt data for this account"
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify(result.value), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get all accounts
      const accountListResult = await kv.get(ALL_ACCOUNTS_KEY);
      const accountList = (accountListResult.value as string[]) || [];

      if (accountList.length === 0) {
        return new Response(JSON.stringify({
          accounts: [],
          message: "No bank alt data available"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      const accounts: Record<string, unknown> = {};
      for (const account of accountList) {
        const result = await kv.get([...BANK_ALTS_KEY, account]);
        if (result.value) {
          accounts[account] = result.value;
        }
      }

      return new Response(JSON.stringify({
        accounts,
        accountCount: Object.keys(accounts).length,
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

  // PUT: Upload bank alt inventory — CHARACTER-LEVEL MERGE
  // Incoming characters overwrite their entry by name.
  // Characters already stored but NOT in this upload are preserved.
  async PUT(req) {
    try {
      const body = await req.json();

      if (!body.account) {
        return new Response(JSON.stringify({ error: "account is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Reject bogus account names — old tray app bug sent "UNKNOWN"
      const BLOCKED_ACCOUNTS = ["UNKNOWN", "unknown", ""];
      if (BLOCKED_ACCOUNTS.includes(body.account)) {
        return new Response(JSON.stringify({
          error: "Invalid account name",
          rejected: body.account,
          message: "Update your tray app to fix this"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!body.characters || !Array.isArray(body.characters)) {
        return new Response(JSON.stringify({ error: "characters array is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const uploadedAt = new Date().toISOString();

      // --- Fetch existing data for this account ---
      const existingResult = await kv.get([...BANK_ALTS_KEY, body.account]);
      const existing = existingResult.value as BankAltRecord | null;

      // Build character map from existing data (keyed by character name)
      const charMap: Record<string, CharacterData> = {};
      if (existing?.characters) {
        for (const char of existing.characters) {
          if (char.name) {
            charMap[char.name] = char;
          }
        }
      }

      // Merge incoming characters — each incoming character overwrites by name
      const incomingNames: string[] = [];
      for (const char of body.characters) {
        if (char.name) {
          charMap[char.name] = char;
          incomingNames.push(char.name);
        }
      }

      // Convert back to array (sorted alphabetically for consistency)
      const mergedCharacters = Object.values(charMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // Recount totals from merged data
      let totalItems = 0;
      let uniqueItems = 0;
      const itemCounts: Record<string, number> = {};

      for (const char of mergedCharacters) {
        const charItems = char.items || [...(char.bags || []), ...(char.bank || [])];
        for (const item of charItems as Array<{ name: string; count?: number }>) {
          totalItems += item.count || 1;
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = 0;
            uniqueItems++;
          }
          itemCounts[item.name] += item.count || 1;
        }
      }

      // Use the most recent scanTime
      const existingScanTime = existing?.scanTime || "";
      const incomingScanTime = body.scanTime || uploadedAt;
      const scanTime = existingScanTime > incomingScanTime ? existingScanTime : incomingScanTime;

      // Build the merged inventory record
      const inventory: BankAltRecord = {
        exportVersion: body.exportVersion || existing?.exportVersion || "2.0",
        scanTime,
        account: body.account,
        characters: mergedCharacters,
        totalItems,
        uniqueItems,
        characterCount: mergedCharacters.length,
        uploadedAt,
        source: body.source || "AH_and_VaultSync",
      };

      // Store merged account inventory
      await kv.set([...BANK_ALTS_KEY, body.account], inventory);

      // Update account list
      const accountListResult = await kv.get(ALL_ACCOUNTS_KEY);
      const accountList = (accountListResult.value as string[]) || [];
      if (!accountList.includes(body.account)) {
        accountList.push(body.account);
        await kv.set(ALL_ACCOUNTS_KEY, accountList);
      }

      const preservedCount = mergedCharacters.length - incomingNames.length;

      return new Response(JSON.stringify({
        success: true,
        merged: true,
        uploadedAt,
        account: body.account,
        characterCount: mergedCharacters.length,
        incomingCharacters: incomingNames,
        preservedCharacters: preservedCount,
        totalItems,
        uniqueItems,
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

  // DELETE: Remove a bank alt account's data
  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const account = url.searchParams.get("account");

      if (!account) {
        return new Response(JSON.stringify({
          error: "account query parameter is required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Delete the account data
      await kv.delete([...BANK_ALTS_KEY, account]);

      // Update account list
      const accountListResult = await kv.get(ALL_ACCOUNTS_KEY);
      const accountList = (accountListResult.value as string[]) || [];
      const updatedList = accountList.filter(a => a !== account);
      await kv.set(ALL_ACCOUNTS_KEY, updatedList);

      return new Response(JSON.stringify({
        success: true,
        deleted: account,
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

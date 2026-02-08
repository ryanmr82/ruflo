const kv = await Deno.openKv();

// Delete UNKNOWN and TEST bank alt account data
await kv.delete(["bank-alts", "UNKNOWN"]);
await kv.delete(["bank-alts", "TEST"]);

// Remove from account list
const result = await kv.get(["bank-alts", "_accounts"]);
const accounts = (result.value as string[]) || [];
const cleaned = accounts.filter((a: string) => a !== "UNKNOWN" && a !== "TEST");
await kv.set(["bank-alts", "_accounts"], cleaned);
console.log("Cleaned accounts:", cleaned);
Deno.exit(0);

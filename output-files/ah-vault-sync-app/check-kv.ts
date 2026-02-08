const kv = await Deno.openKv();

// Check account list
const acctList = await kv.get(["bank-alts", "_accounts"]);
console.log("Account list:", acctList.value);

// List all bank-alts keys
const iter = kv.list({ prefix: ["bank-alts"] });
for await (const entry of iter) {
  const key = entry.key.join("/");
  const val = entry.value as Record<string, unknown>;
  if (key.includes("_accounts")) {
    console.log("Key:", key, "Value:", JSON.stringify(entry.value));
  } else {
    const chars = (val.characters as unknown[])?.length || 0;
    console.log("Key:", key, "scanTime:", val.scanTime, "chars:", chars);
  }
}

Deno.exit(0);

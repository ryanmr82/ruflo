// Script to upload a combat log file to the API

const logFile = Deno.args[0];
if (!logFile) {
  console.error("Usage: deno run -A upload-log.ts <logfile>");
  Deno.exit(1);
}

// Read the log file
const content = await Deno.readTextFile(logFile);
const lines = content.split("\n");

// Extract metadata from filename like TurtLog-BWL-2025-11-21-Nefarian.txt
const fileName = logFile.split("/").pop()!;
const match = fileName.match(/TurtLog-(\w+)-(\d{4})-(\d{2})-(\d{2})-(.+)\.txt/);

if (!match) {
  console.error("Invalid filename format. Expected: TurtLog-RAID-YYYY-MM-DD-Boss.txt");
  Deno.exit(1);
}

const [, raidType, year, month, day, bossKilled] = match;
const dateStr = `${year}-${month}-${day}`;

// Find first and last timestamp in file
const timestampRegex = /^(\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})/;
let startTime = "";
let endTime = "";

for (const line of lines) {
  const m = line.match(timestampRegex);
  if (m) {
    if (!startTime) startTime = m[1];
    endTime = m[1];
  }
}

// Parse times
const parseTime = (ts: string): string => {
  if (!ts) return "00:00:00";
  const parts = ts.split(" ");
  if (parts.length > 1) {
    return parts[1].substring(0, 8);
  }
  return "00:00:00";
};

const data = {
  raidType,
  raidName: `${raidType} - ${dateStr}`,
  bossKilled: bossKilled === "NoKill" ? null : bossKilled,
  startTime: `${dateStr}T${parseTime(startTime)}`,
  endTime: `${dateStr}T${parseTime(endTime)}`,
  lineCount: lines.length,
  content,
};

console.log(`Uploading ${fileName}...`);
console.log(`  Raid: ${raidType}`);
console.log(`  Date: ${dateStr}`);
console.log(`  Boss: ${bossKilled || "N/A"}`);
console.log(`  Lines: ${lines.length}`);

const resp = await fetch("http://localhost:8000/api/logs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

const result = await resp.json();
console.log("Result:", JSON.stringify(result, null, 2));

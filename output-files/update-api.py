import sys
import re

# Read the file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# Find and replace the raw log saving section
old_code = '''      // Save raw content to disk (Deno KV has 64KB limit per value)
      const logsDir = "/home/opc/tbc-website/raw-logs";
      try {
        await Deno.mkdir(logsDir, { recursive: true });
        await Deno.writeTextFile(logsDir + "/" + id + ".txt", data.content);
      } catch (err) {
        console.error("Failed to save raw log to disk:", err);
      }'''

new_code = '''      // Save raw content to disk with proper filename (Deno KV has 64KB limit per value)
      const logsDir = "/home/opc/tbc-website/logs";
      try {
        await Deno.mkdir(logsDir, { recursive: true });
        // Generate filename like TurtLog-RAID-YYYY-MM-DD-Boss.txt
        const dateStr = data.startTime ? data.startTime.substring(0, 10) : new Date().toISOString().substring(0, 10);
        const bossStr = data.bossKilled || "NoKill";
        const filename = `TurtLog-${data.raidType}-${dateStr}-${bossStr}.txt`;
        await Deno.writeTextFile(logsDir + "/" + filename, data.content);
        // Also save with ID for backup/reference
        await Deno.writeTextFile(logsDir + "/" + id + ".txt", data.content);
      } catch (err) {
        console.error("Failed to save raw log to disk:", err);
      }'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(sys.argv[1], 'w') as f:
        f.write(content)
    print("SUCCESS: Updated raw log saving code")
else:
    print("ERROR: Could not find the code to replace")
    print("Looking for partial match...")
    if "raw-logs" in content:
        print("Found 'raw-logs' in file")
    if "logsDir" in content:
        print("Found 'logsDir' in file")

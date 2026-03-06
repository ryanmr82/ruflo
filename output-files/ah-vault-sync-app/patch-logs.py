filepath = "/home/opc/tbc-website/routes/api/logs.ts"
with open(filepath, "r") as f:
    content = f.read()

old = '          const zipData = zipSync({ "WoWCombatLog.txt": strToU8(data.content) });'

# Build the replacement carefully
lines = []
lines.append('          // Fix TurtleLogs Onyxia Phase 2 split bug: TurtleLogs parser splits encounters')
lines.append('          // at Hover(17131) cast, misassigning the kill to Molten Core. Remove Hover lines')
lines.append('          // and fix zone IDs for the TurtleLogs copy only (does NOT affect local parsing).')
lines.append('          let turtleContent = data.content;')
lines.append('          if (data.raidType === "ONY") {')
lines.append('            turtleContent = turtleContent')
lines.append('              .split("\\n")')
lines.append('              .filter((l: string) => !l.includes("Hover(17131)"))')
lines.append('              .join("\\n");')
lines.append('            turtleContent = turtleContent.replace(')
lines.append("              /ZONE_INFO: (\\d{2}\\.\\d{2}\\.\\d{2} \\d{2}:\\d{2}:\\d{2})&onyxia's lair&0/gi,")
lines.append("              (_m: string, ts: string) => \"ZONE_INFO: \" + ts + \"&Onyxia's Lair&249\"")
lines.append('            );')
lines.append('          }')
lines.append('          const zipData = zipSync({ "WoWCombatLog.txt": strToU8(turtleContent) });')

new_code = "\n".join(lines)

if old in content:
    content = content.replace(old, new_code, 1)
    with open(filepath, "w") as f:
        f.write(content)
    print("PATCHED successfully")
else:
    print("ERROR: Could not find target string")
    # Show context around expected location
    idx = content.find("zipSync")
    if idx >= 0:
        print("Found zipSync at index", idx)
        print("Context:", repr(content[idx-50:idx+100]))

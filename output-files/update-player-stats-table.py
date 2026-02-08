#!/usr/bin/env python3
"""Update PlayerStatsTable component for CC tracking with tooltip"""

import sys

# Read the file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# 1. Update interface - replace interrupts with cc
old_interface = """  interrupts: Record<string, number>;
}"""

new_interface = """  cc: {
    total: number;
    interrupts: Record<string, number>;
    stuns: Record<string, number>;
    polymorphs: Record<string, number>;
    fears: Record<string, number>;
    roots: Record<string, number>;
    kicks: Record<string, number>;
    other: Record<string, number>;
    byTarget: Record<string, number>;
  };
}"""

if old_interface in content:
    content = content.replace(old_interface, new_interface)
    print("SUCCESS: Updated PlayerStats interface")
else:
    print("WARNING: Could not find interrupts interface")

# 2. Update SortKey type - replace interrupts with cc
old_sortkey = 'type SortKey = "name" | "totalConsumables" | "potions" | "elixirs" | "flasks" | "food" | "dispels" | "interrupts";'
new_sortkey = 'type SortKey = "name" | "totalConsumables" | "potions" | "elixirs" | "flasks" | "food" | "dispels" | "cc";'

if old_sortkey in content:
    content = content.replace(old_sortkey, new_sortkey)
    print("SUCCESS: Updated SortKey type")
else:
    print("WARNING: Could not find SortKey type")

# 3. Update sort case - replace interrupts with cc
old_case = """      case "interrupts":
        aVal = getSum(a.interrupts);
        bVal = getSum(b.interrupts);
        break;"""

new_case = """      case "cc":
        aVal = a.cc?.total || 0;
        bVal = b.cc?.total || 0;
        break;"""

if old_case in content:
    content = content.replace(old_case, new_case)
    print("SUCCESS: Updated sort case")
else:
    print("WARNING: Could not find sort case")

# 4. Update header label
old_header = '<SortHeader label="Interrupts" sortKeyName="interrupts" />'
new_header = '<SortHeader label="CC" sortKeyName="cc" />'

if old_header in content:
    content = content.replace(old_header, new_header)
    print("SUCCESS: Updated header label")
else:
    print("WARNING: Could not find header label")

# 5. Update variable calculation
old_calc = "const interruptsSum = getSum(player.interrupts);"
new_calc = "const ccTotal = player.cc?.total || 0;"

if old_calc in content:
    content = content.replace(old_calc, new_calc)
    print("SUCCESS: Updated variable calculation")
else:
    print("WARNING: Could not find variable calculation")

# 6. Update the table cell for CC with detailed tooltip
old_cell = """                <td
                  style="text-align: right; color: var(--apple-red); cursor: help;"
                  title={formatDetails(player.interrupts)}
                >
                  {interruptsSum || "-"}
                </td>"""

new_cell = """                <td
                  style="text-align: right; color: var(--apple-red); cursor: help;"
                  title={formatCCDetails(player.cc)}
                >
                  {ccTotal || "-"}
                </td>"""

if old_cell in content:
    content = content.replace(old_cell, new_cell)
    print("SUCCESS: Updated table cell")
else:
    print("WARNING: Could not find table cell")

# 7. Add the formatCCDetails function after formatDetails
old_format_fn = """function formatDetails(obj: Record<string, number> | undefined): string {
  if (!obj || Object.keys(obj).length === 0) return "None";
  return Object.entries(obj)
    .map(([name, count]) => `${name}: ${count}`)
    .join("\\n");
}"""

new_format_fn = """function formatDetails(obj: Record<string, number> | undefined): string {
  if (!obj || Object.keys(obj).length === 0) return "None";
  return Object.entries(obj)
    .map(([name, count]) => `${name}: ${count}`)
    .join("\\n");
}

function formatCCDetails(cc: PlayerStats["cc"] | undefined): string {
  if (!cc || cc.total === 0) return "No CC used";

  const parts: string[] = [];
  parts.push(`Total CC: ${cc.total}`);
  parts.push("");

  if (Object.keys(cc.interrupts).length > 0) {
    parts.push("-- Interrupts --");
    for (const [spell, count] of Object.entries(cc.interrupts)) {
      parts.push(`  ${spell}: ${count}`);
    }
  }

  if (Object.keys(cc.kicks).length > 0) {
    parts.push("-- Kicks/Pummel --");
    for (const [ability, count] of Object.entries(cc.kicks)) {
      parts.push(`  ${ability}: ${count}`);
    }
  }

  if (Object.keys(cc.stuns).length > 0) {
    parts.push("-- Stuns --");
    for (const [ability, count] of Object.entries(cc.stuns)) {
      parts.push(`  ${ability}: ${count}`);
    }
  }

  if (Object.keys(cc.polymorphs).length > 0) {
    parts.push("-- Polymorphs --");
    for (const [spell, count] of Object.entries(cc.polymorphs)) {
      parts.push(`  ${spell}: ${count}`);
    }
  }

  if (Object.keys(cc.fears).length > 0) {
    parts.push("-- Fears --");
    for (const [ability, count] of Object.entries(cc.fears)) {
      parts.push(`  ${ability}: ${count}`);
    }
  }

  if (Object.keys(cc.roots).length > 0) {
    parts.push("-- Roots --");
    for (const [spell, count] of Object.entries(cc.roots)) {
      parts.push(`  ${spell}: ${count}`);
    }
  }

  if (Object.keys(cc.byTarget).length > 0) {
    parts.push("");
    parts.push("-- By Target --");
    const sorted = Object.entries(cc.byTarget).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [target, count] of sorted) {
      parts.push(`  ${target}: ${count}`);
    }
  }

  return parts.join("\\n");
}"""

if old_format_fn in content:
    content = content.replace(old_format_fn, new_format_fn)
    print("SUCCESS: Added formatCCDetails function")
else:
    print("WARNING: Could not find formatDetails function")

# Write the updated file
with open(sys.argv[1], 'w') as f:
    f.write(content)

print("\\nDone updating PlayerStatsTable")

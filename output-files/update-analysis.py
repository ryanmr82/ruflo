#!/usr/bin/env python3
"""Update analysis.tsx to use CC instead of interrupts"""

import sys

# Read the file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# 1. Update interface PlayerStats
old_int = "  interrupts: Record<string, number>;"
new_int = """  cc: {
    total: number;
    interrupts: Record<string, number>;
    stuns: Record<string, number>;
    polymorphs: Record<string, number>;
    fears: Record<string, number>;
    roots: Record<string, number>;
    kicks: Record<string, number>;
    other: Record<string, number>;
    byTarget: Record<string, number>;
  };"""

if old_int in content:
    content = content.replace(old_int, new_int)
    print("SUCCESS: Updated PlayerStats interface")
else:
    print("WARNING: Could not find PlayerStats interface")

# 2. Update summary interface
old_summary = """    totalInterrupts: number;
    mostInterrupts: { player: string; count: number };"""

new_summary = """    totalCC: number;
    mostCC: { player: string; count: number };"""

if old_summary in content:
    content = content.replace(old_summary, new_summary)
    print("SUCCESS: Updated summary interface")
else:
    print("WARNING: Could not find summary interface")

# 3. Update the stat display
old_stat = """{selectedLog.summary?.totalInterrupts || 0}
                      </div>
                      <div class="stat-label">Total Interrupts</div>"""

new_stat = """{selectedLog.summary?.totalCC || 0}
                      </div>
                      <div class="stat-label">Total CC</div>"""

if old_stat in content:
    content = content.replace(old_stat, new_stat)
    print("SUCCESS: Updated stat display")
else:
    print("WARNING: Could not find stat display")

# 4. Update Most Interrupts label
old_most_label = '<div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px;">Most Interrupts</div>'
new_most_label = '<div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px;">Most CC</div>'

if old_most_label in content:
    content = content.replace(old_most_label, new_most_label)
    print("SUCCESS: Updated Most CC label")
else:
    print("WARNING: Could not find Most Interrupts label")

# 5. Update mostInterrupts references
old_most_ref = 'selectedLog.summary.mostInterrupts?.player'
new_most_ref = 'selectedLog.summary.mostCC?.player'

if old_most_ref in content:
    content = content.replace(old_most_ref, new_most_ref)
    print("SUCCESS: Updated mostCC player reference")
else:
    print("WARNING: Could not find mostInterrupts player reference")

old_most_count = 'selectedLog.summary.mostInterrupts?.count'
new_most_count = 'selectedLog.summary.mostCC?.count'

if old_most_count in content:
    content = content.replace(old_most_count, new_most_count)
    print("SUCCESS: Updated mostCC count reference")
else:
    print("WARNING: Could not find mostInterrupts count reference")

# Write the updated file
with open(sys.argv[1], 'w') as f:
    f.write(content)

print("\\nDone updating analysis.tsx")

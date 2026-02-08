#!/usr/bin/env python3
"""Fix remaining CC tracking updates"""

import sys

# Read the file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# 1. Fix the initialization - replace interrupts: {} with cc object
old_init = "      interrupts: {},\n    });"
new_init = """      cc: {
        total: 0,
        interrupts: {},
        stuns: {},
        polymorphs: {},
        fears: {},
        roots: {},
        kicks: {},
        other: {},
        byTarget: {},
      },
    });"""

if old_init in content:
    content = content.replace(old_init, new_init)
    print("SUCCESS: Fixed player stats initialization")
else:
    print("WARNING: Could not find interrupts initialization")

# 2. Fix totalInterrupts calculation
old_total = "const totalInterrupts = players.reduce((sum, p) => sum + Object.values(p.interrupts || {}).reduce((a, b) => a + b, 0), 0);"
new_total = "const totalCC = players.reduce((sum, p) => sum + (p.cc?.total || 0), 0);"

if old_total in content:
    content = content.replace(old_total, new_total)
    print("SUCCESS: Fixed totalCC calculation")
else:
    print("WARNING: Could not find totalInterrupts calculation")

# 3. Fix mostInterruptsPlayer
old_most = """const mostInterruptsPlayer = players.reduce((max, p) => {
    const intCount = Object.values(p.interrupts || {}).reduce((a, b) => a + b, 0);
    const maxIntCount = Object.values(max.interrupts || {}).reduce((a: number, b: number) => a + b, 0);
    return intCount > maxIntCount ? p : max;
  }, { name: "None", interrupts: {} } as PlayerStats);"""

new_most = """const mostCCPlayer = players.reduce((max, p) => {
    const ccCount = p.cc?.total || 0;
    const maxCCCount = max.cc?.total || 0;
    return ccCount > maxCCCount ? p : max;
  }, { name: "None", cc: { total: 0 } } as PlayerStats);"""

if old_most in content:
    content = content.replace(old_most, new_most)
    print("SUCCESS: Fixed mostCC calculation")
else:
    print("WARNING: Could not find mostInterruptsPlayer calculation")

# 4. Fix the return statement for interrupts
old_return = """    totalInterrupts,
    mostInterrupts: {
      player: mostInterruptsPlayer.name,
      count: Object.values(mostInterruptsPlayer.interrupts || {}).reduce((a: number, b: number) => a + b, 0),
    },"""

new_return = """    totalCC,
    mostCC: {
      player: mostCCPlayer.name,
      count: mostCCPlayer.cc?.total || 0,
    },"""

if old_return in content:
    content = content.replace(old_return, new_return)
    print("SUCCESS: Fixed return statement")
else:
    print("WARNING: Could not find return statement to fix")

# Write the updated file
with open(sys.argv[1], 'w') as f:
    f.write(content)

print("\\nDone fixing remaining CC tracking")

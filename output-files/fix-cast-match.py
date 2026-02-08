#!/usr/bin/env python3
"""Fix duplicate castMatch variable"""

import sys

# Read the file
with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

# Line 501 (0-indexed: 500) - change castMatch to ccCastMatch
# Line 502 (0-indexed: 501) - change ccCastMatch to ccCastMatch (already done by sed)
# Line 503 (0-indexed: 502) - change castMatch to ccCastMatch

for i, line in enumerate(lines):
    line_num = i + 1
    if line_num == 501 and 'const castMatch = line.match' in line and 'casts (.+?)(?: on' in line:
        lines[i] = line.replace('const castMatch', 'const ccCastMatch')
        print(f"Fixed line {line_num}: const castMatch -> const ccCastMatch")
    elif line_num == 502 and 'if (castMatch)' in line:
        lines[i] = line.replace('if (castMatch)', 'if (ccCastMatch)')
        print(f"Fixed line {line_num}: if (castMatch) -> if (ccCastMatch)")
    elif line_num == 503 and 'const [, player, spellName, target] = castMatch' in line:
        lines[i] = line.replace('= castMatch', '= ccCastMatch')
        print(f"Fixed line {line_num}: = castMatch -> = ccCastMatch")

# Write back
with open(sys.argv[1], 'w') as f:
    f.writelines(lines)

print("Done fixing castMatch")

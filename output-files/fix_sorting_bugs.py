#!/usr/bin/env python3
"""
Fix sorting bugs:
1. Store original standing on each player so sorting doesn't break calculations
2. Use ASCII arrows instead of Unicode that doesn't render
"""

with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# Fix 1: Change Unicode arrows to simple ASCII in CSS
# Old Unicode that doesn't render properly
content = content.replace('content: "\\2195";', 'content: "";')  # Remove default indicator
content = content.replace('content: "\\25B2";', 'content: " ^";')  # Up arrow
content = content.replace('content: "\\25BC";', 'content: " v";')  # Down arrow

print("Fixed sort arrow characters")

# Fix 2: After players are loaded, store original standing on each player
# Find where originalPlayers is set and add standing to each player

old_original_players = '''let currentSort = {{ column: "standing", direction: "asc" }};
        let originalPlayers = [...players]; // Keep original order for standing sort'''

new_original_players = '''let currentSort = {{ column: "standing", direction: "asc" }};
        // Store original standing on each player so sorting doesn't break calculations
        players.forEach((p, idx) => {{ p.originalStanding = idx + 1; }});
        let originalPlayers = [...players]; // Keep original order for standing sort'''

if old_original_players in content:
    content = content.replace(old_original_players, new_original_players)
    print("Added originalStanding to players")
else:
    print("WARNING: Could not find originalPlayers declaration")

# Fix 3: Update updateTable to use originalStanding instead of loop index for calculations
# Find the line that sets standing from loop index
old_standing_calc = 'const standing = i + 1;'
new_standing_calc = 'const standing = p.originalStanding || (i + 1);'

content = content.replace(old_standing_calc, new_standing_calc)
print("Updated standing calculation to use originalStanding")

# Fix 4: Update sortBy to use originalStanding instead of findIndex
# This makes sorting calculations consistent

old_sort_bracket = '''case "bracket":
                            const idxA = originalPlayers.findIndex(p => p.name === a.name);
                            const idxB = originalPlayers.findIndex(p => p.name === b.name);
                            valA = getBracket(idxA + 1).bracket;
                            valB = getBracket(idxB + 1).bracket;
                            break;'''

new_sort_bracket = '''case "bracket":
                            valA = getBracket(a.originalStanding).bracket;
                            valB = getBracket(b.originalStanding).bracket;
                            break;'''

content = content.replace(old_sort_bracket, new_sort_bracket)
print("Fixed bracket sort to use originalStanding")

old_sort_net = '''case "net":
                            const standA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const standB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const bracketA = getBracket(standA);
                            const bracketB = getBracket(standB);
                            const decayA = Math.round(a.RP * 0.20);
                            const decayB = Math.round(b.RP * 0.20);
                            valA = getRpGain(standA, bracketA, a.thisWeekHonor) - decayA;
                            valB = getRpGain(standB, bracketB, b.thisWeekHonor) - decayB;
                            break;'''

new_sort_net = '''case "net":
                            const bracketA = getBracket(a.originalStanding);
                            const bracketB = getBracket(b.originalStanding);
                            const decayA = Math.round(a.RP * 0.20);
                            const decayB = Math.round(b.RP * 0.20);
                            valA = getRpGain(a.originalStanding, bracketA, a.thisWeekHonor) - decayA;
                            valB = getRpGain(b.originalStanding, bracketB, b.thisWeekHonor) - decayB;
                            break;'''

content = content.replace(old_sort_net, new_sort_net)
print("Fixed net sort to use originalStanding")

old_sort_gain = '''case "gain":
                            // RP gain based on standing and bracket
                            const gainStandA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const gainStandB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const gainBracketA = getBracket(gainStandA);
                            const gainBracketB = getBracket(gainStandB);
                            valA = getRpGain(gainStandA, gainBracketA, a.thisWeekHonor);
                            valB = getRpGain(gainStandB, gainBracketB, b.thisWeekHonor);
                            break;'''

new_sort_gain = '''case "gain":
                            // RP gain based on standing and bracket
                            const gainBracketA = getBracket(a.originalStanding);
                            const gainBracketB = getBracket(b.originalStanding);
                            valA = getRpGain(a.originalStanding, gainBracketA, a.thisWeekHonor);
                            valB = getRpGain(b.originalStanding, gainBracketB, b.thisWeekHonor);
                            break;'''

content = content.replace(old_sort_gain, new_sort_gain)
print("Fixed gain sort to use originalStanding")

old_sort_projected = '''case "projected":
                            // Projected rank after reset
                            const projStandA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const projStandB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const projBracketA = getBracket(projStandA);
                            const projBracketB = getBracket(projStandB);
                            const projDecayA = Math.round(a.RP * 0.20);
                            const projDecayB = Math.round(b.RP * 0.20);
                            const projGainA = getRpGain(projStandA, projBracketA, a.thisWeekHonor);
                            const projGainB = getRpGain(projStandB, projBracketB, b.thisWeekHonor);
                            const newRpA = a.RP + projGainA - projDecayA;
                            const newRpB = b.RP + projGainB - projDecayB;
                            // Sort by projected RP (which determines rank)
                            valA = newRpA;
                            valB = newRpB;
                            break;'''

new_sort_projected = '''case "projected":
                            // Projected rank after reset
                            const projBracketA = getBracket(a.originalStanding);
                            const projBracketB = getBracket(b.originalStanding);
                            const projDecayA = Math.round(a.RP * 0.20);
                            const projDecayB = Math.round(b.RP * 0.20);
                            const projGainA = getRpGain(a.originalStanding, projBracketA, a.thisWeekHonor);
                            const projGainB = getRpGain(b.originalStanding, projBracketB, b.thisWeekHonor);
                            const newRpA = a.RP + projGainA - projDecayA;
                            const newRpB = b.RP + projGainB - projDecayB;
                            valA = newRpA;
                            valB = newRpB;
                            break;'''

content = content.replace(old_sort_projected, new_sort_projected)
print("Fixed projected sort to use originalStanding")

with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("\nAll fixes applied!")

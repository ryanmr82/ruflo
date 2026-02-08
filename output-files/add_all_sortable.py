#!/usr/bin/env python3
"""Add sorting to all remaining columns"""

with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# Update the table headers - make ALL columns sortable
old_headers = '''<thead>
                    <tr>
                        <th class="sortable sort-asc" data-sort="standing" onclick="sortBy('standing')">#</th>
                        <th class="sortable" data-sort="name" onclick="sortBy('name')">Player</th>
                        <th class="sortable" data-sort="rank" onclick="sortBy('rank')">Rank</th>
                        <th class="sortable" data-sort="rp" onclick="sortBy('rp')">RP</th>
                        <th class="sortable" data-sort="honor" onclick="sortBy('honor')">Honor</th>
                        <th>Updated</th>
                        <th class="sortable" data-sort="bracket" onclick="sortBy('bracket')">B</th>
                        <th>Decay</th>
                        <th>Gain</th>
                        <th class="sortable" data-sort="net" onclick="sortBy('net')">Net</th>
                        <th>Projected</th>
                    </tr>
                </thead>'''

new_headers = '''<thead>
                    <tr>
                        <th class="sortable sort-asc" data-sort="standing" onclick="sortBy('standing')">#</th>
                        <th class="sortable" data-sort="name" onclick="sortBy('name')">Player</th>
                        <th class="sortable" data-sort="rank" onclick="sortBy('rank')">Rank</th>
                        <th class="sortable" data-sort="rp" onclick="sortBy('rp')">RP</th>
                        <th class="sortable" data-sort="honor" onclick="sortBy('honor')">Honor</th>
                        <th class="sortable" data-sort="updated" onclick="sortBy('updated')">Updated</th>
                        <th class="sortable" data-sort="bracket" onclick="sortBy('bracket')">B</th>
                        <th class="sortable" data-sort="decay" onclick="sortBy('decay')">Decay</th>
                        <th class="sortable" data-sort="gain" onclick="sortBy('gain')">Gain</th>
                        <th class="sortable" data-sort="net" onclick="sortBy('net')">Net</th>
                        <th class="sortable" data-sort="projected" onclick="sortBy('projected')">Projected</th>
                    </tr>
                </thead>'''

if old_headers in content:
    content = content.replace(old_headers, new_headers)
    print("Headers updated - all columns now sortable")
else:
    print("WARNING: Could not find headers to update")

# Now update the sortBy function to handle the new columns
# Find the switch statement and add cases for updated, decay, gain, projected

old_switch_end = '''                        case "net":
                            const standA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const standB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const bracketA = getBracket(standA);
                            const bracketB = getBracket(standB);
                            const decayA = Math.round(a.RP * 0.20);
                            const decayB = Math.round(b.RP * 0.20);
                            valA = getRpGain(standA, bracketA, a.thisWeekHonor) - decayA;
                            valB = getRpGain(standB, bracketB, b.thisWeekHonor) - decayB;
                            break;
                        default:
                            valA = 0;
                            valB = 0;'''

new_switch_end = '''                        case "net":
                            const standA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const standB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const bracketA = getBracket(standA);
                            const bracketB = getBracket(standB);
                            const decayA = Math.round(a.RP * 0.20);
                            const decayB = Math.round(b.RP * 0.20);
                            valA = getRpGain(standA, bracketA, a.thisWeekHonor) - decayA;
                            valB = getRpGain(standB, bracketB, b.thisWeekHonor) - decayB;
                            break;
                        case "updated":
                            // Sort by last_checked timestamp (newer = higher value)
                            valA = a.last_checked || 0;
                            valB = b.last_checked || 0;
                            break;
                        case "decay":
                            // Decay is 20% of RP
                            valA = Math.round(a.RP * 0.20);
                            valB = Math.round(b.RP * 0.20);
                            break;
                        case "gain":
                            // RP gain based on standing and bracket
                            const gainStandA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const gainStandB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const gainBracketA = getBracket(gainStandA);
                            const gainBracketB = getBracket(gainStandB);
                            valA = getRpGain(gainStandA, gainBracketA, a.thisWeekHonor);
                            valB = getRpGain(gainStandB, gainBracketB, b.thisWeekHonor);
                            break;
                        case "projected":
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
                            break;
                        default:
                            valA = 0;
                            valB = 0;'''

if old_switch_end in content:
    content = content.replace(old_switch_end, new_switch_end)
    print("Sort cases added for updated, decay, gain, projected")
else:
    print("WARNING: Could not find switch statement to update")

with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("Done - all columns are now sortable")

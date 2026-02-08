#!/usr/bin/env python3
"""
Add sortable column headers to HonorSpy dashboard
Added: December 9, 2025
"""

import re

# Read the api.py file
with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# 1. Add CSS for sortable headers (before </style> in dashboard template)
sortable_css = '''
        /* Sortable column headers - Added Dec 9, 2025 */
        th.sortable {{
            cursor: pointer;
            user-select: none;
            position: relative;
            padding-right: 18px !important;
        }}
        th.sortable:hover {{
            background: #333;
        }}
        th.sortable::after {{
            content: "\\2195";
            position: absolute;
            right: 4px;
            opacity: 0.3;
            font-size: 0.75em;
        }}
        th.sortable.sort-asc::after {{
            content: "\\25B2";
            opacity: 1;
            color: #4dabf7;
        }}
        th.sortable.sort-desc::after {{
            content: "\\25BC";
            opacity: 1;
            color: #4dabf7;
        }}
    </style>'''

# Find the dashboard template </style> tag (the one after contributor-info)
old_style_end = '''.contributor-info {{
            color: #888;
            font-size: 0.85em;
        }}
    </style>'''

new_style_end = '''.contributor-info {{
            color: #888;
            font-size: 0.85em;
        }}''' + sortable_css

content = content.replace(old_style_end, new_style_end)
print("CSS added")

# 2. Update table headers to be sortable with onclick handlers
old_headers = '''<thead>
                    <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Rank</th>
                        <th>RP</th>
                        <th>Honor</th>
                        <th>Updated</th>
                        <th>B</th>
                        <th>Decay</th>
                        <th>Gain</th>
                        <th>Net</th>
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
                        <th>Updated</th>
                        <th class="sortable" data-sort="bracket" onclick="sortBy('bracket')">B</th>
                        <th>Decay</th>
                        <th>Gain</th>
                        <th class="sortable" data-sort="net" onclick="sortBy('net')">Net</th>
                        <th>Projected</th>
                    </tr>
                </thead>'''

if old_headers in content:
    content = content.replace(old_headers, new_headers)
    print("Headers updated")
else:
    print("WARNING: Could not find headers to replace")

# 3. Add sorting JavaScript - insert after "let players = data;" line in dashboard
sort_js = '''

        // Sorting state - Added Dec 9, 2025
        let currentSort = {{ column: "standing", direction: "asc" }};
        let originalPlayers = [...players]; // Keep original order for standing sort

        function sortBy(column) {{
            const headers = document.querySelectorAll("th.sortable");

            // Toggle direction if same column, else default to desc (except standing defaults to asc)
            if (currentSort.column === column) {{
                currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
            }} else {{
                currentSort.column = column;
                currentSort.direction = column === "standing" ? "asc" : "desc";
            }}

            // Update header classes
            headers.forEach(h => {{
                h.classList.remove("sort-asc", "sort-desc");
                if (h.dataset.sort === column) {{
                    h.classList.add(currentSort.direction === "asc" ? "sort-asc" : "sort-desc");
                }}
            }});

            // Sort the players array
            if (column === "standing") {{
                // Restore original order for standing
                players = [...originalPlayers];
                if (currentSort.direction === "desc") {{
                    players.reverse();
                }}
            }} else {{
                players.sort((a, b) => {{
                    let valA, valB;
                    switch (column) {{
                        case "name":
                            valA = a.name.toLowerCase();
                            valB = b.name.toLowerCase();
                            break;
                        case "rank":
                            valA = a.rank + a.progress;
                            valB = b.rank + b.progress;
                            break;
                        case "rp":
                            valA = a.RP;
                            valB = b.RP;
                            break;
                        case "honor":
                            valA = a.thisWeekHonor;
                            valB = b.thisWeekHonor;
                            break;
                        case "bracket":
                            const idxA = originalPlayers.findIndex(p => p.name === a.name);
                            const idxB = originalPlayers.findIndex(p => p.name === b.name);
                            valA = getBracket(idxA + 1).bracket;
                            valB = getBracket(idxB + 1).bracket;
                            break;
                        case "net":
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
                            valB = 0;
                    }}

                    if (typeof valA === "string") {{
                        return currentSort.direction === "asc"
                            ? valA.localeCompare(valB)
                            : valB.localeCompare(valA);
                    }}
                    return currentSort.direction === "asc" ? valA - valB : valB - valA;
                }});
            }}

            updateTable();
        }}
'''

# Find the right place to insert (after data is loaded)
insert_marker = "let players = data;"
if insert_marker in content:
    content = content.replace(insert_marker, insert_marker + sort_js)
    print("Sort JavaScript added successfully")
else:
    print("WARNING: Could not find insertion point for sort JS")

# Write the updated file
with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("api.py updated with sortable columns")

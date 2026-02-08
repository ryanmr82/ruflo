#!/usr/bin/env python3
"""Add sorting functionality to the awards page"""

with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# 1. Update awards page table headers to be sortable
old_awards_headers = '''<thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Last Week Honor</th>
                    <th>Pre-Reset RP</th>
                    <th>Pre-Reset Rank</th>
                    <th>Post-Reset RP</th>
                    <th>Award</th>
                    <th>Net Gain</th>
                    <th>Post-Reset Rank</th>
                </tr>
            </thead>'''

new_awards_headers = '''<thead>
                <tr>
                    <th class="sortable sort-asc" data-sort="standing" onclick="sortBy('standing')">#</th>
                    <th class="sortable" data-sort="name" onclick="sortBy('name')">Player</th>
                    <th class="sortable" data-sort="honor" onclick="sortBy('honor')">Last Week Honor</th>
                    <th class="sortable" data-sort="pre_rp" onclick="sortBy('pre_rp')">Pre-Reset RP</th>
                    <th class="sortable" data-sort="pre_rank" onclick="sortBy('pre_rank')">Pre-Reset Rank</th>
                    <th class="sortable" data-sort="post_rp" onclick="sortBy('post_rp')">Post-Reset RP</th>
                    <th class="sortable" data-sort="award" onclick="sortBy('award')">Award</th>
                    <th class="sortable" data-sort="net_gain" onclick="sortBy('net_gain')">Net Gain</th>
                    <th class="sortable" data-sort="post_rank" onclick="sortBy('post_rank')">Post-Reset Rank</th>
                </tr>
            </thead>'''

if old_awards_headers in content:
    content = content.replace(old_awards_headers, new_awards_headers)
    print("Updated awards table headers")
else:
    print("WARNING: Could not find awards table headers")

# 2. Find where awards data is loaded and add sorting state + function
# Look for "let awards = " in the awards template

# First, find the awards page CSS section and add sortable styles if not present
# Check if sortable styles already exist in awards section
if 'th.sortable {{' not in content[:5000]:  # Check first part (awards template)
    # Need to add sortable CSS to awards template
    # Find the </style> in awards template (first one)
    awards_style_end = content.find('</style>')
    if awards_style_end > 0:
        sortable_css = '''
        /* Sortable column headers */
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
            content: "";
            position: absolute;
            right: 4px;
            opacity: 0.3;
            font-size: 0.75em;
        }}
        th.sortable.sort-asc::after {{
            content: " ^";
            opacity: 1;
            color: #4dabf7;
        }}
        th.sortable.sort-desc::after {{
            content: " v";
            opacity: 1;
            color: #4dabf7;
        }}
    </style>'''
        content = content[:awards_style_end] + sortable_css + content[awards_style_end+8:]
        print("Added sortable CSS to awards template")

# 3. Add sorting state and function after awards data is loaded
# Find "let awards = {awards_json};" in awards template
awards_data_marker = "let awards = {awards_json};"
if awards_data_marker in content:
    awards_sort_code = '''let awards = {awards_json};

        // Sorting state for awards page
        let currentSort = {{ column: "standing", direction: "asc" }};
        awards.forEach((a, idx) => {{ a.originalStanding = a.standing || (idx + 1); }});
        let originalAwards = [...awards];

        function sortBy(column) {{
            const headers = document.querySelectorAll("th.sortable");

            if (currentSort.column === column) {{
                currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
            }} else {{
                currentSort.column = column;
                currentSort.direction = column === "standing" ? "asc" : "desc";
            }}

            headers.forEach(h => {{
                h.classList.remove("sort-asc", "sort-desc");
                if (h.dataset.sort === column) {{
                    h.classList.add(currentSort.direction === "asc" ? "sort-asc" : "sort-desc");
                }}
            }});

            if (column === "standing") {{
                awards = [...originalAwards];
                if (currentSort.direction === "desc") {{
                    awards.reverse();
                }}
            }} else {{
                awards.sort((a, b) => {{
                    let valA, valB;
                    switch (column) {{
                        case "name":
                            valA = a.name.toLowerCase();
                            valB = b.name.toLowerCase();
                            break;
                        case "honor":
                            valA = a.pre_reset_honor || 0;
                            valB = b.pre_reset_honor || 0;
                            break;
                        case "pre_rp":
                            valA = a.pre_reset_rp || 0;
                            valB = b.pre_reset_rp || 0;
                            break;
                        case "pre_rank":
                            valA = a.pre_reset_rank || 0;
                            valB = b.pre_reset_rank || 0;
                            break;
                        case "post_rp":
                            valA = a.post_reset_rp || 0;
                            valB = b.post_reset_rp || 0;
                            break;
                        case "award":
                            valA = a.award || 0;
                            valB = b.award || 0;
                            break;
                        case "net_gain":
                            valA = a.net_gain || 0;
                            valB = b.net_gain || 0;
                            break;
                        case "post_rank":
                            valA = a.post_reset_rank || 0;
                            valB = b.post_reset_rank || 0;
                            break;
                        default:
                            valA = a.originalStanding;
                            valB = b.originalStanding;
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
        }}'''

    content = content.replace(awards_data_marker, awards_sort_code)
    print("Added sorting function to awards page")
else:
    print("WARNING: Could not find awards data marker")

with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("\nAwards page sorting added!")

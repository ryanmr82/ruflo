#!/usr/bin/env python3
"""
Fix awards dropdown to select first valid week (with post-reset data)
instead of just checking if index === 0.
"""

with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# Fix the populateWeekSelector function to select first valid week
old_selection_logic = '''weekPairs.forEach((pair, index) => {{
                const option = document.createElement('option');
                const hasPost = pair.post_reset !== null;
                const dateLabel = formatDate(pair.week_date);

                if (hasPost) {{
                    option.value = JSON.stringify({{
                        pre: pair.pre_reset.filename,
                        post: pair.post_reset.filename
                    }});
                    option.textContent = `Week ending ${{dateLabel}} (${{pair.pre_reset.player_count}} players)`;
                }} else {{
                    option.value = 'no-post';
                    option.textContent = `Week ending ${{dateLabel}} (no post-reset data yet)`;
                    option.disabled = false;  // Allow selection to show message
                }}

                // Select first valid option by default
                if (index === 0 && hasPost) {{
                    option.selected = true;
                }}

                selector.appendChild(option);
            }});'''

new_selection_logic = '''let firstValidSelected = false;
            weekPairs.forEach((pair, index) => {{
                const option = document.createElement('option');
                const hasPost = pair.post_reset !== null;
                const dateLabel = formatDate(pair.week_date);

                if (hasPost) {{
                    option.value = JSON.stringify({{
                        pre: pair.pre_reset.filename,
                        post: pair.post_reset.filename
                    }});
                    option.textContent = `Week ending ${{dateLabel}} (${{pair.pre_reset.player_count}} players)`;
                }} else {{
                    option.value = 'no-post';
                    option.textContent = `Week ending ${{dateLabel}} (no post-reset data yet)`;
                    option.disabled = false;  // Allow selection to show message
                }}

                // Select first option that has post-reset data
                if (hasPost && !firstValidSelected) {{
                    option.selected = true;
                    firstValidSelected = true;
                }}

                selector.appendChild(option);
            }});'''

if old_selection_logic in content:
    content = content.replace(old_selection_logic, new_selection_logic)
    print("Fixed awards dropdown selection logic")
else:
    print("WARNING: Could not find awards dropdown selection logic")
    print("Searching for alternative pattern...")
    # Try searching for just the key part
    if "if (index === 0 && hasPost)" in content:
        # Count occurrences
        count = content.count("if (index === 0 && hasPost)")
        print(f"Found {count} occurrences of 'if (index === 0 && hasPost)'")

with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("\nAwards dropdown fix applied!")

#!/usr/bin/env python3
"""Fix sorting state formatting in api.py"""

# Read the file
with open("/home/opc/HonorSpy/api.py", "r") as f:
    content = f.read()

# Fix the malformed sorting state line in dashboard template
old_line = '// Sorting state - Added Dec 9, 2025        let currentSort = { column: "standing", direction: "asc" };        let originalPlayers = [...players]; // Keep original order for standing sort'
new_lines = '''
        // Sorting state - Added Dec 9, 2025
        let currentSort = {{ column: "standing", direction: "asc" }};
        let originalPlayers = [...players]; // Keep original order for standing sort'''

if old_line in content:
    content = content.replace(old_line, new_lines)
    print("Fixed malformed sorting state line")
else:
    print("Malformed line not found, checking for other issues...")

# Also check if there's an unescaped single brace issue in sortBy function
# In Python f-strings, { and } need to be {{ and }}
# Fix any remaining single brace JS objects

# Write the file
with open("/home/opc/HonorSpy/api.py", "w") as f:
    f.write(content)

print("Fix complete")

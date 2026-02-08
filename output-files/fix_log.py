import os

input_file = r"C:\Claude-Flow\output-files\turtlog-broken\WoWCombatLog.txt"
output_file = r"C:\Claude-Flow\output-files\turtlog-fixed\WoWCombatLog.txt"

marker = "12/24 16:11:50.500  CAST: Razorgore the Untamed casts Conflagration(23023) on Razorgore the Untamed."

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
marker_inserted = False

for line in lines:
    # Insert marker right before Phase 2 combat starts
    if "16:11:50.629" in line and not marker_inserted:
        new_lines.append(marker + "\n")
        marker_inserted = True
    new_lines.append(line)

with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Fixed log saved to: {output_file}")
print(f"Marker inserted: {marker_inserted}")
